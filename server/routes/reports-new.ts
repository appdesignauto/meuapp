/**
 * SISTEMA DE REPORTS FUNCIONAL - VERSÃO DEFINITIVA
 * 
 * Conecta diretamente ao banco PostgreSQL para buscar dados reais
 */

import { Router } from 'express';
import { pool } from '../db';

const router = Router();

/**
 * Buscar estatísticas de reports
 * GET /api/reports/stats
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 [REPORTS-NEW] Buscando estatísticas dos reports...');
    
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM reports 
      GROUP BY status
    `);
    
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
    
    console.log('✅ [REPORTS-NEW] Estatísticas encontradas:', stats);
    return res.json({ stats });
  } catch (error) {
    console.error('❌ [REPORTS-NEW] Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
});

/**
 * Buscar lista de reports
 * GET /api/reports
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 [REPORTS-NEW] Buscando lista de reports...');
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let baseQuery = `
      SELECT 
        r.*,
        rt.name as reportTypeName,
        u.username as reporterUsername
      FROM reports r
      LEFT JOIN "reportTypes" rt ON r."reportTypeId" = rt.id
      LEFT JOIN users u ON r."userId" = u.id
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      conditions.push(`r.status = $${paramCount}`);
      values.push(status);
    }

    if (search) {
      paramCount++;
      conditions.push(`(r.title ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`);
      values.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    baseQuery += ` ORDER BY r."createdAt" DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(baseQuery, values);
    
    // Buscar total de registros
    let countQuery = 'SELECT COUNT(*) FROM reports r';
    const countValues = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` WHERE r.status = $${countParamCount}`;
      countValues.push(status);
    }

    if (search) {
      countParamCount++;
      if (countValues.length > 0) {
        countQuery += ` AND (r.title ILIKE $${countParamCount} OR r.description ILIKE $${countParamCount})`;
      } else {
        countQuery += ` WHERE (r.title ILIKE $${countParamCount} OR r.description ILIKE $${countParamCount})`;
      }
      countValues.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    console.log(`✅ [REPORTS-NEW] ${result.rows.length} reports encontrados (total: ${total})`);
    
    return res.json({
      reports: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ [REPORTS-NEW] Erro ao buscar reports:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar reports'
    });
  }
});

/**
 * Buscar report por ID
 * GET /api/reports/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    console.log(`🔍 [REPORTS-NEW] Buscando report ID: ${reportId}`);
    
    const result = await pool.query(`
      SELECT 
        r.*,
        rt.name as reportTypeName,
        u.username as reporterUsername
      FROM reports r
      LEFT JOIN "reportTypes" rt ON r."reportTypeId" = rt.id
      LEFT JOIN users u ON r."userId" = u.id
      WHERE r.id = $1
    `, [reportId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report não encontrado'
      });
    }

    console.log('✅ [REPORTS-NEW] Report encontrado');
    return res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('❌ [REPORTS-NEW] Erro ao buscar report:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar report'
    });
  }
});

/**
 * Atualizar status do report
 * PUT /api/reports/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { status, adminResponse, respondedBy } = req.body;
    
    console.log(`📝 [REPORTS-NEW] Atualizando status do report ${reportId} para: ${status}`);
    
    const result = await pool.query(`
      UPDATE reports 
      SET 
        status = $1,
        "adminResponse" = $2,
        "respondedBy" = $3,
        "respondedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE id = $4
      RETURNING *
    `, [status, adminResponse, respondedBy, reportId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report não encontrado'
      });
    }

    console.log('✅ [REPORTS-NEW] Status atualizado com sucesso');
    return res.json({
      success: true,
      report: result.rows[0]
    });
  } catch (error) {
    console.error('❌ [REPORTS-NEW] Erro ao atualizar status:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status'
    });
  }
});

/**
 * Buscar tipos de report
 * GET /api/reports/types
 */
router.get('/types/list', async (req, res) => {
  try {
    console.log('📑 [REPORTS-NEW] Buscando tipos de reports...');
    
    const result = await pool.query(`
      SELECT * FROM "reportTypes" 
      WHERE "isActive" = true 
      ORDER BY name
    `);
    
    console.log(`✅ [REPORTS-NEW] ${result.rows.length} tipos encontrados`);
    return res.json({ reportTypes: result.rows });
  } catch (error) {
    console.error('❌ [REPORTS-NEW] Erro ao buscar tipos:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar tipos de reports'
    });
  }
});

export default router;