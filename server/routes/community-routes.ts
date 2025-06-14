import { Router } from 'express';
import { db } from '../db';
import { 
  users, 
  communityPosts, 
  communityComments, 
  communityLikes,
  communitySaves,
  communityPoints,
  communityLeaderboard,
  communitySettings,
  communityCommentLikes,
  userFollows
} from '../../shared/schema';
import { eq, and, gt, gte, lte, desc, asc, sql, inArray, count as countFn, or, ilike, SQL } from 'drizzle-orm';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { communityStorageService } from '../services/community-storage';

const router = Router();

/**
 * HOTFIX: Garantir que a propriedade isPinned seja sempre convertida para boolean
 * 
 * O PostgreSQL retorna valores booleanos como 't' e 'f' em formato texto
 * para garantir que sejam interpretados corretamente no JS, adicionamos
 * a conversão explícita em todas as consultas SQL.
 * 
 * Sempre use COALESCE(campo."isPinned", false)::boolean nas consultas SQL
 * E sempre use isPinned === true nas verificações do frontend
 */

/**
 * Função formatarDataCompleta
 * 
 * Formata uma data no formato completo para exibição no frontend
 * Esta função é usada para pré-calcular datas no backend evitando
 * que o frontend mostre "agora" para posts antigos que foram atualizados
 */
function formatarDataCompleta(dateString: string | Date): string {
  if (!dateString) return "Data não disponível";
  
  try {
    // Criar data a partir da string ou objeto Date
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error("Data inválida:", dateString);
      return "Data não disponível";
    }
    
    // Calcular a diferença em milissegundos
    const agora = new Date();
    const diff = agora.getTime() - date.getTime();
    
    // Converter para segundos, minutos, horas, dias
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    // Formatação relativa
    if (segundos < 60) {
      return "Agora mesmo";
    } else if (minutos < 60) {
      return minutos === 1 ? "Há 1 minuto" : `Há ${minutos} minutos`;
    } else if (horas < 24) {
      return horas === 1 ? "Há 1 hora" : `Há ${horas} horas`;
    } else if (dias < 30) {
      return dias === 1 ? "Há 1 dia" : `Há ${dias} dias`;
    } else {
      // Para datas muito antigas, manter formato relativo em meses
      const meses = Math.floor(dias / 30);
      return meses === 1 ? "Há 1 mês" : `Há ${meses} meses`;
    }
  } catch (error) {
    console.error("Erro ao formatar data:", error, "Data:", dateString);
    return "Data não disponível";
  }
}

// IMPORTANTE: Rotas específicas ANTES das rotas com parâmetros dinâmicos
// para evitar conflitos de captura

