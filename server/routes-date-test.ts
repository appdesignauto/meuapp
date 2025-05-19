import express from 'express';
import { BRAZIL_TIMEZONE, formatBrazilDate, formatBrazilDateTime, getBrazilDateTime, getBrazilISOString } from './utils/date-utils';
import { db } from './db';
import { sql } from 'drizzle-orm';

export function registerDateRoutes(app: express.Express) {
  // Endpoint para testar formatação de data no timezone brasileiro
  app.get('/api/test/timezone', async (req, res) => {
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
}