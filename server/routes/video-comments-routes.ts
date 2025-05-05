import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { videoComments, users, insertVideoCommentSchema } from '@shared/schema';
import { Router, Request, Response } from 'express';
import { checkUserAuth, checkUserRole } from '../middlewares/auth';

const router = Router();

// Listar comentários de uma aula específica
router.get('/video-comments/:lessonId', async (req: Request, res: Response) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) {
      return res.status(400).json({ error: 'ID da aula inválido' });
    }

    const commentsWithUsers = await db.query.videoComments.findMany({
      where: eq(videoComments.lessonId, lessonId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            name: true,
            profileimageurl: true,
            nivelacesso: true,
          }
        }
      },
      orderBy: [desc(videoComments.createdAt)]
    });

    // Formatando os dados para o formato esperado pelo frontend
    const formattedComments = commentsWithUsers.map(comment => ({
      id: comment.id,
      content: comment.content,
      likes: comment.likes,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isHidden: comment.isHidden,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        name: comment.user.name,
        profileImage: comment.user.profileimageurl,
        role: comment.user.nivelacesso
      }
    }));

    res.json(formattedComments);
  } catch (error) {
    console.error('Erro ao buscar comentários da aula:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
});

// Adicionar um novo comentário
router.post('/video-comments', checkUserAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Validar dados de entrada
    const validationResult = insertVideoCommentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Dados de comentário inválidos', details: validationResult.error });
    }

    const { lessonId, content } = validationResult.data;

    // Inserir comentário
    const [newComment] = await db
      .insert(videoComments)
      .values({
        userId,
        lessonId,
        content,
        isHidden: false,
        likes: 0
      })
      .returning();

    // Buscar dados do usuário para incluir na resposta
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        profileimageurl: users.profileimageurl,
        nivelacesso: users.nivelacesso
      })
      .from(users)
      .where(eq(users.id, userId));

    // Formatar resposta
    const commentWithUser = {
      ...newComment,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        profileImage: user.profileimageurl,
        role: user.nivelacesso
      }
    };

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

// Curtir um comentário (toggle)
router.post('/video-comments/:commentId/like', checkUserAuth, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'ID do comentário inválido' });
    }

    // Verificar se comentário existe
    const [comment] = await db
      .select()
      .from(videoComments)
      .where(eq(videoComments.id, commentId));

    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    // Atualizar likes (nesta implementação simples, apenas incrementamos)
    // Em uma implementação mais completa, você teria uma tabela de "likes" para controlar quem curtiu
    const [updatedComment] = await db
      .update(videoComments)
      .set({ 
        likes: comment.likes + 1,
        updatedAt: new Date()
      })
      .where(eq(videoComments.id, commentId))
      .returning();

    res.json(updatedComment);
  } catch (error) {
    console.error('Erro ao curtir comentário:', error);
    res.status(500).json({ error: 'Erro ao processar a ação' });
  }
});

// Excluir comentário (apenas o autor ou admin)
router.delete('/video-comments/:commentId', checkUserAuth, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'ID do comentário inválido' });
    }

    const userId = req.user?.id;
    const userRole = req.user?.nivelacesso;

    // Verificar se comentário existe
    const [comment] = await db
      .select()
      .from(videoComments)
      .where(eq(videoComments.id, commentId));

    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    // Verificar permissão (autor do comentário ou admin)
    const isAdmin = userRole === 'admin';
    const isAuthor = comment.userId === userId;
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ error: 'Sem permissão para excluir este comentário' });
    }

    // Excluir comentário
    await db
      .delete(videoComments)
      .where(eq(videoComments.id, commentId));

    res.json({ success: true, message: 'Comentário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    res.status(500).json({ error: 'Erro ao excluir comentário' });
  }
});

// Ocultar/mostrar comentário (apenas admin)
router.patch('/video-comments/:commentId/visibility', checkUserAuth, checkUserRole(['admin']), async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'ID do comentário inválido' });
    }

    const { isHidden } = req.body;
    if (typeof isHidden !== 'boolean') {
      return res.status(400).json({ error: 'Valor de visibilidade inválido' });
    }

    // Verificar se comentário existe
    const [comment] = await db
      .select()
      .from(videoComments)
      .where(eq(videoComments.id, commentId));

    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    // Atualizar visibilidade
    const [updatedComment] = await db
      .update(videoComments)
      .set({ 
        isHidden,
        updatedAt: new Date()
      })
      .where(eq(videoComments.id, commentId))
      .returning();

    res.json(updatedComment);
  } catch (error) {
    console.error('Erro ao atualizar visibilidade do comentário:', error);
    res.status(500).json({ error: 'Erro ao processar a ação' });
  }
});

export default router;