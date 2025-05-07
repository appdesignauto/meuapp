import { Request, Response } from 'express';
import { db } from '../db';
import { courseLessons, courseModules, users } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export const getLesson = async (req: Request, res: Response) => {
  try {
    const lessonId = parseInt(req.params.id);
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'ID da aula inválido' });
    }
    
    const [lesson] = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));
    
    if (!lesson) {
      return res.status(404).json({ message: 'Aula não encontrada' });
    }
    
    return res.status(200).json(lesson);
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    return res.status(500).json({ message: 'Erro ao buscar aula' });
  }
};

export const getModule = async (req: Request, res: Response) => {
  try {
    const moduleId = parseInt(req.params.id);
    
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: 'ID do módulo inválido' });
    }
    
    const [module] = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.id, moduleId));
    
    if (!module) {
      return res.status(404).json({ message: 'Módulo não encontrado' });
    }
    
    // Buscar aulas do módulo
    const lessons = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.moduleId, moduleId))
      .orderBy(courseLessons.order);
    
    const moduleWithLessons = {
      ...module,
      lessons
    };
    
    return res.status(200).json(moduleWithLessons);
  } catch (error) {
    console.error('Erro ao buscar módulo:', error);
    return res.status(500).json({ message: 'Erro ao buscar módulo' });
  }
};

export const getAllModules = async (req: Request, res: Response) => {
  try {
    const modules = await db
      .select()
      .from(courseModules)
      .where(eq(courseModules.isActive, true))
      .orderBy(courseModules.order);
    
    // Para cada módulo, buscar suas aulas
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await db
          .select()
          .from(courseLessons)
          .where(eq(courseLessons.moduleId, module.id))
          .orderBy(courseLessons.order);
        
        return {
          ...module,
          lessons
        };
      })
    );
    
    return res.status(200).json(modulesWithLessons);
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return res.status(500).json({ message: 'Erro ao buscar módulos' });
  }
};

export const markLessonAsViewed = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    const lessonId = parseInt(req.params.id);
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'ID da aula inválido' });
    }
    
    // Verificar se a aula existe
    const [lesson] = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));
    
    if (!lesson) {
      return res.status(404).json({ message: 'Aula não encontrada' });
    }
    
    // Verificar se a visualização já existe
    const viewExists = await db.execute(
      sql`SELECT * FROM "lessonViews" WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
    );
    
    if (viewExists.rows.length === 0) {
      // Registrar visualização
      await db.execute(
        sql`INSERT INTO "lessonViews" ("userId", "lessonId", "viewedAt") 
        VALUES (${user.id}, ${lessonId}, CURRENT_TIMESTAMP)`
      );
      
      // Incrementar contagem de visualizações na aula
      await db.execute(
        sql`UPDATE "courseLessons" 
        SET "viewCount" = COALESCE("viewCount", 0) + 1 
        WHERE "id" = ${lessonId} 
        RETURNING "viewCount"`
      );
      
      console.log('Aula marcada como visualizada com contador incrementado');
    } else {
      // Atualizar data de visualização
      await db.execute(
        sql`UPDATE "lessonViews" 
        SET "viewedAt" = CURRENT_TIMESTAMP 
        WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
      );
      
      console.log('Atualizada data de visualização sem incrementar contador');
    }
    
    return res.status(200).json({ message: 'Visualização registrada' });
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
    return res.status(500).json({ message: 'Erro ao registrar visualização' });
  }
};

