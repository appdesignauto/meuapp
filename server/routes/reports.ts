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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Lista de tipos MIME permitidos
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use JPG, PNG, WEBP ou PDF'));
    }
  }
});

// Esquema para validação do corpo da requisição para criação de denúncia
const createReportSchema = insertReportSchema.extend({
  typeId: z.number({ required_error: "O tipo de denúncia é obrigatório" }),
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  url: z.string().url({ message: "URL inválida" }).optional().or(z.literal('')),
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
// Endpoint principal para obter tipos de denúncias
router.get('/types', async (req, res) => {
  try {
    const reportTypes = await storage.getReportTypes();
    
    // Adiciona fallback para caso não existam tipos no banco
    if (!reportTypes || reportTypes.length === 0) {
      const defaultTypes = [
        { id: 1, name: 'Plágio', description: 'Conteúdo copiado sem autorização ou crédito' },
        { id: 2, name: 'Conteúdo impróprio', description: 'Material ofensivo ou inadequado' },
        { id: 3, name: 'Erro técnico', description: 'Problemas de funcionamento da plataforma' }
      ];
      return res.status(200).json(defaultTypes);
    }
    
    return res.status(200).json(reportTypes);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

// Endpoint adicional específico para JSON (garantia de receber JSON)
router.get('/types/json', async (req, res) => {
  try {
    // Força o Content-Type para application/json
    res.setHeader('Content-Type', 'application/json');
    
    const reportTypes = await storage.getReportTypes();
    
    // Adiciona fallback para caso não existam tipos no banco
    if (!reportTypes || reportTypes.length === 0) {
      const defaultTypes = [
        { id: 1, name: 'Plágio', description: 'Conteúdo copiado sem autorização ou crédito' },
        { id: 2, name: 'Conteúdo impróprio', description: 'Material ofensivo ou inadequado' },
        { id: 3, name: 'Erro técnico', description: 'Problemas de funcionamento da plataforma' }
      ];
      return res.status(200).json(defaultTypes);
    }
    
    return res.status(200).json(reportTypes);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

// Endpoint adicional para obter os dados diretamente sem passar pelo Express Router
router.get('/types-raw', async (req, res) => {
  try {
    // Configurar cabeçalhos para forçar entrega como JSON puro
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Obter dados
    const reportTypes = await storage.getReportTypes();
    
    // Adiciona fallback para caso não existam tipos no banco
    let data = reportTypes;
    if (!reportTypes || reportTypes.length === 0) {
      data = [
        { id: 1, name: 'Plágio', description: 'Conteúdo copiado sem autorização ou crédito' },
        { id: 2, name: 'Conteúdo impróprio', description: 'Material ofensivo ou inadequado' },
        { id: 3, name: 'Erro técnico', description: 'Problemas de funcionamento da plataforma' }
      ];
    }
    
    // Enviar diretamente como texto sem passar pelo express.json()
    const jsonString = JSON.stringify(data);
    return res.status(200).send(jsonString);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).send(JSON.stringify({ message: 'Erro ao buscar tipos de denúncias' }));
  }
});

/**
 * Criar uma nova denúncia
 * POST /api/reports
 * Aberto para todos (incluindo anônimos)
 */
router.post('/', upload.single('evidence'), async (req, res) => {
  try {
    console.log('Recebendo denúncia:', req.body);
    // Converter typeId para número (vem como string do formulário)
    if (req.body.typeId) {
      req.body.typeId = parseInt(req.body.typeId);
    }
    
    // Validar corpo da requisição
    const validatedData = createReportSchema.parse(req.body);
    
    // Adicionar o ID do usuário logado (se disponível)
    const userId = req.isAuthenticated() ? req.user?.id : null;
    
    // Adicionar o caminho do arquivo de evidência, se houver
    let evidence = null;
    if (req.file) {
      // O arquivo está disponível em req.file graças ao multer
      evidence = req.file.path;
    }
    
    console.log('Dados validados:', validatedData);
    
    // Criar a denúncia com os campos permitidos pelo schema do banco
    const reportData = {
      ...validatedData,
      userId,
      evidence,
      reportTypeId: parseInt(req.body.typeId) // Garantir que temos reportTypeId definido
    };
    
    console.log('Dados finais para criação da denúncia:', reportData);
    
    // Criar a denúncia
    const report = await storage.createReport(reportData);
    
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
router.get('/', isAdmin, async (req, res) => {
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
router.get('/:id', isAdmin, async (req, res) => {
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
router.put('/:id', isAdmin, async (req, res) => {
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
      respondedBy: req.user?.id, // ID do administrador que respondeu
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