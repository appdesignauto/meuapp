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
  
  try {
    // Capturar dados básicos do webhook
    const payload = req.body;
    const event = payload?.event || 'UNKNOWN';
    const email = findEmailInPayload(payload);
    const transactionId = findTransactionId(payload);
    
    console.log(`📊 [STANDALONE] Dados extraídos: evento=${event}, email=${email}, transactionId=${transactionId}`);
    
    // Criar conexão com o banco de dados
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    let webhookLogId = null;
    
    try {
      // 1. Registrar o webhook no banco de dados
      const logResult = await pool.query(
        `INSERT INTO webhook_logs 
         (event_type, status, email, source, raw_payload, transaction_id, source_ip, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
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
      
      webhookLogId = logResult.rows[0]?.id;
      console.log(`✅ [STANDALONE] Webhook registrado no banco de dados com ID: ${webhookLogId}`);
      
      // 2. Extrair dados do payload para resposta
      let productId = null;
      let productName = null;
      let planName = null;
      
      if (payload.data?.product?.id) {
        productId = payload.data.product.id;
      }
      
      if (payload.data?.product?.name) {
        productName = payload.data.product.name;
      }
      
      if (payload.data?.subscription?.plan?.name) {
        planName = payload.data.subscription.plan.name;
      }
      
      // 3. Verificar se o email existe no sistema de usuários
      if (email) {
        const userCheck = await pool.query(
          `SELECT id, email FROM users WHERE email = $1`,
          [email]
        );
        
        // Se o usuário existe, processar o webhook de acordo com o evento
        if (userCheck.rows.length > 0) {
          const userId = userCheck.rows[0].id;
          
          // 4. Processar evento de acordo com o tipo
          switch (event) {
            case 'PURCHASE_APPROVED':
              // Atualizar usuário para status premium
              await pool.query(
                `UPDATE users 
                 SET tipoplano = $1, 
                     origemassinatura = $2, 
                     dataassinatura = NOW(), 
                     dataexpiracao = (NOW() + INTERVAL '1 year'),
                     atualizadoem = NOW()
                 WHERE id = $3`,
                [planName || 'Plano Anual', 'hotmart', userId]
              );
              console.log(`✅ [STANDALONE] Usuário ${email} atualizado para plano premium`);
              break;
              
            case 'SUBSCRIPTION_CANCELLATION':
            case 'PURCHASE_REFUNDED':
              // Rebaixar usuário para gratuito
              await pool.query(
                `UPDATE users 
                 SET tipoplano = NULL, 
                     dataexpiracao = NOW(),
                     atualizadoem = NOW()
                 WHERE id = $1`,
                [userId]
              );
              console.log(`✅ [STANDALONE] Assinatura cancelada para usuário ${email}`);
              break;
              
            default:
              console.log(`ℹ️ [STANDALONE] Evento ${event} registrado mas sem ação específica`);
          }
          
          // 5. Atualizar status no log de webhook
          await pool.query(
            `UPDATE webhook_logs 
             SET status = 'processed', 
                 updated_at = NOW()
             WHERE id = $1`,
            [webhookLogId]
          );
        } else {
          console.log(`ℹ️ [STANDALONE] Email ${email} não encontrado no sistema, apenas registrando webhook`);
        }
      }
      
      // Sempre retornar sucesso para a Hotmart não reenviar
      return res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso',
        event,
        email,
        transactionId,
        productId,
        productName,
        planName,
        timestamp: new Date().toISOString()
      });
      
    } catch (dbError) {
      console.error('❌ [STANDALONE] Erro no processamento do banco de dados:', dbError);
      
      // Registrar erro no log se tiver um ID
      if (webhookLogId) {
        try {
          await pool.query(
            `UPDATE webhook_logs 
             SET status = 'error', 
                 error_message = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [dbError.message || 'Erro no processamento', webhookLogId]
          );
        } catch (updateError) {
          console.error('❌ [STANDALONE] Erro adicional ao atualizar status do webhook:', updateError);
        }
      }
      
      // Sempre retornar 200 para a Hotmart não reenviar
      return res.status(200).json({
        success: true, // Respondemos true mesmo com erro para não confundir o cliente
        message: 'Webhook recebido com sucesso pelo servidor STANDALONE',
        timestamp: new Date().toISOString()
      });
    } finally {
      // Garantir que a conexão seja fechada em qualquer cenário
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ [STANDALONE] Erro ao processar webhook:', error);
    
    // Mesmo com erro, retornar 200 para evitar reenvios
    return res.status(200).json({
      success: true, // Respondemos true mesmo com erro para não confundir o cliente
      message: 'Webhook recebido com sucesso pelo servidor STANDALONE',
      timestamp: new Date().toISOString()
    });
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