import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { db } from '../../db';

// Criar uma instância do roteador
const router = Router();

router.post('/webhook-hotmart', async (req: Request, res: Response) => {
  try {
    // Log completo para análise da estrutura dos dados
    console.log('===================== WEBHOOK HOTMART RECEBIDO =====================');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    console.log('==================================================================');
    
    // Extrair dados mínimos para logging rápido
    const eventType = req.body?.event || req.body?.data?.purchase?.status || 'unknown';
    const transactionCode = req.body?.data?.purchase?.transaction || 
                           req.body?.data?.purchase?.transaction_code || 'unknown';
    
    console.log(`Tipo de evento: ${eventType}, Transação: ${transactionCode}`);
    
    // Salvar webhook em arquivo para análise
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const webhookFilePath = path.join(__dirname, '../../../webhook-logs', `webhook-${timestamp}-${transactionCode}.json`);
    
    // Garantir que o diretório existe
    const webhookDir = path.join(__dirname, '../../../webhook-logs');
    if (!fs.existsSync(webhookDir)) {
      fs.mkdirSync(webhookDir, { recursive: true });
    }
    
    // Salvar arquivo de log
    fs.writeFileSync(
      webhookFilePath, 
      JSON.stringify({
        timestamp: new Date().toISOString(),
        eventType,
        transactionCode,
        headers: req.headers,
        payload: req.body
      }, null, 2)
    );
    
    // Salvar na fila de processamento
    try {
      // Conectar ao banco usando Pool para garantir conexões eficientes
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      
      // Inserir na tabela webhook_queue
      await pool.query(
        `INSERT INTO webhook_queue (
          event_type, 
          transaction_code, 
          raw_data, 
          status, 
          created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [
          eventType,
          transactionCode,
          JSON.stringify(req.body),
          'pending'
        ]
      );
      
      console.log(`Webhook Hotmart enfileirado: ${eventType}, Transação: ${transactionCode}`);
      
      // Liberar pool
      pool.end();
      
    } catch (dbError) {
      console.error('Erro ao salvar webhook na fila:', dbError);
      // Não deixa falhar o processamento mesmo que o banco falhe
    }
    
    // Responder imediatamente para não bloquear o servidor
    res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido e registrado com sucesso para análise',
      eventType,
      transactionCode
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook da Hotmart:', error);
    
    // Mesmo em caso de erro, retornar 200 para a Hotmart não reenviar
    res.status(200).json({ 
      success: false, 
      message: 'Erro ao processar webhook, mas foi recebido para análise',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;