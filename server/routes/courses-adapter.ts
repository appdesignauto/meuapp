import { Router } from 'express';
import { db } from '../db';
import { courses, courseModules, courseLessons, courseSettings } from '@shared/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';

/**
 * Este adaptador cria rotas compatíveis com o formato antigo (/api/courses)
 * mas internamente utiliza a nova estrutura (/api/course)
 * permitindo a transição gradual entre os formatos
 */

const router = Router();

// Rota principal para listar todos os cursos
router.get('/', async (req, res) => {
  try {
    console.log('[ADAPTER] Redirecionando chamada de /api/course para listar cursos');
    
    // Abordagem direta com SQL raw para evitar problemas
    const coursesList = await db.execute(
      sql`SELECT id, title, description, slug, "featuredImage", level, status, "isPublished", "isPremium", "createdBy", "createdAt", "updatedAt" 
          FROM courses 
          ORDER BY "updatedAt" DESC`
    );
    
    console.log('[ADAPTER] Cursos encontrados:', coursesList.length);
    
    // Buscar os módulos para cada curso
    const coursesWithModules = await Promise.all(
      coursesList.map(async (course) => {
        const modules = await db.query.courseModules.findMany({
          where: eq(courseModules.courseId, course.id),
          orderBy: [asc(courseModules.order)]
        });
        
        return {
          ...course,
          modules
        };
      })
    );
    
    return res.json(coursesWithModules);
  } catch (error) {
    console.error('[ADAPTER] Erro ao buscar cursos:', error);
    return res.status(500).json({ message: 'Erro ao buscar cursos', error: String(error) });
  }
});

// Rota de compatibilidade para módulos
router.get('/modules', async (req, res) => {
  try {
    console.log('[ADAPTER] Redirecionando chamada de /api/courses/modules para estrutura atualizada');
    
    // Verificar se está buscando um módulo específico por ID
    const moduleId = req.query.id ? parseInt(req.query.id as string) : undefined;
    
    if (moduleId && !isNaN(moduleId)) {
      // Buscar módulo específico
      const module = await db.query.courseModules.findFirst({
        where: eq(courseModules.id, moduleId),
        with: {
          lessons: {
            orderBy: [asc(courseLessons.order)]
          }
        }
      });
      
      if (!module) {
        return res.status(404).json({ message: 'Módulo não encontrado' });
      }
      
      return res.json(module);
    } else {
      // Buscar todos os módulos
      const modules = await db.query.courseModules.findMany({
        orderBy: [asc(courseModules.order)],
        with: {
          lessons: {
            orderBy: [asc(courseLessons.order)]
          }
        }
      });
      
      return res.json(modules);
    }
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
    
    // Verificar diferentes parâmetros
    const moduleId = req.query.moduleId ? parseInt(req.query.moduleId as string) : undefined;
    const lessonId = req.query.id ? parseInt(req.query.id as string) : undefined;
    
    // Verificar se está buscando uma lição específica pelo ID
    if (lessonId && !isNaN(lessonId)) {
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
    }
    // Verificar lições por módulo
    else if (moduleId && !isNaN(moduleId)) {
      const lessons = await db.select().from(courseLessons)
        .where(eq(courseLessons.moduleId, moduleId))
        .orderBy(asc(courseLessons.order));
      
      return res.json(lessons);
    } 
    // Buscar todas as lições
    else {
      const lessons = await db.select().from(courseLessons)
        .orderBy(asc(courseLessons.order));
      
      return res.json(lessons);
    }
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

// Rota de compatibilidade para as configurações de cursos
router.get('/settings', async (req, res) => {
  try {
    console.log('[ADAPTER] Redirecionando chamada de /api/courses/settings para estrutura atualizada');
    
    // Buscar as configurações ou criar registros padrão se não existirem
    const settings = await db.query.courseSettings.findFirst({
      where: eq(courseSettings.id, 1) // Assumindo que há apenas um registro de configurações
    });
    
    if (!settings) {
      console.log('[ADAPTER] Configurações não encontradas, redirecionando para API principal');
      return res.status(404).json({ message: 'Configurações não encontradas' });
    }
    
    return res.json(settings);
  } catch (error) {
    console.error('[ADAPTER] Erro ao buscar configurações:', error);
    return res.status(500).json({ message: 'Erro ao buscar configurações', error: String(error) });
  }
});

// Mantendo compatibilidade com a rota antiga
router.get('/settings/get', async (req, res) => {
  try {
    console.log('[ADAPTER] Redirecionando chamada de /api/courses/settings/get para /api/courses/settings');
    
    // Buscar as configurações usando a rota principal
    const settings = await db.query.courseSettings.findFirst({
      where: eq(courseSettings.id, 1)
    });
    
    if (!settings) {
      return res.status(404).json({ message: 'Configurações não encontradas' });
    }
    
    return res.json(settings);
  } catch (error) {
    console.error('[ADAPTER] Erro ao buscar configurações (rota antiga):', error);
    return res.status(500).json({ message: 'Erro ao buscar configurações', error: String(error) });
  }
});

export default router;