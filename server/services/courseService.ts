import { db } from "../db";
import { 
  courseModules, CourseModule, InsertCourseModule,
  courseLessons, CourseLesson, InsertCourseLesson,
  courseProgress, CourseProgress, InsertCourseProgress,
  courseRatings, CourseRating, InsertCourseRating,
  users
} from "@shared/schema";
import { eq, and, asc, desc } from "drizzle-orm";

class CourseService {
  // ===== Módulos =====
  async getModules(includePremium = false): Promise<CourseModule[]> {
    try {
      let query = db.select().from(courseModules).where(eq(courseModules.isActive, true));
      
      if (!includePremium) {
        query = query.where(eq(courseModules.isPremium, false));
      }
      
      return await query.orderBy(asc(courseModules.order));
    } catch (error) {
      console.error("Erro ao buscar módulos:", error);
      return [];
    }
  }

  async getModuleById(id: number, includePremium = false): Promise<CourseModule | undefined> {
    try {
      const query = db.select()
        .from(courseModules)
        .where(eq(courseModules.id, id))
        .where(eq(courseModules.isActive, true));
      
      if (!includePremium) {
        query.where(eq(courseModules.isPremium, false));
      }
      
      const modules = await query;
      return modules[0];
    } catch (error) {
      console.error(`Erro ao buscar módulo ${id}:`, error);
      return undefined;
    }
  }

  async createModule(module: InsertCourseModule): Promise<CourseModule> {
    try {
      const [newModule] = await db.insert(courseModules).values(module).returning();
      return newModule;
    } catch (error) {
      console.error("Erro ao criar módulo:", error);
      throw error;
    }
  }

  async updateModule(id: number, data: Partial<InsertCourseModule>): Promise<CourseModule | undefined> {
    try {
      const now = new Date();
      const [updatedModule] = await db.update(courseModules)
        .set({ ...data, updatedAt: now })
        .where(eq(courseModules.id, id))
        .returning();
      return updatedModule;
    } catch (error) {
      console.error(`Erro ao atualizar módulo ${id}:`, error);
      return undefined;
    }
  }