export const markLessonAsCompleted = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    const lessonId = parseInt(req.params.id);
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'ID da aula inválido' });
    }
    
    // Verificar se a aula existe
    const [lesson] = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));
    
    if (!lesson) {
      return res.status(404).json({ message: 'Aula não encontrada' });
    }
    
    // Verificar se já foi marcada como completada
    const completedExists = await db.execute(
      sql`SELECT * FROM "courseProgress" WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
    );
    
    if (completedExists.rows.length === 0) {
      // Registrar como completada
      await db.execute(
        sql`INSERT INTO "courseProgress" ("userId", "lessonId", "lastWatchedAt", "isCompleted") 
        VALUES (${user.id}, ${lessonId}, CURRENT_TIMESTAMP, true)`
      );
    } else {
      // Atualizar status
      await db.execute(
        sql`UPDATE "courseProgress" 
        SET "lastWatchedAt" = CURRENT_TIMESTAMP, "isCompleted" = true 
        WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
      );
    }
    
    return res.status(200).json({ message: 'Aula marcada como completada' });
  } catch (error) {
    console.error('Erro ao marcar aula como completada:', error);
    return res.status(500).json({ message: 'Erro ao marcar aula como completada' });
  }
};

export const getCourseProgress = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    const moduleId = parseInt(req.params.id);
    
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: 'ID do módulo inválido' });
    }
    
    // Contar total de aulas no módulo
    const totalLessonsResult = await db.execute(
      sql`SELECT COUNT(*) as "totalLessons" FROM "courseLessons" WHERE "moduleId" = ${moduleId}`
    );
    
    const totalLessons = parseInt(totalLessonsResult.rows[0].totalLessons) || 0;
    
    // Contar aulas completadas pelo usuário neste módulo
    const completedLessonsResult = await db.execute(
      sql`SELECT COUNT(*) as "completedLessons" 
      FROM "courseProgress" lp
      JOIN "courseLessons" cl ON lp."lessonId" = cl.id
      WHERE lp."userId" = ${user.id} 
      AND cl."moduleId" = ${moduleId}
      AND lp."isCompleted" = true`
    );
    
    const completedLessons = parseInt(completedLessonsResult.rows[0].completedLessons) || 0;
    
    // Calcular porcentagem
    const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    
    return res.status(200).json({
      moduleId,
      totalLessons,
      completedLessons,
      percentage
    });
  } catch (error) {
    console.error('Erro ao buscar progresso do curso:', error);
    return res.status(500).json({ message: 'Erro ao buscar progresso do curso' });
  }
};

export const saveNote = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    const lessonId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'ID da aula inválido' });
    }
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Conteúdo da anotação vazio' });
    }
    
    // Verificar se a aula existe
    const [lesson] = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));
    
    if (!lesson) {
      return res.status(404).json({ message: 'Aula não encontrada' });
    }
    
    // Verificar se já existe uma anotação
    const noteExists = await db.execute(
      sql`SELECT * FROM "lessonNotes" WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
    );
    
    if (noteExists.rows.length === 0) {
      // Criar nova anotação
      await db.execute(
        sql`INSERT INTO "lessonNotes" ("userId", "lessonId", "content", "createdAt", "updatedAt") 
        VALUES (${user.id}, ${lessonId}, ${content}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      );
    } else {
      // Atualizar anotação existente
      await db.execute(
        sql`UPDATE "lessonNotes" 
        SET "content" = ${content}, "updatedAt" = CURRENT_TIMESTAMP 
        WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
      );
    }
    
    return res.status(200).json({ message: 'Anotação salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar anotação:', error);
    return res.status(500).json({ message: 'Erro ao salvar anotação' });
  }
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    const lessonId = parseInt(req.params.id);
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'ID da aula inválido' });
    }
    
    // Buscar anotações
    const notes = await db.execute(
      sql`SELECT * FROM "lessonNotes" WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
    );
    
    if (notes.rows.length === 0) {
      return res.status(200).json({ content: '' });
    }
    
    return res.status(200).json(notes.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar anotações:', error);
    return res.status(500).json({ message: 'Erro ao buscar anotações' });
  }
};

