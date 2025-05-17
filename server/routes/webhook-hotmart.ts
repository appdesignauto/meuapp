// webhook-hotmart.ts
import express, { Request, Response } from 'express';
import { createLogger } from '../utils/logger';
import { pool } from '../db';
import crypto from 'crypto';

const router = express.Router();
const logger = createLogger('webhook-hotmart');

/**
 * Endpoint de webhook para a Hotmart
 * Esta implementação preserva a funcionalidade existente da Hotmart,
 * apenas movendo o código para um arquivo separado.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const hotmartSignature = req.headers['x-hotmart-hottok'];
    
    logger.debug(`Webhook Hotmart recebido - Signature: ${hotmartSignature ? 'presente' : 'ausente'}`);
    
    // Verificar autenticidade da requisição da Hotmart
    if (!hotmartSignature) {
      logger.warn('Webhook Hotmart recebido sem assinatura');
      return res.status(401).json({ error: 'Assinatura não fornecida' });
    }
    
    // Verificar se há dados válidos
    if (!body || Object.keys(body).length === 0) {
      logger.warn('Webhook Hotmart recebido sem dados no corpo');
      return res.status(400).json({ error: 'Corpo da requisição vazio ou inválido' });
    }
    
    // Extração de dados principais
    let eventType = 'desconhecido';
    if (body.event) {
      eventType = body.event;
    } else if (body.data && body.data.purchase && body.data.purchase.status) {
      eventType = body.data.purchase.status;
    }
    
    // Logar o webhook recebido
    await logWebhook(body, eventType, hotmartSignature);
    
    // Retornar resposta de sucesso
    res.status(200).json({ status: 'success', message: 'Webhook processado com sucesso' });
    
  } catch (error: any) {
    logger.error(`Erro ao processar webhook Hotmart: ${error.message}`);
    res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
});

/**
 * Salva o log do webhook no banco de dados
 */
async function logWebhook(payload: any, eventType: string, signature: string | string[] | undefined): Promise<void> {
  try {
    // Salvar na tabela webhookLogs
    const query = `
      INSERT INTO webhookLogs (
        eventType, 
        payloadData, 
        signature,
        status, 
        source,
        processedAt
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    await pool.query(query, [
      eventType || 'desconhecido',
      JSON.stringify(payload),
      signature || null,
      'success', 
      'hotmart'
    ]);
    
    logger.debug('Webhook Hotmart registrado no banco de dados');
  } catch (error: any) {
    logger.error(`Erro ao salvar log do webhook: ${error.message}`);
  }
}

export default router;