  async deleteModule(id: number): Promise<boolean> {
    try {
      const result = await db.delete(courseModules).where(eq(courseModules.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Erro ao excluir módulo ${id}:`, error);
      return false;
    }
  }

  // ===== Aulas =====
  async getLessonsByModuleId(moduleId: number, includePremium = false): Promise<CourseLesson[]> {
    try {
      let query = db.select()
        .from(courseLessons)
        .where(eq(courseLessons.moduleId, moduleId));
      
      if (!includePremium) {
        query = query.where(eq(courseLessons.isPremium, false));
      }
      
      return await query.orderBy(asc(courseLessons.order));
    } catch (error) {
      console.error(`Erro ao buscar aulas do módulo ${moduleId}:`, error);
      return [];
    }
  }

  async getLessonById(id: number, includePremium = false): Promise<CourseLesson | undefined> {
    try {
      const query = db.select()
        .from(courseLessons)
        .where(eq(courseLessons.id, id));
      
      if (!includePremium) {
        query.where(eq(courseLessons.isPremium, false));
      }
      
      const lessons = await query;
      return lessons[0];
    } catch (error) {
      console.error(`Erro ao buscar aula ${id}:`, error);
      return undefined;
    }
  }

  async createLesson(lesson: InsertCourseLesson): Promise<CourseLesson> {
    try {
      const [newLesson] = await db.insert(courseLessons).values(lesson).returning();
      return newLesson;
    } catch (error) {
      console.error("Erro ao criar aula:", error);
      throw error;
    }
  }

  async updateLesson(id: number, data: Partial<InsertCourseLesson>): Promise<CourseLesson | undefined> {
    try {
      const now = new Date();
      const [updatedLesson] = await db.update(courseLessons)
        .set({ ...data, updatedAt: now })
        .where(eq(courseLessons.id, id))
        .returning();
      return updatedLesson;
    } catch (error) {
      console.error(`Erro ao atualizar aula ${id}:`, error);
      return undefined;
    }
  }

  async deleteLesson(id: number): Promise<boolean> {
    try {
      const result = await db.delete(courseLessons).where(eq(courseLessons.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error(`Erro ao excluir aula ${id}:`, error);
      return false;
    }
  }

  // ===== Progresso do Usuário =====
  async getUserProgress(userId: number, lessonId: number): Promise<CourseProgress | undefined> {
    try {
      const progressRecords = await db.select()
        .from(courseProgress)
        .where(and(
          eq(courseProgress.userId, userId),
          eq(courseProgress.lessonId, lessonId)
        ));
      
      return progressRecords[0];
    } catch (error) {
      console.error(`Erro ao buscar progresso do usuário ${userId} na aula ${lessonId}:`, error);
      return undefined;
    }
  }

  async getAllUserProgressForModule(userId: number, moduleId: number): Promise<{lesson: CourseLesson, progress: CourseProgress}[]> {
    try {
      // Primeiro, obtemos todas as aulas do módulo
      const lessons = await this.getLessonsByModuleId(moduleId, true);
      
      // Então, para cada aula, buscamos o progresso do usuário
      const result = [];
      
      for (const lesson of lessons) {
        const progress = await this.getUserProgress(userId, lesson.id);
        result.push({
          lesson,
          progress: progress || {
            id: 0,
            userId,
            lessonId: lesson.id,
            progress: 0,
            isCompleted: false,
            lastWatchedAt: new Date(),
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Erro ao buscar progresso completo do usuário ${userId} no módulo ${moduleId}:`, error);
      return [];
    }
  }

  async updateUserProgress(
    userId: number, 
    lessonId: number, 
    data: { progress?: number, isCompleted?: boolean, notes?: string }
  ): Promise<CourseProgress> {
    try {
      const existingProgress = await this.getUserProgress(userId, lessonId);
      const now = new Date();
      
      if (existingProgress) {
        // Atualizar progresso existente
        const [updatedProgress] = await db.update(courseProgress)
          .set({ 
            progress: data.progress !== undefined ? data.progress : existingProgress.progress,
            isCompleted: data.isCompleted !== undefined ? data.isCompleted : existingProgress.isCompleted,
            notes: data.notes !== undefined ? data.notes : existingProgress.notes,
            lastWatchedAt: now,
            updatedAt: now
          })
          .where(and(
            eq(courseProgress.userId, userId),
            eq(courseProgress.lessonId, lessonId)
          ))
          .returning();
        
        return updatedProgress;
      } else {
        // Criar novo registro de progresso
        const [newProgress] = await db.insert(courseProgress)
          .values({
            userId,
            lessonId,
            progress: data.progress || 0,
            isCompleted: data.isCompleted || false,
            notes: data.notes || null,
            lastWatchedAt: now
          })
          .returning();
        
        return newProgress;
      }
    } catch (error) {
      console.error(`Erro ao atualizar progresso do usuário ${userId} na aula ${lessonId}:`, error);
      throw error;
    }
  }

  // ===== Avaliações =====
  async getLessonRatings(lessonId: number): Promise<(CourseRating & { username: string, name: string | null })[]> {
    try {
      const result = await db.select({
        ...courseRatings,
        username: users.username,
        name: users.name
      })
      .from(courseRatings)
      .leftJoin(users, eq(courseRatings.userId, users.id))
      .where(eq(courseRatings.lessonId, lessonId))
      .orderBy(desc(courseRatings.createdAt));
      
      return result;
    } catch (error) {
      console.error(`Erro ao buscar avaliações da aula ${lessonId}:`, error);
      return [];
    }
  }

  async getUserRating(userId: number, lessonId: number): Promise<CourseRating | undefined> {
    try {
      const ratings = await db.select()
        .from(courseRatings)
        .where(and(
          eq(courseRatings.userId, userId),
          eq(courseRatings.lessonId, lessonId)
        ));
      
      return ratings[0];
    } catch (error) {
      console.error(`Erro ao buscar avaliação do usuário ${userId} na aula ${lessonId}:`, error);
      return undefined;
    }
  }

  async rateLesson(userId: number, lessonId: number, rating: number, comment?: string): Promise<CourseRating> {
    try {
      const existingRating = await this.getUserRating(userId, lessonId);
      const now = new Date();
      
      if (existingRating) {
        // Atualizar avaliação existente
        const [updatedRating] = await db.update(courseRatings)
          .set({ 
            rating,
            comment: comment || existingRating.comment,
            updatedAt: now
          })
          .where(and(
            eq(courseRatings.userId, userId),
            eq(courseRatings.lessonId, lessonId)
          ))
          .returning();
        
        return updatedRating;
      } else {
        // Criar nova avaliação
        const [newRating] = await db.insert(courseRatings)
          .values({
            userId,
            lessonId,
            rating,
            comment: comment || null
          })
          .returning();
        
        return newRating;
      }
    } catch (error) {
      console.error(`Erro ao avaliar aula ${lessonId} pelo usuário ${userId}:`, error);
      throw error;
    }
  }

  async deleteRating(userId: number, lessonId: number): Promise<boolean> {
    try {
      const result = await db.delete(courseRatings)
        .where(and(
          eq(courseRatings.userId, userId),
          eq(courseRatings.lessonId, lessonId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error(`Erro ao excluir avaliação do usuário ${userId} na aula ${lessonId}:`, error);
      return false;
    }
  }

  // Método para verificar se o usuário tem acesso premium
  async userHasPremiumAccess(userId: number): Promise<boolean> {
    try {
      const user = await db.select({
        nivelacesso: users.nivelacesso,
        acessovitalicio: users.acessovitalicio
      })
      .from(users)
      .where(eq(users.id, userId));
      
      if (!user || user.length === 0) {
        return false;
      }
      
      // Usuários com acesso vitalício ou níveis premium, admin, designer_adm têm acesso premium
      return user[0].acessovitalicio || 
             ['premium', 'admin', 'designer_adm'].includes(user[0].nivelacesso);
    } catch (error) {
      console.error(`Erro ao verificar acesso premium do usuário ${userId}:`, error);
      return false;
    }
  }
}

export const courseService = new CourseService();