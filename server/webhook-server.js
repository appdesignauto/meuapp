/**
 * Servidor Webhook Dedicado para Hotmart
 * 
 * Este módulo define um servidor Express dedicado exclusivamente para 
 * processar webhooks da Hotmart, garantindo respostas rápidas e confiáveis.
 */

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Porta separada para o servidor webhook
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 5001;

// Cria a aplicação Express
const webhookApp = express();

// Configurações básicas
webhookApp.use(express.json());
webhookApp.use(express.urlencoded({ extended: true }));

// Configuração CORS específica para Hotmart
webhookApp.use(cors({
  origin: [
    'https://app-vlc.hotmart.com',
    'https://hotmart.com',
    'https://designauto.com.br'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Hotmart-Webhook-Signature']
}));

// Função para buscar email recursivamente no payload
function findEmailInPayload(payload) {
  if (!payload) return null;
  
  // Busca recursiva
  function searchEmail(obj) {
    if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
      return obj;
    }
    
    if (typeof obj === 'object' && obj !== null) {
      // Verificar chaves comuns primeiro
      if (obj.email && typeof obj.email === 'string') return obj.email;
      if (obj.buyer && obj.buyer.email) return obj.buyer.email;
      if (obj.customer && obj.customer.email) return obj.customer.email;
      if (obj.data && obj.data.buyer && obj.data.buyer.email) return obj.data.buyer.email;
      
      // Buscar em todas as propriedades
      for (const key in obj) {
        const result = searchEmail(obj[key]);
        if (result) return result;
      }
    }
    
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const result = searchEmail(obj[i]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchEmail(payload);
}

// Função para encontrar ID da transação
function findTransactionId(payload) {
  if (!payload) return null;
  
  // Verificar locais comuns
  if (payload.data?.purchase?.transaction) return payload.data.purchase.transaction;
  if (payload.data?.transaction) return payload.data.transaction;
  if (payload.transaction) return payload.transaction;
  
  // Busca recursiva para encontrar qualquer campo que pareça ser um ID de transação
  function searchTransactionId(obj) {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const key in obj) {
      if (
        (key.toLowerCase().includes('transaction') || 
         key.toLowerCase().includes('order') || 
         key.toLowerCase().includes('pedido')) && 
        typeof obj[key] === 'string'
      ) {
        return obj[key];
      }
      
      if (typeof obj[key] === 'object') {
        const result = searchTransactionId(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchTransactionId(payload);
}

// Rota para verificar se o servidor está rodando
webhookApp.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    message: 'Servidor webhook da Hotmart está ativo'
  });
});

// Rota principal para processar webhooks da Hotmart
webhookApp.post('/hotmart', async (req, res) => {
  const startTime = Date.now();
  console.log(`📩 Webhook Hotmart recebido: ${new Date().toISOString()}`);
  
  try {
    // Extrair dados do payload
    const payload = req.body;
    const event = payload?.event || 'UNKNOWN';
    const email = findEmailInPayload(payload);
    const transactionId = findTransactionId(payload);
    
    console.log(`📊 Dados extraídos: evento=${event}, email=${email || 'não encontrado'}, transactionId=${transactionId || 'não encontrado'}`);
    
    // Log no banco de dados (não-bloqueante para resposta rápida)
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      await pool.query(
        `INSERT INTO webhook_logs 
         (event_type, status, email, source, raw_payload, transaction_id, source_ip, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          event,
          'received',
          email || null,
          'hotmart',
          JSON.stringify(payload),
          transactionId || null,
          req.ip || null,
          new Date()
        ]
      );
      
      console.log('✅ Log do webhook registrado no banco de dados');
      
      // Fecha a conexão com o pool
      await pool.end();
    } catch (dbError) {
      // Apenas log do erro, mas continua processando
      console.error('❌ Erro ao registrar webhook no banco:', dbError.message);
    }
    
    // Calcular tempo de processamento
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Tempo de processamento: ${processingTime}ms`);
    
    // Responder rapidamente (evitar timeout)
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error.message);
    
    // Mesmo com erro, retornar 200 para evitar reenvios
    return res.status(200).json({
      success: false,
      error: error.message,
      message: 'Erro ao processar webhook, mas confirmamos o recebimento',
      timestamp: new Date().toISOString()
    });
  }
});

// Inicia o servidor na porta específica
export function startWebhookServer() {
  return webhookApp.listen(WEBHOOK_PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Webhook Hotmart iniciado na porta ${WEBHOOK_PORT}`);
    console.log(`📌 URL para configuração na Hotmart: https://designauto.com.br/webhook/hotmart`);
    console.log(`📋 Teste de status: http://localhost:${WEBHOOK_PORT}/status`);
  });
}

// Se for executado diretamente (não como módulo)
if (import.meta.url === `file://${process.argv[1]}`) {
  startWebhookServer();
}

export default webhookApp;