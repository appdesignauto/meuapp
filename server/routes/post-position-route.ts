import { Request, Response, Router, Express } from 'express';
import { db } from '../db';

const router = Router();

/**
 * Endpoint para obter a posição de um post na ordem cronológica de posts
 * 
 * Este endpoint é usado para paginação eficiente quando precisamos
 * saltar diretamente para uma página específica que contém o post.
 */
export function registerPostPositionRoute(app: Express): void {
  // Endpoint para obter a posição de um post (para paginação eficiente)
  app.get('/api/community/posts/position/:id', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id, 10);
      
      if (isNaN(postId)) {
        return res.status(400).json({ error: 'ID de post inválido' });
      }
      
      // Contar quantos posts existem com ID maior que este (mais recentes)
      // Esta query conta quantos posts aprovados existem mais recentes que o post em questão
      // Isso é útil para calcular em qual página o post deve estar
      const result = await db.execute(
        `SELECT COUNT(*) as position FROM "communityPosts" 
         WHERE status = 'approved' AND id > $1`,
        [postId.toString()]
      );
      
      const position = parseInt(result.rows?.[0]?.position || "0", 10);
      
      console.log(`[POST POSITION] Post ID ${postId} está na posição ${position}`);
      
      return res.json({ position, id: postId });
    } catch (error) {
      console.error('Erro ao buscar posição do post:', error);
      return res.status(500).json({ error: 'Erro ao buscar posição do post' });
    }
  });
}

export default router;