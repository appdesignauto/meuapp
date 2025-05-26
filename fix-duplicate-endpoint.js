/**
 * Script para eliminar o endpoint duplicado que retorna valores incorretos
 */
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testRealStats() {
  try {
    console.log('🔍 Verificando dados reais do banco...');
    
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM reports 
      GROUP BY status
    `);
    
    console.log('📊 Dados reais do banco:', result.rows);
    
    const stats = {
      pending: 0,
      reviewing: 0,
      resolved: 0,
      rejected: 0,
      total: 0
    };
    
    let total = 0;
    result.rows.forEach((row) => {
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
    
    console.log('✅ Estatísticas corretas que deveriam aparecer:', stats);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testRealStats();