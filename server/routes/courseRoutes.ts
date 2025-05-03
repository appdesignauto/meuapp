import { Router } from "express";
import { courseService } from "../services/courseService";
import { isAuthenticated, isAdmin, isDesignerOrAdmin } from "../middleware/auth";
import { z } from "zod";
import { 
  insertCourseModuleSchema, 
  insertCourseLessonSchema, 
  insertCourseProgressSchema,
  insertCourseRatingSchema
} from "@shared/schema";
import multer from "multer";
import { supabaseStorageService } from "../services/supabase-storage";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validadores
const createModuleValidator = insertCourseModuleSchema.extend({
  level: z.enum(["iniciante", "intermediario", "avancado"]),
  order: z.number().int().positive()
});

const updateModuleValidator = createModuleValidator.partial();

const createLessonValidator = insertCourseLessonSchema.extend({
  order: z.number().int().positive(),
  videoProvider: z.enum(["youtube", "vimeo", "vturb", "panda"])
});

const updateLessonValidator = createLessonValidator.partial();

const updateProgressValidator = z.object({
  progress: z.number().int().min(0).max(100).optional(),
  isCompleted: z.boolean().optional(),
  notes: z.string().optional().nullable()
});

const ratingValidator = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable()
});

// Utility para verificar acesso premium
const checkPremiumAccess = async (req: any, moduleOrLesson: { isPremium: boolean }) => {
  // Se o conteúdo não é premium, qualquer um pode acessar
  if (!moduleOrLesson.isPremium) {
    return true;
  }
  
  // Se o usuário não está logado, não pode acessar conteúdo premium
  if (!req.isAuthenticated()) {
    return false;
  }
  
  // Verifica se o usuário tem acesso premium
  return await courseService.userHasPremiumAccess(req.user.id);
};

// ===== Rotas Públicas =====

// Listar todos os módulos
router.get("/modules", async (req, res) => {
  try {
    const includePremium = req.isAuthenticated() && await courseService.userHasPremiumAccess(req.user.id);
    const modules = await courseService.getModules(includePremium);
    res.json(modules);
  } catch (error) {
    console.error("Erro ao listar módulos:", error);
    res.status(500).json({ message: "Erro ao listar módulos" });
  }
});

// Obter módulo por ID
router.get("/modules/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const includePremium = req.isAuthenticated() && await courseService.userHasPremiumAccess(req.user.id);
    const module = await courseService.getModuleById(id, includePremium);
    
    if (!module) {
      return res.status(404).json({ message: "Módulo não encontrado" });
    }
    
    if (module.isPremium && !includePremium) {
      return res.status(403).json({ message: "Este módulo é exclusivo para usuários premium" });
    }
    
    res.json(module);
  } catch (error) {
    console.error(`Erro ao buscar módulo ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao buscar módulo" });
  }
});

// Listar aulas de um módulo
router.get("/modules/:id/lessons", async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    const includePremium = req.isAuthenticated() && await courseService.userHasPremiumAccess(req.user.id);
    
    // Primeiro verificamos se o módulo existe e se o usuário pode acessá-lo
    const module = await courseService.getModuleById(moduleId, includePremium);
    
    if (!module) {
      return res.status(404).json({ message: "Módulo não encontrado" });
    }
    
    if (module.isPremium && !includePremium) {
      return res.status(403).json({ message: "Este módulo é exclusivo para usuários premium" });
    }
    
    const lessons = await courseService.getLessonsByModuleId(moduleId, includePremium);
    res.json(lessons);
  } catch (error) {
    console.error(`Erro ao listar aulas do módulo ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao listar aulas" });
  }
});

// Obter aula por ID
router.get("/lessons/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const includePremium = req.isAuthenticated() && await courseService.userHasPremiumAccess(req.user.id);
    const lesson = await courseService.getLessonById(id, includePremium);
    
    if (!lesson) {
      return res.status(404).json({ message: "Aula não encontrada" });
    }
    
    if (lesson.isPremium && !includePremium) {
      return res.status(403).json({ message: "Esta aula é exclusiva para usuários premium" });
    }
    
    res.json(lesson);
  } catch (error) {
    console.error(`Erro ao buscar aula ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao buscar aula" });
  }
});

// Listar avaliações de uma aula
router.get("/lessons/:id/ratings", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const ratings = await courseService.getLessonRatings(lessonId);
    res.json(ratings);
  } catch (error) {
    console.error(`Erro ao listar avaliações da aula ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao listar avaliações" });
  }
});

// ===== Rotas Autenticadas =====