// Obter a última aula assistida pelo usuário
export const getLastWatchedLesson = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    
    // Verificar se existem aulas marcadas como visualizadas pelo usuário
    // Primeiro tentamos buscar na tabela de progresso (mais preciso)
    const lastProgressResult = await db.execute(
      sql`SELECT lp.*, cl.* 
          FROM "courseProgress" lp
          JOIN "courseLessons" cl ON lp."lessonId" = cl.id
          WHERE lp."userId" = ${user.id}
          ORDER BY lp."lastWatchedAt" DESC
          LIMIT 1`
    );
    
    // Se não encontrar na tabela de progresso, tentamos na tabela de visualizações
    if (lastProgressResult.rows.length === 0) {
      const lastViewedResult = await db.execute(
        sql`SELECT lv.*, cl.* 
            FROM "lessonViews" lv
            JOIN "courseLessons" cl ON lv."lessonId" = cl.id
            WHERE lv."userId" = ${user.id}
            ORDER BY lv."viewedAt" DESC
            LIMIT 1`
      );
      
      if (lastViewedResult.rows.length === 0) {
        // Se não houver nenhuma aula assistida, retornar a primeira aula do primeiro módulo
        const firstLessonResult = await db.execute(
          sql`SELECT cl.* 
              FROM "courseLessons" cl
              JOIN "courseModules" cm ON cl."moduleId" = cm.id
              ORDER BY cm."order", cl."order"
              LIMIT 1`
        );
        
        if (firstLessonResult.rows.length === 0) {
          return res.status(404).json({ 
            message: 'Nenhuma aula disponível',
            hasLastWatched: false
          });
        }
        
        const firstLesson = firstLessonResult.rows[0];
        return res.status(200).json({
          lessonId: firstLesson.id,
          title: firstLesson.title,
          moduleId: firstLesson.moduleId,
          thumbnailUrl: firstLesson.thumbnailUrl,
          hasLastWatched: false,
          isRecommended: true
        });
      }
      
      const lastViewedLesson = lastViewedResult.rows[0];
      return res.status(200).json({
        lessonId: lastViewedLesson.lessonId,
        title: lastViewedLesson.title,
        moduleId: lastViewedLesson.moduleId,
        thumbnailUrl: lastViewedLesson.thumbnailUrl,
        lastWatched: lastViewedLesson.viewedAt,
        hasLastWatched: true
      });
    }
    
    const lastWatchedLesson = lastProgressResult.rows[0];
    return res.status(200).json({
      lessonId: lastWatchedLesson.lessonId,
      title: lastWatchedLesson.title,
      moduleId: lastWatchedLesson.moduleId,
      thumbnailUrl: lastWatchedLesson.thumbnailUrl,
      lastWatched: lastWatchedLesson.lastWatchedAt,
      progress: lastWatchedLesson.progress,
      isCompleted: lastWatchedLesson.isCompleted,
      hasLastWatched: true
    });
  } catch (error) {
    console.error('Erro ao buscar última aula assistida:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar última aula assistida',
      hasLastWatched: false
    });
  }
};

