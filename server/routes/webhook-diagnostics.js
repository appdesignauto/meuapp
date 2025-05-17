/**
 * Rotas de diagnóstico para webhooks
 * Estas rotas são usadas apenas por administradores para verificar
 * o status e histórico de webhooks recebidos
 */

import express from 'express';
import { storage } from '../storage.js';
import { db } from '../db.js';
import { isAdmin } from '../middleware/auth-middleware.js';
const router = express.Router();

// Middleware que verifica se o usuário é admin
router.use(isAdmin);

// Listar todos os logs de webhook (com paginação)
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Usar sintaxe mais simples e compatível com ambos sistemas de módulos
    const logs = await db.select().from('webhookLogs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);
    
    const total = await db.select().from('webhookLogs').count('id as count');
    
    return res.json({
      logs,
      pagination: {
        page,
        limit,
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar logs de webhook:', error);
    return res.status(500).json({ error: 'Erro ao listar logs de webhook' });
  }
});

// Visualizar detalhes de um log específico
router.get('/logs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const log = await storage.getWebhookLog(id);
    
    if (!log) {
      return res.status(404).json({ error: 'Log não encontrado' });
    }
    
    return res.json(log);
  } catch (error) {
    console.error(`Erro ao buscar log #${req.params.id}:`, error);
    return res.status(500).json({ error: 'Erro ao buscar log de webhook' });
  }
});

// Buscar webhooks por email
router.get('/search', async (req, res) => {
  try {
    const { email, transactionId, source, status } = req.query;
    let query = db.select().from(db.webhookLogs);
    
    if (email) {
      query = query.where(db.webhookLogs.email, 'like', `%${email}%`);
    }
    
    if (transactionId) {
      query = query.where(db.webhookLogs.transactionId, 'like', `%${transactionId}%`);
    }
    
    if (source) {
      query = query.where(db.webhookLogs.source, '=', source);
    }
    
    if (status) {
      query = query.where(db.webhookLogs.status, '=', status);
    }
    
    const results = await query.orderBy(db.webhookLogs.createdAt, 'desc').limit(100);
    
    return res.json({
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Erro ao buscar logs de webhook:', error);
    return res.status(500).json({ error: 'Erro ao buscar logs de webhook' });
  }
});

// Testar simulação de webhook Hotmart
router.post('/simulate/hotmart', async (req, res) => {
  try {
    const { email, productId } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    // Criar o webhook simulado
    const webhookPayload = {
      data: {
        buyer: {
          email: email
        },
        purchase: {
          transaction: `SIM-${Date.now()}`,
          status: 'APPROVED'
        },
        product: {
          id: productId || 'DEFAULT_PRODUCT'
        }
      },
      event: 'PURCHASE_APPROVED',
      id: `sim-${Date.now()}`
    };
    
    // Simular o processamento do webhook
    try {
      await storage.createWebhookLog({
        eventType: webhookPayload.event,
        payloadData: JSON.stringify(webhookPayload),
        status: 'received',
        source: 'hotmart',
        sourceIp: req.ip || 'simulação',
        transactionId: webhookPayload.data.purchase.transaction,
        email: email,
        userId: null,
        errorMessage: null
      });
      
      return res.json({
        success: true,
        message: 'Webhook simulado processado com sucesso',
        webhook: webhookPayload
      });
    } catch (error) {
      console.error('Erro ao processar webhook simulado:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao processar webhook simulado',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Erro ao simular webhook Hotmart:', error);
    return res.status(500).json({ error: 'Erro ao simular webhook Hotmart' });
  }
});

// Rota para testar o serviço de armazenamento de logs
router.post('/test-log', async (req, res) => {
  try {
    const testLog = await storage.createWebhookLog({
      eventType: 'TEST_EVENT',
      payloadData: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      status: 'testing',
      source: 'diagnostic',
      sourceIp: req.ip || 'unknown',
      transactionId: `test-${Date.now()}`,
      email: req.body.email || 'test@example.com',
      userId: null,
      errorMessage: null
    });
    
    return res.json({
      success: true,
      message: 'Log de teste criado com sucesso',
      log: testLog
    });
  } catch (error) {
    console.error('Erro ao criar log de teste:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro ao criar log de teste', 
      details: error.message 
    });
  }
});

export default router;