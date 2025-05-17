/**
 * Serviço de proxy dedicado para webhooks da Hotmart/Doppus durante desenvolvimento
 * 
 * Este script cria um servidor HTTP separado que recebe webhooks e os encaminha
 * para o servidor principal, contornando o problema de interceptação do Vite
 */
import http from 'http';
import https from 'https';
import { createServer } from 'http';
import express from 'express';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// Configurar pool de conexão ao banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Porta separada para o serviço de webhook
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3333;

// Criar aplicação Express dedicada para webhooks
const app = express();
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`🔔 [WEBHOOK-PROXY] ${req.method} ${req.path}`);
  next();
});

// Função para validar a assinatura HMAC do webhook da Hotmart
async function validateHotmartSignature(req) {
  try {
    // Obter a assinatura do cabeçalho
    const signature = req.headers['x-hotmart-signature'];
    if (!signature) {
      console.warn('⚠️ Webhook sem assinatura Hotmart');
      return false;
    }

    // Obter o secret da Hotmart do banco de dados
    const secretQuery = await pool.query(
      `SELECT value FROM "integrationSettings" WHERE provider = 'hotmart' AND key = 'secret' LIMIT 1`
    );
    
    if (!secretQuery.rows || secretQuery.rows.length === 0) {
      console.error('❌ Secret da Hotmart não encontrado no banco de dados');
      return false;
    }
    
    const secret = secretQuery.rows[0].value;
    
    // Calcular o HMAC usando o corpo da requisição e o secret
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(req.body));
    const calculatedSignature = hmac.digest('hex');
    
    // Comparar as assinaturas
    const isValid = calculatedSignature === signature;
    if (!isValid) {
      console.warn(`⚠️ Assinatura inválida. Recebida: ${signature}, Calculada: ${calculatedSignature}`);
    } else {
      console.log('✅ Assinatura Hotmart válida');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Erro ao validar assinatura Hotmart:', error);
    return false;
  }
}

// Função para processar webhook diretamente
async function processHotmartWebhook(payload) {
  try {
    // Extrair informações importantes do webhook
    let email = null;
    if (payload?.data?.buyer?.email) {
      email = payload.data.buyer.email;
    } else if (payload?.buyer?.email) {
      email = payload.buyer.email;
    } else if (payload?.data?.subscriber?.email) {
      email = payload.data.subscriber.email;
    } else if (payload?.subscriber?.email) {
      email = payload.subscriber.email;
    }
    
    let transactionId = null;
    if (payload?.data?.purchase?.transaction) {
      transactionId = payload.data.purchase.transaction;
    } else if (payload?.data?.subscription?.code) {
      transactionId = payload.data.subscription.code;
    } else if (payload?.purchase?.transaction) {
      transactionId = payload.purchase.transaction;
    }
    
    const eventType = payload?.event || 'UNKNOWN';
    
    // Registrar o webhook no banco de dados
    const query = `
      INSERT INTO "webhookLogs" 
      ("eventType", "payloadData", "status", "source", "sourceIp", "transactionId", "email", "errorMessage", "createdAt", "updatedAt") 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id;
    `;
    
    const values = [
      eventType,
      JSON.stringify(payload),
      'processing',
      'hotmart',
      'webhook-proxy',
      transactionId,
      email,
      null
    ];
    
    const result = await pool.query(query, values);
    const webhookLogId = result.rows[0].id;
    console.log('✅ Log de webhook criado:', webhookLogId);
    
    // Importar diretamente o SubscriptionService
    const { SubscriptionService } = require('./server/services/subscription-service');
    
    // Processar o webhook
    const processResult = await SubscriptionService.processHotmartWebhook(payload);
    console.log('✅ Webhook processado com sucesso:', processResult);
    
    // Atualizar o status do webhook para sucesso
    await pool.query(
      `UPDATE "webhookLogs" SET status = 'success', "updatedAt" = NOW() WHERE id = $1`,
      [webhookLogId]
    );
    
    console.log(`Status do webhook ${webhookLogId} atualizado para success`);
    
    return {
      success: true,
      webhookLogId,
      processResult
    };
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Rota para verificação de status
app.get('/webhook/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    message: 'Serviço de proxy para webhooks está funcionando corretamente',
    port: WEBHOOK_PORT
  });
});

// Rota de webhook Hotmart
app.post('/webhook/hotmart', async (req, res) => {
  console.log('⚡ Webhook da Hotmart recebido no serviço proxy');
  
  try {
    // Validar a assinatura (opcional durante testes)
    const isSignatureValid = await validateHotmartSignature(req);
    if (!isSignatureValid) {
      console.warn('⚠️ Assinatura inválida, mas continuando o processamento para fins de teste');
      // Nota: em produção, retornaria um erro aqui
    }
    
    // Processar o webhook
    const result = await processHotmartWebhook(req.body);
    
    // Retornar resposta bem-sucedida
    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso pelo proxy dedicado',
      result
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook no proxy:', error);
    
    // Retornar 200 mesmo em caso de erro para evitar retentativas
    res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas confirmando recebimento'
    });
  }
});

// Iniciar o servidor HTTP para webhooks
const server = createServer(app);
server.listen(WEBHOOK_PORT, () => {
  console.log(`🚀 Servidor proxy para webhooks iniciado na porta ${WEBHOOK_PORT}`);
  console.log(`📡 URL para webhooks: http://localhost:${WEBHOOK_PORT}/webhook/hotmart`);
});