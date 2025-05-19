import { Router } from 'express';
import { db } from '../db';
import { courses, insertCourseSchema, courseModules, courseSettings, insertCourseModuleSchema } from '@shared/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();

// Buscar todos os cursos
router.get('/', async (req, res) => {
  try {
    console.log('[GET /courses] Buscando cursos');
    
    // Abordagem mais simples para evitar problemas com colunas que não existem
    const query = `
      SELECT c.id, c.title, c.description, c."featuredImage", c.level, c.status, 
             c."isPublished", c."isPremium", c."createdBy", c."createdAt", c."updatedAt",
             (SELECT COUNT(*) FROM "courseModules" WHERE "courseId" = c.id) as "moduleCount",
             (SELECT COUNT(*) FROM "courseLessons" l INNER JOIN "courseModules" m ON l."moduleId" = m.id WHERE m."courseId" = c.id) as "lessonCount"
      FROM courses c
      ORDER BY c."updatedAt" DESC
    `;
    
    const result = await db.execute(query);
    
    // Formatar resultados
    const formattedCourses = result.rows.map((course: any) => {
      // Garantir que temos o campo thumbnailUrl para compatibilidade
      return {
        ...course,
        thumbnailUrl: course.featuredImage
      };
    });
    
    return res.json(formattedCourses);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    return res.status(500).json({ message: 'Erro ao buscar cursos', error: String(error) });
  }
});

// Buscar um curso específico
router.get('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const courseData = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        modules: {
          orderBy: [asc(courseModules.order)],
          with: {
            lessons: true
          }
        }
      }
    });
    
    if (!courseData) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    return res.json(courseData);
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    return res.status(500).json({ message: 'Erro ao buscar curso', error: String(error) });
  }
});

// Criar um novo curso
router.post('/', async (req, res) => {
  try {
    console.log('[POST /courses] Recebendo requisição para criar curso:', req.body);
    
    // Validar os dados de entrada com zod
    const courseData = insertCourseSchema.parse({
      ...req.body,
      createdBy: req.user?.id
    });
    
    console.log('[POST /courses] Dados validados:', courseData);
    
    // Inserir o novo curso
    const [newCourse] = await db.insert(courses)
      .values(courseData)
      .returning();
    
    console.log('[POST /courses] Curso criado com sucesso:', newCourse);
    
    return res.status(201).json(newCourse);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      console.error('[POST /courses] Erro de validação:', validationError);
      return res.status(400).json({ message: 'Dados inválidos', errors: validationError.message });
    }
    
    console.error('[POST /courses] Erro ao criar curso:', error);
    return res.status(500).json({ message: 'Erro ao criar curso', error: String(error) });
  }
});

// Atualizar um curso
router.put('/:id', async (req, res) => {
  try {
    console.log(`[PUT /courses/${req.params.id}] Recebendo requisição para atualizar curso:`, req.body);
    
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.id, courseId)
    });
    
    if (!existingCourse) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    // Permite atualizações parciais
    const courseData = insertCourseSchema.partial().parse(req.body);
    console.log(`[PUT /courses/${req.params.id}] Dados validados:`, courseData);
    
    const [updatedCourse] = await db
      .update(courses)
      .set(courseData)
      .where(eq(courses.id, courseId))
      .returning();
    
    console.log(`[PUT /courses/${req.params.id}] Curso atualizado com sucesso:`, updatedCourse);
    
    return res.json(updatedCourse);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      console.error(`[PUT /courses/${req.params.id}] Erro de validação:`, validationError);
      return res.status(400).json({ message: 'Dados inválidos', errors: validationError.message });
    }
    
    console.error(`[PUT /courses/${req.params.id}] Erro ao atualizar curso:`, error);
    return res.status(500).json({ message: 'Erro ao atualizar curso', error: String(error) });
  }
});

