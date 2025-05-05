import { Router, Request, Response } from 'express';
import { checkUserAuth, checkUserRole } from '../middlewares/auth';
import { db } from '../db';
import { videoComments, users, courseLessons } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Rota para obter todos os comentários de uma lição específica
router.get('/video-comments/:lessonId', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    
    // Verificar se a lição existe
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, parseInt(lessonId)));
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    // Obter comentários ordenados por data mais recente
    const commentsList = await db
      .select({
        id: videoComments.id,
        content: videoComments.content,
        createdAt: videoComments.createdAt,
        userId: videoComments.userId,
        lessonId: videoComments.lessonId,
        likes: videoComments.likes,
        isHidden: videoComments.isHidden,
        username: users.username,
        name: users.name,
        profileImageUrl: users.profileimageurl
      })
      .from(videoComments)
      .leftJoin(users, eq(videoComments.userId, users.id))
      .where(
        and(
          eq(videoComments.lessonId, parseInt(lessonId)),
          eq(videoComments.isHidden, false)
        )
      )
      .orderBy(desc(videoComments.createdAt));
      
    return res.status(200).json(commentsList);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
});

// Rota para criar um novo comentário (requer autenticação)
router.post('/video-comments', checkUserAuth, async (req: Request, res: Response) => {
  try {
    const { lessonId, content } = req.body;
    
    // Validar dados de entrada
    if (!lessonId || !content) {
      return res.status(400).json({ error: 'Dados incompletos. lessonId e content são obrigatórios' });
    }
    
    // Verificar se a lição existe
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, parseInt(lessonId)));
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    // Criar o comentário
    const [newComment] = await db.insert(videoComments).values({
      content,
      userId: req.user?.id,
      lessonId: parseInt(lessonId),
      createdAt: new Date(),
      likes: 0,
      isHidden: false
    }).returning();
    
    // Buscar dados completos do usuário para retornar junto com o comentário
    const [user] = await db.select().from(users).where(eq(users.id, req.user?.id));
    
    // Retornar o comentário criado com dados do usuário
    return res.status(201).json({
      ...newComment,
      username: user.username,
      name: user.name,
      profileImageUrl: user.profileimageurl
    });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return res.status(500).json({ error: 'Erro ao criar comentário' });
  }
});

// Rota para dar like em um comentário (requer autenticação)
router.post('/video-comments/:commentId/like', checkUserAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    // Verificar se o comentário existe
    const [comment] = await db.select().from(videoComments).where(eq(videoComments.id, parseInt(commentId)));
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    // Incrementar o contador de likes
    const [updatedComment] = await db
      .update(videoComments)
      .set({ likes: (comment.likes || 0) + 1 })
      .where(eq(videoComments.id, parseInt(commentId)))
      .returning();
    
    return res.status(200).json({ likes: updatedComment.likes });
  } catch (error) {
    console.error('Erro ao dar like no comentário:', error);
    return res.status(500).json({ error: 'Erro ao dar like no comentário' });
  }
});

// Rota para excluir um comentário (requer autenticação e ser dono do comentário ou admin)
router.delete('/video-comments/:commentId', checkUserAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    // Verificar se o comentário existe
    const [comment] = await db.select().from(videoComments).where(eq(videoComments.id, parseInt(commentId)));
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    // Verificar se o usuário é dono do comentário ou admin
    if (comment.userId !== req.user?.id && req.user?.nivelacesso !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para excluir este comentário' });
    }
    
    // Excluir o comentário
    await db.delete(videoComments).where(eq(videoComments.id, parseInt(commentId)));
    
    return res.status(200).json({ success: true, message: 'Comentário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    return res.status(500).json({ error: 'Erro ao excluir comentário' });
  }
});

// Rota para atualizar visibilidade de um comentário (apenas para admin)
router.patch('/video-comments/:commentId/visibility', checkUserAuth, checkUserRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { isHidden } = req.body;
    
    // Verificar se o comentário existe
    const [comment] = await db.select().from(videoComments).where(eq(videoComments.id, parseInt(commentId)));
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    
    // Atualizar visibilidade
    const [updatedComment] = await db
      .update(videoComments)
      .set({ isHidden: isHidden === true })
      .where(eq(videoComments.id, parseInt(commentId)))
      .returning();
    
    return res.status(200).json(updatedComment);
  } catch (error) {
    console.error('Erro ao atualizar visibilidade do comentário:', error);
    return res.status(500).json({ error: 'Erro ao atualizar visibilidade do comentário' });
  }
});

export default router;