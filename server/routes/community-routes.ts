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
  communityCommentLikes
} from '../../shared/schema';
import { eq, and, gt, gte, lte, desc, asc, sql, inArray, count } from 'drizzle-orm';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { communityStorageService } from '../services/community-storage';
import { flexibleAuth } from '../auth-flexible';

const router = Router();

// IMPORTANTE: Rotas específicas ANTES das rotas com parâmetros dinâmicos
// para evitar conflitos de captura

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
    
    // Consulta para posts com contagem de likes e salvamentos
    const posts = await db.select({
      post: communityPosts,
      user: {
        id: users.id,
        username: users.username,
        name: users.name,
        profileimageurl: users.profileimageurl,
        nivelacesso: users.nivelacesso
      },
      likesCount: sql<number>`COUNT(DISTINCT ${communityLikes.id})`,
      savesCount: sql<number>`COUNT(DISTINCT ${communitySaves.id})`,
      commentsCount: sql<number>`COUNT(DISTINCT ${communityComments.id})`
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.userId, users.id))
    .leftJoin(communityLikes, eq(communityPosts.id, communityLikes.postId))
    .leftJoin(communitySaves, eq(communityPosts.id, communitySaves.postId))
    .leftJoin(communityComments, eq(communityPosts.id, communityComments.postId))
    .where(
      isAdmin && status === 'all' 
        ? sql`1=1` 
        : eq(communityPosts.status, postStatus)
    )
    .groupBy(communityPosts.id, users.id)
    .orderBy(desc(communityPosts.createdAt))
    .limit(limit)
    .offset(offset);

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

          return {
            ...post,
            userHasLiked: !!userLike,
            isLikedByUser: !!userLike, // Campo adicional para compatibilidade com frontend
            userHasSaved: !!userSave,
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
        
        return res.json({
          ...post,
          userHasLiked,
          isLikedByUser: userHasLiked, // Para compatibilidade com frontend
          userHasSaved,
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
      const pointsForPost = settings?.pointsForPost || 20;
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
      const pointsForPost = settings?.pointsForPost || 20;
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
      const pointsForLike = settings?.pointsForLike || 5;
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
      const pointsForSave = settings?.pointsForSave || 10;
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
router.post('/api/community/posts/:id/comments', flexibleAuth, async (req, res) => {
  try {
    // A autenticação já é verificada pelo middleware flexibleAuth
    
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
router.get('/api/community/comments/:id/replies', flexibleAuth, async (req, res) => {
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
router.post('/api/community/comments/:id/like', flexibleAuth, async (req, res) => {
  try {
    // A autenticação já é verificada pelo middleware flexibleAuth
    console.log('Recebida solicitação para curtir comentário:', req.params.id);
    console.log('Usuário autenticado:', req.user?.id, req.user?.username);
    
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
        .select({ count: count() })
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
        .select({ count: count() })
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
    // Registrar mais detalhes do erro para diagnóstico
    console.error('Detalhes da requisição:', {
      commentId: req.params.id,
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Presente' : 'Ausente'
      }
    });

    if (error instanceof Error) {
      console.error('Stack trace do erro:', error.stack);
    }

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
    
    // Validar período
    const validPeriods = ['all_time', 'year', 'month', 'week'];
    if (!validPeriods.includes(period) && !period.match(/^\d{4}(-\d{2})?(-W\d{2})?$/)) {
      return res.status(400).json({ message: 'Período inválido' });
    }
    
    // Buscar usuários do ranking
    const ranking = await db
      .select({
        rank: communityLeaderboard.rank,
        totalPoints: communityLeaderboard.totalPoints,
        postCount: communityLeaderboard.postCount,
        likesReceived: communityLeaderboard.likesReceived,
        savesReceived: communityLeaderboard.savesReceived,
        featuredCount: communityLeaderboard.featuredCount,
        level: communityLeaderboard.level,
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
      .where(eq(communityLeaderboard.period, period))
      .orderBy(asc(communityLeaderboard.rank))
      .limit(limit);
    
    return res.json(ranking);
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
          pointsForWeeklyFeatured: pointsForWeeklyFeatured || 50,
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
        "Iniciante KDG": 0,
        "Colaborador KDG": 501,
        "Destaque KDG": 2001,
        "Elite KDG": 5001,
        "Lenda KDG": 10001
      };
      
      let level = "Iniciante KDG";
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

// ========== ROTAS ADMINISTRATIVAS ==========

// GET: Estatísticas administrativas da comunidade
router.get('/api/community/admin/stats', async (req, res) => {
  try {
    // Verificar permissão - apenas admin pode acessar
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm')) {
      return res.status(403).json({ message: 'Sem permissão para esta ação' });
    }

    // Contar total de posts
    const totalPostsResult = await db
      .select({ count: count() })
      .from(communityPosts);

    // Contar posts pendentes
    const pendingPostsResult = await db
      .select({ count: count() })
      .from(communityPosts)
      .where(eq(communityPosts.status, 'pending'));

    // Contar posts aprovados
    const approvedPostsResult = await db
      .select({ count: count() })
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
    // Verificar permissão - apenas admin pode acessar
    if (!req.user || (req.user.nivelacesso !== 'admin' && req.user.nivelacesso !== 'designer_adm')) {
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
      .select({ count: count() })
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
    // Verificar permissão - apenas admin pode aprovar
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
      const pointsForPost = settings?.pointsForPost || 20;
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
    // Verificar permissão - apenas admin pode rejeitar
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

// DELETE: Excluir um post
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
      conditions.push(like(communityComments.content, `%${search}%`));
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

// DELETE: Excluir um comentário
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

export default router;