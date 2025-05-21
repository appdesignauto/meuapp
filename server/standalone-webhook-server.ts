/**
 * Servidor Express Standalone para Webhooks
 * 
 * Este servidor é COMPLETAMENTE INDEPENDENTE do servidor principal
 * e roda em uma porta diferente, garantindo que nenhum middleware
 * do servidor principal interfira na resposta dos webhooks.
 */

import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import { processHotmartSubscription } from './services/hotmart-subscription-processor';

// Carrega variáveis de ambiente
dotenv.config();

// Porta para o servidor standalone de webhooks (diferente da porta principal)
const WEBHOOK_PORT = 5001;

// Inicia servidor Express dedicado
const webhookApp = express();

// Configurações básicas
webhookApp.use(express.json());
webhookApp.use(express.urlencoded({ extended: true }));

// Configurar CORS básico permitindo Hotmart e Doppus
webhookApp.use(cors({
  origin: [
    'https://hotmart.com',
    'https://www.hotmart.com',
    'https://developers.hotmart.com',
    'https://apis.hotmart.com',
    'https://sandbox.hotmart.com',
    'https://api-content.hotmart.com',
    'https://api-hot-connect.hotmart.com',
    'https://api-sec.hotmart.com',
    'https://api-sec-vlc.hotmart.com',
    'https://doppler.co',
    'https://api.doppler.co'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-Hotmart-Webhook-Signature',
    'X-Hotmart-Webhook-Token',
    'X-Forwarded-For',
    'User-Agent'
  ]
}));

// Interface para erro com mensagem
interface ErrorWithMessage {
  message: string;
}

// Função auxiliar para verificar se o erro possui a propriedade message
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Função para extrair mensagem de erro de qualquer tipo de erro
function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

// Middleware de logging para Debug
webhookApp.use((req, res, next) => {
  console.log(`📝 [STANDALONE WEBHOOK] ${req.method} ${req.url}`);
  console.log('📝 [STANDALONE WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method === 'POST') {
    console.log('📝 [STANDALONE WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Forçar cabeçalhos anti-cache
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-No-Cache', Date.now().toString());
  
  next();
});

// Função para encontrar email em qualquer parte do payload da Hotmart
function findEmailInPayload(payload: any): string | null {
  if (!payload) return null;
  
  // Função recursiva para buscar emails em objetos aninhados
  function searchEmail(obj: any): string | null {
    // Caso base: é uma string e parece um email
    if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
      return obj;
    }
    
    // Caso recursivo: objeto
    if (typeof obj === 'object' && obj !== null) {
      // Verificar chaves que provavelmente contêm email
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
    
    // Caso recursivo: array
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

// Função para encontrar ID da transação no payload
function findTransactionId(payload: any): string | null {
  if (!payload) return null;
  
  // Verificar locais comuns primeiro
  if (payload.data?.purchase?.transaction) return payload.data.purchase.transaction;
  if (payload.data?.transaction) return payload.data.transaction;
  if (payload.transaction) return payload.transaction;
  
  // Função recursiva para busca profunda
  function searchTransactionId(obj: any): string | null {
    if (!obj || typeof obj !== 'object') return null;
    
    // Procurar por chaves que possam conter o ID da transação
    for (const key in obj) {
      if (
        (key.toLowerCase().includes('transaction') || 
         key.toLowerCase().includes('order') || 
         key.toLowerCase().includes('pedido')) && 
        typeof obj[key] === 'string'
      ) {
        return obj[key];
      }
      
      // Buscar recursivamente
      if (typeof obj[key] === 'object') {
        const result = searchTransactionId(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchTransactionId(payload);
}

// Rota principal para webhook da Hotmart
webhookApp.post('/hotmart', async (req, res) => {
  console.log('📩 [STANDALONE] Webhook da Hotmart recebido em', new Date().toISOString());
  
  // IMPORTANTE: Responder IMEDIATAMENTE para a Hotmart com sucesso
  // para evitar o timeout - isso é crucial!
  res.status(200).json({
    success: true,
    message: 'Webhook recebido com sucesso pelo servidor STANDALONE',
    timestamp: new Date().toISOString()
  });
  
  // Após enviar a resposta, processar os dados em background
  // para não bloquear a resposta da API
  try {
    // Capturar dados básicos do webhook
    const payload = req.body;
    const event = payload?.event || 'UNKNOWN';
    const email = findEmailInPayload(payload);
    const transactionId = findTransactionId(payload);
    
    console.log(`📊 [STANDALONE] Dados extraídos: evento=${event}, email=${email}, transactionId=${transactionId}`);
    
    // Registrar no banco de dados (log only)
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
          email,
          'hotmart',
          JSON.stringify(payload),
          transactionId,
          req.ip,
          new Date()
        ]
      );
      
      console.log('✅ [STANDALONE] Webhook registrado no banco de dados');
      
      // Processar a assinatura da Hotmart
      console.log('🔄 [STANDALONE] Iniciando processamento da assinatura...');
      try {
        await processHotmartSubscription(payload);
        console.log('✅ [STANDALONE] Assinatura processada com sucesso');
        
        // Atualizar o status do webhook no banco
        await pool.query(
          `UPDATE webhook_logs SET status = $1, processed_at = $2
           WHERE transaction_id = $3 AND source = $4
           ORDER BY created_at DESC LIMIT 1`,
          ['processed', new Date(), transactionId, 'hotmart']
        );
      } catch (processingError: unknown) {
        console.error('❌ [STANDALONE] Erro ao processar assinatura:', processingError);
        
        // Atualizar o status do webhook no banco (erro)
        await pool.query(
          `UPDATE webhook_logs SET status = $1, processed_at = $2, error_message = $3
           WHERE transaction_id = $4 AND source = $5
           ORDER BY created_at DESC LIMIT 1`,
          ['error', new Date(), getErrorMessage(processingError), transactionId, 'hotmart']
        );
      }
      
      await pool.end();
    } catch (dbError) {
      console.error('❌ [STANDALONE] Erro ao registrar webhook:', dbError);
      // Continuar mesmo com erro de log
    }
  } catch (error) {
    console.error('❌ [STANDALONE] Erro ao processar webhook:', error);
  }
});

// Rota de diagnóstico (GET) para verificar se o servidor está respondendo
webhookApp.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    message: 'Servidor standalone de webhooks está funcionando corretamente'
  });
});

// Iniciar servidor standalone
webhookApp.listen(WEBHOOK_PORT, () => {
  console.log(`🚀 Servidor STANDALONE de webhooks iniciado na porta ${WEBHOOK_PORT}`);
  console.log(`📌 URLs dos webhooks:`);
  console.log(`   - Hotmart: http://localhost:${WEBHOOK_PORT}/hotmart`);
  console.log(`   - Status:  http://localhost:${WEBHOOK_PORT}/status`);
  console.log(`⚠️  IMPORTANTE: Configure a URL do webhook na Hotmart para:`);
  console.log(`   - Em desenvolvimento: http://<seu-ip>:${WEBHOOK_PORT}/hotmart`);
  console.log(`   - Em produção: https://designauto.com.br:${WEBHOOK_PORT}/hotmart`);
});