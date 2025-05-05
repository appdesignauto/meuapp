import { Router } from 'express';
import { db } from '../db';
import { courses, courseModules, courseLessons, courseSettings, insertCourseModuleSchema, insertCourseLessonSchema } from '@shared/schema';
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

// ENDPOINTS PARA CONFIGURAÇÕES DOS CURSOS

// Buscar configurações dos cursos
router.get('/settings', async (req, res) => {
  try {
    console.log('[GET /course/settings] Buscando configurações de cursos');
    
    // Buscar as configurações ou criar registros padrão se não existirem
    const settings = await db.query.courseSettings.findFirst({
      where: eq(courseSettings.id, 1) // Assumindo que há apenas um registro de configurações
    });
    
    if (!settings) {
      console.log('[GET /course/settings] Configurações não encontradas, criando padrão...');
      
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
    console.error('[GET /course/settings] Erro ao buscar configurações:', error);
    return res.status(500).json({ message: 'Erro ao buscar configurações', error: String(error) });
  }
});

// Atualizar configurações dos cursos
router.put('/settings', async (req, res) => {
  try {
    console.log('[PUT /course/settings] Atualizando configurações de cursos:', req.body);
    
    const settingsId = 1; // Assumindo que há apenas um registro de configurações
    
    // Verificar se as configurações existem
    const existingSettings = await db.query.courseSettings.findFirst({
      where: eq(courseSettings.id, settingsId)
    });
    
    let updatedSettings;
    
    if (!existingSettings) {
      console.log('[PUT /course/settings] Configurações não encontradas, criando...');
      
      // Criar configurações
      const [newSettings] = await db.insert(courseSettings)
        .values({
          ...req.body,
          updatedBy: req.user?.id
        })
        .returning();
      
      updatedSettings = newSettings;
    } else {
      console.log('[PUT /course/settings] Atualizando configurações existentes');
      
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
    
    console.log('[PUT /course/settings] Configurações atualizadas com sucesso:', updatedSettings);
    
    return res.json(updatedSettings);
  } catch (error) {
    console.error('[PUT /course/settings] Erro ao atualizar configurações:', error);
    return res.status(500).json({ message: 'Erro ao atualizar configurações', error: String(error) });
  }
});

// ENDPOINTS PARA CURSOS

// Buscar todos os cursos
router.get('/', async (req, res) => {
  try {
    console.log('[GET /course] Buscando todos os cursos');
    
    // Usando SQL diretamente para evitar problemas de esquema
    const query = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c."featuredImage" as "thumbnailUrl", /* Usando featuredImage como fallback para thumbnailUrl */
        c."featuredImage" as "featuredImage",
        c.level, 
        c.status, 
        c."isPublished" as "isPublished", 
        c."isPremium" as "isPremium",
        c."createdAt" as "createdAt",
        c."updatedAt" as "updatedAt",
        COALESCE(
          (SELECT COUNT(*) FROM "courseModules" cm WHERE cm."courseId" = c.id), 0
        ) AS "moduleCount",
        COALESCE(
          (SELECT COUNT(*) FROM "courseModules" cm JOIN "courseLessons" cl ON cm.id = cl."moduleId" WHERE cm."courseId" = c.id), 0
        ) AS "lessonCount"
      FROM 
        courses c
      ORDER BY 
        c."createdAt" DESC
    `;
    
    const result = await db.execute(query);
    const courses = result.rows;
    
    console.log(`[GET /course] ${courses.length} cursos encontrados`);
    
    return res.json(courses);
  } catch (error) {
    console.error('[GET /course] Erro ao buscar cursos:', error);
    return res.status(500).json({ message: 'Erro ao buscar cursos', error: String(error) });
  }
});

// Buscar um curso específico
router.get('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso inválido' });
    }
    
    console.log(`[GET /course/${courseId}] Buscando curso específico`);
    
    // Usando SQL diretamente para evitar problemas de esquema
    const query = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c."featuredImage" as "thumbnailUrl", /* Usando featuredImage como fallback para thumbnailUrl */
        c."featuredImage" as "featuredImage",
        c.level, 
        c.status, 
        c."isPublished" as "isPublished", 
        c."isPremium" as "isPremium",
        c."createdAt" as "createdAt",
        c."updatedAt" as "updatedAt"
      FROM 
        courses c
      WHERE 
        c.id = $1
    `;
    
    const result = await db.execute(query, [courseId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    // Buscar módulos relacionados
    const modulesQuery = `
      SELECT 
        cm.id, 
        cm.title, 
        cm.description, 
        cm.thumbnailurl as "thumbnailUrl",
        cm.level, 
        cm.order, 
        cm.isactive as "isActive", 
        cm.ispremium as "isPremium"
      FROM 
        "courseModules" cm
      WHERE 
        cm."courseId" = $1
      ORDER BY 
        cm.order ASC
    `;
    
    const modulesResult = await db.execute(modulesQuery, [courseId]);
    const modules = modulesResult.rows;
    
    // Para cada módulo, buscar suas lições
    for (const module of modules) {
      const lessonsQuery = `
        SELECT 
          cl.id, 
          cl.title, 
          cl.description, 
          cl.videourl as "videoUrl", 
          cl.thumbnailurl as "thumbnailUrl",
          cl.duration, 
          cl.order, 
          cl.ispremium as "isPremium"
        FROM 
          "courseLessons" cl
        WHERE 
          cl."moduleId" = $1
        ORDER BY 
          cl.order ASC
      `;
      
      const lessonsResult = await db.execute(lessonsQuery, [module.id]);
      module.lessons = lessonsResult.rows;
    }
    
    // Combinar os resultados
    const course = result.rows[0];
    course.modules = modules;
    
    console.log(`[GET /course/${courseId}] Curso encontrado com ${modules.length} módulos`);
    
    return res.json(course);
  } catch (error) {
    console.error(`[GET /course/${req.params.id}] Erro ao buscar curso:`, error);
    return res.status(500).json({ message: 'Erro ao buscar curso', error: String(error) });
  }
});

// Criar um novo curso
router.post('/', async (req, res) => {
  try {
    console.log('[POST /course] Criando novo curso com dados:', req.body);
    
    const { title, description, thumbnailUrl, featuredImage, level, status, isPublished, isPremium } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'O título do curso é obrigatório' });
    }
    
    // Inserir o novo curso usando SQL direto para evitar problemas de esquema
    const query = `
      INSERT INTO courses (
        title, 
        description, 
        "featuredImage", /* Usando a coluna featuredImage correta */
        "featuredImage", /* Usando featuredImage como thumbnailUrl */
        level, 
        status, 
        "isPublished", 
        "isPremium", 
        "createdBy"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING 
        id, 
        title, 
        description, 
        "featuredImage" as "thumbnailUrl", /* Usando featuredImage como thumbnailUrl */ 
        "featuredImage", 
        level, 
        status, 
        "isPublished", 
        "isPremium", 
        "createdAt", 
        "updatedAt"
    `;
    
    const levelValue = level || 'iniciante';
    const statusValue = status || 'active';
    const isPublishedValue = isPublished !== undefined ? isPublished : true;
    const isPremiumValue = isPremium !== undefined ? isPremium : false;
    
    const result = await db.execute(
      query, 
      [
        title, 
        description || '', 
        thumbnailUrl || null, 
        featuredImage || null, 
        levelValue, 
        statusValue, 
        isPublishedValue, 
        isPremiumValue, 
        req.user?.id || null
      ]
    );
    
    const newCourse = result.rows[0];
    
    console.log('[POST /course] Curso criado com sucesso:', newCourse);
    
    return res.status(201).json(newCourse);
  } catch (error) {
    console.error('[POST /course] Erro ao criar curso:', error);
    return res.status(500).json({ message: 'Erro ao criar curso', error: String(error) });
  }
});

// Atualizar um curso
router.put('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso inválido' });
    }
    
    console.log(`[PUT /course/${courseId}] Atualizando curso com dados:`, req.body);
    
    // Verificar se o curso existe
    const checkQuery = `SELECT id FROM courses WHERE id = $1`;
    const checkResult = await db.execute(checkQuery, [courseId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    // Construir a query de atualização
    let updateQuery = 'UPDATE courses SET "updatedAt" = NOW()';
    const params = [];
    let paramIndex = 1;
    
    const fields = [
      'title', 'description', 'thumbnailUrl', 'featuredImage', 
      'level', 'status', 'isPublished', 'isPremium'
    ];
    
    // Mapeamento correto dos campos
    const dbFields = {
      'thumbnailUrl': '"featuredImage"', // Usar featuredImage para thumbnailUrl
      'featuredImage': '"featuredImage"',
      'isPublished': '"isPublished"',
      'isPremium': '"isPremium"'
    };
    
    // Flag para verificar se algum campo foi atualizado
    let hasUpdates = false;
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbField = dbFields[field] || field.toLowerCase();
        updateQuery += `, ${dbField} = $${paramIndex}`;
        params.push(req.body[field]);
        paramIndex++;
        hasUpdates = true;
      }
    });
    
    // Adicionar o ID do curso aos parâmetros
    updateQuery += ' WHERE id = $' + paramIndex;
    params.push(courseId);
    
    // Se não houver atualizações, adicionamos pelo menos um campo para evitar erro
    if (!hasUpdates) {
      updateQuery = 'UPDATE courses SET "updatedAt" = NOW() WHERE id = $1';
      params.length = 0; // Limpar parâmetros
      params.push(courseId);
    }
    
    // Query para retornar os dados atualizados
    updateQuery += ` RETURNING id, title, description, "featuredImage" as "thumbnailUrl", "featuredImage", 
                     level, status, "isPublished", "isPremium", 
                     "createdAt", "updatedAt"`;
    
    console.log(`[PUT /course/${courseId}] Query de atualização:`, updateQuery);
    console.log(`[PUT /course/${courseId}] Parâmetros:`, params);
    
    const result = await db.execute(updateQuery, params);
    const updatedCourse = result.rows[0];
    
    console.log(`[PUT /course/${courseId}] Curso atualizado com sucesso:`, updatedCourse);
    
    return res.json(updatedCourse);
  } catch (error) {
    console.error(`[PUT /course/${req.params.id}] Erro ao atualizar curso:`, error);
    return res.status(500).json({ message: 'Erro ao atualizar curso', error: String(error) });
  }
});

// Excluir um curso
router.delete('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'ID de curso inválido' });
    }
    
    console.log(`[DELETE /course/${courseId}] Verificando dependências antes de excluir`);
    
    // Verificar se existem módulos relacionados
    const checkModulesQuery = `SELECT COUNT(*) as count FROM "courseModules" WHERE "courseId" = $1`;
    const modulesResult = await db.execute(checkModulesQuery, [courseId]);
    const moduleCount = parseInt(modulesResult.rows[0].count);
    
    if (moduleCount > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir este curso pois existem módulos associados a ele. Exclua os módulos primeiro.',
        moduleCount
      });
    }
    
    // Excluir o curso
    const deleteQuery = `DELETE FROM courses WHERE id = $1 RETURNING id`;
    const result = await db.execute(deleteQuery, [courseId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    console.log(`[DELETE /course/${courseId}] Curso excluído com sucesso`);
    
    return res.json({ message: 'Curso excluído com sucesso', id: courseId });
  } catch (error) {
    console.error(`[DELETE /course/${req.params.id}] Erro ao excluir curso:`, error);
    return res.status(500).json({ message: 'Erro ao excluir curso', error: String(error) });
  }
});

export default router;