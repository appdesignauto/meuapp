/**
 * Rota de debug para diagnóstico de webhooks
 * 
 * Este endpoint captura e registra qualquer webhook recebido,
 * independentemente do formato ou origem, para fins de diagnóstico.
 */

import { Router, Request, Response } from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurar conexão com banco de dados
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const router = Router();

// Endpoint para diagnóstico geral de webhooks
router.post('/debug', async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  console.log(`📩 Webhook de diagnóstico recebido em ${timestamp}`);
  
  try {
    // Capturar o corpo da requisição
    const payload = req.body;
    
    // Capturar cabeçalhos importantes
    const headers = {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'x-hotmart-webhook-signature': req.headers['x-hotmart-webhook-signature'],
      'x-hotmart-webhook-token': req.headers['x-hotmart-webhook-token'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'host': req.headers['host']
    };
    
    // Registrar o IP de origem
    const ipAddress = (
      req.headers['x-forwarded-for'] || 
      req.connection.remoteAddress || 
      'desconhecido'
    ).toString();
    
    console.log(`📌 IP de origem: ${ipAddress}`);
    console.log(`🔑 Cabeçalhos recebidos:`, headers);
    console.log(`📦 Payload recebido:`, JSON.stringify(payload, null, 2));
    
    // Registrar no banco de dados
    try {
      const insertResult = await db.query(
        `INSERT INTO webhook_logs 
         (event_type, status, email, source, source_ip, transaction_id, raw_payload) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [
          'DEBUG', 
          'received',
          payload.email || payload.data?.buyer?.email || payload.data?.customer?.email || 'desconhecido',
          'debug',
          ipAddress,
          payload.data?.purchase?.transaction || 'desconhecido',
          JSON.stringify(payload)
        ]
      );
      
      const logId = insertResult.rows[0]?.id;
      console.log(`📝 Log de diagnóstico registrado com ID: ${logId}`);
    } catch (dbError) {
      console.error('❌ Erro ao registrar diagnóstico no banco de dados:', dbError);
    }
    
    // Sempre retornar sucesso para que o webhook não seja reenviado
    return res.status(200).json({
      success: true,
      message: 'Webhook de diagnóstico recebido e registrado',
      timestamp,
      headers: headers,
      ipAddress
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook de diagnóstico:', error);
    
    // Mesmo em caso de erro, retornar 200 para não causar reenvios
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook de diagnóstico',
      error: error.message || String(error)
    });
  }
});

export default router;