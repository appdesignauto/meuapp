import { Router } from 'express';
import { db } from '../db';
import { courses, courseModules, courseLessons } from '@shared/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';

/**
 * Este adaptador cria rotas compatíveis com o formato antigo (/api/courses)
 * mas internamente utiliza a nova estrutura (/api/course)
 * permitindo a transição gradual entre os formatos
 */

const router = Router();

// Rota de compatibilidade para módulos
router.get('/modules', async (req, res) => {
  try {
    console.log('[ADAPTER] Redirecionando chamada de /api/courses/modules para estrutura atualizada');
    const modules = await db.query.courseModules.findMany({
      orderBy: [asc(courseModules.order)],
      with: {
        lessons: {
          orderBy: [asc(courseLessons.order)]
        }
      }
    });
    
    return res.json(modules);
  } catch (error) {
    console.error('[ADAPTER] Erro ao buscar módulos:', error);
    return res.status(500).json({ message: 'Erro ao buscar módulos', error: String(error) });
  }
});

// Rota de compatibilidade para um módulo específico
router.get('/modules/:id', async (req, res) => {
  try {
    console.log(`[ADAPTER] Redirecionando chamada de /api/courses/modules/${req.params.id} para estrutura atualizada`);
    const moduleId = parseInt(req.params.id);
    
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const moduleData = await db.query.courseModules.findFirst({
      where: eq(courseModules.id, moduleId),
      with: {
        lessons: {
          orderBy: [asc(courseLessons.order)]
        }
      }
    });
    
    if (!moduleData) {
      return res.status(404).json({ message: 'Módulo não encontrado' });
    }
    
    return res.json(moduleData);
  } catch (error) {
    console.error('[ADAPTER] Erro ao buscar módulo:', error);
    return res.status(500).json({ message: 'Erro ao buscar módulo', error: String(error) });
  }
});

// Rota de compatibilidade para lições
router.get('/lessons', async (req, res) => {
  try {
    console.log('[ADAPTER] Redirecionando chamada de /api/courses/lessons para estrutura atualizada');
    const moduleId = req.query.moduleId ? parseInt(req.query.moduleId as string) : undefined;
    
    let lessons;
    
    if (moduleId && !isNaN(moduleId)) {
      lessons = await db.select().from(courseLessons)
        .where(eq(courseLessons.moduleId, moduleId))
        .orderBy(asc(courseLessons.order));
    } else {
      lessons = await db.select().from(courseLessons)
        .orderBy(asc(courseLessons.order));
    }
    
    return res.json(lessons);
  } catch (error) {
    console.error('[ADAPTER] Erro ao buscar lições:', error);
    return res.status(500).json({ message: 'Erro ao buscar lições', error: String(error) });
  }
});

// Rota de compatibilidade para uma lição específica
router.get('/lessons/:id', async (req, res) => {
  try {
    console.log(`[ADAPTER] Redirecionando chamada de /api/courses/lessons/${req.params.id} para estrutura atualizada`);
    const lessonId = parseInt(req.params.id);
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const lesson = await db.query.courseLessons.findFirst({
      where: eq(courseLessons.id, lessonId),
      with: {
        module: true
      }
    });
    
    if (!lesson) {
      return res.status(404).json({ message: 'Lição não encontrada' });
    }
    
    return res.json(lesson);
  } catch (error) {
    console.error('[ADAPTER] Erro ao buscar lição:', error);
    return res.status(500).json({ message: 'Erro ao buscar lição', error: String(error) });
  }
});

export default router;