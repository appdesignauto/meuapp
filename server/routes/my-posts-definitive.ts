import { Router } from 'express';

const router = Router();

// ROTA DEFINITIVA PARA MEUS POSTS - ISOLADA E SEM CONFLITOS
router.get('/my-posts-data/:userId', async (req, res) => {
  console.log('✨ [ROTA ISOLADA] Endpoint my-posts-data executado!');
  console.log('✨ [ROTA ISOLADA] UserID:', req.params.userId);
  
  const userId = req.params.userId;
  
  try {
    const { pool } = await import('../db');
    
    // Query para buscar posts com dados completos do usuário, curtidas e comentários
    const posts = await pool.query(`
      SELECT 
        cp.*,
        u.username,
        u.name,
        u.profileimageurl,
        u.nivelacesso,
        u.acessovitalicio,
        COALESCE(likes_count.total, 0) as likes_count,
        COALESCE(comments_count.total, 0) as comments_count
      FROM "communityPosts" cp
      LEFT JOIN "users" u ON cp."userId" = u.id
      LEFT JOIN (
        SELECT "postId", COUNT(*) as total 
        FROM "communityPostLikes" 
        GROUP BY "postId"
      ) likes_count ON cp.id = likes_count."postId"
      LEFT JOIN (
        SELECT "postId", COUNT(*) as total 
        FROM "communityComments" 
        GROUP BY "postId"
      ) comments_count ON cp.id = comments_count."postId"
      WHERE cp."userId" = $1 
      ORDER BY cp."createdAt" DESC
    `, [userId]);
    
    console.log('✨ [ROTA ISOLADA] Encontrados', posts.rows.length, 'posts para usuário', userId);
    console.log('✨ [DADOS ISOLADOS] Primeiro post dados:', {
      title: posts.rows[0]?.title,
      likes: posts.rows[0]?.likes_count,
      comments: posts.rows[0]?.comments_count,
      avatar: posts.rows[0]?.profileimageurl,
      status: posts.rows[0]?.status || 'approved'
    });
    
    // Formatar os dados no formato esperado pelo frontend
    const formattedPosts = posts.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      content: row.content,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      status: row.status || 'approved',
      isApproved: row.isApproved || row.status === 'approved' || true,
      isPinned: row.isPinned || false,
      editLink: row.editLink,
      viewCount: row.viewCount || 0,
      likesCount: parseInt(row.likes_count) || 0,
      commentsCount: parseInt(row.comments_count) || 0,
      featuredUntil: row.featuredUntil,
      isWeeklyFeatured: row.isWeeklyFeatured || false,
      user: {
        id: row.userId,
        username: row.username,
        name: row.name,
        profileimageurl: row.profileimageurl,
        nivelacesso: row.nivelacesso,
        acessovitalicio: row.acessovitalicio
      }
    }));
    
    console.log('✨ [RESULTADO ISOLADO] Retornando', formattedPosts.length, 'posts formatados');
    console.log('✨ [POST FINAL]', JSON.stringify(formattedPosts[0], null, 2));
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(formattedPosts);
    
  } catch (error) {
    console.error('✨ [ROTA ISOLADA] Erro:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;