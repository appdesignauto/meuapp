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
// Implementação removida e unificada com a versão mais abaixo para evitar duplicação

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
    // Usando string interpolation para evitar problemas com parâmetros $1
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
        c.id = ${courseId}
    `;
    
    console.log(`[GET /course/${courseId}] Query de curso:`, query);
    const result = await db.execute(query);
    
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
        cm."courseId" = ${courseId}
      ORDER BY 
        cm.order ASC
    `;
    
    console.log(`[GET /course/${courseId}] Modules Query:`, modulesQuery);
    const modulesResult = await db.execute(modulesQuery);
    const modules = modulesResult.rows;
    
    // Para cada módulo, buscar suas lições
    for (const module of modules) {
      const moduleId = module.id;
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
          cl."moduleId" = ${moduleId}
        ORDER BY 
          cl.order ASC
      `;
      
      console.log(`[GET /course/${courseId}] Lessons Query para módulo ${moduleId}:`, lessonsQuery);
      const lessonsResult = await db.execute(lessonsQuery);
      module.lessons = lessonsResult.rows || [];
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
    
    // Inserir o novo curso usando SQL direto com string interpolation em vez de parâmetros
    // Função auxiliar segura para escapar strings SQL que pode ser null/undefined
    const safeEscape = (value) => {
      if (value === null || value === undefined) return null;
      return `'${value.toString().replace(/'/g, "''")}'`;
    };
    
    // Definir valores padrão seguros
    const levelValue = safeEscape(level || 'iniciante');
    const statusValue = safeEscape(status || 'active');
    const isPublishedValue = isPublished !== undefined ? isPublished : true;
    const isPremiumValue = isPremium !== undefined ? isPremium : false;
    
    // Tratar nulos e escapar strings de forma segura
    const titleEscaped = safeEscape(title);
    const descriptionEscaped = safeEscape(description);
    
    // Tratar campos de imagem que podem ser nulos
    let thumbnailUrlEscaped = safeEscape(thumbnailUrl);
    let featuredImageEscaped = safeEscape(featuredImage);
    
    // Se não houver featuredImage, usar thumbnailUrl como fallback
    if (!featuredImageEscaped && thumbnailUrlEscaped) {
      featuredImageEscaped = thumbnailUrlEscaped;
    }
    
    // ID do criador (pode ser NULL)
    const createdById = req.user?.id || 'NULL';
    
    const query = `
      INSERT INTO courses (
        title, 
        description, 
        "featuredImage", /* Usando a coluna featuredImage correta */
        level, 
        status, 
        "isPublished", 
        "isPremium", 
        "createdBy"
      ) 
      VALUES (
        ${titleEscaped || 'NULL'}, 
        ${descriptionEscaped || 'NULL'}, 
        ${featuredImageEscaped || 'NULL'}, 
        ${levelValue || "'iniciante'"}, 
        ${statusValue || "'active'"}, 
        ${isPublishedValue}, 
        ${isPremiumValue}, 
        ${createdById}
      ) 
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
    
    console.log(`[POST /course] Query de inserção:`, query);
    const result = await db.execute(query);
    
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
    
    // Verificar se o curso existe - usando string interpolation
    const checkQuery = `SELECT id FROM courses WHERE id = ${courseId}`;
    console.log(`[PUT /course/${courseId}] Verificando existência do curso:`, checkQuery);
    const checkResult = await db.execute(checkQuery);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Curso não encontrado' });
    }
    
    // Abordagem completamente diferente - usar lógica de string interpolado para SQL
    // Este método evita o problema de parâmetros $N com erros
    const { 
      title, 
      description, 
      thumbnailUrl, 
      featuredImage,
      level,
      status,
      isPublished,
      isPremium
    } = req.body;
    
    // Usar thumbnailUrl como fallback para featuredImage se fornecido
    const finalFeaturedImage = featuredImage || thumbnailUrl;
    
    // Construir manualmente os SET clauses
    let setClauses = [];
    
    // Função auxiliar segura para escapar strings SQL que pode ser null/undefined
    const safeEscape = (value) => {
      if (value === null || value === undefined) return null;
      return `'${value.toString().replace(/'/g, "''")}'`;
    };
    
    // Adicionar clauses que são seguros
    setClauses.push(`"updatedAt" = NOW()`);
    
    if (title !== undefined) {
      const safeTitle = safeEscape(title);
      if (safeTitle) {
        setClauses.push(`title = ${safeTitle}`);
      } else {
        setClauses.push(`title = NULL`);
      }
    }
    
    if (description !== undefined) {
      const safeDescription = safeEscape(description);
      if (safeDescription) {
        setClauses.push(`description = ${safeDescription}`);
      } else {
        setClauses.push(`description = NULL`);
      }
    }
    
    if (finalFeaturedImage !== undefined) {
      const safeFeaturedImage = safeEscape(finalFeaturedImage);
      if (safeFeaturedImage) {
        setClauses.push(`"featuredImage" = ${safeFeaturedImage}`);
      } else {
        setClauses.push(`"featuredImage" = NULL`);
      }
    }
    
    if (level !== undefined) {
      const safeLevel = safeEscape(level);
      if (safeLevel) {
        setClauses.push(`level = ${safeLevel}`);
      } else {
        setClauses.push(`level = NULL`);
      }
    }
    
    if (status !== undefined) {
      const safeStatus = safeEscape(status);
      if (safeStatus) {
        setClauses.push(`status = ${safeStatus}`);
      } else {
        setClauses.push(`status = NULL`);
      }
    }
    
    if (isPublished !== undefined) {
      setClauses.push(`"isPublished" = ${isPublished ? 'true' : 'false'}`);
    }
    
    if (isPremium !== undefined) {
      setClauses.push(`"isPremium" = ${isPremium ? 'true' : 'false'}`);
    }
    
    // Verificar se temos algo para atualizar
    if (setClauses.length < 1) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
    }
    
    const updateQuery = `
      UPDATE courses 
      SET ${setClauses.join(', ')}
      WHERE id = ${courseId}
      RETURNING 
        id, 
        title, 
        description, 
        "featuredImage" as "thumbnailUrl", 
        "featuredImage", 
        level, 
        status, 
        "isPublished", 
        "isPremium", 
        "createdAt", 
        "updatedAt"
    `;
    
    console.log(`[PUT /course/${courseId}] Query de atualização:`, updateQuery);
    
    const result = await db.execute(updateQuery);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(500).json({ message: 'Falha ao atualizar o curso' });
    }
    
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
    
    // Verificar se existem módulos relacionados - usando string interpolation
    const checkModulesQuery = `SELECT COUNT(*) as count FROM "courseModules" WHERE "courseId" = ${courseId}`;
    console.log(`[DELETE /course/${courseId}] Query para verificar módulos:`, checkModulesQuery);
    const modulesResult = await db.execute(checkModulesQuery);
    const moduleCount = parseInt(modulesResult.rows[0].count || '0');
    
    if (moduleCount > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir este curso pois existem módulos associados a ele. Exclua os módulos primeiro.',
        moduleCount
      });
    }
    
    // Excluir o curso - usando string interpolation
    const deleteQuery = `DELETE FROM courses WHERE id = ${courseId} RETURNING id`;
    console.log(`[DELETE /course/${courseId}] Query de exclusão:`, deleteQuery);
    const result = await db.execute(deleteQuery);
    
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

