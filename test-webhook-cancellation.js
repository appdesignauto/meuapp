/**
 * Script para testar o evento de cancelamento de assinatura da Hotmart
 * Este script simula uma requisição ao endpoint do webhook para cancelar uma assinatura
 */

const fetch = require('node-fetch');

// Dados simulados de um evento de cancelamento da Hotmart
const sampleCancellationData = {
  data: {
    subscription: {
      subscriber: {
        code: "SUB-TEST-123",
        email: "test@example.com",
        name: "Usuário Teste"
      },
      plan: {
        name: "Plano Mensal"
      },
      status: "CANCELLED",
      expiresDate: new Date().toISOString(),
      cancellationDate: new Date().toISOString()
    },
    product: {
      id: process.env.HOTMART_MENSAL_PRODUCT_ID || "12345",
      name: "Plano Pro - Mensal"
    }
  },
  event: "SUBSCRIPTION_CANCELLATION",
  id: "test-event-" + Date.now(),
  creationDate: new Date().toISOString()
};

async function simulateCancellationWebhook() {
  try {
    // URL local para o endpoint do webhook
    const webhookUrl = 'http://localhost:5000/webhook/hotmart/simulate';
    
    console.log('Enviando requisição de cancelamento para:', webhookUrl);
    console.log('Dados:', JSON.stringify(sampleCancellationData, null, 2));
    
    // Enviar a requisição para o endpoint
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Event': 'SUBSCRIPTION_CANCELLATION',
        'X-Hotmart-Hottok': 'simulation-token'
      },
      body: JSON.stringify(sampleCancellationData)
    });
    
    // Verificar a resposta
    const result = await response.json();
    
    console.log('Status da resposta:', response.status);
    console.log('Resposta:', JSON.stringify(result, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Webhook de cancelamento processado com sucesso!');
    } else {
      console.log('❌ Erro ao processar webhook de cancelamento!');
    }
  } catch (error) {
    console.error('Erro ao simular webhook de cancelamento:', error);
  }
}

console.log('Iniciando simulação de webhook de cancelamento da Hotmart...');
simulateCancellationWebhook();