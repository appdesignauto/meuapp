// webhook-doppus.ts
import express, { Request, Response } from 'express';
import { createLogger } from '../utils/logger';
import { pool } from '../db';

const router = express.Router();
const logger = createLogger('webhook-doppus');

/**
 * Endpoint de webhook para a Doppus
 * Esta implementação simplificada retorna 200 OK imediatamente
 * para evitar o problema onde a Doppus considera que o webhook falhou
 * quando há qualquer processamento adicional.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Extrair dados principais da requisição para log
    const body = req.body;
    const method = req.method;
    const contentType = req.headers['content-type'] || 'desconhecido';
    
    // Log mínimo antes de responder
    logger.debug(`Webhook Doppus recebido - Método: ${method}, Content-Type: ${contentType}`);
    
    // Responder imediatamente com 200 OK para evitar timeout da Doppus
    res.status(200).json({ status: 'success', message: 'Webhook recebido com sucesso' });
    
    // Após responder, processar assincronamente no background
    processDoppusWebhook(body, contentType).catch(error => {
      logger.error(`Erro ao processar webhook Doppus: ${error.message}`);
    });
    
  } catch (error: any) {
    // Mesmo em caso de erro, retornamos 200 para prevenir retentativas da Doppus
    logger.error(`Erro ao processar webhook Doppus: ${error.message}`);
    res.status(200).json({ 
      status: 'error', 
      message: 'Erro ao processar webhook, mas recebido com sucesso'
    });
  }
});

/**
 * Processa o webhook da Doppus em background após já ter respondido ao cliente
 */
async function processDoppusWebhook(body: any, contentType: string): Promise<void> {
  try {
    // Identificar formato do payload
    let webhookData: any;
    let eventType = 'desconhecido';
    
    // Detectar e normalizar o formato dos dados
    if (typeof body === 'object') {
      // Se já é um objeto (JSON parseado pelo middleware)
      webhookData = body;
      
      // Tentar extrair o tipo de evento com base no formato do webhook
      if (body.evento) {
        eventType = body.evento;
      } else if (body.event) {
        eventType = body.event;
      } else if (body.id && body.status) {
        // Formato potencialmente novo conforme captura de tela fornecida
        eventType = body.status;
      }
    } else if (typeof body === 'string') {
      // Se é uma string, tentar parsear como JSON
      try {
        webhookData = JSON.parse(body);
        if (webhookData.evento) {
          eventType = webhookData.evento;
        } else if (webhookData.event) {
          eventType = webhookData.event;
        }
      } catch (e) {
        logger.error('Falha ao parsear corpo do webhook como JSON');
        webhookData = { rawData: body };
      }
    } else {
      // Formato desconhecido
      webhookData = { rawData: 'Formato desconhecido' };
    }
    
    // Registrar o webhook no banco de dados para análise posterior
    await logWebhook(webhookData, eventType);
    
    logger.info(`Webhook Doppus processado com sucesso. Tipo: ${eventType}`);
  } catch (error: any) {
    logger.error(`Erro ao processar webhook Doppus em background: ${error.message}`);
  }
}

/**
 * Salva o log do webhook no banco de dados
 */
async function logWebhook(payload: any, eventType: string): Promise<void> {
  try {
    // Salvar na tabela webhookLogs
    const query = `
      INSERT INTO webhookLogs (
        eventType, 
        payloadData, 
        status, 
        source,
        processedAt
      )
      VALUES ($1, $2, $3, $4, NOW())
    `;
    
    await pool.query(query, [
      eventType || 'desconhecido',
      JSON.stringify(payload),
      'success', // Consideramos sucesso pois respondemos 200
      'doppus'
    ]);
    
    logger.debug('Webhook Doppus registrado no banco de dados');
  } catch (error: any) {
    logger.error(`Erro ao salvar log do webhook: ${error.message}`);
  }
}

export default router;