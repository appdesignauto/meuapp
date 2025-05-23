/**
 * Servidor Express dedicado exclusivamente para Webhooks
 * 
 * Este arquivo cria um servidor Express simples que pode ser executado
 * separadamente para processar exclusivamente webhooks, sem interferência
 * de outras partes da aplicação.
 * 
 * Execute com: node server/webhook-express-server.js
 */

// Importações necessárias
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Cria um app Express
const app = express();

// Configurar middlewares essenciais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar CORS básico
app.use(cors({
  origin: '*',  // Permitir qualquer origem para webhooks
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Hotmart-Webhook-Signature']
}));

// Função para encontrar email em qualquer parte do payload
function findEmailInPayload(payload) {
  if (!payload) return null;
  
  // Busca recursiva
  function searchEmail(obj) {
    if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
      return obj;
    }
    
    if (typeof obj === 'object' && obj !== null) {
      // Verificar chaves comuns
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
  
  // Busca recursiva
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

// Webhook da Hotmart
app.post('/hotmart', async (req, res) => {
  const startTime = Date.now();
  
  console.log('📩 Webhook Hotmart recebido em:', new Date().toISOString());
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
  
  try {
    // Extrair dados do payload
    const payload = req.body;
    const event = payload?.event || 'UNKNOWN';
    const email = findEmailInPayload(payload);
    const transactionId = findTransactionId(payload);
    
    console.log(`📊 Dados extraídos: evento=${event}, email=${email}, transactionId=${transactionId}`);
    
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
      
      console.log('✅ Webhook registrado no banco de dados');
      await pool.end();
    } catch (dbError) {
      console.error('❌ Erro ao registrar webhook:', dbError);
      // Continuar mesmo com erro de log
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Tempo de processamento: ${processingTime}ms`);
    
    // Retornar resposta rapidamente (máximo 200ms)
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Mesmo com erro, retornar 200 para evitar reenvios
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas confirmamos o recebimento',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de teste
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    message: 'Servidor webhook está funcionando corretamente'
  });
});

// Escolher a porta (padrão: 3333 - diferente da aplicação principal)
const PORT = process.env.WEBHOOK_PORT || 3333;

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Webhook iniciado em: http://0.0.0.0:${PORT}`);
  console.log(`📌 Endpoints:`);
  console.log(`   - Hotmart webhook: http://0.0.0.0:${PORT}/hotmart`);
  console.log(`   - Status:          http://0.0.0.0:${PORT}/status`);
  console.log('');
  console.log('⚠️ IMPORTANTE:');
  console.log('   Configure a URL do webhook na Hotmart para:');
  console.log(`   - https://designauto.com.br/webhook/hotmart`);
  console.log('');
  console.log('   Certifique-se de que esta porta (3333) esteja redirecionada corretamente no seu servidor web!');
});