// GET: Buscar contagem total de posts na comunidade
router.get('/api/community/stats', async (req, res) => {
  try {
    // Buscar o total de posts aprovados
    const result = await db.execute(sql`
      SELECT COUNT(*) as total_posts
      FROM "communityPosts"
      WHERE status = 'approved'
    `);
    
    const totalPosts = parseInt(result.rows[0]?.total_posts || '0');
    
    // Buscar o total de usuários que já fizeram posts
    const usersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT "userId") as total_creators
      FROM "communityPosts"
      WHERE status = 'approved'
    `);
    
    const totalCreators = parseInt(usersResult.rows[0]?.total_creators || '0');
    
    // Retornar estatísticas
    return res.json({
      totalPosts,
      totalCreators
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas da comunidade:', error);
    return res.status(500).json({ message: 'Erro ao buscar estatísticas da comunidade' });
  }
});

// GET: Buscar posts populares - ESTA ROTA DEVE ESTAR NO INÍCIO DO ARQUIVO
router.get('/api/community/populares', async (req, res) => {
  try {
    console.log('==== BUSCANDO POSTS POPULARES (NOVA URL) ====');
    
    // Validação robusta do parâmetro de limite
    let limit = 5;
    if (req.query.limit && typeof req.query.limit === 'string') {
      const parsedLimit = parseInt(req.query.limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 20); // Limita a no máximo 20 para proteger o banco
      }
    }
    
    console.log('Limite validado:', limit);
    
    // Nova implementação usando SQL direto e com tratamento de erro aprimorado
    try {
      // Consulta SQL direta e simples que evita problemas de NaN
      const result = await db.execute(sql`
        WITH popular_posts AS (
          SELECT 
            cp.id, 
            cp.title, 
            cp.content, 
            cp."imageUrl", 
            cp."editLink", 
            cp.status, 
            cp."createdAt", 
            cp."updatedAt", 
            COALESCE(cp."viewCount", 0) as "viewCount",
            cp."userId",
            cp."featuredUntil",
            COALESCE(cp."isPinned", false)::boolean as "isPinned",
            cp."isWeeklyFeatured",
            u.id as user_id,
            u.username,
            u.name,
            u.profileimageurl,
            u.nivelacesso,
            COUNT(DISTINCT cl.id) as likes_count,
            COUNT(DISTINCT cc.id) as comments_count
          FROM "communityPosts" cp
          LEFT JOIN users u ON cp."userId" = u.id
          LEFT JOIN "communityLikes" cl ON cp.id = cl."postId"
          LEFT JOIN "communityComments" cc ON cp.id = cc."postId"
          WHERE cp.status = 'approved'
          GROUP BY cp.id, u.id
          ORDER BY likes_count DESC, cp."createdAt" DESC
          LIMIT ${limit}
        )
        SELECT * FROM popular_posts
      `);
      
      // Processar os resultados com muita segurança
      const formattedResults = [];
      
      if (result && result.rows && Array.isArray(result.rows)) {
        // Mapear cada resultado em um formato seguro
        for (const row of result.rows) {
          try {
            // Verificar se o usuário atual segue o autor do post
            let isFollowing = false;
            const userId = req.user?.id;
            const postAuthorId = row.user_id ? Number(row.user_id) : 0;
            
            if (userId && postAuthorId && userId !== postAuthorId) {
              try {
                // Verificar relação de seguidor
                const followResult = await db.execute(sql`
                  SELECT 1 FROM "userFollows"
                  WHERE "followerId" = ${userId} AND "followingId" = ${postAuthorId}
                  LIMIT 1
                `);
                isFollowing = followResult.rows.length > 0;
              } catch (followError) {
                console.error(`Erro ao verificar relação de seguir para post ${row.id}:`, followError);
              }
            }
            // Pré-formatar a data para evitar mudanças ao visualizar
            const formattedDate = formatarDataCompleta(row.createdAt || new Date());
            
            formattedResults.push({
              post: {
                id: row.id ? Number(row.id) : 0,
                title: row.title || 'Sem título',
                content: row.content || '',
                imageUrl: row.imageUrl || '',
                editLink: row.editLink || '',
                status: row.status || 'approved',
                createdAt: row.createdAt || new Date(),
                updatedAt: row.updatedAt || new Date(),
                viewCount: (typeof row.viewCount === 'number' || typeof row.viewCount === 'string') 
                    ? Number(row.viewCount) : 0,
                userId: row.userId ? Number(row.userId) : 0,
                formattedDate: formattedDate, // Adicionar data pré-formatada
                featuredUntil: row.featuredUntil,
                isWeeklyFeatured: !!row.isWeeklyFeatured
              },
              user: {
                id: postAuthorId,
                username: row.username || 'usuário',
                name: row.name || 'Usuário',
                profileimageurl: row.profileimageurl || null,
                nivelacesso: row.nivelacesso || 'free',
                isFollowing // Adicionar status de seguindo
              },
              likesCount: (typeof row.likes_count === 'number' || typeof row.likes_count === 'string') 
                  ? Number(row.likes_count) : 0,
              commentsCount: (typeof row.comments_count === 'number' || typeof row.comments_count === 'string') 
                  ? Number(row.comments_count) : 0
            });
          } catch (rowError) {
            console.error('Erro ao processar linha em popular posts:', rowError);
            // Continuar para a próxima linha
          }
        }
      }
      
      console.log(`Retornando ${formattedResults.length} posts populares (nova URL)`);
      return res.json(formattedResults);
      
    } catch (dbError) {
      console.error('ERRO CRÍTICO em posts populares (nova URL):', dbError);
      // Em caso de erro crítico, retornar array vazio em vez de erro 500
      return res.json([]);
    }
  } catch (error) {
    console.error('Erro ao buscar posts populares (nova URL):', error);
    // Em último caso, retornar array vazio para evitar quebra do frontend
    return res.json([]);
  }
});

// Configuração do multer para upload de imagens com armazenamento em memória
// para depois enviar para o Supabase
const upload = multer({ 
  storage: multer.memoryStorage(), // Armazenar o arquivo em memória
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter: (req, file, cb) => {
    // Permitir apenas imagens
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'));
    }
    cb(null, true);
  }
});

// Este helper não é mais necessário pois agora usamos o comunidade-storage.ts 
// para otimizar e fazer upload diretamente para o Supabase

// GET: Listar posts da comunidade 
// Parâmetros opcionais: ?page=1&limit=20&status=approved
router.get('/api/community/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = (req.query.status as string) || 'approved';
    
    // Admin pode ver todos os posts, outros usuários apenas os aprovados
    const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm';
    const postStatus = isAdmin && status !== 'all' ? status : 'approved';
    
    // Vamos usar a consulta SQL direta para garantir os tipos corretos
    const rawPostsQuery = await db.execute(sql`
      SELECT 
        p.*,
        u.id as user_id,
        u.username,
        u.name,
        u.profileimageurl,
        u.nivelacesso,
        CAST(COALESCE(p."isPinned", false) AS BOOLEAN) as is_pinned, 
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT s.id) as saves_count,
        COUNT(DISTINCT c.id) as comments_count
      FROM "communityPosts" p
      LEFT JOIN users u ON p."userId" = u.id
      LEFT JOIN "communityLikes" l ON p.id = l."postId"
      LEFT JOIN "communitySaves" s ON p.id = s."postId"
      LEFT JOIN "communityComments" c ON p.id = c."postId"
      WHERE ${isAdmin && status === 'all' ? sql`1=1` : sql`p.status = ${postStatus}`}
      GROUP BY p.id, u.id
      ORDER BY p."isPinned" DESC, p."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    
    // Preparar array de resultados formatados
    const posts = [];
    
    if (rawPostsQuery && rawPostsQuery.rows) {
      for (const row of rawPostsQuery.rows) {
        // Pré-formatar a data para evitar mudanças ao visualizar
        const formattedDate = formatarDataCompleta(row.createdAt);
        
        posts.push({
          post: {
            id: Number(row.id),
            userId: Number(row.userId),
            title: row.title || '',
            content: row.content || '',
            imageUrl: row.imageUrl || '',
            status: row.status || 'approved',
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            viewCount: Number(row.viewCount || 0),
            isPinned: row.is_pinned === true, // Garantir formato booleano
            editLink: row.editLink || '',
            featuredUntil: row.featuredUntil,
            isWeeklyFeatured: !!row.isWeeklyFeatured,
            formattedDate: formattedDate // Adicionar a data pré-formatada
          },
          user: {
            id: Number(row.user_id),
            username: row.username || '',
            name: row.name || '',
            profileimageurl: row.profileimageurl || null,
            nivelacesso: row.nivelacesso || 'free'
          },
          likesCount: Number(row.likes_count || 0),
          savesCount: Number(row.saves_count || 0),
          commentsCount: Number(row.comments_count || 0)
        });
      }
    }

    // Adicionar informações para o usuário logado sobre cada post
    if (req.user?.id) {
      const userId = req.user.id;
      const userInteractions = await Promise.all(
        posts.map(async (post) => {
          const [userLike] = await db
            .select()
            .from(communityLikes)
            .where(
              and(
                eq(communityLikes.postId, post.post.id),
                eq(communityLikes.userId, userId)
              )
            );

          const [userSave] = await db
            .select()
            .from(communitySaves)
            .where(
              and(
                eq(communitySaves.postId, post.post.id),
                eq(communitySaves.userId, userId)
              )
            );
            
          // Verificar se o usuário atual segue o autor do post
          const [isFollowing] = post.user && post.user.id ? await db
            .select({ count: countFn() })
            .from(userFollows)
            .where(
              and(
                eq(userFollows.followerId, userId),
                eq(userFollows.followingId, post.user.id)
              )
            ) : [{ count: 0 }];

          return {
            ...post,
            userHasLiked: !!userLike,
            isLikedByUser: !!userLike, // Campo adicional para compatibilidade com frontend
            userHasSaved: !!userSave,
            post: {
              ...post.post,
              isPinned: post.post.isPinned === true // Garante que é um booleano
            },
            user: {
              ...post.user,
              isFollowing: Number(isFollowing?.count || 0) > 0
            }
          };
        })
      );

      return res.json(userInteractions);
    }

    return res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts da comunidade:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar posts da comunidade',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Buscar um post específico por ID
router.get('/api/community/posts/:id', async (req, res) => {
  try {
    // Validação robusta do ID do post
    const postIdParam = req.params.id;
    console.log(`Requisição para post ID: '${postIdParam}'`);
    
    // Validação completa para garantir que postId seja um número válido
    if (!postIdParam || postIdParam === 'popular') {
      console.log('ID inválido ou rota especial detectada:', postIdParam);
      return res.status(404).json({ message: 'Post não encontrado - ID inválido' });
    }
    
    const postId = parseInt(postIdParam);
    if (isNaN(postId) || postId <= 0) {
      console.log('ID não numérico ou inválido:', postIdParam);
      return res.status(404).json({ message: 'Post não encontrado - ID inválido' });
    }
    
    console.log(`ID do post validado: ${postId}`);
    
    try {
      // Usar SQL bruto para melhor controle e prevenir NaN
      const postResult = await db.execute(sql`
        SELECT p.*, 
               u.id as "userId", 
               u.username, 
               u.name, 
               u.profileimageurl, 
               u.nivelacesso,
               COUNT(DISTINCT l.id) as "likesCount",
               COUNT(DISTINCT s.id) as "savesCount",
               COUNT(DISTINCT c.id) as "commentsCount"
        FROM "communityPosts" p
        LEFT JOIN users u ON p."userId" = u.id
        LEFT JOIN "communityLikes" l ON p.id = l."postId"
        LEFT JOIN "communitySaves" s ON p.id = s."postId"
        LEFT JOIN "communityComments" c ON p.id = c."postId"
        WHERE p.id = ${postId}
        GROUP BY p.id, u.id
      `);
      
      if (!postResult.rows || postResult.rows.length === 0) {
        console.log(`Post ${postId} não encontrado na consulta SQL`);
        return res.status(404).json({ message: 'Post não encontrado' });
      }
      
      const rawPost = postResult.rows[0];
      console.log(`Post ${postId} encontrado:`, rawPost ? 'Sim' : 'Não');
      
      // Formatar a data para evitar o problema de "agora" após atualizações
      const formattedDate = formatarDataCompleta(rawPost.createdAt);

      // Estruturar dados no formato esperado pelo frontend
      const post = {
        post: {
          id: postId,
          title: rawPost.title || 'Sem título',
          content: rawPost.content || '',
          imageUrl: rawPost.imageUrl || '',
          editLink: rawPost.editLink || '',
          status: rawPost.status || 'pending',
          createdAt: rawPost.createdAt || new Date(),
          updatedAt: rawPost.updatedAt || new Date(),
          viewCount: typeof rawPost.viewCount === 'number' ? rawPost.viewCount : 0,
          userId: typeof rawPost.userId === 'number' ? rawPost.userId : 0,
          featuredUntil: rawPost.featuredUntil,
          isWeeklyFeatured: !!rawPost.isWeeklyFeatured,
          formattedDate: formattedDate, // Adicionar campo com data pré-formatada
        },
        user: {
          id: typeof rawPost.userId === 'number' ? rawPost.userId : 0,
          username: rawPost.username || 'usuário',
          name: rawPost.name || 'Usuário',
          profileimageurl: rawPost.profileimageurl || null,
          nivelacesso: rawPost.nivelacesso || 'free'
        },
        likesCount: parseInt(rawPost.likesCount) || 0,
        commentsCount: parseInt(rawPost.commentsCount) || 0,
        savesCount: parseInt(rawPost.savesCount) || 0
      };
      
      // Verificar se o usuário pode ver o post
      const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm';
      const isOwner = req.user?.id === post.user.id;
      
      if (post.post.status !== 'approved' && !isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Você não tem permissão para visualizar este post' });
      }
      
      // Incrementar contador de visualizações com tratamento de erro
      try {
        await db.execute(sql`
          UPDATE "communityPosts"
          SET "viewCount" = COALESCE("viewCount", 0) + 1
          WHERE id = ${postId}
        `);
        console.log(`Contador de visualizações atualizado para o post ${postId}`);
      } catch (error) {
        console.error(`Erro ao atualizar contador de visualizações para o post ${postId}:`, error);
        // Erro não fatal, continuar processamento
      }
      
      // Adicionar informações para o usuário logado
      if (req.user?.id) {
        const userId = req.user.id;
        
        // Verificar se o usuário curtiu o post
        let userHasLiked = false;
        try {
          const likeResult = await db.execute(sql`
            SELECT 1 FROM "communityLikes"
            WHERE "postId" = ${postId} AND "userId" = ${userId}
            LIMIT 1
          `);
          userHasLiked = likeResult.rows.length > 0;
        } catch (error) {
          console.error(`Erro ao verificar curtida do usuário para post ${postId}:`, error);
        }
        
        // Verificar se o usuário salvou o post
        let userHasSaved = false;
        try {
          const saveResult = await db.execute(sql`
            SELECT 1 FROM "communitySaves"
            WHERE "postId" = ${postId} AND "userId" = ${userId}
            LIMIT 1
          `);
          userHasSaved = saveResult.rows.length > 0;
        } catch (error) {
          console.error(`Erro ao verificar save do usuário para post ${postId}:`, error);
        }
        
        // Verificar se o usuário segue o autor do post
        let isFollowing = false;
        try {
          // Verificar se o usuário atual segue o autor do post
          if (post.user.id !== userId) { // Não seguimos a nós mesmos
            const followResult = await db.execute(sql`
              SELECT 1 FROM "userFollows"
              WHERE "followerId" = ${userId} AND "followingId" = ${post.user.id}
              LIMIT 1
            `);
            isFollowing = followResult.rows.length > 0;
          }
        } catch (error) {
          console.error(`Erro ao verificar relação de seguir para post ${postId}:`, error);
        }
        
        return res.json({
          ...post,
          userHasLiked,
          isLikedByUser: userHasLiked, // Para compatibilidade com frontend
          userHasSaved,
          user: {
            ...post.user,
            isFollowing
          }
        });
      }
      
      return res.json(post);
    } catch (dbError) {
      console.error(`Erro crítico ao buscar post ${postId}:`, dbError);
      throw dbError; // Propagar para tratamento global
    }
  } catch (error) {
    console.error('Erro ao buscar post da comunidade:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar post da comunidade',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST: Criar um novo post na comunidade
router.post('/api/community/posts', upload.single('image'), async (req, res) => {
  try {
    console.log('Recebendo solicitação para criar novo post da comunidade');
    console.log('Body:', req.body);
    console.log('Arquivo:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'Nenhum arquivo');
    
    if (!req.user) {
      console.log('Erro: Usuário não autenticado');
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    if (!req.file) {
      console.log('Erro: Nenhuma imagem enviada no campo "image"');
      return res.status(400).json({ message: 'Imagem é obrigatória' });
    }
    
    const { title, content, editLink } = req.body;
    console.log('Dados do formulário:', { title, content, editLink });
    
    // Validamos o título apenas se estiver presente na rota original
    // mas agora vamos torná-lo opcional para compatibilidade com o formulário
    const postTitle = title || `Post de ${req.user.username} - ${new Date().toLocaleDateString()}`;
    
    // Fazer upload da imagem para o Supabase usando o novo serviço
    console.log('Enviando imagem para o Supabase via community-storage...');
    let imageUrl = '';
    let storageType = 'local';
    
    try {
      // Usar o novo serviço de armazenamento da comunidade para o Supabase
      const uploadResult = await communityStorageService.uploadCommunityImage(
        req.file,
        req.user.id
      );
      
      console.log('Resultado do upload para Supabase:', uploadResult);
      
      imageUrl = uploadResult.imageUrl;
      storageType = uploadResult.storageType;
      
      console.log(`Imagem salva em ${storageType} com URL: ${imageUrl}`);
    } catch (uploadError) {
      console.error('Erro no upload para Supabase:', uploadError);
      
      // Se falhar completamente, usar o fluxo antigo
      console.warn('Não foi possível fazer upload para o Supabase, usando fallback completo');
      
      // Caminho da imagem antigo (fallback)
      if (req.file.path) {
        const filePath = req.file.path;
        const webpPath = filePath.replace(/\.[^.]+$/, '.webp');
        imageUrl = `/uploads/community/${path.basename(webpPath)}`;
      } else {
        return res.status(500).json({ message: 'Falha ao processar a imagem' });
      }
    }
    
    if (!imageUrl) {
      return res.status(500).json({ message: 'Falha ao processar a imagem' });
    }
    
    // Consultar configurações para saber se post precisa de aprovação
    const [settings] = await db.select().from(communitySettings);
    const requireApproval = settings?.requireApproval !== false;
    
    // Status padrão com base na configuração e no nível do usuário
    const isAdmin = req.user.nivelacesso === 'admin' || req.user.nivelacesso === 'designer_adm';
    const status = requireApproval && !isAdmin ? 'pending' : 'approved';
    console.log('Status do post:', status, 'Aprovação necessária:', requireApproval, 'Usuário é admin:', isAdmin);
    
    // Inserir novo post
    const [newPost] = await db
      .insert(communityPosts)
      .values({
        userId: req.user.id,
        title: postTitle,
        content: content || '',
        imageUrl,
        editLink: editLink || null,
        status,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
        // Nota: featuredUntil e isWeeklyFeatured estão definidos com valores padrão no schema
      })
      .returning();
    
    // Se o post for aprovado automaticamente, adicionar pontos
    if (status === 'approved') {
      // Adicionar pontos ao usuário
      const pointsForPost = settings?.pointsForPost || 5;
      const currentMonth = new Date().toISOString().substring(0, 7); // Formato YYYY-MM
      
      await db
        .insert(communityPoints)
        .values({
          userId: req.user.id,
          points: pointsForPost,
          reason: 'post',
          sourceId: newPost.id,
          period: currentMonth,
          createdAt: new Date(),
        });
        
      // Atualizar leaderboard
      await updateLeaderboard(req.user.id);
    }
    
    return res.status(201).json({
      message: status === 'approved' 
        ? 'Post criado com sucesso!' 
        : 'Post enviado e aguardando aprovação',
      post: newPost,
      status,
      storageType
    });
  } catch (error) {
    console.error('Erro ao criar post da comunidade:', error);
    return res.status(500).json({ 
      message: 'Erro ao criar post da comunidade',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// PUT: Atualizar status de um post (aprovar/rejeitar)
router.put('/api/community/posts/:id/status', async (req, res) => {
  try {
    // Apenas admins podem alterar o status
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }
    
    const postId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }
    
    // Buscar post atual
    const [currentPost] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));
      
    if (!currentPost) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    // Atualizar status
    const [updatedPost] = await db
      .update(communityPosts)
      .set({ 
        status,
        updatedAt: new Date() 
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    
    // Se o post estava pendente e foi aprovado, adicionar pontos
    if (currentPost.status === 'pending' && status === 'approved') {
      // Buscar configurações para determinar pontos
      const [settings] = await db.select().from(communitySettings);
      const pointsForPost = settings?.pointsForPost || 5;
      const currentMonth = new Date().toISOString().substring(0, 7); // Formato YYYY-MM
      
      // Adicionar pontos
      await db
        .insert(communityPoints)
        .values({
          userId: currentPost.userId,
          points: pointsForPost,
          reason: 'post',
          sourceId: postId,
          period: currentMonth,
          createdAt: new Date(),
        });
        
      // Atualizar leaderboard
      await updateLeaderboard(currentPost.userId);
    }
    
    return res.json({
      message: `Post ${status === 'approved' ? 'aprovado' : status === 'rejected' ? 'rejeitado' : 'pendente'} com sucesso`,
      post: updatedPost
    });
  } catch (error) {
    console.error('Erro ao atualizar status do post:', error);
    return res.status(500).json({ 
      message: 'Erro ao atualizar status do post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Fixar post no topo da comunidade
router.put('/api/community/posts/:id/pin', async (req, res) => {
  try {
    // Apenas administradores podem fixar posts
    if (!req.user || req.user.nivelacesso !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem fixar posts' });
    }
    
    const postId = parseInt(req.params.id);
    
    // Buscar post atual
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));
      
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    // Verificar se o post está aprovado
    if (post.status !== 'approved') {
      return res.status(400).json({ message: 'Apenas posts aprovados podem ser fixados' });
    }
    
    // Fixar o post sem alterar a data de publicação
    const [updatedPost] = await db
      .update(communityPosts)
      .set({ 
        isPinned: true
        // Removemos updatedAt para manter a data original
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    
    return res.json({
      message: 'Post fixado com sucesso',
      post: updatedPost
    });
  } catch (error) {
    console.error('Erro ao fixar post:', error);
    return res.status(500).json({ 
      message: 'Erro ao fixar post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Desafixar post do topo da comunidade
router.put('/api/community/posts/:id/unpin', async (req, res) => {
  try {
    // Apenas administradores podem desafixar posts
    if (!req.user || req.user.nivelacesso !== 'admin') {
      return res.status(403).json({ message: 'Apenas administradores podem desafixar posts' });
    }
    
    const postId = parseInt(req.params.id);
    
    // Buscar post atual
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));
      
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    // Desafixar o post sem alterar a data de publicação
    const [updatedPost] = await db
      .update(communityPosts)
      .set({ 
        isPinned: false
        // Removemos updatedAt para manter a data original
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    
    return res.json({
      message: 'Post desafixado com sucesso',
      post: updatedPost
    });
  } catch (error) {
    console.error('Erro ao desafixar post:', error);
    return res.status(500).json({ 
      message: 'Erro ao desafixar post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST: Adicionar like a um post
router.post('/api/community/posts/:id/like', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verificar se o post existe e está aprovado
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(
        and(
          eq(communityPosts.id, postId),
          eq(communityPosts.status, 'approved')
        )
      );
      
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado ou não aprovado' });
    }
    
    // Verificar se o usuário já deu like
    const [existingLike] = await db
      .select()
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.postId, postId),
          eq(communityLikes.userId, userId)
        )
      );
      
    if (existingLike) {
      return res.status(400).json({ message: 'Você já curtiu este post' });
    }
    
    // Adicionar like
    const [like] = await db
      .insert(communityLikes)
      .values({
        postId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    // Adicionar pontos para o criador do post
    if (post.userId !== userId) { // Não adicionar pontos se for o próprio usuário
      // Buscar configurações para determinar pontos
      const [settings] = await db.select().from(communitySettings);
      const pointsForLike = settings?.pointsForLike || 1;
      const currentMonth = new Date().toISOString().substring(0, 7); // Formato YYYY-MM
      
      // Adicionar pontos
      await db
        .insert(communityPoints)
        .values({
          userId: post.userId,
          points: pointsForLike,
          reason: 'like',
          sourceId: postId,
          period: currentMonth,
          createdAt: new Date(),
        });
        
      // Atualizar leaderboard
      await updateLeaderboard(post.userId);
    }
    
    return res.status(201).json({
      message: 'Post curtido com sucesso',
      like
    });
  } catch (error) {
    console.error('Erro ao curtir post:', error);
    return res.status(500).json({ 
      message: 'Erro ao curtir post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE: Remover like de um post
router.delete('/api/community/posts/:id/like', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Remover like
    const result = await db
      .delete(communityLikes)
      .where(
        and(
          eq(communityLikes.postId, postId),
          eq(communityLikes.userId, userId)
        )
      );
      
    // Verificar se algum like foi removido
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Like não encontrado' });
    }
    
    return res.json({
      message: 'Like removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover like:', error);
    return res.status(500).json({ 
      message: 'Erro ao remover like',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST: Salvar um post
router.post('/api/community/posts/:id/save', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verificar se o post existe e está aprovado
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(
        and(
          eq(communityPosts.id, postId),
          eq(communityPosts.status, 'approved')
        )
      );
      
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado ou não aprovado' });
    }
    
    // Verificar se o usuário já salvou
    const [existingSave] = await db
      .select()
      .from(communitySaves)
      .where(
        and(
          eq(communitySaves.postId, postId),
          eq(communitySaves.userId, userId)
        )
      );
      
    if (existingSave) {
      return res.status(400).json({ message: 'Você já salvou este post' });
    }
    
    // Adicionar salvamento
    const [save] = await db
      .insert(communitySaves)
      .values({
        postId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    // Adicionar pontos para o criador do post
    if (post.userId !== userId) { // Não adicionar pontos se for o próprio usuário
      // Buscar configurações para determinar pontos
      const [settings] = await db.select().from(communitySettings);
      const pointsForSave = settings?.pointsForSave || 2;
      const currentMonth = new Date().toISOString().substring(0, 7); // Formato YYYY-MM
      
      // Adicionar pontos
      await db
        .insert(communityPoints)
        .values({
          userId: post.userId,
          points: pointsForSave,
          reason: 'save',
          sourceId: postId,
          period: currentMonth,
          createdAt: new Date(),
        });
        
      // Atualizar leaderboard
      await updateLeaderboard(post.userId);
    }
    
    return res.status(201).json({
      message: 'Post salvo com sucesso',
      save
    });
  } catch (error) {
    console.error('Erro ao salvar post:', error);
    return res.status(500).json({ 
      message: 'Erro ao salvar post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE: Remover salvamento de um post
router.delete('/api/community/posts/:id/save', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Remover salvamento
    const result = await db
      .delete(communitySaves)
      .where(
        and(
          eq(communitySaves.postId, postId),
          eq(communitySaves.userId, userId)
        )
      );
      
    // Verificar se algum salvamento foi removido
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Salvamento não encontrado' });
    }
    
    return res.json({
      message: 'Salvamento removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover salvamento:', error);
    return res.status(500).json({ 
      message: 'Erro ao remover salvamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Listar comentários de um post
router.get('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    // Verificar se devemos incluir respostas ou apenas comentários principais
    const includeReplies = req.query.includeReplies === 'true';
    const parentIdFilter = includeReplies 
      ? sql`1=1` 
      : sql`"parentId" IS NULL`;

    // Buscar comentários com informações do usuário e contagem de curtidas
    const comments = await db.execute(sql`
      SELECT 
        c.id, c."postId", c."userId", c.content, c."isHidden", c."parentId", c."createdAt", c."updatedAt",
        u.id as user_id, u.username, u.name, u.profileimageurl, u.nivelacesso,
        COUNT(DISTINCT cl.id) as likes_count,
        (SELECT COUNT(*) FROM "communityComments" as replies WHERE replies."parentId" = c.id) as replies_count
      FROM "communityComments" c
      LEFT JOIN users u ON c."userId" = u.id
      LEFT JOIN "communityCommentLikes" cl ON c.id = cl."commentId"
      WHERE c."postId" = ${postId}
        AND c."isHidden" = false
        AND ${parentIdFilter}
      GROUP BY c.id, u.id
      ORDER BY c."createdAt" DESC
    `);

    // Processar os resultados para o formato que o frontend espera
    const formattedComments = comments.rows.map(row => ({
      comment: {
        id: row.id,
        postId: row.postId,
        userId: row.userId,
        content: row.content,
        isHidden: row.isHidden,
        parentId: row.parentId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      },
      user: {
        id: row.user_id,
        username: row.username,
        name: row.name,
        profileimageurl: row.profileimageurl,
        nivelacesso: row.nivelacesso
      },
      likesCount: parseInt(row.likes_count) || 0,
      repliesCount: parseInt(row.replies_count) || 0,
      userHasLiked: false // será atualizado abaixo para usuários autenticados
    }));

    // Adicionar info se o usuário autenticado curtiu cada comentário
    if (req.user?.id) {
      const userId = req.user.id;
      const commentIds = formattedComments.map(c => c.comment.id);
      
      if (commentIds.length > 0) {
        const userLikes = await db
          .select()
          .from(communityCommentLikes)
          .where(
            and(
              inArray(communityCommentLikes.commentId, commentIds),
              eq(communityCommentLikes.userId, userId)
            )
          );
        
        const likedCommentIds = new Set(userLikes.map(like => like.commentId));
        
        formattedComments.forEach(comment => {
          comment.userHasLiked = likedCommentIds.has(comment.comment.id);
        });
      }
    }
    
    return res.json(formattedComments);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar comentários',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST: Adicionar comentário a um post
router.post('/api/community/posts/:id/comments', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const postId = parseInt(req.params.id);
    const { content, parentId } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Conteúdo do comentário é obrigatório' });
    }
    
    // Verificar se o post existe e está aprovado
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(
        and(
          eq(communityPosts.id, postId),
          eq(communityPosts.status, 'approved')
        )
      );
      
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado ou não aprovado' });
    }
    
    // Verificar se comentários estão habilitados
    const [settings] = await db.select().from(communitySettings);
    if (settings?.allowComments === false) {
      return res.status(403).json({ message: 'Comentários estão desabilitados' });
    }
    
    // Se for resposta, verificar se o comentário pai existe
    if (parentId) {
      const [parentComment] = await db
        .select()
        .from(communityComments)
        .where(
          and(
            eq(communityComments.id, parentId),
            eq(communityComments.postId, postId),
            eq(communityComments.isHidden, false)
          )
        );
      
      if (!parentComment) {
        return res.status(404).json({ message: 'Comentário pai não encontrado' });
      }
    }
    
    // Adicionar comentário
    const [comment] = await db
      .insert(communityComments)
      .values({
        postId,
        userId: req.user.id,
        content,
        isHidden: false,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Buscar informações do usuário para retornar
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        profileimageurl: users.profileimageurl,
        nivelacesso: users.nivelacesso
      })
      .from(users)
      .where(eq(users.id, req.user.id));
    
    return res.status(201).json({
      message: 'Comentário adicionado com sucesso',
      comment,
      user,
      likesCount: 0,
      repliesCount: 0,
      userHasLiked: false
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return res.status(500).json({ 
      message: 'Erro ao adicionar comentário',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Buscar respostas de um comentário
router.get('/api/community/comments/:id/replies', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    
    // Verificar se o comentário existe
    const [commentExists] = await db
      .select()
      .from(communityComments)
      .where(eq(communityComments.id, commentId));
      
    if (!commentExists) {
      return res.status(404).json({ message: 'Comentário não encontrado' });
    }
    
    // Buscar respostas do comentário
    const replies = await db.execute(sql`
      SELECT 
        c.id, c."postId", c."userId", c.content, c."isHidden", c."parentId", c."createdAt", c."updatedAt",
        u.id as user_id, u.username, u.name, u.profileimageurl, u.nivelacesso,
        COUNT(DISTINCT cl.id) as likes_count
      FROM "communityComments" c
      LEFT JOIN users u ON c."userId" = u.id
      LEFT JOIN "communityCommentLikes" cl ON c.id = cl."commentId"
      WHERE c."parentId" = ${commentId}
        AND c."isHidden" = false
      GROUP BY c.id, u.id
      ORDER BY c."createdAt" ASC
    `);
    
    // Processar os resultados para o formato esperado pelo frontend
    const formattedReplies = replies.rows.map(row => ({
      comment: {
        id: row.id,
        postId: row.postId,
        userId: row.userId,
        content: row.content,
        isHidden: row.isHidden,
        parentId: row.parentId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      },
      user: {
        id: row.user_id,
        username: row.username,
        name: row.name,
        profileimageurl: row.profileimageurl,
        nivelacesso: row.nivelacesso
      },
      likesCount: parseInt(row.likes_count) || 0,
      userHasLiked: false // será atualizado abaixo para usuários autenticados
    }));
    
    // Adicionar informação se o usuário curtiu cada resposta
    if (req.user?.id && formattedReplies.length > 0) {
      const userId = req.user.id;
      const replyIds = formattedReplies.map(r => r.comment.id);
      
      const userLikes = await db
        .select()
        .from(communityCommentLikes)
        .where(
          and(
            inArray(communityCommentLikes.commentId, replyIds),
            eq(communityCommentLikes.userId, userId)
          )
        );
      
      const likedReplyIds = new Set(userLikes.map(like => like.commentId));
      
      formattedReplies.forEach(reply => {
        reply.userHasLiked = likedReplyIds.has(reply.comment.id);
      });
    }
    
    return res.json(formattedReplies);
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar respostas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST: Curtir um comentário
router.post('/api/community/comments/:id/like', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const commentId = parseInt(req.params.id);
    
    // Verificar se o comentário existe
    const [comment] = await db
      .select({
        comment: communityComments,
        post: {
          id: communityPosts.id,
          status: communityPosts.status
        }
      })
      .from(communityComments)
      .leftJoin(communityPosts, eq(communityComments.postId, communityPosts.id))
      .where(
        and(
          eq(communityComments.id, commentId),
          eq(communityComments.isHidden, false),
          eq(communityPosts.status, 'approved')
        )
      );
      
    if (!comment) {
      return res.status(404).json({ message: 'Comentário não encontrado ou não disponível' });
    }
    
    // Verificar se o usuário já curtiu este comentário
    const [existingLike] = await db
      .select()
      .from(communityCommentLikes)
      .where(
        and(
          eq(communityCommentLikes.commentId, commentId),
          eq(communityCommentLikes.userId, req.user.id)
        )
      );
    
    if (existingLike) {
      // Remover curtida
      await db
        .delete(communityCommentLikes)
        .where(
          and(
            eq(communityCommentLikes.commentId, commentId),
            eq(communityCommentLikes.userId, req.user.id)
          )
        );
      
      // Contar curtidas totais do comentário
      const [{ count }] = await db
        .select({ count: countFn() })
        .from(communityCommentLikes)
        .where(eq(communityCommentLikes.commentId, commentId));
      
      return res.json({
        message: 'Curtida removida com sucesso',
        liked: false,
        likesCount: Number(count)
      });
    } else {
      // Adicionar curtida
      await db
        .insert(communityCommentLikes)
        .values({
          commentId,
          userId: req.user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      // Contar curtidas totais do comentário
      const [{ count }] = await db
        .select({ count: countFn() })
        .from(communityCommentLikes)
        .where(eq(communityCommentLikes.commentId, commentId));
      
      return res.json({
        message: 'Comentário curtido com sucesso',
        liked: true,
        likesCount: Number(count)
      });
    }
  } catch (error) {
    console.error('Erro ao curtir comentário:', error);
    return res.status(500).json({ 
      message: 'Erro ao curtir comentário',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Obter ranking de usuários
router.get('/api/community/ranking', async (req, res) => {
  try {
    const period = req.query.period as string || 'all_time';
    const limit = parseInt(req.query.limit as string) || 10;
    const monthYear = req.query.monthYear as string; // Formato YYYY-MM para buscar ranking de um mês específico
    
    // Validar período
    const validPeriods = ['all_time', 'year', 'month', 'week'];
    if (!validPeriods.includes(period) && !period.match(/^\d{4}(-\d{2})?(-W\d{2})?$/)) {
      return res.status(400).json({ message: 'Período inválido' });
    }
    
    // Se temos um mês específico no formato 'YYYY-MM', vamos usar esse valor em vez do período padrão do mês atual
    let periodValue = period;
    if (period === 'month' && monthYear && monthYear.match(/^\d{4}-\d{2}$/)) {
      periodValue = monthYear;
    }
    
    // Buscar usuários do ranking
    const users_ranking = await db
      .select({
        id: communityLeaderboard.id,
        userId: communityLeaderboard.userId,
        rank: communityLeaderboard.rank,
        totalPoints: communityLeaderboard.totalPoints,
        postCount: communityLeaderboard.postCount,
        likesReceived: communityLeaderboard.likesReceived,
        savesReceived: communityLeaderboard.savesReceived,
        featuredCount: communityLeaderboard.featuredCount,
        level: communityLeaderboard.level,
        period: communityLeaderboard.period,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          nivelacesso: users.nivelacesso
        }
      })
      .from(communityLeaderboard)
      .leftJoin(users, eq(communityLeaderboard.userId, users.id))
      .where(eq(communityLeaderboard.period, periodValue))
      .orderBy(asc(communityLeaderboard.rank))
      .limit(limit);
    
    // Buscar configurações do sistema
    const [settings] = await db.select().from(communitySettings);
    
    // Verificar se tem dados para o período atual
    if (users_ranking.length === 0 && (period === 'month' || period === 'week')) {
      // Iniciar o cálculo do ranking para o período atual
      await updateLeaderboardForPeriod(period);
      
      // Buscar novamente após atualização
      const refreshed_ranking = await db
        .select({
          id: communityLeaderboard.id,
          userId: communityLeaderboard.userId,
          rank: communityLeaderboard.rank,
          totalPoints: communityLeaderboard.totalPoints,
          postCount: communityLeaderboard.postCount,
          likesReceived: communityLeaderboard.likesReceived,
          savesReceived: communityLeaderboard.savesReceived,
          featuredCount: communityLeaderboard.featuredCount,
          level: communityLeaderboard.level,
          period: communityLeaderboard.period,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileimageurl: users.profileimageurl,
            nivelacesso: users.nivelacesso
          }
        })
        .from(communityLeaderboard)
        .leftJoin(users, eq(communityLeaderboard.userId, users.id))
        .where(eq(communityLeaderboard.period, periodValue))
        .orderBy(asc(communityLeaderboard.rank))
        .limit(limit);
        
      return res.json({
        users: refreshed_ranking,
        settings: settings || {
          prize1stPlace: "R$ 100",
          prize2ndPlace: "R$ 50",
          prize3rdPlace: "R$ 25",
          levelThresholds: {
            "Iniciante KDG": 0,
            "Colaborador KDG": 501,
            "Destaque KDG": 2001,
            "Elite KDG": 5001,
            "Lenda KDG": 10001
          }
        }
      });
    }
    
    // Retornar dados do ranking e configurações
    return res.json({
      users: users_ranking,
      settings: settings || {
        prize1stPlace: "R$ 100",
        prize2ndPlace: "R$ 50",
        prize3rdPlace: "R$ 25",
        levelThresholds: {
          "Iniciante KDG": 0,
          "Colaborador KDG": 501,
          "Destaque KDG": 2001,
          "Elite KDG": 5001,
          "Lenda KDG": 10001
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar ranking',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Obter configurações do sistema de comunidade
router.get('/api/community/settings', async (req, res) => {
  try {
    // Apenas admins podem ver as configurações completas
    const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm';
    
    const [settings] = await db.select().from(communitySettings);
    
    if (!settings) {
      // Criar configurações padrão se não existirem
      const [newSettings] = await db
        .insert(communitySettings)
        .values({
          pointsForPost: 20,
          pointsForLike: 5,
          pointsForSave: 10,
          pointsForWeeklyFeatured: 50,
          prize1stPlace: 'R$ 0',
          prize2ndPlace: 'R$ 0',
          prize3rdPlace: 'R$ 0',
          levelThresholds: {
            "Iniciante KDG": 0,
            "Colaborador KDG": 501,
            "Destaque KDG": 2001,
            "Elite KDG": 5001,
            "Lenda KDG": 10001
          },
          requireApproval: true,
          allowComments: true,
          showRanking: true,
          updatedAt: new Date()
        })
        .returning();
      
      if (!isAdmin) {
        // Para usuários não-admin, retornar apenas configurações públicas
        return res.json({
          allowComments: newSettings.allowComments,
          showRanking: newSettings.showRanking,
          requireApproval: newSettings.requireApproval,
          prizes: {
            first: newSettings.prize1stPlace,
            second: newSettings.prize2ndPlace,
            third: newSettings.prize3rdPlace,
          },
          levels: newSettings.levelThresholds
        });
      }
      
      return res.json(newSettings);
    }
    
    if (!isAdmin) {
      // Para usuários não-admin, retornar apenas configurações públicas
      return res.json({
        allowComments: settings.allowComments,
        showRanking: settings.showRanking,
        requireApproval: settings.requireApproval,
        prizes: {
          first: settings.prize1stPlace,
          second: settings.prize2ndPlace,
          third: settings.prize3rdPlace,
        },
        levels: settings.levelThresholds
      });
    }
    
    return res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar configurações',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// PUT: Atualizar configurações do sistema de comunidade
router.put('/api/community/settings', async (req, res) => {
  try {
    // Apenas admins podem atualizar configurações
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }
    
    const {
      pointsForPost,
      pointsForLike,
      pointsForSave,
      pointsForWeeklyFeatured,
      prize1stPlace,
      prize2ndPlace,
      prize3rdPlace,
      levelThresholds,
      requireApproval,
      allowComments,
      showRanking
    } = req.body;
    
    // Verificar se existe configuração
    const [existingSettings] = await db.select().from(communitySettings);
    
    if (!existingSettings) {
      // Criar nova configuração
      const [settings] = await db
        .insert(communitySettings)
        .values({
          pointsForPost: pointsForPost || 20,
          pointsForLike: pointsForLike || 5,
          pointsForSave: pointsForSave || 10,
          pointsForWeeklyFeatured: pointsForWeeklyFeatured || 5,
          prize1stPlace: prize1stPlace || 'R$ 0',
          prize2ndPlace: prize2ndPlace || 'R$ 0',
          prize3rdPlace: prize3rdPlace || 'R$ 0',
          levelThresholds: levelThresholds || {
            "Iniciante KDG": 0,
            "Colaborador KDG": 501,
            "Destaque KDG": 2001,
            "Elite KDG": 5001,
            "Lenda KDG": 10001
          },
          requireApproval: requireApproval !== undefined ? requireApproval : true,
          allowComments: allowComments !== undefined ? allowComments : true,
          showRanking: showRanking !== undefined ? showRanking : true,
          updatedAt: new Date(),
          updatedBy: req.user.id
        })
        .returning();
        
      return res.json({
        message: 'Configurações criadas com sucesso',
        settings
      });
    }
    
    // Atualizar configurações existentes
    const [settings] = await db
      .update(communitySettings)
      .set({
        ...(pointsForPost !== undefined && { pointsForPost }),
        ...(pointsForLike !== undefined && { pointsForLike }),
        ...(pointsForSave !== undefined && { pointsForSave }),
        ...(pointsForWeeklyFeatured !== undefined && { pointsForWeeklyFeatured }),
        ...(prize1stPlace !== undefined && { prize1stPlace }),
        ...(prize2ndPlace !== undefined && { prize2ndPlace }),
        ...(prize3rdPlace !== undefined && { prize3rdPlace }),
        ...(levelThresholds !== undefined && { levelThresholds }),
        ...(requireApproval !== undefined && { requireApproval }),
        ...(allowComments !== undefined && { allowComments }),
        ...(showRanking !== undefined && { showRanking }),
        updatedAt: new Date(),
        updatedBy: req.user.id
      })
      .where(eq(communitySettings.id, existingSettings.id))
      .returning();
      
    return res.json({
      message: 'Configurações atualizadas com sucesso',
      settings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return res.status(500).json({ 
      message: 'Erro ao atualizar configurações',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Função auxiliar para atualizar o ranking de um usuário
async function updateLeaderboard(userId: number) {
  try {
    // Períodos a serem atualizados
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
    
    // Método seguro para calcular número da semana do ano
    let weekNumber;
    try {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      
      // Garantir que o valor é um número válido
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
        console.warn('Cálculo da semana do ano resultou em valor inválido, usando valor padrão 1');
        weekNumber = 1;
      }
    } catch (error) {
      console.error('Erro ao calcular semana do ano:', error);
      weekNumber = 1; // Valor padrão seguro
    }
    
    const currentWeek = `${currentYear}-W${weekNumber.toString().padStart(2, '0')}`;
    
    const periods = ['all_time', currentYear, currentMonth, currentWeek];
    
    for (const period of periods) {
      // Calcular pontos totais para o período
      const pointsResult = await db.execute(sql`
        SELECT SUM(points) as total_points
        FROM ${communityPoints}
        WHERE "userId" = ${userId}
        ${period !== 'all_time' ? sql`AND period LIKE ${period + '%'}` : sql``}
      `);
      
      const totalPoints = pointsResult.rows[0]?.total_points || 0;
      
      // Calcular estatísticas
      const postsResult = await db.execute(sql`
        SELECT COUNT(*) as post_count
        FROM ${communityPosts}
        WHERE "userId" = ${userId} AND status = 'approved'
        ${period !== 'all_time' ? sql`AND "createdAt" >= ${period.substring(0, 4) + '-01-01'}` : sql``}
      `);
      
      const likesResult = await db.execute(sql`
        SELECT COUNT(*) as likes_received
        FROM ${communityLikes} l
        JOIN ${communityPosts} p ON l."postId" = p.id
        WHERE p."userId" = ${userId}
        ${period !== 'all_time' ? sql`AND l."createdAt" >= ${period.substring(0, 4) + '-01-01'}` : sql``}
      `);
      
      const savesResult = await db.execute(sql`
        SELECT COUNT(*) as saves_received
        FROM ${communitySaves} s
        JOIN ${communityPosts} p ON s."postId" = p.id
        WHERE p."userId" = ${userId}
        ${period !== 'all_time' ? sql`AND s."createdAt" >= ${period.substring(0, 4) + '-01-01'}` : sql``}
      `);
      
      const featuredResult = await db.execute(sql`
        SELECT COUNT(*) as featured_count
        FROM ${communityPosts}
        WHERE "userId" = ${userId} AND "isWeeklyFeatured" = true
        ${period !== 'all_time' ? sql`AND "createdAt" >= ${period.substring(0, 4) + '-01-01'}` : sql``}
      `);
      
      const postCount = parseInt(postsResult.rows[0]?.post_count) || 0;
      const likesReceived = parseInt(likesResult.rows[0]?.likes_received) || 0;
      const savesReceived = parseInt(savesResult.rows[0]?.saves_received) || 0;
      const featuredCount = parseInt(featuredResult.rows[0]?.featured_count) || 0;
      
      // Determinar nível com base nos pontos
      const [settings] = await db.select().from(communitySettings);
      const levelThresholds = settings?.levelThresholds || {
        "Membro D.Auto": 0,
        "Voluntário D.Auto": 200,
        "Cooperador D.Auto": 700,
        "Destaque D.Auto": 1500,
        "Referência D.Auto": 3000,
        "Pro D.Auto": 5000
      };
      
      let level = "Membro D.Auto";
      for (const [levelName, threshold] of Object.entries(levelThresholds)) {
        if (totalPoints >= threshold) {
          level = levelName;
        } else {
          break;
        }
      }
      
      // Verificar se já existe entrada no leaderboard para este usuário e período
      const [existingEntry] = await db
        .select()
        .from(communityLeaderboard)
        .where(
          and(
            eq(communityLeaderboard.userId, userId),
            eq(communityLeaderboard.period, period)
          )
        );
        
      if (existingEntry) {
        // Atualizar entrada existente
        await db
          .update(communityLeaderboard)
          .set({
            totalPoints,
            postCount,
            likesReceived,
            savesReceived,
            featuredCount,
            level,
            lastUpdated: new Date()
          })
          .where(eq(communityLeaderboard.id, existingEntry.id));
      } else {
        // Criar nova entrada
        await db
          .insert(communityLeaderboard)
          .values({
            userId,
            totalPoints,
            postCount,
            likesReceived,
            savesReceived,
            featuredCount,
            period,
            rank: 0, // Será atualizado posteriormente
            level,
            lastUpdated: new Date()
          });
      }
      
      // Atualizar ranks para este período
      await updateRanks(period);
    }
  } catch (error) {
    console.error('Erro ao atualizar leaderboard:', error);
  }
}

// Função auxiliar para atualizar os ranks de um período específico
async function updateRanks(period: string) {
  try {
    // Buscar todos os usuários ordenados por pontos
    const leaderboard = await db
      .select()
      .from(communityLeaderboard)
      .where(eq(communityLeaderboard.period, period))
      .orderBy(desc(communityLeaderboard.totalPoints));
      
    // Atualizar rank de cada usuário
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const rank = i + 1;
      
      if (entry.rank !== rank) {
        await db
          .update(communityLeaderboard)
          .set({ rank })
          .where(eq(communityLeaderboard.id, entry.id));
      }
    }
  } catch (error) {
    console.error(`Erro ao atualizar ranks para o período ${period}:`, error);
  }
}

// Função para calcular e atualizar o leaderboard para um período específico
async function updateLeaderboardForPeriod(period: string) {
  try {
    // Primeiro identificar o período inicial e final para filtrar os dados
    let startDateStr: string, endDateStr: string, formattedPeriod: string;
    const now = new Date();
    
    switch(period) {
      case 'month':
        // Primeiro dia do mês atual
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        // Último dia do mês atual
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        startDateStr = firstDay.toISOString().split('T')[0];
        endDateStr = lastDay.toISOString().split('T')[0];
        formattedPeriod = now.toISOString().substring(0, 7); // YYYY-MM
        break;
        
      case 'week':
        // Calcular primeira e última data da semana atual
        const dayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda, etc.
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // ajusta quando o dia é domingo
        
        // Clone do objeto Date para não modificar o original
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);
        
        startDateStr = firstDayOfWeek.toISOString().split('T')[0];
        endDateStr = lastDayOfWeek.toISOString().split('T')[0];
        
        // Calcular número da semana
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((firstDayOfWeek.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        formattedPeriod = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
        break;
        
      default:
        throw new Error('Período inválido para atualização do leaderboard');
    }
    
    console.log(`Atualizando leaderboard para período ${formattedPeriod} (${startDateStr} a ${endDateStr})`);
    
    // Buscar todos os usuários que interagiram no período usando SQL direta
    const activeUsersSql = sql`
      WITH active_users AS (
        -- Usuários que fizeram posts
        SELECT DISTINCT "userId" AS user_id
        FROM "communityPosts"
        WHERE status = 'approved'
          AND "createdAt" >= ${startDateStr}
          AND "createdAt" <= ${endDateStr}
        
        UNION
        
        -- Usuários que receberam likes ou saves
        SELECT DISTINCT p."userId" AS user_id
        FROM "communityPosts" p
        LEFT JOIN "communityLikes" l ON p.id = l."postId"
        LEFT JOIN "communitySaves" s ON p.id = s."postId"
        WHERE 
          (l."createdAt" >= ${startDateStr} AND l."createdAt" <= ${endDateStr})
          OR (s."createdAt" >= ${startDateStr} AND s."createdAt" <= ${endDateStr})
      )
      SELECT user_id FROM active_users
    `;
    
    const activeUsersResult = await db.execute(activeUsersSql);
    const userIds = activeUsersResult.rows.map(row => Number(row.user_id));
    
    console.log(`Encontrados ${userIds.length} usuários ativos no período ${formattedPeriod}`);
    
    // Para cada usuário ativo, atualizar seu ranking
    for (const userId of userIds) {
      if (userId) { // Verifica se o ID é válido (não null, undefined ou 0)
        await updateLeaderboard(userId);
      }
    }
    
    // Atualizar ranks
    await updateRanks(formattedPeriod);
    
    return formattedPeriod;
  } catch (error) {
    console.error(`Erro ao atualizar leaderboard para o período ${period}:`, error);
    throw error;
  }
}

// ========== ROTAS ADMINISTRATIVAS ==========

// GET: Estatísticas administrativas da comunidade
router.get('/api/community/admin/stats', async (req, res) => {
  try {
    // Verificar permissão - admin, designer_adm e suporte podem acessar
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm' && req.user.nivelacesso !== 'suporte')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    // Contar total de posts
    const totalPostsResult = await db
      .select({ count: countFn() })
      .from(communityPosts);

    // Contar posts pendentes
    const pendingPostsResult = await db
      .select({ count: countFn() })
      .from(communityPosts)
      .where(eq(communityPosts.status, 'pending'));

    // Contar posts aprovados
    const approvedPostsResult = await db
      .select({ count: countFn() })
      .from(communityPosts)
      .where(eq(communityPosts.status, 'approved'));

    // Retornar as estatísticas
    return res.json({
      totalPosts: totalPostsResult[0].count,
      pendingPosts: pendingPostsResult[0].count,
      approvedPosts: approvedPostsResult[0].count
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de administração:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar estatísticas de administração',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Listar posts para administração (com filtros e paginação)
router.get('/api/community/admin/posts', async (req, res) => {
  try {
    // Verificar permissão - admin, designer_adm e suporte podem acessar
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm' && req.user.nivelacesso !== 'suporte')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    // Parâmetros de filtro e paginação
    const status = req.query.status as string || 'pending';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const sortBy = req.query.sortBy as string || 'newest';
    
    const offset = (page - 1) * limit;
    
    // Construir condições WHERE
    let conditions = and();
    
    // Filtrar por status
    if (status !== 'all') {
      conditions = and(conditions, eq(communityPosts.status, status));
    }
    
    // Filtrar por userId se especificado
    if (userId) {
      conditions = and(conditions, eq(communityPosts.userId, userId));
    }
    
    // Filtrar por termo de pesquisa se especificado
    if (search) {
      conditions = and(
        conditions,
        sql`(${communityPosts.title} ILIKE ${'%' + search + '%'} OR ${communityPosts.content} ILIKE ${'%' + search + '%'})`
      );
    }

    // Contar total de posts com os filtros aplicados
    const countResult = await db
      .select({ count: countFn() })
      .from(communityPosts)
      .where(conditions);
    
    const total = countResult[0].count;
    
    // Definir ordenação
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = asc(communityPosts.createdAt);
        break;
      case 'most_likes':
        orderBy = desc(sql`COUNT(DISTINCT ${communityLikes.id})`);
        break;
      case 'most_comments':
        orderBy = desc(sql`COUNT(DISTINCT ${communityComments.id})`);
        break;
      case 'newest':
      default:
        orderBy = desc(communityPosts.createdAt);
    }

    // Buscar posts com informações do usuário e contagens
    const posts = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        imageUrl: communityPosts.imageUrl,
        editLink: communityPosts.editLink,
        status: communityPosts.status,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        viewCount: communityPosts.viewCount,
        userId: communityPosts.userId,
        likesCount: sql<number>`COUNT(DISTINCT ${communityLikes.id})`,
        commentsCount: sql<number>`COUNT(DISTINCT ${communityComments.id})`,
        savesCount: sql<number>`COUNT(DISTINCT ${communitySaves.id})`,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          nivelacesso: users.nivelacesso,
        }
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(communityLikes, eq(communityPosts.id, communityLikes.postId))
      .leftJoin(communityComments, eq(communityPosts.id, communityComments.postId))
      .leftJoin(communitySaves, eq(communityPosts.id, communitySaves.postId))
      .where(conditions)
      .groupBy(
        communityPosts.id,
        users.id,
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Retornar posts e informações de paginação
    return res.json({
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar posts para administração:', error);
    return res.status(500).json({
      message: 'Erro ao buscar posts para administração',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST: Aprovar um post
router.post('/api/community/admin/posts/:id/approve', async (req, res) => {
  try {
    // Verificar permissão - admin, designer_adm e suporte podem aprovar
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm' && req.user.nivelacesso !== 'suporte')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    const postId = parseInt(req.params.id);
    
    // Verificar se o post existe
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));
      
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    // Atualizar status para 'approved'
    const [updatedPost] = await db
      .update(communityPosts)
      .set({ 
        status: 'approved',
        updatedAt: new Date()
      })
      .where(eq(communityPosts.id, postId))
      .returning();
      
    // Se o post estava pendente e foi aprovado, adicionar pontos ao usuário
    if (post.status === 'pending') {
      // Buscar configurações
      const [settings] = await db.select().from(communitySettings);
      const pointsForPost = settings?.pointsForPost || 5;
      const currentMonth = new Date().toISOString().substring(0, 7); // Formato YYYY-MM
      
      // Adicionar pontos
      await db
        .insert(communityPoints)
        .values({
          userId: post.userId,
          points: pointsForPost,
          reason: 'post',
          sourceId: postId,
          period: currentMonth,
          createdAt: new Date(),
        });
        
      // Atualizar leaderboard
      await updateLeaderboard(post.userId);
    }
    
    return res.json({
      message: 'Post aprovado com sucesso',
      post: updatedPost
    });
  } catch (error) {
    console.error('Erro ao aprovar post:', error);
    return res.status(500).json({
      message: 'Erro ao aprovar post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST: Rejeitar um post
router.post('/api/community/admin/posts/:id/reject', async (req, res) => {
  try {
    // Verificar permissão - admin, designer_adm e suporte podem rejeitar
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm' && req.user.nivelacesso !== 'suporte')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    const postId = parseInt(req.params.id);
    
    // Verificar se o post existe
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));
      
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    // Atualizar status para 'rejected'
    const [updatedPost] = await db
      .update(communityPosts)
      .set({ 
        status: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    
    return res.json({
      message: 'Post rejeitado com sucesso',
      post: updatedPost
    });
  } catch (error) {
    console.error('Erro ao rejeitar post:', error);
    return res.status(500).json({
      message: 'Erro ao rejeitar post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE: Excluir um post (Rota para usuários regulares)
router.delete('/api/community/posts/:id', async (req, res) => {
  try {
    console.log('==== TENTATIVA DE EXCLUSÃO DE POST ====');
    
    if (!req.user) {
      console.log('- Usuário não autenticado');
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const isAdmin = req.user.nivelacesso === 'admin' || req.user.nivelacesso === 'designer_adm';
    
    console.log(`- Post ID: ${postId}`);
    console.log(`- Usuário ID: ${userId}`);
    console.log(`- É admin: ${isAdmin}`);
    
    // Verificar se o post existe
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));
      
    if (!post) {
      console.log('- Post não encontrado');
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    console.log(`- Post encontrado, pertence ao usuário: ${post.userId}`);
    
    // Verificar se o usuário é admin (somente admins podem excluir posts)
    if (!isAdmin) {
      console.log('- Usuário não tem permissão para excluir este post - apenas administradores podem excluir posts');
      return res.status(403).json({ message: 'Apenas administradores podem excluir posts na comunidade' });
    }
    
    // Iniciar uma transação para excluir o post e seus registros relacionados
    console.log('- Iniciando transação para excluir o post e seus registros relacionados');
    
    try {
      // 1. Excluir comentários do post
      console.log('- Excluindo comentários do post');
      await db
        .delete(communityComments)
        .where(eq(communityComments.postId, postId));
      
      // 2. Excluir comentários likes do post
      // Não precisamos buscar os comentários, pois já os excluímos no passo anterior
      // Vamos direto excluir todos os likes de comentários deste post
      console.log('- Excluindo likes de comentários do post - usando JOIN em vez de inArray');
      await db.execute(sql`
        DELETE FROM "communityCommentLikes"
        WHERE "commentId" IN (
          SELECT id FROM "communityComments" 
          WHERE "postId" = ${postId}
        )
      `);
      
      // 3. Excluir likes do post
      console.log('- Excluindo likes do post');
      await db
        .delete(communityLikes)
        .where(eq(communityLikes.postId, postId));
      
      // 4. Excluir saves do post
      console.log('- Excluindo saves do post');
      await db
        .delete(communitySaves)
        .where(eq(communitySaves.postId, postId));
      
      // 5. Finalmente excluir o post
      console.log('- Excluindo o post');
      await db
        .delete(communityPosts)
        .where(eq(communityPosts.id, postId));
      
      console.log('- Post e registros relacionados excluídos com sucesso');
      
      // 6. Adicionar cabeçalho especial para indicar que o post foi excluído
      //    Isso ajuda o service worker a não cachear esta resposta
      res.setHeader('X-Post-Deleted', 'true');
    } catch (innerError) {
      console.error('Erro durante a transação de exclusão:', innerError);
      throw new Error(`Erro ao excluir dados relacionados: ${innerError instanceof Error ? innerError.message : String(innerError)}`);
    }
    
    return res.json({
      message: 'Post excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir post:', error);
    return res.status(500).json({
      message: 'Erro ao excluir post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE: Excluir um post (Rota para administração)
router.delete('/api/community/admin/posts/:id', async (req, res) => {
  try {
    // Verificar permissão - apenas admin pode excluir
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    const postId = parseInt(req.params.id);
    
    // Verificar se o post existe
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));
      
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    // Excluir post
    await db
      .delete(communityPosts)
      .where(eq(communityPosts.id, postId));
    
    return res.json({
      message: 'Post excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir post:', error);
    return res.status(500).json({
      message: 'Erro ao excluir post',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Listar todos os comentários para administração
router.get('/api/community/admin/comments', async (req, res) => {
  try {
    // Verificar permissão - apenas admin pode acessar
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parâmetros de filtro
    const postId = req.query.postId ? parseInt(req.query.postId as string) : null;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
    const search = req.query.search as string || '';
    const hideStatus = req.query.hideStatus as string || 'all'; // 'hidden', 'visible', 'all'
    
    // Construir condição WHERE baseada nos filtros
    let conditions: SQL<unknown>[] = [];
    
    if (postId) {
      conditions.push(eq(communityComments.postId, postId));
    }
    
    if (userId) {
      conditions.push(eq(communityComments.userId, userId));
    }
    
    if (search) {
      conditions.push(ilike(communityComments.content, `%${search}%`));
    }
    
    if (hideStatus === 'hidden') {
      conditions.push(eq(communityComments.isHidden, true));
    } else if (hideStatus === 'visible') {
      conditions.push(eq(communityComments.isHidden, false));
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    // Contar total para paginação
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityComments)
      .where(whereClause);
      
    // Buscar comentários com informações do usuário e post
    const comments = await db
      .select({
        comment: communityComments,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          nivelacesso: users.nivelacesso
        },
        post: {
          id: communityPosts.id,
          title: communityPosts.title
        }
      })
      .from(communityComments)
      .leftJoin(users, eq(communityComments.userId, users.id))
      .leftJoin(communityPosts, eq(communityComments.postId, communityPosts.id))
      .where(whereClause)
      .orderBy(desc(communityComments.createdAt))
      .limit(limit)
      .offset(offset);
    
    return res.json({
      comments,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar comentários para administração:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar comentários',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// PATCH: Ocultar/mostrar um comentário
router.patch('/api/community/admin/comments/:id/toggle-visibility', async (req, res) => {
  try {
    // Verificar permissão - apenas admin pode modificar
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    const commentId = parseInt(req.params.id);
    
    // Verificar se o comentário existe
    const [comment] = await db
      .select()
      .from(communityComments)
      .where(eq(communityComments.id, commentId));
      
    if (!comment) {
      return res.status(404).json({ message: 'Comentário não encontrado' });
    }
    
    // Inverter o estado de visibilidade
    const currentVisibility = comment.isHidden;
    const [updatedComment] = await db
      .update(communityComments)
      .set({ 
        isHidden: !currentVisibility,
        updatedAt: new Date()
      })
      .where(eq(communityComments.id, commentId))
      .returning();
    
    return res.json({
      message: updatedComment.isHidden ? 'Comentário ocultado com sucesso' : 'Comentário mostrado com sucesso',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Erro ao alterar visibilidade do comentário:', error);
    return res.status(500).json({ 
      message: 'Erro ao alterar visibilidade do comentário',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE: Excluir um comentário (Rota para administradores)
router.delete('/api/community/admin/comments/:id', async (req, res) => {
  try {
    // Verificar permissão - apenas admin pode excluir
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    const commentId = parseInt(req.params.id);
    
    // Verificar se o comentário existe
    const [comment] = await db
      .select()
      .from(communityComments)
      .where(eq(communityComments.id, commentId));
      
    if (!comment) {
      return res.status(404).json({ message: 'Comentário não encontrado' });
    }
    
    // Excluir comentário
    await db
      .delete(communityComments)
      .where(eq(communityComments.id, commentId));
    
    return res.json({
      message: 'Comentário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    return res.status(500).json({ 
      message: 'Erro ao excluir comentário',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE: Excluir um comentário (Rota para usuários regulares)
router.delete('/api/community/comments/:id', async (req, res) => {
  try {
    console.log('==== TENTATIVA DE EXCLUSÃO DE COMENTÁRIO ====');
    
    if (!req.user) {
      console.log('- Usuário não autenticado');
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;
    const isAdmin = req.user.nivelacesso === 'admin' || req.user.nivelacesso === 'designer_adm';
    
    console.log(`- Comentário ID: ${commentId}`);
    console.log(`- Usuário ID: ${userId}`);
    console.log(`- É admin: ${isAdmin}`);
    
    // Verificar se o comentário existe
    const [comment] = await db
      .select()
      .from(communityComments)
      .where(eq(communityComments.id, commentId));
      
    if (!comment) {
      console.log('- Comentário não encontrado');
      return res.status(404).json({ message: 'Comentário não encontrado' });
    }
    
    console.log(`- Comentário encontrado, pertence ao usuário: ${comment.userId}`);
    
    // Verificar se o usuário é o autor do comentário ou admin
    if (comment.userId !== userId && !isAdmin) {
      console.log('- Permissão negada: Usuário não é o autor nem admin');
      return res.status(403).json({ 
        message: 'Você só pode excluir seus próprios comentários',
        details: {
          commentUserId: comment.userId,
          requestUserId: userId,
          isAdmin: isAdmin
        }
      });
    }
    
    // Excluir comentário
    console.log('- Executando query de exclusão...');
    await db
      .delete(communityComments)
      .where(eq(communityComments.id, commentId));
    
    console.log('- Comentário excluído com sucesso');
    return res.json({
      message: 'Comentário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    return res.status(500).json({ 
      message: 'Erro ao excluir comentário',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Buscar posts populares (ESTA ROTA DEVE ESTAR ANTES DA ROTA DE DETALHES DO POST)
// ROTA DESATIVADA - USAR /api/community/populares
// Esta rota não funcionará devido ao conflito com a rota dinâmica /api/community/posts/:id
router.get('/api/community/posts/popular_DESATIVADO', async (req, res) => {
  try {
    console.log('==== BUSCANDO POSTS POPULARES (NOVA IMPLEMENTAÇÃO) ====');
    
    // Validação robusta do parâmetro de limite
    let limit = 5;
    if (req.query.limit && typeof req.query.limit === 'string') {
      const parsedLimit = parseInt(req.query.limit);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 20); // Limita a no máximo 20 para proteger o banco
      }
    }
    
    console.log('Limite validado:', limit);
    
    // Nova implementação usando SQL direto e com tratamento de erro aprimorado
    try {
      // Consulta SQL direta e simples que evita problemas de NaN
      const result = await db.execute(sql`
        WITH popular_posts AS (
          SELECT 
            cp.id, 
            cp.title, 
            cp.content, 
            cp."imageUrl", 
            cp."editLink", 
            cp.status, 
            cp."createdAt", 
            cp."updatedAt", 
            COALESCE(cp."viewCount", 0) as "viewCount",
            cp."userId",
            cp."featuredUntil",
            cp."isWeeklyFeatured",
            u.id as user_id,
            u.username,
            u.name,
            u.profileimageurl,
            u.nivelacesso,
            COUNT(DISTINCT cl.id) as likes_count,
            COUNT(DISTINCT cc.id) as comments_count
          FROM "communityPosts" cp
          LEFT JOIN users u ON cp."userId" = u.id
          LEFT JOIN "communityLikes" cl ON cp.id = cl."postId"
          LEFT JOIN "communityComments" cc ON cp.id = cc."postId"
          WHERE cp.status = 'approved'
          GROUP BY cp.id, u.id
          ORDER BY "viewCount" DESC
          LIMIT ${limit}
        )
        SELECT * FROM popular_posts
      `);
      
      // Processar os resultados com muita segurança
      const formattedResults = [];
      
      if (result && result.rows && Array.isArray(result.rows)) {
        // Mapear cada resultado em um formato seguro
        for (const row of result.rows) {
            // Pré-formatar a data para evitar mudanças ao visualizar
            const formattedDate = formatarDataCompleta(row.createdAt || new Date());
          try {
            formattedResults.push({
              post: {
                id: row.id ? Number(row.id) : 0,
                title: row.title || 'Sem título',
                content: row.content || '',
                imageUrl: row.imageUrl || '',
                editLink: row.editLink || '',
                status: row.status || 'approved',
                createdAt: row.createdAt || new Date(),
                updatedAt: row.updatedAt || new Date(),
                viewCount: (typeof row.viewCount === 'number' || typeof row.viewCount === 'string') 
                    ? Number(row.viewCount) : 0,
                userId: row.userId ? Number(row.userId) : 0,
                formattedDate: formattedDate, // Adicionar data pré-formatada
                featuredUntil: row.featuredUntil,
                isWeeklyFeatured: !!row.isWeeklyFeatured
              },
              user: {
                id: row.user_id ? Number(row.user_id) : 0,
                username: row.username || 'usuário',
                name: row.name || 'Usuário',
                profileimageurl: row.profileimageurl || null,
                nivelacesso: row.nivelacesso || 'free'
              },
              likesCount: (typeof row.likes_count === 'number' || typeof row.likes_count === 'string') 
                  ? Number(row.likes_count) : 0,
              commentsCount: (typeof row.comments_count === 'number' || typeof row.comments_count === 'string') 
                  ? Number(row.comments_count) : 0
            });
          } catch (rowError) {
            console.error('Erro ao processar linha em popular posts:', rowError);
            // Continuar para a próxima linha
          }
        }
      }
      
      console.log(`Retornando ${formattedResults.length} posts populares (nova implementação)`);
      return res.json(formattedResults);
      
    } catch (dbError) {
      console.error('ERRO CRÍTICO em posts populares (nova implementação):', dbError);
      // Em caso de erro crítico, retornar array vazio em vez de erro 500
      return res.json([]);
    }
  } catch (error) {
    console.error('Erro ao buscar posts populares (nova implementação):', error);
    // Em último caso, retornar array vazio para evitar quebra do frontend
    return res.json([]);
  }
});

// POST: Recalcular ranking D.Auto com os novos valores de pontuação
router.post('/api/community/recalcular-ranking', async (req, res) => {
  try {
    // Verificar permissão - apenas admin pode usar esta função
    if (!req.user || req.user.nivelacesso !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    // 1. Atualizar as configurações com os novos valores
    console.log('Atualizando configurações de pontuação...');
    await db.update(communitySettings)
      .set({
        pointsForPost: 5, // Antes 20
        pointsForLike: 1, // Antes 5
        pointsForSave: 2, // Antes 10
        pointsForWeeklyFeatured: 5, // Antes 50
        updatedAt: new Date()
      })
      .where(eq(communitySettings.id, 1));
    
    // 2. Atualizar pontos na tabela communityPoints
    console.log('Atualizando registros de pontos...');
    
    // 2.1 Atualizar pontos para posts
    await db.execute(sql`
      UPDATE "communityPoints"
      SET "points" = 5
      WHERE "reason" = 'post'
    `);
    
    // 2.2 Atualizar pontos para curtidas
    await db.execute(sql`
      UPDATE "communityPoints"
      SET "points" = 1
      WHERE "reason" = 'like'
    `);
    
    // 2.3 Atualizar pontos para salvamentos
    await db.execute(sql`
      UPDATE "communityPoints"
      SET "points" = 2
      WHERE "reason" = 'save'
    `);
    
    // 2.4 Atualizar pontos para posts em destaque
    await db.execute(sql`
      UPDATE "communityPoints"
      SET "points" = 5
      WHERE "reason" = 'weekly_featured'
    `);
    
    // 3. Limpar tabela de leaderboard para recalcular
    console.log('Limpando dados de leaderboard para recalcular...');
    await db.delete(communityLeaderboard);
    
    // 4. Recalcular o leaderboard para todos os períodos
    console.log('Recalculando o leaderboard...');
    const periods = [
      // Formato: all_time, YYYY (ano), YYYY-MM (ano-mês), YYYY-WW (ano-semana)
      'all_time',
      new Date().getFullYear().toString(), // Ano atual
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, // Mês atual
    ];
    
    // Adicionar semana atual (formato YYYY-WW)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    periods.push(`${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`);
    
    // Recalcular para cada período
    for (const period of periods) {
      console.log(`Recalculando leaderboard para período: ${period}`);
      
      // Buscar todos os usuários com pontos no período
      const usersResult = await db.execute(sql`
        SELECT DISTINCT "userId" FROM "communityPoints"
        WHERE ${period === 'all_time' ? sql`TRUE` : 
              period.length === 4 ? sql`"period" LIKE ${period + '-%'}` :
              sql`"period" = ${period}`}
      `);
      
      for (const user of usersResult.rows) {
        const userId = user.userId;
        
        // Calcular pontos totais para o usuário no período
        const pointsResult = await db.execute(sql`
          SELECT 
            SUM("points") as "totalPoints",
            COUNT(CASE WHEN "reason" = 'post' THEN 1 END) as "postCount",
            COUNT(CASE WHEN "reason" = 'like' THEN 1 END) as "likesReceived",
            COUNT(CASE WHEN "reason" = 'save' THEN 1 END) as "savesReceived",
            COUNT(CASE WHEN "reason" = 'weekly_featured' THEN 1 END) as "featuredCount"
          FROM "communityPoints"
          WHERE "userId" = ${userId}
          AND ${period === 'all_time' ? 
                sql`TRUE` : 
              period.startsWith('2025-W') ? 
                // Para período semanal, vamos pegar os registros do mês atual
                sql`"period" LIKE '2025-05%'` :
              period.length === 4 ? 
                sql`"period" LIKE ${period + '-%'}` :
                sql`"period" = ${period}`}
        `);
        
        if (pointsResult.rows.length > 0) {
          const stats = pointsResult.rows[0];
          const totalPoints = Number(stats.totalPoints) || 0;
          
          // Determinar nível com base em pontos
          let level = 'Membro D.Auto';
          if (totalPoints >= 5000) level = 'Pro D.Auto';
          else if (totalPoints >= 3000) level = 'Referência D.Auto';
          else if (totalPoints >= 1500) level = 'Destaque D.Auto';
          else if (totalPoints >= 700) level = 'Cooperador D.Auto';
          else if (totalPoints >= 200) level = 'Voluntário D.Auto';
          
          // Inserir no leaderboard
          await db.insert(communityLeaderboard).values({
            userId: userId,
            totalPoints: totalPoints,
            postCount: Number(stats.postCount) || 0,
            likesReceived: Number(stats.likesReceived) || 0,
            savesReceived: Number(stats.savesReceived) || 0,
            featuredCount: Number(stats.featuredCount) || 0,
            period: period,
            level: level,
            rank: 0, // Será definido pelo próximo passo
            lastUpdated: new Date()
          });
        }
      }
      
      // Atualizar posições (ranks) no leaderboard
      await db.execute(sql`
        WITH ranked_users AS (
          SELECT 
            "id",
            "userId",
            "totalPoints",
            ROW_NUMBER() OVER (ORDER BY "totalPoints" DESC, "lastUpdated" ASC) as row_num
          FROM "communityLeaderboard"
          WHERE "period" = ${period}
        )
        UPDATE "communityLeaderboard" cl
        SET "rank" = ru.row_num
        FROM ranked_users ru
        WHERE cl."id" = ru."id"
        AND cl."period" = ${period}
      `);
    }
    
    return res.json({
      success: true,
      message: 'Ranking D.Auto recalculado com sucesso com os novos valores de pontuação!',
      pointSettings: {
        pointsForPost: 5,
        pointsForLike: 1,
        pointsForSave: 2,
        pointsForWeeklyFeatured: 5
      }
    });
    
  } catch (error) {
    console.error('Erro ao recalcular ranking D.Auto:', error);
    return res.status(500).json({ 
      message: 'Erro ao recalcular ranking D.Auto',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET: Buscar posts do usuário logado (para seção "Meus Posts")
router.get('/api/community/my-posts', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const limit = parseInt(req.query.limit as string) || 5;
    
    if (!userId) {
      return res.status(400).json({ message: 'ID do usuário é obrigatório' });
    }
    
    // Verificar se o usuário está logado e se está buscando seus próprios posts
    if (!req.user || req.user.id !== userId) {
      return res.status(403).json({ message: 'Você só pode ver seus próprios posts' });
    }
    
    // Buscar posts do usuário (todos os status - pendente, aprovado, rejeitado)
    // Usando a mesma estrutura da query principal para garantir compatibilidade
    const rawPostsQuery = await db.execute(sql`
      SELECT 
        p.*,
        u.id as user_id,
        u.username,
        u.name,
        u.profileimageurl,
        u.nivelacesso,
        CAST(COALESCE(p."isPinned", false) AS BOOLEAN) as is_pinned,
        COUNT(DISTINCT l.id) as likes_count,
        COUNT(DISTINCT s.id) as saves_count,
        COUNT(DISTINCT c.id) as comments_count
      FROM "communityPosts" p
      LEFT JOIN users u ON p."userId" = u.id
      LEFT JOIN "communityLikes" l ON p.id = l."postId"
      LEFT JOIN "communitySaves" s ON p.id = s."postId"
      LEFT JOIN "communityComments" c ON p.id = c."postId"
      WHERE p."userId" = ${userId}
      GROUP BY p.id, u.id
      ORDER BY p."createdAt" DESC
      LIMIT ${limit}
    `);
    
    const posts = rawPostsQuery.rows;
    const formattedResults = [];
    
    for (const row of posts) {
      try {
        // Pré-formatar a data para evitar mudanças ao visualizar
        const formattedDate = formatarDataCompleta(row.createdAt || new Date());
        
        // Garantir que userId seja do tipo correto
        const postAuthorId = row.userId ? Number(row.userId) : Number(row.user_id) || 0;
        
        // Verificar se o usuário logado curtiu este post
        let isLikedByUser = false;
        if (req.user && row.id) {
          try {
            const likeCheck = await db.execute(sql`
              SELECT id FROM "communityLikes" 
              WHERE "postId" = ${Number(row.id)} AND "userId" = ${req.user.id}
              LIMIT 1
            `);
            isLikedByUser = likeCheck.rows.length > 0;
          } catch (likeError) {
            console.error(`Erro ao verificar curtida para post ${row.id}:`, likeError);
          }
        }
        
        formattedResults.push({
          post: {
            id: row.id ? Number(row.id) : 0,
            title: row.title || 'Sem título',
            content: row.content || '',
            imageUrl: row.imageUrl || '',
            editLink: row.editLink || '',
            status: row.status || 'pending',
            createdAt: row.createdAt || new Date(),
            updatedAt: row.updatedAt || new Date(),
            viewCount: (typeof row.viewCount === 'number' || typeof row.viewCount === 'string') 
                ? Number(row.viewCount) : 0,
            userId: postAuthorId,
            formattedDate: formattedDate,
            isPinned: !!row.is_pinned,
            featuredUntil: row.featuredUntil,
            isWeeklyFeatured: !!row.isWeeklyFeatured
          },
          user: {
            id: postAuthorId,
            username: row.username || 'usuário',
            name: row.name || 'Usuário',
            profileimageurl: row.profileimageurl || null,
            nivelacesso: row.nivelacesso || 'free'
          },
          likesCount: (typeof row.likes_count === 'number' || typeof row.likes_count === 'string') 
              ? Number(row.likes_count) : 0,
          commentsCount: (typeof row.comments_count === 'number' || typeof row.comments_count === 'string') 
              ? Number(row.comments_count) : 0,
          savesCount: (typeof row.saves_count === 'number' || typeof row.saves_count === 'string') 
              ? Number(row.saves_count) : 0,
          isLikedByUser: isLikedByUser,
          userHasLiked: isLikedByUser
        });
      } catch (rowError) {
        console.error('Erro ao processar post do usuário:', rowError);
        // Continuar para o próximo post
      }
    }
    
    console.log(`Retornando ${formattedResults.length} posts do usuário ${userId}`);
    return res.json(formattedResults);
    
  } catch (error) {
    console.error('Erro ao buscar posts do usuário:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar seus posts',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;