// Excluir um curso
router.delete('/:id', async (req, res) => {
  try {
    console.log(`[DELETE /courses/${req.params.id}] Tentando excluir curso`);
    
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    // Verificar se o curso existe
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.id, courseId)
    });
    
    if (!existingCourse) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    // Verificar se existem módulos associados a este curso
    const relatedModules = await db.query.courseModules.findMany({
      where: eq(courseModules.courseId, courseId)
    });
    
    if (relatedModules.length > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir este curso pois existem módulos associados a ele. Exclua os módulos primeiro.'
      });
    }
    
    // Excluir o curso
    await db.delete(courses).where(eq(courses.id, courseId));
    
    console.log(`[DELETE /courses/${req.params.id}] Curso excluído com sucesso`);
    
    return res.status(200).json({ message: 'Curso excluído com sucesso' });
  } catch (error) {
    console.error(`[DELETE /courses/${req.params.id}] Erro ao excluir curso:`, error);
    return res.status(500).json({ message: 'Erro ao excluir curso', error: String(error) });
  }
});

// Rotas para as configurações de cursos
router.get('/settings/get', async (req, res) => {
  try {
    console.log('[GET /courses/settings] Buscando configurações de cursos');
    
    // Buscar as configurações ou criar registros padrão se não existirem
    const settings = await db.query.courseSettings.findFirst({
      where: eq(courseSettings.id, 1) // Assumindo que há apenas um registro de configurações
    });
    
    if (!settings) {
      console.log('[GET /courses/settings] Configurações não encontradas, criando padrão...');
      
      // Criar configurações padrão
      const [newSettings] = await db.insert(courseSettings)
        .values({
          bannerTitle: 'DesignAuto Videoaulas',
          bannerDescription: 'A formação completa para você criar designs profissionais para seu negócio automotivo',
          bannerImageUrl: 'https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop',
          welcomeMessage: 'Bem-vindo aos nossos cursos! Aprenda com os melhores profissionais.',
          showModuleNumbers: true,
          useCustomPlayerColors: false,
          enableComments: true,
          allowNonPremiumEnrollment: false,
          updatedBy: req.user?.id
        })
        .returning();
      
      return res.json(newSettings);
    }
    
    return res.json(settings);
  } catch (error) {
    console.error('[GET /courses/settings] Erro ao buscar configurações:', error);
    return res.status(500).json({ message: 'Erro ao buscar configurações', error: String(error) });
  }
});

router.put('/settings/update', async (req, res) => {
  try {
    console.log('[PUT /courses/settings] Atualizando configurações de cursos:', req.body);
    
    const settingsId = 1; // Assumindo que há apenas um registro de configurações
    
    // Verificar se as configurações existem
    const existingSettings = await db.query.courseSettings.findFirst({
      where: eq(courseSettings.id, settingsId)
    });
    
    let updatedSettings;
    
    if (!existingSettings) {
      console.log('[PUT /courses/settings] Configurações não encontradas, criando...');
      
      // Criar configurações
      const [newSettings] = await db.insert(courseSettings)
        .values({
          ...req.body,
          updatedBy: req.user?.id
        })
        .returning();
      
      updatedSettings = newSettings;
    } else {
      console.log('[PUT /courses/settings] Atualizando configurações existentes');
      
      // Atualizar configurações existentes
      const [settings] = await db
        .update(courseSettings)
        .set({
          ...req.body,
          updatedBy: req.user?.id,
          updatedAt: new Date()
        })
        .where(eq(courseSettings.id, settingsId))
        .returning();
      
      updatedSettings = settings;
    }
    
    console.log('[PUT /courses/settings] Configurações atualizadas com sucesso:', updatedSettings);
    
    return res.json(updatedSettings);
  } catch (error) {
    console.error('[PUT /courses/settings] Erro ao atualizar configurações:', error);
    return res.status(500).json({ message: 'Erro ao atualizar configurações', error: String(error) });
  }
});

export default router;