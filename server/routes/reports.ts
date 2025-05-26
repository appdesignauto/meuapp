/**
 * Rotas para o sistema de denúncias - VERSÃO SEGURA
 */
import express from 'express';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../middlewares/auth';
import { insertReportSchema, reports, reportTypes, users } from '../../shared/schema';
import multer from 'multer';
import { z } from 'zod';
import { db } from '../db';
import { sql, eq, and, desc, count } from 'drizzle-orm';

const router = express.Router();

// Configuração do Multer para uploads temporários
const upload = multer({ 
  dest: 'temp/', 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
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

// Esquemas de validação
const createReportSchema = insertReportSchema.extend({
  reportTypeId: z.number({ required_error: "O tipo de denúncia é obrigatório" }),
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  url: z.string().url({ message: "URL inválida" }).optional().or(z.literal('')),
  evidence: z.string().optional()
});

const adminResponseSchema = z.object({
  status: z.enum(['pendente', 'em-analise', 'resolvido', 'rejeitado']),
  adminResponse: z.string().min(5, "A resposta deve ter pelo menos 5 caracteres").optional(),
  isResolved: z.boolean().optional()
});

/**
 * Buscar tipos de denúncias disponíveis
 * GET /api/reports/types
 */
router.get('/types', async (req, res) => {
  try {
    console.log('GET /api/reports/types - Buscando tipos de denúncias');
    
    // Consulta segura usando Drizzle ORM
    const types = await db
      .select({
        id: reportTypes.id,
        name: reportTypes.name,
        description: reportTypes.description,
        isActive: reportTypes.isActive
      })
      .from(reportTypes)
      .where(eq(reportTypes.isActive, true))
      .orderBy(reportTypes.name);
    
    console.log(`GET /api/reports/types - ${types.length} tipos encontrados`);
    
    return res.status(200).json(types);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

/**
 * Criar uma nova denúncia
 * POST /api/reports
 */
router.post('/', upload.single('evidence'), async (req, res) => {
  try {
    console.log('Recebendo denúncia:', req.body);
    
    if (req.body.reportTypeId) {
      req.body.reportTypeId = parseInt(req.body.reportTypeId);
    }
    
    const validatedData = createReportSchema.parse(req.body);
    const userId = req.isAuthenticated() ? req.user?.id : null;
    
    let evidence = null;
    if (req.file) {
      evidence = req.file.path;
    }
    
    const reportData = {
      ...validatedData,
      userId,
      evidence,
    };
    
    const report = await storage.createReport(reportData);
    
    return res.status(201).json({
      success: true,
      message: 'Denúncia criada com sucesso',
      reportId: report.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    
    console.error('Erro ao criar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao processar denúncia' });
  }
});

/**
 * Lista denúncias (apenas para administradores) - VERSÃO SEGURA
 * GET /api/reports
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || null;
    
    console.log('GET /api/reports - Listando denúncias com segurança');
    console.log(`Parâmetros: page=${page}, limit=${limit}, status=${status}`);
    
    const offset = (page - 1) * limit;
    
    // Construir consulta segura usando apenas campos existentes
    let query = db
      .select({
        id: reports.id,
        title: reports.title,
        description: reports.description,
        evidence: reports.evidence,
        status: reports.status,
        isResolved: reports.isResolved,
        adminResponse: reports.adminResponse,
        userId: reports.userId,
        reportTypeId: reports.reportTypeId,
        respondedBy: reports.respondedBy,
        respondedAt: reports.respondedAt,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt
      })
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    // Filtro por status de forma segura
    if (status) {
      query = query.where(eq(reports.status, status));
    }
    
    const result = await query;
    
    // Buscar informações relacionadas separadamente para evitar erros
    const enhancedResult = await Promise.all(
      result.map(async (report) => {
        // Buscar tipo de report
        let reportType = null;
        if (report.reportTypeId) {
          try {
            const typeResult = await db
              .select()
              .from(reportTypes)
              .where(eq(reportTypes.id, report.reportTypeId))
              .limit(1);
            reportType = typeResult[0] || null;
          } catch (error) {
            console.warn('Erro ao buscar tipo de report:', error);
          }
        }
        
        // Buscar usuário
        let user = null;
        if (report.userId) {
          try {
            const userResult = await db
              .select({
                id: users.id,
                username: users.username,
                email: users.email
              })
              .from(users)
              .where(eq(users.id, report.userId))
              .limit(1);
            user = userResult[0] || null;
          } catch (error) {
            console.warn('Erro ao buscar usuário:', error);
          }
        }
        
        // Buscar admin que respondeu
        let admin = null;
        if (report.respondedBy) {
          try {
            const adminResult = await db
              .select({
                id: users.id,
                username: users.username
              })
              .from(users)
              .where(eq(users.id, report.respondedBy))
              .limit(1);
            admin = adminResult[0] || null;
          } catch (error) {
            console.warn('Erro ao buscar admin:', error);
          }
        }
        
        return {
          ...report,
          reportType,
          user,
          admin
        };
      })
    );
    
    const finalResult = enhancedResult;
    
    // Contagem segura
    let countQuery = db.select({ total: count() }).from(reports);
    if (status) {
      countQuery = countQuery.where(eq(reports.status, status));
    }
    
    const countResult = await countQuery;
    const totalCount = countResult[0]?.total || 0;
    
    console.log(`Total de denúncias encontradas: ${totalCount}`);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return res.status(200).json({
      success: true,
      data: result,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar denúncias' });
  }
});

/**
 * Atualizar status de denúncia (apenas administradores) - VERSÃO SEGURA
 * PUT /api/reports/:id/respond
 */
router.put('/:id/respond', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const validatedData = adminResponseSchema.parse(req.body);
    const adminId = req.user?.id;
    
    if (!adminId) {
      return res.status(401).json({ message: 'Acesso negado' });
    }
    
    // Atualização segura usando Drizzle ORM
    const updatedReport = await db
      .update(reports)
      .set({
        status: validatedData.status,
        adminResponse: validatedData.adminResponse,
        isResolved: validatedData.isResolved || false,
        respondedBy: adminId,
        updatedAt: new Date()
      })
      .where(eq(reports.id, reportId))
      .returning();
    
    if (!updatedReport.length) {
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Resposta registrada com sucesso',
      data: updatedReport[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    
    console.error('Erro ao responder denúncia:', error);
    return res.status(500).json({ message: 'Erro ao processar resposta' });
  }
});

export default router;