import { Router } from 'express';
import { db } from '../db';
import { courseModules, courseLessons, insertCourseModuleSchema, insertCourseLessonSchema } from '@shared/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();

// Buscar todos os módulos
router.get('/modules', async (req, res) => {
  try {
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
    console.error('Erro ao buscar módulos:', error);
    return res.status(500).json({ message: 'Erro ao buscar módulos', error: String(error) });
  }
});

// Buscar um módulo específico
router.get('/modules/:id', async (req, res) => {
  try {
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
    console.error('Erro ao buscar módulo:', error);
    return res.status(500).json({ message: 'Erro ao buscar módulo', error: String(error) });
  }
});

// Criar um novo módulo
router.post('/modules', async (req, res) => {
  try {
    // Validar os dados de entrada com zod
    const moduleData = insertCourseModuleSchema.parse({
      ...req.body,
      createdBy: req.user?.id
    });
    
    // Remover o ID se foi fornecido, para evitar violação de chave primária
    const { id, ...safeModuleData } = moduleData;
    
    // Encontrar o maior ID existente para garantir um novo ID único
    const maxIdResult = await db.select({ maxId: sql`MAX(id)` }).from(courseModules);
    const nextId = (maxIdResult[0]?.maxId || 0) + 1;
    
    console.log(`Próximo ID disponível para módulo: ${nextId}`);
    
    // Inserir o novo módulo com um ID seguro
    const [newModule] = await db.insert(courseModules)
      .values({
        ...safeModuleData
      })
      .returning();
    
    return res.status(201).json(newModule);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: 'Dados inválidos', errors: validationError.message });
    }
    
    console.error('Erro ao criar módulo:', error);
    return res.status(500).json({ message: 'Erro ao criar módulo', error: String(error) });
  }
});

// Atualizar um módulo
router.put('/modules/:id', async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const existingModule = await db.query.courseModules.findFirst({
      where: eq(courseModules.id, moduleId)
    });
    
    if (!existingModule) {
      return res.status(404).json({ message: 'Módulo não encontrado' });
    }
    
    const moduleData = insertCourseModuleSchema.partial().parse(req.body);
    
    const [updatedModule] = await db
      .update(courseModules)
      .set(moduleData)
      .where(eq(courseModules.id, moduleId))
      .returning();
    
    return res.json(updatedModule);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: 'Dados inválidos', errors: validationError.message });
    }
    
    console.error('Erro ao atualizar módulo:', error);
    return res.status(500).json({ message: 'Erro ao atualizar módulo', error: String(error) });
  }
});

// Excluir um módulo
router.delete('/modules/:id', async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    // Verificar se o módulo existe
    const existingModule = await db.query.courseModules.findFirst({
      where: eq(courseModules.id, moduleId)
    });
    
    if (!existingModule) {
      return res.status(404).json({ message: 'Módulo não encontrado' });
    }
    
    // Verificar se existem lições associadas a este módulo
    const relatedLessons = await db.query.courseLessons.findMany({
      where: eq(courseLessons.moduleId, moduleId)
    });
    
    if (relatedLessons.length > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir este módulo pois existem lições associadas a ele. Exclua as lições primeiro.'
      });
    }
    
    // Excluir o módulo
    await db.delete(courseModules).where(eq(courseModules.id, moduleId));
    
    return res.status(200).json({ message: 'Módulo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir módulo:', error);
    return res.status(500).json({ message: 'Erro ao excluir módulo', error: String(error) });
  }
});

// ENDPOINTS PARA LIÇÕES

// Buscar todas as lições
router.get('/lessons', async (req, res) => {
  try {
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
    console.error('Erro ao buscar lições:', error);
    return res.status(500).json({ message: 'Erro ao buscar lições', error: String(error) });
  }
});

// Buscar uma lição específica
router.get('/lessons/:id', async (req, res) => {
  try {
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
    console.error('Erro ao buscar lição:', error);
    return res.status(500).json({ message: 'Erro ao buscar lição', error: String(error) });
  }
});