// Obter estatísticas gerais dos cursos para o painel administrativo
export const getCoursesStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    
    // Verificar se o usuário é administrador
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    // Total de visualizações de todas as aulas
    const totalViewsResult = await db.execute(
      sql`SELECT SUM("viewCount") AS "totalViews" FROM "courseLessons"`
    );
    const totalViews = parseInt(totalViewsResult.rows[0]?.totalViews) || 0;
    
    // Total de usuários que assistiram pelo menos uma aula
    const activeUsersResult = await db.execute(
      sql`SELECT COUNT(DISTINCT "userId") AS "activeUsers" FROM "lessonViews"`
    );
    const activeUsers = parseInt(activeUsersResult.rows[0]?.activeUsers) || 0;
    
    // Total de aulas completadas
    const completedLessonsResult = await db.execute(
      sql`SELECT COUNT(*) AS "completedLessons" FROM "courseProgress" WHERE "isCompleted" = true`
    );
    const completedLessons = parseInt(completedLessonsResult.rows[0]?.completedLessons) || 0;
    
    // Tempo médio de visualização por usuário (em segundos)
    const averageViewTimeResult = await db.execute(
      sql`
      SELECT AVG(cl.duration) AS "averageViewTime"
      FROM "lessonViews" lv
      JOIN "courseLessons" cl ON lv."lessonId" = cl.id
      WHERE cl.duration IS NOT NULL
      `
    );
    const averageViewTime = parseFloat(averageViewTimeResult.rows[0]?.averageViewTime) || 0;
    
    // Total de comentários
    const totalCommentsResult = await db.execute(
      sql`SELECT COUNT(*) AS "totalComments" FROM "videoComments"`
    );
    const totalComments = parseInt(totalCommentsResult.rows[0]?.totalComments) || 0;
    
    // Aulas mais populares (top 5)
    const popularLessonsResult = await db.execute(
      sql`
      SELECT 
        cl.id, 
        cl.title, 
        cl."moduleId", 
        cl."viewCount", 
        cm.title AS "moduleName"
      FROM "courseLessons" cl
      JOIN "courseModules" cm ON cl."moduleId" = cm.id
      ORDER BY cl."viewCount" DESC
      LIMIT 5
      `
    );
    
    // Calcular a taxa de conclusão média dos cursos
    const completionRateResult = await db.execute(
      sql`
      WITH user_progress AS (
        SELECT 
          "userId",
          COUNT(DISTINCT "lessonId") AS "completedLessons"
        FROM "courseProgress"
        WHERE "isCompleted" = true
        GROUP BY "userId"
      ),
      total_lessons AS (
        SELECT COUNT(*) AS "totalLessons" FROM "courseLessons"
      )
      SELECT 
        AVG((up."completedLessons"::float / tl."totalLessons"::float) * 100) AS "completionRate"
      FROM user_progress up, total_lessons tl
      `
    );
    const completionRate = parseFloat(completionRateResult.rows[0]?.completionRate) || 0;
    
    return res.status(200).json({
      totalViews,
      activeUsers,
      completedLessons,
      averageViewTime,
      totalComments,
      completionRate: Math.round(completionRate * 10) / 10, // Arredondar para 1 casa decimal
      popularLessons: popularLessonsResult.rows
    });
    
  } catch (error) {
    console.error('Erro ao obter estatísticas dos cursos:', error);
    return res.status(500).json({ message: 'Erro ao obter estatísticas dos cursos' });
  }
};

// Obter comentários recentes para o painel administrativo
export const getRecentComments = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    
    // Verificar se o usuário é administrador
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Buscar comentários recentes com informações do usuário e da aula
    const commentsResult = await db.execute(
      sql`
      SELECT 
        vc.id,
        vc.content,
        vc."createdAt",
        vc."userId",
        vc."lessonId",
        u.username,
        u.name,
        u."profileimageurl" AS "profileImageUrl",
        cl.title AS "lessonTitle",
        cm.title AS "moduleName"
      FROM "videoComments" vc
      JOIN users u ON vc."userId" = u.id
      JOIN "courseLessons" cl ON vc."lessonId" = cl.id
      JOIN "courseModules" cm ON cl."moduleId" = cm.id
      ORDER BY vc."createdAt" DESC
      LIMIT ${limit}
      `
    );
    
    return res.status(200).json(commentsResult.rows);
    
  } catch (error) {
    console.error('Erro ao obter comentários recentes:', error);
    return res.status(500).json({ message: 'Erro ao obter comentários recentes' });
  }
};

