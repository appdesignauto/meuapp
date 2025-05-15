/**
 * Script para testar o endpoint de webhook do Doppus
 * 
 * Este script simula eventos do Doppus, enviando payloads para o endpoint /api/webhooks/doppus
 * Útil para testar localmente a integração sem precisar configurar na plataforma Doppus
 * 
 * Uso:
 * 1. Execute este script após iniciar o servidor:
 *    node test-doppus-webhook.js [evento]
 * 
 * 2. Os eventos disponíveis são:
 *    - approved: Simula uma aprovação de compra
 *    - canceled: Simula um cancelamento de assinatura
 *    - refunded: Simula um reembolso
 *    - expired: Simula uma expiração de assinatura
 * 
 * 3. Por padrão, usa o email example@test.com como cliente
 *    Para testar com outro email, defina a variável de ambiente TEST_EMAIL
 */

import fetch from 'node-fetch';

// Email de teste - pode ser substituído por variável de ambiente
const TEST_EMAIL = process.env.TEST_EMAIL || 'example@test.com';
// URL do servidor - ajuste conforme necessário
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

function createTestPayload(eventType) {
  const transactionId = `doppus-test-${Date.now()}`;
  const now = new Date().toISOString();
  
  // Estrutura base do payload
  const payload = {
    event: eventType,
    data: {
      transaction: {
        code: transactionId,
        date: now,
        status: 'completed',
        paymentType: 'credit_card'
      },
      subscription: {
        plan: 'PRO',
        startDate: now,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      customer: {
        email: TEST_EMAIL,
        name: 'Cliente Teste Doppus',
        document: '12345678900'
      }
    }
  };
  
  // Ajustes específicos para cada tipo de evento
  switch(eventType) {
    case 'approved':
      payload.event = 'purchase_approved';
      break;
    case 'canceled':
      payload.event = 'subscription_canceled';
      payload.data.subscription.status = 'canceled';
      payload.data.cancelReason = 'Cliente solicitou';
      break;
    case 'refunded':
      payload.event = 'purchase_refunded';
      payload.data.refundReason = 'Cliente insatisfeito';
      break;
    case 'expired':
      payload.event = 'subscription_expired';
      payload.data.subscription.status = 'expired';
      break;
    default:
      throw new Error(`Tipo de evento desconhecido: ${eventType}`);
  }
  
  return payload;
}

async function sendTestWebhook(payload) {
  const webhookEndpoint = `${SERVER_URL}/api/webhooks/doppus`;
  
  try {
    const response = await fetch(webhookEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Doppus-Signature': 'test-signature',
        'X-Doppus-Event': payload.event
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Resposta: ${result}`);
    
    return { status: response.status, response: result };
  } catch (error) {
    console.error('Erro ao enviar webhook:', error.message);
    throw error;
  }
}

// Função principal auto-executável
(async function() {
  try {
    const eventType = process.argv[2] || 'approved';
    console.log(`Enviando evento ${eventType} do Doppus para o email ${TEST_EMAIL}...`);
    
    const payload = createTestPayload(eventType);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const result = await sendTestWebhook(payload);
    console.log('Webhook enviado com sucesso!');
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();