// Obter progresso do usuário em uma aula
router.get("/lessons/:id/progress", isAuthenticated, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const progress = await courseService.getUserProgress(userId, lessonId);
    res.json(progress || { progress: 0, isCompleted: false });
  } catch (error) {
    console.error(`Erro ao buscar progresso na aula ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao buscar progresso" });
  }
});

// Obter progresso do usuário em um módulo completo (todas as aulas)
router.get("/modules/:id/progress", isAuthenticated, async (req, res) => {
  try {
    const moduleId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const progressData = await courseService.getAllUserProgressForModule(userId, moduleId);
    res.json(progressData);
  } catch (error) {
    console.error(`Erro ao buscar progresso do módulo ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao buscar progresso do módulo" });
  }
});

// Atualizar progresso do usuário em uma aula
router.put("/lessons/:id/progress", isAuthenticated, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Validação do corpo da requisição
    const validationResult = updateProgressValidator.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: validationResult.error.errors });
    }
    
    const progress = await courseService.updateUserProgress(userId, lessonId, validationResult.data);
    res.json(progress);
  } catch (error) {
    console.error(`Erro ao atualizar progresso na aula ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao atualizar progresso" });
  }
});

// Avaliar uma aula
router.post("/lessons/:id/rate", isAuthenticated, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Validação do corpo da requisição
    const validationResult = ratingValidator.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: validationResult.error.errors });
    }
    
    const rating = await courseService.rateLesson(
      userId, 
      lessonId, 
      validationResult.data.rating, 
      validationResult.data.comment
    );
    
    res.json(rating);
  } catch (error) {
    console.error(`Erro ao avaliar aula ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao avaliar aula" });
  }
});

// Remover avaliação de uma aula
router.delete("/lessons/:id/rate", isAuthenticated, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const success = await courseService.deleteRating(userId, lessonId);
    
    if (!success) {
      return res.status(404).json({ message: "Avaliação não encontrada" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Erro ao remover avaliação da aula ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao remover avaliação" });
  }
});

// ===== Rotas de Administração =====

// Criar módulo
router.post("/modules", isDesignerOrAdmin, upload.single("thumbnail"), async (req, res) => {
  try {
    // Validar dados do módulo
    const moduleData = JSON.parse(req.body.data || "{}");
    const validationResult = createModuleValidator.safeParse(moduleData);
    
    if (!validationResult.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: validationResult.error.errors });
    }
    
    // Se houver thumbnail, faz upload
    let thumbnailUrl = moduleData.thumbnailUrl;
    
    if (req.file) {
      // Upload do thumbnail para o Supabase
      const options = {
        width: 800,
        height: undefined,
        quality: 85,
        format: "webp" as const
      };
      
      const uploadResult = await supabaseStorageService.uploadImage(
        req.file,
        options,
        "courses",
        req.user.id
      );
      
      thumbnailUrl = uploadResult.url;
    }
    
    // Cria o módulo com a URL da thumbnail
    const module = await courseService.createModule({
      ...validationResult.data,
      thumbnailUrl,
      createdBy: req.user.id
    });
    
    res.status(201).json(module);
  } catch (error) {
    console.error("Erro ao criar módulo:", error);
    res.status(500).json({ message: "Erro ao criar módulo" });
  }
});

