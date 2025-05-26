/**
 * NOVO SISTEMA DE REPORTS - VERSÃO LIMPA
 * 
 * Este arquivo substitui completamente todos os endpoints de reports anteriores
 * com uma implementação limpa e funcional.
 */

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';

const router = Router();

/**
 * Buscar estatísticas de reports
 * GET /api/reports/stats
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/reports/stats - Buscando estatísticas REAIS');
    
    const result = await db.execute({
      sql: `
        SELECT 
          status,
          COUNT(*) as count
        FROM reports 
        GROUP BY status
      `,
      args: []
    });
    
    const stats = {
      pending: 0,
      reviewing: 0, 
      resolved: 0,
      rejected: 0,
      total: 0
    };
    
    let total = 0;
    result.rows.forEach((row: any) => {
      const count = parseInt(row.count || '0');
      total += count;
      
      switch(row.status) {
        case 'pendente':
          stats.pending = count;
          break;
        case 'em-analise':
          stats.reviewing = count;
          break;
        case 'resolvido':
          stats.resolved = count;
          break;
        case 'rejeitado':
          stats.rejected = count;
          break;
      }
    });
    
    stats.total = total;
    
    console.log('✅ Estatísticas CORRETAS do banco:', stats);
    
    return res.json({ stats });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
});

/**
 * Buscar tipos de reports
 * GET /api/reports/types
 */
router.get('/types', async (req, res) => {
  try {
    console.log('📋 GET /api/reports/types - Buscando tipos');
    
    const result = await db.execute({
      sql: `
        SELECT id, name, description, "isActive" 
        FROM "reportTypes" 
        WHERE "isActive" = true 
        ORDER BY name
      `,
      args: []
    });
    
    console.log(`✅ ${result.rows.length} tipos encontrados`);
    
    return res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar tipos:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar tipos de denúncias' 
    });
  }
});

/**
 * Listar reports
 * GET /api/reports
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/reports - Listando reports');
    
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const status = req.query.status as string || null;
    
    console.log(`Parâmetros: page=${page}, limit=${limit}, status=${status}`);
    
    const offset = (page - 1) * limit;
    
    // Query para buscar reports
    let baseQuery = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.evidence,
        r.status,
        r."isResolved",
        r."adminResponse",
        r."userId",
        r."reportTypeId",
        r."respondedBy",
        r."respondedAt",
        r."createdAt",
        r."updatedAt"
      FROM reports r
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM reports r';
    let queryParams = [];
    let paramIndex = 1;
    
    if (status) {
      baseQuery += ` WHERE r.status = $${paramIndex}`;
      countQuery += ` WHERE r.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    baseQuery += ` ORDER BY r."createdAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    // Executar consultas
    const [reportsResult, countResult] = await Promise.all([
      db.execute({ sql: baseQuery, args: queryParams }),
      db.execute({ sql: countQuery, args: status ? [status] : [] })
    ]);
    
    const reports = reportsResult.rows as any[];
    const totalCount = (countResult.rows[0] as any)?.total || 0;
    
    console.log(`✅ ${reports.length} reports encontrados de ${totalCount} total`);
    
    // Buscar informações relacionadas para cada report
    const enhancedReports = await Promise.all(
      reports.map(async (report) => {
        // Buscar tipo do report
        let reportType = null;
        if (report.reportTypeId) {
          try {
            const typeResult = await db.execute({
              sql: 'SELECT name FROM "reportTypes" WHERE id = $1',
              args: [report.reportTypeId]
            });
            reportType = typeResult.rows[0] as any;
          } catch (error) {
            console.error(`Erro ao buscar tipo do report ${report.id}:`, error);
          }
        }
        
        // Buscar usuário que fez o report
        let user = null;
        if (report.userId) {
          try {
            const userResult = await db.execute({
              sql: 'SELECT email FROM users WHERE id = $1',
              args: [report.userId]
            });
            user = userResult.rows[0] as any;
          } catch (error) {
            console.error(`Erro ao buscar usuário do report ${report.id}:`, error);
          }
        }
        
        return {
          ...report,
          reportType: reportType?.name || 'Tipo não encontrado',
          userEmail: user?.email || 'Email não encontrado'
        };
      })
    );
    
    return res.json({
      success: true,
      reports: enhancedReports,
      totalCount: parseInt(totalCount),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('❌ Erro ao listar reports:', error);
    return res.status(500).json({ 
      message: 'Erro ao listar denúncias' 
    });
  }
});

/**
 * Criar novo report
 * POST /api/reports
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/reports - Criando novo report');
    
    const createReportSchema = z.object({
      title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
      description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
      reportTypeId: z.number().int().positive("Tipo de denúncia é obrigatório"),
      evidence: z.string().optional(),
      userId: z.number().int().positive("ID do usuário é obrigatório")
    });
    
    const validatedData = createReportSchema.parse(req.body);
    
    const result = await db.execute({
      sql: `
        INSERT INTO reports (
          title, description, "reportTypeId", evidence, "userId", 
          status, "isResolved", "createdAt", "updatedAt"
        ) 
        VALUES ($1, $2, $3, $4, $5, 'pendente', false, NOW(), NOW())
        RETURNING id
      `,
      args: [
        validatedData.title,
        validatedData.description,
        validatedData.reportTypeId,
        validatedData.evidence || null,
        validatedData.userId
      ]
    });
    
    const reportId = (result.rows[0] as any)?.id;
    
    console.log(`✅ Novo report criado com ID: ${reportId}`);
    
    return res.status(201).json({
      success: true,
      message: 'Denúncia criada com sucesso',
      reportId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    
    console.error('❌ Erro ao criar report:', error);
    return res.status(500).json({ 
      message: 'Erro ao criar denúncia' 
    });
  }
});

/**
 * Atualizar status de report
 * PUT /api/reports/:id/respond
 */
router.put('/:id/respond', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    console.log(`🔄 PUT /api/reports/${reportId}/respond - Atualizando report`);
    
    const userId = (req as any).user?.id;
    const userLevel = (req as any).user?.nivelacesso;
    
    if (!userId || !['admin', 'suporte'].includes(userLevel)) {
      return res.status(403).json({ 
        message: 'Acesso negado. Apenas administradores podem responder denúncias.' 
      });
    }
    
    const updateSchema = z.object({
      status: z.enum(['pendente', 'em-analise', 'resolvido', 'rejeitado']),
      adminResponse: z.string().min(5, "A resposta deve ter pelo menos 5 caracteres").optional(),
      isResolved: z.boolean().optional()
    });
    
    const validatedData = updateSchema.parse(req.body);
    
    const result = await db.execute({
      sql: `
        UPDATE reports 
        SET 
          status = $1,
          "adminResponse" = $2,
          "isResolved" = $3,
          "respondedBy" = $4,
          "respondedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE id = $5
        RETURNING id
      `,
      args: [
        validatedData.status,
        validatedData.adminResponse || null,
        validatedData.isResolved || false,
        userId,
        reportId
      ]
    });
    
    if (!result.rows.length) {
      return res.status(404).json({ 
        message: 'Denúncia não encontrada' 
      });
    }
    
    console.log(`✅ Report ${reportId} atualizado com sucesso`);
    
    return res.json({
      success: true,
      message: 'Denúncia atualizada com sucesso'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    
    console.error('❌ Erro ao atualizar report:', error);
    return res.status(500).json({ 
      message: 'Erro ao atualizar denúncia' 
    });
  }
});

export default router;