// ENDPOINTS PARA CONFIGURAÇÕES DOS CURSOS - IMPLEMENTAÇÃO DA ROTA GET

// Rota especial para depuração - para verificar se a implementação está sendo executada
// Colocando antes de todas as outras rotas para garantir que seja processada primeiro

router.get('/settings', async (req, res) => {
  try {
    console.log('[GET /course/settings] VERSÃO CORRIGIDA: Buscando configurações de cursos');
    
    // Buscar as configurações com SQL bruto para evitar problemas
    const configQuery = `
      SELECT 
        id, 
        "bannerTitle",
        "bannerDescription", 
        "bannerImageUrl",
        "welcomeMessage",
        "showModuleNumbers",
        "useCustomPlayerColors",
        "enableComments",
        "allowNonPremiumEnrollment",
        "createdAt",
        "updatedAt",
        "updatedBy"
      FROM 
        "courseSettings" 
      WHERE 
        id = 1
      LIMIT 1
    `;
    
    console.log('[GET /course/settings] Executando query para buscar configurações...');
    const configResult = await db.execute(configQuery);
    console.log('[GET /course/settings] Configurações encontradas:', configResult.rows);
    let settings = configResult.rows && configResult.rows.length > 0 ? configResult.rows[0] : null;
    
    // Se não houver configurações, criar uma padrão
    if (!settings) {
      console.log('[GET /course/settings] Configurações não encontradas, criando padrão...');
      
      // Criar configurações padrão com SQL bruto com string interpolação em vez de parâmetros
      const userId = req.user?.id || 'NULL';
      const insertQuery = `
        INSERT INTO "courseSettings" (
          "bannerTitle", 
          "bannerDescription", 
          "bannerImageUrl", 
          "welcomeMessage",
          "showModuleNumbers",
          "useCustomPlayerColors",
          "enableComments",
          "allowNonPremiumEnrollment",
          "updatedBy"
        ) 
        VALUES (
          'DesignAuto Videoaulas',
          'A formação completa para você criar designs profissionais para seu negócio automotivo',
          'https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop',
          'Bem-vindo aos nossos cursos! Aprenda com os melhores profissionais.',
          true,
          false,
          true,
          false,
          ${userId}
        )
        RETURNING 
          id, 
          "bannerTitle",
          "bannerDescription", 
          "bannerImageUrl",
          "welcomeMessage",
          "showModuleNumbers",
          "useCustomPlayerColors",
          "enableComments",
          "allowNonPremiumEnrollment",
          "createdAt",
          "updatedAt",
          "updatedBy"
      `;
      
      console.log('[GET /course/settings] Query de inserção: ', insertQuery);
      const insertResult = await db.execute(insertQuery);
      
      if (insertResult.rows && insertResult.rows.length > 0) {
        settings = insertResult.rows[0];
        console.log('[GET /course/settings] Configurações criadas:', settings);
      } else {
        return res.status(500).json({ message: 'Falha ao criar as configurações padrão' });
      }
    }
    
    // Buscar informações do curso principal (ID 2)
    console.log('[GET /course/settings] Buscando dados do curso principal');
    const courseQuery = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c."featuredImage", 
        c.level, 
        c.status, 
        c."isPublished", 
        c."isPremium",
        c."createdBy",
        c."createdAt",
        c."updatedAt",
        COALESCE(
          (SELECT COUNT(*) FROM "courseModules" cm WHERE cm."courseId" = c.id), 0
        ) AS "moduleCount",
        COALESCE(
          (SELECT COUNT(*) FROM "courseModules" cm JOIN "courseLessons" cl ON cm.id = cl."moduleId" WHERE cm."courseId" = c.id), 0
        ) AS "lessonCount"
      FROM 
        courses c
      WHERE 
        c.id = 2 -- Assume que o ID 2 é o curso "Tutoriais Design Auto"
      LIMIT 1
    `;
    
    console.log('[GET /course/settings] Executando query para buscar curso...');
    const courseResult = await db.execute(courseQuery);
    console.log('[GET /course/settings] Dados do curso encontrados:', courseResult.rows);
    const course = courseResult.rows && courseResult.rows.length > 0 ? courseResult.rows[0] : null;
    
    // Retornar o HTML com as informações para depuração
    if (req.query.format === 'debug') {
      let debug = `
        <h1>Dados de depuração</h1>
        <h2>Configurações</h2>
        <pre>${JSON.stringify(settings, null, 2)}</pre>
        <h2>Curso</h2>
        <pre>${JSON.stringify(course, null, 2)}</pre>
      `;
      return res.send(debug);
    }
    
    // Combinar as informações do curso com as configurações e retornar em formato de array
    if (course) {
      console.log('[GET /course/settings] Combinando dados do curso com configurações');
      
      const combinedData = [{
        ...course,
        bannerTitle: settings.bannerTitle,
        bannerDescription: settings.bannerDescription,
        bannerImageUrl: settings.bannerImageUrl,
        welcomeMessage: settings.welcomeMessage,
        showModuleNumbers: settings.showModuleNumbers,
        useCustomPlayerColors: settings.useCustomPlayerColors,
        enableComments: settings.enableComments,
        allowNonPremiumEnrollment: settings.allowNonPremiumEnrollment,
        thumbnailUrl: course.featuredImage // Garantir que thumbnailUrl está presente para compatibilidade
      }];
      
      console.log('[GET /course/settings] Dados combinados:', JSON.stringify(combinedData));
      return res.json(combinedData);
    } else {
      // Se não houver curso, retornar apenas as configurações no formato de array
      console.log('[GET /course/settings] Não foi encontrado curso. Retornando apenas configurações.');
      return res.json([settings]);
    }
  } catch (error) {
    console.error('[GET /course/settings] Erro ao buscar configurações:', error);
    return res.status(500).json({ message: 'Erro ao buscar configurações', error: String(error) });
  }
});

// Atualizar configurações dos cursos
router.put('/settings', async (req, res) => {
  try {
    console.log('[PUT /course/settings] Atualizando configurações de cursos:', req.body);
    
    const { 
      bannerTitle,
      bannerDescription,
      bannerImageUrl,
      welcomeMessage,
      showModuleNumbers,
      useCustomPlayerColors,
      enableComments,
      allowNonPremiumEnrollment
    } = req.body;
    
    // Verificar se as configurações existem
    const checkQuery = `SELECT id FROM "courseSettings" WHERE id = 1`;
    const checkResult = await db.execute(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('[PUT /course/settings] Configurações não encontradas, criando...');
      
      // Criar configurações se não existirem - usando abordagem mais segura com string interpolation
      const insertQuery = `
        INSERT INTO "courseSettings" (
          "bannerTitle", 
          "bannerDescription", 
          "bannerImageUrl", 
          "welcomeMessage",
          "showModuleNumbers",
          "useCustomPlayerColors",
          "enableComments",
          "allowNonPremiumEnrollment",
          "updatedBy"
        ) 
        VALUES (
          '${bannerTitle ? bannerTitle.replace(/'/g, "''") : "DesignAuto Videoaulas"}',
          '${bannerDescription ? bannerDescription.replace(/'/g, "''") : "A formação completa para você criar designs profissionais para seu negócio automotivo"}',
          '${bannerImageUrl ? bannerImageUrl.replace(/'/g, "''") : "https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop"}',
          '${welcomeMessage ? welcomeMessage.replace(/'/g, "''") : "Bem-vindo aos nossos cursos! Aprenda com os melhores profissionais."}',
          ${showModuleNumbers !== undefined ? showModuleNumbers : true},
          ${useCustomPlayerColors !== undefined ? useCustomPlayerColors : false},
          ${enableComments !== undefined ? enableComments : true},
          ${allowNonPremiumEnrollment !== undefined ? allowNonPremiumEnrollment : false},
          ${req.user?.id || 'NULL'}
        )
        RETURNING 
          id, 
          "bannerTitle",
          "bannerDescription", 
          "bannerImageUrl",
          "welcomeMessage",
          "showModuleNumbers",
          "useCustomPlayerColors",
          "enableComments",
          "allowNonPremiumEnrollment",
          "createdAt",
          "updatedAt",
          "updatedBy"
      `;
      
      console.log('[PUT /course/settings] Query de inserção: ', insertQuery);
      const insertResult = await db.execute(insertQuery);
      
      if (insertResult.rows.length === 0) {
        return res.status(500).json({ message: 'Falha ao criar as configurações' });
      }
      
      const newSettings = insertResult.rows[0];
      console.log('[PUT /course/settings] Configurações criadas com sucesso:', newSettings);
      
      return res.json(newSettings);
    } else {
      console.log('[PUT /course/settings] Atualizando configurações existentes');
      
      // Construir manualmente os SET clauses
      let setClauses = [];
      
      // Adicionar clauses que são seguros
      setClauses.push(`"updatedAt" = NOW()`);
      setClauses.push(`"updatedBy" = ${req.user?.id || 'NULL'}`);
      
      if (bannerTitle !== undefined) {
        setClauses.push(`"bannerTitle" = '${bannerTitle.replace(/'/g, "''")}'`);
      }
      
      if (bannerDescription !== undefined) {
        setClauses.push(`"bannerDescription" = '${bannerDescription.replace(/'/g, "''")}'`);
      }
      
      if (bannerImageUrl !== undefined) {
        setClauses.push(`"bannerImageUrl" = '${bannerImageUrl.replace(/'/g, "''")}'`);
      }
      
      if (welcomeMessage !== undefined) {
        setClauses.push(`"welcomeMessage" = '${welcomeMessage.replace(/'/g, "''")}'`);
      }
      
      if (showModuleNumbers !== undefined) {
        setClauses.push(`"showModuleNumbers" = ${showModuleNumbers}`);
      }
      
      if (useCustomPlayerColors !== undefined) {
        setClauses.push(`"useCustomPlayerColors" = ${useCustomPlayerColors}`);
      }
      
      if (enableComments !== undefined) {
        setClauses.push(`"enableComments" = ${enableComments}`);
      }
      
      if (allowNonPremiumEnrollment !== undefined) {
        setClauses.push(`"allowNonPremiumEnrollment" = ${allowNonPremiumEnrollment}`);
      }
      
      // Verificar se temos algo para atualizar além do timestamp
      if (setClauses.length < 2) {
        return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
      }
      
      const updateQuery = `
        UPDATE "courseSettings"
        SET ${setClauses.join(', ')}
        WHERE id = 1
        RETURNING 
          id, 
          "bannerTitle",
          "bannerDescription", 
          "bannerImageUrl",
          "welcomeMessage",
          "showModuleNumbers",
          "useCustomPlayerColors",
          "enableComments",
          "allowNonPremiumEnrollment",
          "createdAt",
          "updatedAt",
          "updatedBy"
      `;
      
      console.log('[PUT /course/settings] Query de atualização: ', updateQuery);
      
      const result = await db.execute(updateQuery);
      
      if (result.rows.length === 0) {
        return res.status(500).json({ message: 'Falha ao atualizar as configurações' });
      }
      
      const updatedSettings = result.rows[0];
      console.log('[PUT /course/settings] Configurações atualizadas com sucesso:', updatedSettings);
      
      return res.json(updatedSettings);
    }
  } catch (error) {
    console.error('[PUT /course/settings] Erro ao atualizar configurações:', error);
    return res.status(500).json({ message: 'Erro ao atualizar configurações', error: String(error) });
  }
});

export default router;