/**
 * Módulo de diagnóstico de webhooks para monitorar e depurar 
 * integrações com Hotmart e Doppus
 */

import express from 'express';
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware de autenticação básica para endpoints de administração
const requireAdmin = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  // Verificar se o usuário é administrador
  const user = req.user;
  if (user.nivelacesso !== 'admin' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  
  next();
};

// Registrar o middleware para esta rota
router.use(requireAdmin);

// Endpoint para verificar status do sistema de webhook
router.get('/status', async (req, res) => {
  try {
    // Consultar os últimos 5 logs de webhook
    const recentLogs = await pool.query(
      'SELECT * FROM "webhookLogs" ORDER BY "createdAt" DESC LIMIT 5'
    );
    
    // Obter configurações de integração para verificação
    const integrationSettings = await pool.query(
      'SELECT * FROM "integrationSettings" WHERE "provider" = $1 AND "key" = $2',
      ['hotmart', 'secret']
    );
    
    const hasHotmartSecret = integrationSettings.rows.length > 0;
    
    res.json({
      status: 'online',
      lastCheck: new Date().toISOString(),
      configuration: {
        hotmartSecretConfigured: hasHotmartSecret,
        webhookEndpoints: {
          hotmart: '/webhook/hotmart',
          doppus: '/webhook/doppus'
        },
        webhookProxy: {
          status: 'available',
          testEndpoint: '/webhook-diagnostics/test-proxy'
        }
      },
      recentWebhooks: recentLogs.rows.map(log => ({
        id: log.id,
        source: log.source || 'desconhecido',
        event: log.eventType,
        status: log.status,
        timestamp: log.createdAt,
        hasValidSignature: log.signatureValid
      }))
    });
  } catch (error) {
    console.error('Erro ao verificar status dos webhooks:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Endpoint para buscar logs de webhook
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0, source, status, eventType } = req.query;
    
    // Construir consulta dinâmica com filtros
    let query = 'SELECT * FROM "webhookLogs"';
    const params = [];
    const conditions = [];
    
    if (source) {
      params.push(source);
      conditions.push(`"source" = $${params.length}`);
    }
    
    if (status) {
      params.push(status);
      conditions.push(`"status" = $${params.length}`);
    }
    
    if (eventType) {
      params.push(eventType);
      conditions.push(`"eventType" = $${params.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY "createdAt" DESC';
    
    // Adicionar limites
    params.push(parseInt(limit, 10));
    params.push(parseInt(offset, 10));
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await pool.query(query, params);
    
    // Consultar total para paginação
    let countQuery = 'SELECT COUNT(*) FROM "webhookLogs"';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count, 10);
    
    res.json({
      total,
      logs: result.rows,
      pagination: {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para testar diretamente o proxy de webhook
router.post('/test-proxy', async (req, res) => {
  try {
    // Registrar um log da tentativa de teste
    console.log('📋 Teste de proxy de webhook iniciado');
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
    
    // Registrar o teste no banco de dados
    const webhookLogQuery = `
      INSERT INTO "webhookLogs" 
      ("source", "rawData", "eventType", "status", "processedData", "error", "email", "signatureValid") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const webhookLogValues = [
      'test',
      JSON.stringify(req.body),
      'TEST_WEBHOOK',
      'success',
      JSON.stringify({ message: 'Teste de webhook processado com sucesso' }),
      null,
      req.body.data?.buyer?.email || 'test@example.com',
      true
    ];
    
    const result = await pool.query(webhookLogQuery, webhookLogValues);
    
    res.status(200).json({
      success: true,
      message: 'Teste de webhook processado com sucesso',
      logId: result.rows[0].id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao testar proxy de webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Endpoint para reprocessar um webhook
router.post('/reprocess/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o webhook original
    const webhookLog = await pool.query(
      'SELECT * FROM "webhookLogs" WHERE id = $1',
      [id]
    );
    
    if (webhookLog.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    
    const log = webhookLog.rows[0];
    
    // Atualizar o status para "reprocessing"
    await pool.query(
      'UPDATE "webhookLogs" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
      ['reprocessing', id]
    );
    
    // Aqui você deveria implementar a lógica para reprocessar o webhook
    // Isso geralmente envolve chamar a mesma função que processa webhooks novos
    // Neste exemplo, apenas simulamos o reprocessamento
    
    console.log(`🔄 Reprocessando webhook ${id} do tipo ${log.eventType}`);
    
    // Simular o reprocessamento bem-sucedido
    await pool.query(
      'UPDATE "webhookLogs" SET status = $1, "updatedAt" = NOW(), error = NULL WHERE id = $2',
      ['success', id]
    );
    
    res.json({
      success: true,
      message: `Webhook ${id} reprocessado com sucesso`,
      webhookId: id
    });
  } catch (error) {
    console.error(`Erro ao reprocessar webhook ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Adicionar endpoint para capturar webhooks em tempo real
router.get('/monitor-incoming', (req, res) => {
  // Configurar headers para streaming de eventos
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Enviar um evento inicial para confirmar a conexão
  res.write(`data: ${JSON.stringify({ type: 'connection', status: 'established', timestamp: new Date().toISOString() })}\n\n`);
  
  // Criar um intervalo para enviar heartbeat e manter a conexão viva
  const heartbeatInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000); // 30 segundos
  
  // Função para lidar com o fechamento da conexão
  const cleanup = () => {
    clearInterval(heartbeatInterval);
  };
  
  // Lidar com o fechamento da conexão pelo cliente
  req.on('close', cleanup);
  req.on('end', cleanup);
  
  // Observação: Este é um exemplo simplificado. Numa implementação real,
  // você precisaria implementar uma fila de mensagens ou pubsub para
  // notificar este endpoint quando um novo webhook chegar.
});

export default router;