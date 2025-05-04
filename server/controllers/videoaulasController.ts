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
      const updatedLessonResult = await db.execute(
        sql`UPDATE "courseLessons" 
        SET "viewCount" = COALESCE("viewCount", 0) + 1 
        WHERE "id" = ${lessonId} 
        RETURNING "viewCount"`
      );
      
      console.log('Aula marcada como visualizada');
    } else {
      // Atualizar data de visualização
      await db.execute(
        sql`UPDATE "lessonViews" 
        SET "viewedAt" = CURRENT_TIMESTAMP 
        WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
      );
      
      console.log('Atualizada data de visualização');
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
      sql`SELECT * FROM "lessonProgress" WHERE "userId" = ${user.id} AND "lessonId" = ${lessonId}`
    );
    
    if (completedExists.rows.length === 0) {
      // Registrar como completada
      await db.execute(
        sql`INSERT INTO "lessonProgress" ("userId", "lessonId", "completedAt", "isCompleted") 
        VALUES (${user.id}, ${lessonId}, CURRENT_TIMESTAMP, true)`
      );
    } else {
      // Atualizar status
      await db.execute(
        sql`UPDATE "lessonProgress" 
        SET "completedAt" = CURRENT_TIMESTAMP, "isCompleted" = true 
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
      FROM "lessonProgress" lp
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