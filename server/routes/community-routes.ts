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
  communitySettings
} from '../../shared/schema';
import { eq, and, gt, gte, lte, desc, asc, sql, inArray, count } from 'drizzle-orm';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/community';
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `community-${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter: (req, file, cb) => {
    // Permitir apenas imagens
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'));
    }
    cb(null, true);
  }
});

// Helper para otimizar imagens com sharp
const optimizeImage = async (filePath: string): Promise<void> => {
  try {
    // Criar versão WebP otimizada
    const webpPath = filePath.replace(/\.[^.]+$/, '.webp');
    await sharp(filePath)
      .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(webpPath);

    // Se a conversão for bem-sucedida, remova o arquivo original
    fs.unlinkSync(filePath);

    // Renomear o arquivo WebP para o nome original com extensão .webp
    fs.renameSync(webpPath, filePath.replace(/\.[^.]+$/, '.webp'));
  } catch (error) {
    console.error('Erro ao otimizar imagem:', error);
    // Continue mesmo se a otimização falhar
  }
};

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
    const postId = parseInt(req.params.id);
    
    // Buscar o post com informações do usuário criador e contagens
    const [post] = await db.select({
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
    .where(eq(communityPosts.id, postId))
    .groupBy(communityPosts.id, users.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    // Verificar se o usuário pode ver o post
    const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm';
    const isOwner = req.user?.id === post.user.id;
    
    if (post.post.status !== 'approved' && !isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para visualizar este post' });
    }
    
    // Incrementar contador de visualizações
    await db.update(communityPosts)
      .set({ 
        views: sql`${communityPosts.views} + 1` 
      })
      .where(eq(communityPosts.id, postId));
    
    // Adicionar informações para o usuário logado
    if (req.user?.id) {
      const userId = req.user.id;
      
      const [userLike] = await db
        .select()
        .from(communityLikes)
        .where(
          and(
            eq(communityLikes.postId, postId),
            eq(communityLikes.userId, userId)
          )
        );
        
      const [userSave] = await db
        .select()
        .from(communitySaves)
        .where(
          and(
            eq(communitySaves.postId, postId),
            eq(communitySaves.userId, userId)
          )
        );
      
      return res.json({
        ...post,
        userHasLiked: !!userLike,
        isLikedByUser: !!userLike, // Campo adicional para compatibilidade com frontend
        userHasSaved: !!userSave,
      });
    }
    
    return res.json(post);
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
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Imagem é obrigatória' });
    }
    
    const { title, content, editLink } = req.body;
    
    // Validar campos obrigatórios
    if (!title) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }
    
    // Otimizar imagem
    const filePath = req.file.path;
    await optimizeImage(filePath);
    
    // Caminho da imagem após otimização (agora em webp)
    const webpPath = filePath.replace(/\.[^.]+$/, '.webp');
    const imageUrl = `/uploads/community/${path.basename(webpPath)}`;
    
    // Consultar configurações para saber se post precisa de aprovação
    const [settings] = await db.select().from(communitySettings);
    const requireApproval = settings?.requireApproval !== false;
    
    // Status padrão com base na configuração e no nível do usuário
    const isAdmin = req.user.nivelacesso === 'admin' || req.user.nivelacesso === 'designer_adm';
    const status = requireApproval && !isAdmin ? 'pending' : 'approved';
    
    // Inserir novo post
    const [newPost] = await db
      .insert(communityPosts)
      .values({
        userId: req.user.id,
        title,
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
      status
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
    
    // Buscar comentários com informações do usuário
    const comments = await db
      .select({
        comment: communityComments,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileimageurl: users.profileimageurl,
          nivelacesso: users.nivelacesso
        }
      })
      .from(communityComments)
      .leftJoin(users, eq(communityComments.userId, users.id))
      .where(
        and(
          eq(communityComments.postId, postId),
          eq(communityComments.isHidden, false)
        )
      )
      .orderBy(desc(communityComments.createdAt));
    
    return res.json(comments);
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
    const { content } = req.body;
    
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
    
    // Adicionar comentário
    const [comment] = await db
      .insert(communityComments)
      .values({
        postId,
        userId: req.user.id,
        content,
        isHidden: false,
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
      user
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return res.status(500).json({ 
      message: 'Erro ao adicionar comentário',
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
    
    // Calcular número da semana do ano
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
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

export default router;