import { Router } from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { courseModules, courseLessons } from '@shared/schema';

const router = Router();

// Schema para validação de módulos
const moduleSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  thumbnailUrl: z.string().url('URL de miniatura inválida'),
  level: z.enum(['iniciante', 'intermediario', 'avancado']),
  order: z.number().int().positive(),
  isActive: z.boolean(),
  isPremium: z.boolean()
});

// Schema para validação de aulas
const lessonSchema = z.object({
  moduleId: z.number().int().positive(),
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  videoUrl: z.string().url('URL de vídeo inválida'),
  videoProvider: z.enum(['youtube', 'vimeo', 'vturb', 'panda', 'direct']),
  duration: z.number().int().positive().nullable().optional(),
  thumbnailUrl: z.string().url('URL de miniatura inválida').nullable().optional(),
  order: z.number().int().positive(),
  isPremium: z.boolean(),
  additionalMaterialsUrl: z.string().url('URL de materiais inválida').nullable().optional()
});

// ===== Rotas de Módulos =====

// Listar todos os módulos
router.get('/course-modules', async (req, res) => {
  try {
    const modules = await db.select().from(courseModules).orderBy(courseModules.order);
    
    res.json(modules);
  } catch (error: any) {
    console.error('Erro ao buscar módulos:', error);
    res.status(500).json({ message: 'Erro ao buscar módulos', error: error.message });
  }
});

// Buscar módulo por ID
router.get('/course-modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const module = await db.select().from(courseModules).where(eq(courseModules.id, parseInt(id))).limit(1);
    
    if (module.length === 0) {
      return res.status(404).json({ message: 'Módulo não encontrado' });
    }
    
    res.json(module[0]);
  } catch (error: any) {
    console.error('Erro ao buscar módulo:', error);
    res.status(500).json({ message: 'Erro ao buscar módulo', error: error.message });
  }
});

// Criar novo módulo
router.post('/course-modules', async (req, res) => {
  try {
    const validation = moduleSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: validation.error.errors 
      });
    }
    
    // Adiciona ID do usuário que criou o módulo
    const userId = req.user?.id || 1; // Fallback para usuário 1 se não estiver logado
    
    const result = await db.insert(courseModules).values({
      ...validation.data,
      createdBy: userId
    }).returning();
    
    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Erro ao criar módulo:', error);
    res.status(500).json({ message: 'Erro ao criar módulo', error: error.message });
  }
});

// Atualizar módulo existente
router.put('/course-modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validation = moduleSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: validation.error.errors 
      });
    }
    
    const moduleId = parseInt(id);
    const existingModule = await db.select().from(courseModules).where(eq(courseModules.id, moduleId)).limit(1);
    
    if (existingModule.length === 0) {
      return res.status(404).json({ message: 'Módulo não encontrado' });
    }
    
    const result = await db.update(courseModules)
      .set({
        ...validation.data,
        updatedAt: new Date()
      })
      .where(eq(courseModules.id, moduleId))
      .returning();
    
    res.json(result[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar módulo:', error);
    res.status(500).json({ message: 'Erro ao atualizar módulo', error: error.message });
  }
});

// Excluir módulo
router.delete('/course-modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const moduleId = parseInt(id);
    
    // Verificar se o módulo existe
    const existingModule = await db.select().from(courseModules).where(eq(courseModules.id, moduleId)).limit(1);
    
    if (existingModule.length === 0) {
      return res.status(404).json({ message: 'Módulo não encontrado' });
    }
    
    // Primeiro excluir todas as aulas do módulo
    await db.delete(courseLessons).where(eq(courseLessons.moduleId, moduleId));
    
    // Depois excluir o módulo
    await db.delete(courseModules).where(eq(courseModules.id, moduleId));
    
    res.json({ message: 'Módulo e aulas relacionadas excluídos com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir módulo:', error);
    res.status(500).json({ message: 'Erro ao excluir módulo', error: error.message });
  }
});

