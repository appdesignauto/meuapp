/**
 * Script para simular um webhook de cancelamento da Hotmart
 * Este script envia uma requisição para o endpoint de webhook da Hotmart
 * simulando um evento de cancelamento de assinatura
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import { db } from './server/db.js';

// Estrutura do webhook de cancelamento da Hotmart
const webhookData = {
  event: 'SUBSCRIPTION_CANCELLATION',
  data: {
    subscriber: {
      email: 'inovedigitalmarketing10@gmail.com'
    },
    subscription: {
      id: 'SUB123456789',
      code: 'SUB123456789',
      status: 'CANCELLED'
    },
    purchase: {
      transaction: 'SUB123456789'
    },
    cancellation_date: new Date().toISOString()
  }
};

async function getHotmartSecret() {
  try {
    // Buscar secret da Hotmart do banco de dados
    const settings = await db.query.subscriptionSettings.findFirst();
    return settings?.hotmartSecret || process.env.HOTMART_SECRET;
  } catch (error) {
    console.error('Erro ao buscar segredo da Hotmart:', error);
    return process.env.HOTMART_SECRET;
  }
}

// Função para gerar assinatura HMAC
function generateSignature(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

async function simulateWebhook() {
  try {
    // Buscar o segredo da Hotmart
    const secret = await getHotmartSecret();
    
    if (!secret) {
      throw new Error('Não foi possível obter o segredo da Hotmart');
    }
    
    console.log('🔑 Segredo da Hotmart obtido');
    
    // Gerar assinatura HMAC
    const signature = generateSignature(webhookData, secret);
    
    console.log('🔏 Assinatura gerada:', signature);
    
    // URL do webhook (local)
    const webhookUrl = 'http://localhost:5000/api/webhooks/hotmart';
    
    console.log('🚀 Enviando webhook simulado para:', webhookUrl);
    console.log('📦 Dados do webhook:', JSON.stringify(webhookData, null, 2));
    
    // Enviar requisição para o webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Token': secret,
        'X-Hotmart-Signature': signature
      },
      body: JSON.stringify(webhookData)
    });
    
    const responseData = await response.json();
    
    console.log('✅ Resposta do webhook:', responseData);
    console.log('📝 Status da resposta:', response.status);
    
    return responseData;
  } catch (error) {
    console.error('❌ Erro ao simular webhook:', error);
    return { success: false, error: error.message };
  } finally {
    // Fechar conexão com o banco de dados
    process.exit(0);
  }
}

// Executar simulação
simulateWebhook();