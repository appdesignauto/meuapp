import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Configuração do pool de conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Endpoint dedicado para estatísticas dos reports
router.get('/stats', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Buscando estatísticas dos reports...');
    
    // Consulta para obter todas as estatísticas
    const statsQuery = await pool.query(`
      SELECT 
        COALESCE(status, 'total') as status,
        COUNT(*) as count
      FROM reports 
      GROUP BY ROLLUP(status)
      ORDER BY status NULLS LAST
    `);
    
    const stats = {
      pending: 0,
      reviewing: 0,
      resolved: 0,
      rejected: 0,
      total: 0
    };
    
    console.log('📊 Resultados da consulta:', statsQuery.rows);
    
    statsQuery.rows.forEach(row => {
      const count = parseInt(row.count || '0');
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
        case 'total':
        case null:
          stats.total = count;
          break;
      }
    });
    
    console.log('✅ Estatísticas finais:', stats);
    
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

export default router;