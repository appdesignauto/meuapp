import { Router } from 'express';
import { db } from '../db';
import { courses, courseRatings } from '@shared/schema';
import { eq, and, avg, count } from 'drizzle-orm';

const router = Router();

// Rota para obter as avaliações médias de um curso
router.get('/course/ratings/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID do curso inválido' });
    }
    
    // Verificar se o curso existe
    const courseExists = await db.select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
      
    if (courseExists.length === 0) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    // Buscar a média de avaliações e contagem
    const ratingsStats = await db
      .select({
        averageRating: avg(courseRatings.rating).mapWith(Number) as any,
        count: count(courseRatings.id).mapWith(Number),
      })
      .from(courseRatings)
      .where(eq(courseRatings.courseId, courseId));
      
    const result = {
      courseId,
      averageRating: ratingsStats[0]?.averageRating || 0,
      count: ratingsStats[0]?.count || 0,
    };
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao buscar avaliações do curso:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para obter a avaliação do usuário atual para um curso específico
router.get('/course/user-rating/:courseId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const userId = req.user.id;
    const courseId = parseInt(req.params.courseId);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID do curso inválido' });
    }
    
    // Buscar a avaliação do usuário para o curso
    const userRating = await db
      .select({ rating: courseRatings.rating })
      .from(courseRatings)
      .where(
        and(
          eq(courseRatings.userId, userId),
          eq(courseRatings.courseId, courseId)
        )
      )
      .limit(1);
      
    if (userRating.length === 0) {
      return res.status(200).json({ hasRated: false });
    }
    
    return res.status(200).json({
      hasRated: true,
      rating: userRating[0].rating,
    });
  } catch (error) {
    console.error('Erro ao buscar avaliação do usuário:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para avaliar um curso
router.post('/course/rate/:courseId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const userId = req.user.id;
    const courseId = parseInt(req.params.courseId);
    const { rating } = req.body;
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID do curso inválido' });
    }
    
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Avaliação inválida (deve ser um número inteiro entre 1 e 5)' });
    }
    
    // Verificar se o curso existe
    const courseExists = await db.select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
      
    if (courseExists.length === 0) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    // Verificar se o usuário já avaliou este curso
    const existingRating = await db
      .select({ id: courseRatings.id })
      .from(courseRatings)
      .where(
        and(
          eq(courseRatings.userId, userId),
          eq(courseRatings.courseId, courseId)
        )
      )
      .limit(1);
      
    // Se o usuário já avaliou, atualizar a avaliação existente
    if (existingRating.length > 0) {
      await db
        .update(courseRatings)
        .set({ 
          rating, 
          updatedAt: new Date() 
        })
        .where(eq(courseRatings.id, existingRating[0].id));
        
      return res.status(200).json({ message: 'Avaliação atualizada com sucesso', updated: true });
    }
    
    // Se o usuário ainda não avaliou, criar uma nova avaliação
    await db.insert(courseRatings).values({
      userId,
      courseId,
      rating,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return res.status(201).json({ message: 'Avaliação enviada com sucesso', created: true });
  } catch (error) {
    console.error('Erro ao avaliar curso:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;