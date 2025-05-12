/**
 * Rotas para o sistema de denúncias
 */
import express from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../middlewares/auth';
import { insertReportSchema } from '../../shared/schema';
import multer from 'multer';
import { z } from 'zod';

const router = express.Router();

// Configuração do Multer para uploads temporários
const upload = multer({ 
  dest: 'temp/', 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Esquema para validação do corpo da requisição para criação de denúncia
const createReportSchema = insertReportSchema.extend({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  evidence: z.string().optional()
});

// Esquema para validação da resposta do administrador
const adminResponseSchema = z.object({
  status: z.enum(['pendente', 'em_analise', 'resolvido', 'rejeitado']),
  adminResponse: z.string().min(5, "A resposta deve ter pelo menos 5 caracteres").optional(),
  isResolved: z.boolean().optional()
});

/**
 * Obter todos os tipos de denúncias
 * GET /api/reports/types
 * Público
 */
router.get('/types', async (req, res) => {
  try {
    const reportTypes = await storage.getReportTypes();
    
    return res.status(200).json(reportTypes);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

/**
 * Criar uma nova denúncia
 * POST /api/reports
 * Autenticado
 */
router.post('/', isAuthenticated, upload.none(), async (req, res) => {
  try {
    // Validar corpo da requisição
    const validatedData = createReportSchema.parse(req.body);
    
    // Adicionar o ID do usuário logado (se disponível)
    const userId = req.user?.id || null;
    
    // Criar a denúncia
    const report = await storage.createReport({
      ...validatedData,
      userId
    });
    
    return res.status(201).json({
      message: 'Denúncia enviada com sucesso',
      reportId: report.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error('Erro ao criar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao processar denúncia' });
  }
});

/**
 * Lista denúncias (apenas para administradores)
 * GET /api/reports
 * Admin
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || null;
    
    const reports = await storage.getReports({ page, limit, status });
    const count = await storage.getReportsCount(status);
    
    return res.status(200).json({
      reports,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    return res.status(500).json({ message: 'Erro ao listar denúncias' });
  }
});

/**
 * Obter uma denúncia específica (apenas para administradores)
 * GET /api/reports/:id
 * Admin
 */
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'ID de denúncia inválido' });
    }
    
    const report = await storage.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    return res.status(200).json(report);
  } catch (error) {
    console.error('Erro ao buscar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao buscar denúncia' });
  }
});

/**
 * Responder a uma denúncia (apenas para administradores)
 * PUT /api/reports/:id
 * Admin
 */
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'ID de denúncia inválido' });
    }
    
    // Validar corpo da requisição
    const validatedData = adminResponseSchema.parse(req.body);
    
    // Verificar se a denúncia existe
    const existingReport = await storage.getReportById(reportId);
    if (!existingReport) {
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    // Atualizar a denúncia
    const report = await storage.updateReport(reportId, {
      ...validatedData,
      adminId: req.user?.id, // Usando adminId em vez de respondedBy para corresponder à definição do schema
      respondedAt: new Date()
    });
    
    return res.status(200).json({
      message: 'Denúncia atualizada com sucesso',
      report
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error('Erro ao atualizar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao atualizar denúncia' });
  }
});

export default router;