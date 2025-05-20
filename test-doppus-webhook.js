/**
 * Script para testar a integração Doppus
 * Este script simula um webhook da Doppus para testar a funcionalidade de processamento
 */

import fetch from 'node-fetch';
import { createHmac } from 'crypto';

// Configurações
// Use a URL do Replit para testes em ambiente de produção
const WEBHOOK_URL = process.env.REPLIT_URL 
  ? `https://${process.env.REPLIT_URL}/api/webhooks/doppus` 
  : 'https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev/api/webhooks/doppus';
const DOPPUS_SECRET_KEY = process.env.DOPPUS_SECRET_KEY || 'f8bb3a727ac70b8217d01407febd0dc6';

console.log('URL do webhook:', WEBHOOK_URL);

// Exemplo de payload de teste (baseado no formato da Doppus)
// Este payload simula um evento de compra aprovada
const payload = {
  event: 'purchase.success',
  timestamp: new Date().toISOString(),
  data: {
    customer: {
      name: 'Cliente Teste',
      email: 'cliente.teste@example.com',
      phone: '+5511987654321'
    },
    transaction: {
      code: 'DOPPUS-' + Math.floor(Math.random() * 10000),
      payment_method: 'credit_card',
      installments: 1,
      status: 'approved'
    },
    subscription: {
      plan_id: 'premium_30',  // ID do plano no DesignAuto
      plan_name: 'Premium Mensal',
      price: 39.90,
      currency: 'BRL',
      duration_days: 30,
      is_trial: false
    }
  }
};

// Gera assinatura HMAC para o webhook
function generateSignature(body, secret) {
  const hmac = createHmac('sha256', secret);
  hmac.update(JSON.stringify(body));
  return hmac.digest('hex');
}

// Função para enviar o webhook simulado
async function sendTestWebhook() {
  console.log('🔄 Enviando webhook de teste para Doppus...');
  
  try {
    const signature = generateSignature(payload, DOPPUS_SECRET_KEY);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Doppus-Signature': signature,
        'X-Doppus-Event': payload.event
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    console.log('✅ Webhook enviado com sucesso!');
    console.log('📊 Código de status:', response.status);
    console.log('📝 Resposta:', JSON.stringify(result, null, 2));
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error);
    return { status: 'error', error: error.message };
  }
}

// Executa o teste de webhook
sendTestWebhook()
  .then(() => {
    console.log('🏁 Teste concluído!');
  })
  .catch(error => {
    console.error('🔥 Erro durante o teste:', error);
  });