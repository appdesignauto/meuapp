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
    
    // Criar um arquivo de log com os dados do webhook para análise posterior
    const logFile = path.join(__dirname, '..', '..', '..', 'webhook-hotmart.log');
    const logEntry = `
[${new Date().toISOString()}] Webhook Hotmart recebido
Tipo de evento: ${eventType}
Transação: ${transactionCode}
Headers: ${JSON.stringify(req.headers)}
Body: ${JSON.stringify(req.body)}
---------------------------------------------
`;
    
    // Tentar salvar o log
    try {
      fs.appendFileSync(logFile, logEntry);
      console.log(`Webhook registrado no arquivo ${logFile}`);
    } catch (logError) {
      console.error('Erro ao salvar log do webhook:', logError);
    }
    
    // Responder imediatamente para não bloquear o servidor
    res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido e registrado com sucesso',
      eventType,
      transactionCode
    });
    
  } catch (error) {
    console.error('Erro ao processar webhook da Hotmart:', error);
    
    // Mesmo em caso de erro, retornar 200 para a Hotmart não reenviar
    res.status(200).json({ 
      success: false, 
      message: 'Erro no processamento do webhook',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;