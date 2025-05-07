import { Router, Request, Response } from 'express';
import { checkUserAuth } from '../middlewares/auth';
import { db } from '../db';
import { courseRatings, users, courses, courseLessons } from '@shared/schema';
import { eq, and, avg, count, sql } from 'drizzle-orm';

const router = Router();

// Rota para obter avaliações de um curso
router.get('/course-ratings/:courseId', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    
    // Verificar se o curso existe
    const [course] = await db.select().from(courses).where(eq(courses.id, parseInt(courseId)));
    
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Obter todas as avaliações do curso
    const ratings = await db
      .select({
        id: courseRatings.id,
        rating: courseRatings.rating,
        review: courseRatings.review,
        createdAt: courseRatings.createdAt,
        userId: courseRatings.userId,
        userName: users.name,
        userUsername: users.username,
        userProfileImage: users.profileimageurl
      })
      .from(courseRatings)
      .leftJoin(users, eq(courseRatings.userId, users.id))
      .where(and(
        eq(courseRatings.courseId, parseInt(courseId)),
        eq(courseRatings.lessonId, null)
      ));
    
    // Calcular média de avaliações
    const [ratingStats] = await db
      .select({
        avgRating: avg(courseRatings.rating).as('avgRating'),
        totalRatings: count(courseRatings.id).as('totalRatings')
      })
      .from(courseRatings)
      .where(and(
        eq(courseRatings.courseId, parseInt(courseId)),
        eq(courseRatings.lessonId, null)
      ));
    
    return res.json({
      ratings,
      stats: {
        averageRating: ratingStats?.avgRating || 0,
        totalRatings: ratingStats?.totalRatings || 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações do curso:', error);
    return res.status(500).json({ error: 'Erro ao buscar avaliações do curso' });
  }
});

// Rota para obter avaliações de uma lição
router.get('/lesson-ratings/:lessonId', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    
    // Verificar se a lição existe
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, parseInt(lessonId)));
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lição não encontrada' });
    }
    
    // Obter todas as avaliações da lição
    const ratings = await db
      .select({
        id: courseRatings.id,
        rating: courseRatings.rating,
        review: courseRatings.review,
        createdAt: courseRatings.createdAt,
        userId: courseRatings.userId,
        userName: users.name,
        userUsername: users.username,
        userProfileImage: users.profileimageurl
      })
      .from(courseRatings)
      .leftJoin(users, eq(courseRatings.userId, users.id))
      .where(eq(courseRatings.lessonId, parseInt(lessonId)));
    
    // Calcular média de avaliações
    const [ratingStats] = await db
      .select({
        avgRating: avg(courseRatings.rating).as('avgRating'),
        totalRatings: count(courseRatings.id).as('totalRatings')
      })
      .from(courseRatings)
      .where(eq(courseRatings.lessonId, parseInt(lessonId)));
    
    return res.json({
      ratings,
      stats: {
        averageRating: ratingStats?.avgRating || 0,
        totalRatings: ratingStats?.totalRatings || 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações da lição:', error);
    return res.status(500).json({ error: 'Erro ao buscar avaliações da lição' });
  }
});

// Rota para verificar se o usuário já avaliou um curso/lição
router.get('/user-rating', checkUserAuth, async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId } = req.query;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    let query = db
      .select()
      .from(courseRatings)
      .where(eq(courseRatings.userId, userId));
    
    if (courseId && !lessonId) {
      // Avaliação de curso
      query = query.where(and(
        eq(courseRatings.courseId, parseInt(courseId as string)),
        eq(courseRatings.lessonId, null)
      ));
    } else if (lessonId) {
      // Avaliação de lição
      query = query.where(eq(courseRatings.lessonId, parseInt(lessonId as string)));
    } else {
      return res.status(400).json({ error: 'É necessário fornecer courseId ou lessonId' });
    }
    
    const [existingRating] = await query;
    
    return res.json({
      hasRated: !!existingRating,
      rating: existingRating || null
    });
  } catch (error) {
    console.error('Erro ao verificar avaliação do usuário:', error);
    return res.status(500).json({ error: 'Erro ao verificar avaliação do usuário' });
  }
});

// Rota para avaliar um curso
router.post('/course-ratings', checkUserAuth, async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId, rating, review } = req.body;
    const userId = req.user?.id;
    
    // Validação básica dos dados de entrada
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser um valor entre 1 e 5' });
    }
    
    if (!courseId && !lessonId) {
      return res.status(400).json({ error: 'É necessário fornecer courseId ou lessonId' });
    }
    
    // Verificar se o curso/lição existe
    if (courseId) {
      const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
      if (!course) {
        return res.status(404).json({ error: 'Curso não encontrado' });
      }
    }
    
    if (lessonId) {
      const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId));
      if (!lesson) {
        return res.status(404).json({ error: 'Lição não encontrada' });
      }
    }
    
    // Verificar se o usuário já avaliou
    let existingRatingQuery = db
      .select()
      .from(courseRatings)
      .where(eq(courseRatings.userId, userId));
    
    if (courseId && !lessonId) {
      existingRatingQuery = existingRatingQuery.where(and(
        eq(courseRatings.courseId, courseId),
        eq(courseRatings.lessonId, null)
      ));
    } else if (lessonId) {
      existingRatingQuery = existingRatingQuery.where(eq(courseRatings.lessonId, lessonId));
    }
    
    const [existingRating] = await existingRatingQuery;
    
    if (existingRating) {
      // Atualizar avaliação existente
      const [updatedRating] = await db
        .update(courseRatings)
        .set({
          rating,
          review: review || null,
          updatedAt: new Date()
        })
        .where(eq(courseRatings.id, existingRating.id))
        .returning();
      
      return res.json(updatedRating);
    } else {
      // Criar nova avaliação
      const [newRating] = await db
        .insert(courseRatings)
        .values({
          userId,
          courseId: courseId || null,
          lessonId: lessonId || null,
          rating,
          review: review || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return res.status(201).json(newRating);
    }
  } catch (error) {
    console.error('Erro ao avaliar curso/lição:', error);
    return res.status(500).json({ error: 'Erro ao avaliar curso/lição' });
  }
});

// Rota para obter estatísticas resumidas de todos os cursos (para admin)
router.get('/course-ratings-stats', async (req: Request, res: Response) => {
  try {
    const courseStats = await db
      .select({
        courseId: courseRatings.courseId,
        courseTitle: courses.title,
        avgRating: avg(courseRatings.rating).as('avgRating'),
        totalRatings: count(courseRatings.id).as('totalRatings')
      })
      .from(courseRatings)
      .leftJoin(courses, eq(courseRatings.courseId, courses.id))
      .where(eq(courseRatings.lessonId, null))
      .groupBy(courseRatings.courseId, courses.title)
      .orderBy(sql`"avgRating" DESC`);
    
    return res.json(courseStats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de avaliações:', error);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas de avaliações' });
  }
});

export default router;