// Criar uma nova lição
router.post('/lessons', async (req, res) => {
  try {
    // Validar dados de entrada
    const lessonData = insertCourseLessonSchema.parse({
      ...req.body,
      createdBy: req.user?.id
    });
    
    // Remover o ID se foi fornecido, para evitar violação de chave primária
    const { id, ...safeLessonData } = lessonData as any;
    
    // Verificar se o módulo existe
    const moduleExists = await db.query.courseModules.findFirst({
      where: eq(courseModules.id, safeLessonData.moduleId)
    });
    
    if (!moduleExists) {
      return res.status(400).json({ message: 'Módulo não encontrado' });
    }
    
    // Encontrar o maior ID existente para garantir um novo ID único
    const maxIdResult = await db.select({ maxId: sql`MAX(id)` }).from(courseLessons);
    const nextId = (maxIdResult[0]?.maxId || 0) + 1;
    
    console.log(`Próximo ID disponível para lição: ${nextId}`);
    
    // Inserir a nova lição
    const [newLesson] = await db.insert(courseLessons)
      .values(safeLessonData)
      .returning();
    
    return res.status(201).json(newLesson);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: 'Dados inválidos', errors: validationError.message });
    }
    
    console.error('Erro ao criar lição:', error);
    return res.status(500).json({ message: 'Erro ao criar lição', error: String(error) });
  }
});

// Atualizar uma lição
router.put('/lessons/:id', async (req, res) => {
  try {
    console.log(`[UPDATE LESSON] Iniciando atualização da lição ID: ${req.params.id}`);
    console.log(`[UPDATE LESSON] Corpo da requisição:`, req.body);
    
    const lessonId = parseInt(req.params.id);
    
    if (isNaN(lessonId)) {
      console.log(`[UPDATE LESSON] ID inválido: ${req.params.id}`);
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const existingLesson = await db.query.courseLessons.findFirst({
      where: eq(courseLessons.id, lessonId)
    });
    
    console.log(`[UPDATE LESSON] Lição existente encontrada:`, existingLesson);
    
    if (!existingLesson) {
      console.log(`[UPDATE LESSON] Lição não encontrada com ID: ${lessonId}`);
      return res.status(404).json({ message: 'Lição não encontrada' });
    }
    
    console.log(`[UPDATE LESSON] Validando dados...`);
    const lessonData = insertCourseLessonSchema.partial().parse(req.body);
    console.log(`[UPDATE LESSON] Dados validados:`, lessonData);
    
    // Se o moduleId foi fornecido, verificar se o módulo existe
    if (lessonData.moduleId !== undefined) {
      console.log(`[UPDATE LESSON] Verificando existência do módulo ID: ${lessonData.moduleId}`);
      const moduleExists = await db.query.courseModules.findFirst({
        where: eq(courseModules.id, lessonData.moduleId)
      });
      
      if (!moduleExists) {
        console.log(`[UPDATE LESSON] Módulo não encontrado com ID: ${lessonData.moduleId}`);
        return res.status(400).json({ message: 'Módulo não encontrado' });
      }
      console.log(`[UPDATE LESSON] Módulo encontrado:`, moduleExists.title);
    }
    
    console.log(`[UPDATE LESSON] Executando atualização no banco de dados...`);
    const [updatedLesson] = await db
      .update(courseLessons)
      .set(lessonData)
      .where(eq(courseLessons.id, lessonId))
      .returning();
    
    console.log(`[UPDATE LESSON] Atualização concluída com sucesso:`, updatedLesson);
    return res.json(updatedLesson);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      console.error(`[UPDATE LESSON] Erro de validação:`, validationError);
      return res.status(400).json({ message: 'Dados inválidos', errors: validationError.message });
    }
    
    console.error('[UPDATE LESSON] Erro ao atualizar lição:', error);
    return res.status(500).json({ message: 'Erro ao atualizar lição', error: String(error) });
  }
});

// Excluir uma lição
router.delete('/lessons/:id', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    // Verificar se a lição existe
    const existingLesson = await db.query.courseLessons.findFirst({
      where: eq(courseLessons.id, lessonId)
    });
    
    if (!existingLesson) {
      return res.status(404).json({ message: 'Lição não encontrada' });
    }
    
    // Excluir a lição
    await db.delete(courseLessons).where(eq(courseLessons.id, lessonId));
    
    return res.status(200).json({ message: 'Lição excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir lição:', error);
    return res.status(500).json({ message: 'Erro ao excluir lição', error: String(error) });
  }
});

export default router;