// Obter as aulas mais assistidas agrupadas por módulo
export const getMostWatchedLessons = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    
    // Verificar se o usuário é administrador
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    // Buscar estatísticas de visualização agrupadas por módulo
    const moduleStatsResult = await db.execute(
      sql`
      SELECT 
        cm.id AS "moduleId",
        cm.title AS "moduleName",
        COUNT(cl.id) AS "lessonCount",
        SUM(cl."viewCount") AS "totalViews",
        AVG(cl."viewCount") AS "averageViews"
      FROM "courseModules" cm
      JOIN "courseLessons" cl ON cl."moduleId" = cm.id
      GROUP BY cm.id, cm.title
      ORDER BY "totalViews" DESC
      `
    );
    
    // Para cada módulo, buscar suas 3 aulas mais assistidas
    const moduleWithTopLessons = await Promise.all(
      moduleStatsResult.rows.map(async (module) => {
        const topLessonsResult = await db.execute(
          sql`
          SELECT 
            cl.id,
            cl.title,
            cl."viewCount",
            cl.duration
          FROM "courseLessons" cl
          WHERE cl."moduleId" = ${module.moduleId}
          ORDER BY cl."viewCount" DESC
          LIMIT 3
          `
        );
        
        return {
          ...module,
          topLessons: topLessonsResult.rows
        };
      })
    );
    
    return res.status(200).json(moduleWithTopLessons);
    
  } catch (error) {
    console.error('Erro ao obter aulas mais assistidas por módulo:', error);
    return res.status(500).json({ message: 'Erro ao obter aulas mais assistidas por módulo' });
  }
};

// Obter histórico de aulas assistidas pelo usuário (para a seção "Continuar assistindo")
export const getWatchHistory = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    const user = req.user as Express.User;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Buscar histórico combinando dados de progresso e visualizações
    // Ordenamos por último acesso (mais recente primeiro) e limitamos ao número solicitado
    const recentWatchedLessons = await db.execute(
      sql`
      WITH combined_history AS (
        -- Resultados da tabela de progresso
        SELECT 
          cp."lessonId", 
          cp."lastWatchedAt" as timestamp, 
          cp."progress",
          cp."isCompleted",
          TRUE as has_progress
        FROM "courseProgress" cp
        WHERE cp."userId" = ${user.id}
        
        UNION ALL
        
        -- Resultados da tabela de visualizações que não estão na tabela de progresso
        SELECT 
          lv."lessonId", 
          lv."viewedAt" as timestamp,
          0 as progress,
          FALSE as is_completed,
          FALSE as has_progress
        FROM "lessonViews" lv
        WHERE lv."userId" = ${user.id}
        AND NOT EXISTS (
          SELECT 1 FROM "courseProgress" cp 
          WHERE cp."lessonId" = lv."lessonId" AND cp."userId" = ${user.id}
        )
      )
      
      SELECT 
        ch.*,
        cl.title,
        cl."moduleId",
        cl."thumbnailUrl",
        cl."videoUrl",
        cl.duration,
        cm.title as "moduleName",
        cm.level
      FROM (
        -- Selecionamos o registro mais recente para cada aula
        SELECT DISTINCT ON ("lessonId") *
        FROM combined_history
        ORDER BY "lessonId", timestamp DESC
      ) ch
      JOIN "courseLessons" cl ON ch."lessonId" = cl.id
      JOIN "courseModules" cm ON cl."moduleId" = cm.id
      ORDER BY ch.timestamp DESC
      LIMIT ${limit}
      `
    );
    
    if (recentWatchedLessons.rows.length === 0) {
      return res.status(200).json({
        hasHistory: false,
        lessons: []
      });
    }
    
    // Formatar a duração para cada aula no formato MM:SS
    const formattedLessons = recentWatchedLessons.rows.map(lesson => {
      let durationFormatted = '';
      if (lesson.duration) {
        const minutes = Math.floor(lesson.duration / 60);
        const seconds = lesson.duration % 60;
        durationFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      return {
        lessonId: lesson.lessonId,
        title: lesson.title,
        moduleId: lesson.moduleId,
        moduleName: lesson.moduleName,
        thumbnailUrl: lesson.thumbnailUrl,
        videoUrl: lesson.videoUrl,
        lastWatched: lesson.timestamp,
        progress: lesson.progress,
        isCompleted: lesson.isCompleted,
        hasProgress: lesson.has_progress,
        duration: lesson.duration,
        durationFormatted,
        level: lesson.level
      };
    });
    
    return res.status(200).json({
      hasHistory: true,
      lessons: formattedLessons
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de aulas:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar histórico de aulas',
      hasHistory: false,
      lessons: []
    });
  }
};