/**
 * Sistema de Reports - Versão Completamente Funcional
 * Implementação direta usando pool de conexão PostgreSQL
 */

import { Router } from 'express';
import { z } from 'zod';
import { Pool } from 'pg';

const router = Router();

// Configuração do pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Buscar tipos de denúncias disponíveis
 * GET /api/reports/types
 */
router.get('/types', async (req, res) => {
  try {
    console.log('GET /api/reports/types - Buscando tipos de denúncias');
    
    const result = await pool.query(`
      SELECT id, name, description, "isActive" 
      FROM "reportTypes" 
      WHERE "isActive" = true 
      ORDER BY name
    `);
    
    console.log(`${result.rows.length} tipos de denúncia encontrados`);
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar tipos de denúncias:', error);
    return res.status(500).json({ message: 'Erro ao buscar tipos de denúncias' });
  }
});

/**
 * Listar denúncias (apenas para administradores)
 * GET /api/reports
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/reports - Listando denúncias (versão funcional)');
    
    // Validação de parâmetros
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const status = req.query.status as string || null;
    
    console.log(`Parâmetros: page=${page}, limit=${limit}, status=${status}`);
    
    const offset = (page - 1) * limit;
    
    // Query base
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
    let paramCount = 1;
    
    // Filtro por status
    if (status) {
      baseQuery += ` WHERE r.status = $${paramCount}`;
      countQuery += ` WHERE r.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    // Ordenação e paginação
    baseQuery += ` ORDER BY r."createdAt" DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);
    
    // Executar consultas
    const [reportsResult, countResult] = await Promise.all([
      pool.query(baseQuery, queryParams),
      pool.query(countQuery, status ? [status] : [])
    ]);
    
    const reports = reportsResult.rows;
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    
    console.log(`${reports.length} denúncias encontradas de ${totalCount} total`);
    
    // Buscar informações relacionadas para cada report
    const enhancedReports = await Promise.all(
      reports.map(async (report) => {
        let reportType = null;
        let user = null;
        let admin = null;
        
        // Buscar tipo de report
        if (report.reportTypeId) {
          try {
            const typeResult = await pool.query(
              'SELECT id, name, description FROM "reportTypes" WHERE id = $1 LIMIT 1',
              [report.reportTypeId]
            );
            reportType = typeResult.rows[0] || null;
          } catch (error) {
            console.warn('Erro ao buscar tipo de report:', error);
          }
        }
        
        // Buscar usuário
        if (report.userId) {
          try {
            const userResult = await pool.query(
              'SELECT id, username, email FROM users WHERE id = $1 LIMIT 1',
              [report.userId]
            );
            user = userResult.rows[0] || null;
          } catch (error) {
            console.warn('Erro ao buscar usuário:', error);
          }
        }
        
        // Buscar admin que respondeu
        if (report.respondedBy) {
          try {
            const adminResult = await pool.query(
              'SELECT id, username FROM users WHERE id = $1 LIMIT 1',
              [report.respondedBy]
            );
            admin = adminResult.rows[0] || null;
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
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return res.status(200).json({
      success: true,
      reports: enhancedReports,
      totalCount,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error('Erro ao listar denúncias (versão funcional):', error);
    return res.status(500).json({ message: 'Erro ao buscar denúncias' });
  }
});

/**
 * Criar uma nova denúncia
 * POST /api/reports
 */
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/reports - Criando nova denúncia');
    
    const createReportSchema = z.object({
      artId: z.number().optional(),
      reportTypeId: z.number(),
      title: z.string().min(5, "O título deve ter pelo menos 5 caracteres").max(200),
      description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres").max(1000),
      evidence: z.string().max(500).optional()
    });
    
    const validatedData = createReportSchema.parse(req.body);
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    // Inserir nova denúncia
    const result = await pool.query(`
      INSERT INTO reports ("userId", "artId", "reportTypeId", title, description, evidence, status, "isResolved", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, 'pendente', false, NOW(), NOW())
      RETURNING id
    `, [
      userId,
      validatedData.artId || null,
      validatedData.reportTypeId,
      validatedData.title,
      validatedData.description,
      validatedData.evidence || null
    ]);
    
    const reportId = result.rows[0]?.id;
    
    console.log(`Nova denúncia criada com ID: ${reportId}`);
    
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
    
    console.error('Erro ao criar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao criar denúncia' });
  }
});

/**
 * Atualizar status de denúncia (apenas administradores)
 * PUT /api/reports/:id/respond
 */
router.put('/:id/respond', async (req, res) => {
  try {
    console.log(`PUT /api/reports/${req.params.id}/respond - Respondendo denúncia`);
    
    const reportId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    const userLevel = (req as any).user?.nivelacesso;
    
    if (!userId || !['admin', 'suporte'].includes(userLevel)) {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem responder denúncias.' });
    }
    
    const adminResponseSchema = z.object({
      status: z.enum(['pendente', 'em-analise', 'resolvido', 'rejeitado']),
      adminResponse: z.string().min(5, "A resposta deve ter pelo menos 5 caracteres").optional(),
      isResolved: z.boolean().optional()
    });
    
    const validatedData = adminResponseSchema.parse(req.body);
    
    // Definir isResolved baseado no status
    const isResolved = validatedData.status === 'resolvido';
    
    // Atualizar denúncia
    const result = await pool.query(`
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
    `, [
      validatedData.status,
      validatedData.adminResponse || null,
      isResolved,
      userId,
      reportId
    ]);
    
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    console.log(`Denúncia ${reportId} atualizada com sucesso`);
    
    return res.status(200).json({
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
    
    console.error('Erro ao atualizar denúncia:', error);
    return res.status(500).json({ message: 'Erro ao atualizar denúncia' });
  }
});

// Excluir denúncia
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    const user = req.user as any;
    
    // Verificar se o usuário é admin
    if (user.nivelacesso !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    console.log(`[DELETE] Excluindo denúncia ID: ${reportId}`);
    
    // Excluir denúncia
    const result = await pool.query(`
      DELETE FROM reports 
      WHERE id = $1
      RETURNING id
    `, [reportId]);
    
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Denúncia não encontrada' });
    }
    
    console.log(`Denúncia ${reportId} excluída com sucesso`);
    
    return res.status(200).json({
      success: true,
      message: 'Denúncia excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir denúncia:', error);
    return res.status(500).json({ message: 'Erro ao excluir denúncia' });
  }
});

export default router;