// ===== Rotas de Aulas =====

// Listar todas as aulas
router.get('/course-lessons', async (req, res) => {
  try {
    const lessons = await db.select().from(courseLessons).orderBy(courseLessons.moduleId, courseLessons.order);
    
    res.json(lessons);
  } catch (error: any) {
    console.error('Erro ao buscar aulas:', error);
    res.status(500).json({ message: 'Erro ao buscar aulas', error: error.message });
  }
});

// Listar aulas por módulo
router.get('/course-modules/:moduleId/lessons', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const lessons = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.moduleId, parseInt(moduleId)))
      .orderBy(courseLessons.order);
    
    res.json(lessons);
  } catch (error: any) {
    console.error('Erro ao buscar aulas do módulo:', error);
    res.status(500).json({ message: 'Erro ao buscar aulas do módulo', error: error.message });
  }
});

// Buscar aula por ID
router.get('/course-lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await db.select().from(courseLessons).where(eq(courseLessons.id, parseInt(id))).limit(1);
    
    if (lesson.length === 0) {
      return res.status(404).json({ message: 'Aula não encontrada' });
    }
    
    res.json(lesson[0]);
  } catch (error: any) {
    console.error('Erro ao buscar aula:', error);
    res.status(500).json({ message: 'Erro ao buscar aula', error: error.message });
  }
});

// Criar nova aula
router.post('/course-lessons', async (req, res) => {
  try {
    const validation = lessonSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: validation.error.errors 
      });
    }
    
    // Verificar se o módulo existe
    const moduleExists = await db.select({ id: courseModules.id })
      .from(courseModules)
      .where(eq(courseModules.id, validation.data.moduleId))
      .limit(1);
    
    if (moduleExists.length === 0) {
      return res.status(400).json({ message: 'Módulo não encontrado' });
    }
    
    // Adiciona ID do usuário que criou a aula
    const userId = req.user?.id || 1; // Fallback para usuário 1 se não estiver logado
    
    const result = await db.insert(courseLessons).values({
      ...validation.data,
      createdBy: userId
    }).returning();
    
    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ message: 'Erro ao criar aula', error: error.message });
  }
});

// Atualizar aula existente
router.put('/course-lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validation = lessonSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: validation.error.errors 
      });
    }
    
    const lessonId = parseInt(id);
    const existingLesson = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId)).limit(1);
    
    if (existingLesson.length === 0) {
      return res.status(404).json({ message: 'Aula não encontrada' });
    }
    
    // Verificar se o módulo existe
    const moduleExists = await db.select({ id: courseModules.id })
      .from(courseModules)
      .where(eq(courseModules.id, validation.data.moduleId))
      .limit(1);
    
    if (moduleExists.length === 0) {
      return res.status(400).json({ message: 'Módulo não encontrado' });
    }
    
    const result = await db.update(courseLessons)
      .set({
        ...validation.data,
        updatedAt: new Date()
      })
      .where(eq(courseLessons.id, lessonId))
      .returning();
    
    res.json(result[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar aula:', error);
    res.status(500).json({ message: 'Erro ao atualizar aula', error: error.message });
  }
});

// Excluir aula
router.delete('/course-lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lessonId = parseInt(id);
    
    // Verificar se a aula existe
    const existingLesson = await db.select().from(courseLessons).where(eq(courseLessons.id, lessonId)).limit(1);
    
    if (existingLesson.length === 0) {
      return res.status(404).json({ message: 'Aula não encontrada' });
    }
    
    // TODO: Quando houver tabelas de progresso e avaliações, excluir registros relacionados aqui
    
    // Excluir a aula
    await db.delete(courseLessons).where(eq(courseLessons.id, lessonId));
    
    res.json({ message: 'Aula excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir aula:', error);
    res.status(500).json({ message: 'Erro ao excluir aula', error: error.message });
  }
});

export default router;