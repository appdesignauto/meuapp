import express from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { 
  BRAZIL_TIMEZONE, 
  getBrazilDateTime, 
  formatBrazilDate, 
  formatBrazilDateTime, 
  getBrazilISOString
} from '../utils/date-utils';

const router = express.Router();

// Endpoint para obter informações sobre a data e fuso horário atual
router.get('/info', async (req, res) => {
  try {
    // Obter data atual em diferentes formatos
    const now = new Date();
    const brazilDateTime = getBrazilDateTime();
    
    // Consultar o banco para verificar o timezone da conexão - versão simplificada
    const dbResult = await db.execute(sql`SELECT NOW() as db_now`);
    
    // Retornar resultado com dados de diferentes fontes para comparação
    res.json({
      timezone_info: {
        environment_timezone: process.env.TZ || '(não configurado)',
        brazil_timezone_name: BRAZIL_TIMEZONE,
        node_timezone_offset_mins: now.getTimezoneOffset(),
      },
      javascript_dates: {
        utc_now: now.toISOString(),
        local_now: now.toString(),
        brazil_now: brazilDateTime.toString(),
        brazil_formatted_date: formatBrazilDate(now),
        brazil_formatted_datetime: formatBrazilDateTime(now),
        brazil_iso_string: getBrazilISOString(),
      },
      database_dates: dbResult.rows?.[0] || 'Erro ao consultar banco de dados'
    });
  } catch (error) {
    console.error('Erro ao testar timezone:', error);
    res.status(500).json({ 
      error: 'Erro ao testar timezone', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Teste simples para verificar se a rota está funcionando
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Rota de teste de data funcionando', 
    now: new Date().toISOString(),
    brazil_time: getBrazilDateTime().toISOString()
  });
});

export default router;