// Atualizar módulo
router.put("/modules/:id", isDesignerOrAdmin, upload.single("thumbnail"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Buscar módulo para verificar permissão
    const existingModule = await courseService.getModuleById(id, true);
    
    if (!existingModule) {
      return res.status(404).json({ message: "Módulo não encontrado" });
    }
    
    // Apenas admin pode editar conteúdo de outros usuários
    if (existingModule.createdBy !== req.user.id && req.user.nivelacesso !== "admin") {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    // Validar dados do módulo
    const moduleData = JSON.parse(req.body.data || "{}");
    const validationResult = updateModuleValidator.safeParse(moduleData);
    
    if (!validationResult.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: validationResult.error.errors });
    }
    
    // Se houver thumbnail, faz upload
    let thumbnailUrl = moduleData.thumbnailUrl;
    
    if (req.file) {
      // Upload do thumbnail para o Supabase
      const options = {
        width: 800,
        height: undefined,
        quality: 85,
        format: "webp" as const
      };
      
      const uploadResult = await supabaseStorageService.uploadImage(
        req.file,
        options,
        "courses",
        req.user.id
      );
      
      thumbnailUrl = uploadResult.url;
    }
    
    // Atualiza o módulo
    const updatedModule = await courseService.updateModule(id, {
      ...validationResult.data,
      ...(thumbnailUrl ? { thumbnailUrl } : {})
    });
    
    res.json(updatedModule);
  } catch (error) {
    console.error(`Erro ao atualizar módulo ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao atualizar módulo" });
  }
});

// Excluir módulo
router.delete("/modules/:id", isDesignerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Buscar módulo para verificar permissão
    const existingModule = await courseService.getModuleById(id, true);
    
    if (!existingModule) {
      return res.status(404).json({ message: "Módulo não encontrado" });
    }
    
    // Apenas admin pode excluir conteúdo de outros usuários
    if (existingModule.createdBy !== req.user.id && req.user.nivelacesso !== "admin") {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const success = await courseService.deleteModule(id);
    
    if (!success) {
      return res.status(404).json({ message: "Módulo não encontrado" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Erro ao excluir módulo ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao excluir módulo" });
  }
});

// Criar aula
router.post("/modules/:moduleId/lessons", isDesignerOrAdmin, upload.single("thumbnail"), async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    
    // Verificar se o módulo existe
    const module = await courseService.getModuleById(moduleId, true);
    
    if (!module) {
      return res.status(404).json({ message: "Módulo não encontrado" });
    }
    
    // Apenas admin ou criador do módulo pode adicionar aulas
    if (module.createdBy !== req.user.id && req.user.nivelacesso !== "admin") {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    // Validar dados da aula
    const lessonData = JSON.parse(req.body.data || "{}");
    const validationResult = createLessonValidator.safeParse(lessonData);
    
    if (!validationResult.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: validationResult.error.errors });
    }
    
    // Se houver thumbnail, faz upload
    let thumbnailUrl = lessonData.thumbnailUrl;
    
    if (req.file) {
      // Upload do thumbnail para o Supabase
      const options = {
        width: 800,
        height: 450, // 16:9
        quality: 85,
        format: "webp" as const
      };
      
      const uploadResult = await supabaseStorageService.uploadImage(
        req.file,
        options,
        "courses",
        req.user.id
      );
      
      thumbnailUrl = uploadResult.url;
    }
    
    // Cria a aula
    const lesson = await courseService.createLesson({
      ...validationResult.data,
      moduleId,
      thumbnailUrl,
      createdBy: req.user.id
    });
    
    res.status(201).json(lesson);
  } catch (error) {
    console.error(`Erro ao criar aula no módulo ${req.params.moduleId}:`, error);
    res.status(500).json({ message: "Erro ao criar aula" });
  }
});

// Atualizar aula
router.put("/lessons/:id", isDesignerOrAdmin, upload.single("thumbnail"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Buscar aula para verificar permissão
    const existingLesson = await courseService.getLessonById(id, true);
    
    if (!existingLesson) {
      return res.status(404).json({ message: "Aula não encontrada" });
    }
    
    // Apenas admin pode editar conteúdo de outros usuários
    if (existingLesson.createdBy !== req.user.id && req.user.nivelacesso !== "admin") {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    // Validar dados da aula
    const lessonData = JSON.parse(req.body.data || "{}");
    const validationResult = updateLessonValidator.safeParse(lessonData);
    
    if (!validationResult.success) {
      return res.status(400).json({ message: "Dados inválidos", errors: validationResult.error.errors });
    }
    
    // Se houver thumbnail, faz upload
    let thumbnailUrl = lessonData.thumbnailUrl;
    
    if (req.file) {
      // Upload do thumbnail para o Supabase
      const options = {
        width: 800,
        height: 450, // 16:9
        quality: 85,
        format: "webp" as const
      };
      
      const uploadResult = await supabaseStorageService.uploadImage(
        req.file,
        options,
        "courses",
        req.user.id
      );
      
      thumbnailUrl = uploadResult.url;
    }
    
    // Atualiza a aula
    const updatedLesson = await courseService.updateLesson(id, {
      ...validationResult.data,
      ...(thumbnailUrl ? { thumbnailUrl } : {})
    });
    
    res.json(updatedLesson);
  } catch (error) {
    console.error(`Erro ao atualizar aula ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao atualizar aula" });
  }
});

// Excluir aula
router.delete("/lessons/:id", isDesignerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Buscar aula para verificar permissão
    const existingLesson = await courseService.getLessonById(id, true);
    
    if (!existingLesson) {
      return res.status(404).json({ message: "Aula não encontrada" });
    }
    
    // Apenas admin pode excluir conteúdo de outros usuários
    if (existingLesson.createdBy !== req.user.id && req.user.nivelacesso !== "admin") {
      return res.status(403).json({ message: "Permissão negada" });
    }
    
    const success = await courseService.deleteLesson(id);
    
    if (!success) {
      return res.status(404).json({ message: "Aula não encontrada" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Erro ao excluir aula ${req.params.id}:`, error);
    res.status(500).json({ message: "Erro ao excluir aula" });
  }
});

export default router;