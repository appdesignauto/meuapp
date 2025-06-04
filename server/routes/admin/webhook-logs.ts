/**
 * Rota de API para gerenciamento de logs de webhook
 * Esta rota oferece endpoints para listar, filtrar e pesquisar logs de webhook
 */

import express from 'express';
import { Pool } from 'pg';
// Importar middleware básico de autenticação 
// Isso será verificado no router principal que já tem a autenticação configurada
import { Request, Response, NextFunction } from 'express';

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (user && (user.role === 'admin' || user.nivelacesso === 'admin' || user.nivelacesso === 'designer_adm')) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. É necessário ser administrador.' });
};

const router = express.Router();

// Função para obter a conexão com o banco de dados
async function getPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  return pool;
}

// Endpoint para listar logs de webhook com filtros e paginação
router.get('/webhook-logs', isAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    
    // Parâmetros de paginação e ordenação
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parâmetros de ordenação
    const sortField = req.query.sort_field as string || 'created_at';
    const sortDirection = req.query.sort_direction as string || 'desc';
    
    // Parâmetros de filtro
    const email = req.query.email as string;
    const eventType = req.query.event_type as string;
    const source = req.query.source as string;
    const status = req.query.status as string;
    const transactionId = req.query.transaction_id as string;
    
    // Construir a consulta base
    let query = `SELECT * FROM "webhook_logs" WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) FROM "webhook_logs" WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    // Adicionar filtros se fornecidos
    if (email) {
      query += ` AND email ILIKE $${paramIndex}`;
      countQuery += ` AND email ILIKE $${paramIndex}`;
      params.push(`%${email}%`);
      paramIndex++;
    }
    
    if (eventType) {
      query += ` AND "event_type" = $${paramIndex}`;
      countQuery += ` AND "event_type" = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }
    
    if (source) {
      query += ` AND source = $${paramIndex}`;
      countQuery += ` AND source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (transactionId) {
      query += ` AND "transaction_id" ILIKE $${paramIndex}`;
      countQuery += ` AND "transaction_id" ILIKE $${paramIndex}`;
      params.push(`%${transactionId}%`);
      paramIndex++;
    }
    
    // Adicionar ordenação, limite e offset
    query += ` ORDER BY "${sortField}" ${sortDirection === 'asc' ? 'ASC' : 'DESC'}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    // Executar as consultas
    const result = await pool.query(query, params);
    const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 1));
    
    // Retornar os resultados
    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar logs de webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar logs de webhook' 
    });
  }
});

// Endpoint para obter detalhes de um log de webhook específico
router.get('/webhook-logs/:id', isAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const id = parseInt(req.params.id);
    
    // Verificar se o ID é válido
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID inválido' 
      });
    }
    
    // Buscar o log de webhook
    const result = await pool.query('SELECT * FROM "webhook_logs" WHERE id = $1', [id]);
    
    // Verificar se o log foi encontrado
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Log de webhook não encontrado' 
      });
    }
    
    // Retornar o log
    res.json({
      success: true,
      log: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do log de webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar detalhes do log de webhook' 
    });
  }
});

// Endpoint para obter estatísticas de webhooks
router.get('/webhook-stats', isAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    
    // Obter contagem por tipo de evento
    const eventTypesQuery = `
      SELECT "event_type", COUNT(*) as count 
      FROM "webhook_logs" 
      GROUP BY "event_type" 
      ORDER BY count DESC
    `;
    
    // Obter contagem por fonte
    const sourcesQuery = `
      SELECT source, COUNT(*) as count 
      FROM "webhook_logs" 
      GROUP BY source 
      ORDER BY count DESC
    `;
    
    // Obter contagem por status
    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM "webhook_logs" 
      GROUP BY status 
      ORDER BY count DESC
    `;
    
    // Obter contagem por dia (últimos 7 dias)
    const dailyCountQuery = `
      SELECT 
        DATE_TRUNC('day', "created_at") as date,
        COUNT(*) as count
      FROM "webhook_logs"
      WHERE "created_at" > NOW() - INTERVAL '7 days'
      GROUP BY date
      ORDER BY date ASC
    `;
    
    // Executar as consultas
    const [eventTypes, sources, statuses, dailyCounts] = await Promise.all([
      pool.query(eventTypesQuery),
      pool.query(sourcesQuery),
      pool.query(statusQuery),
      pool.query(dailyCountQuery)
    ]);
    
    // Retornar as estatísticas
    res.json({
      success: true,
      stats: {
        eventTypes: eventTypes.rows,
        sources: sources.rows,
        statuses: statuses.rows,
        dailyCounts: dailyCounts.rows
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de webhooks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar estatísticas de webhooks' 
    });
  }
});

export default router;