/**
 * Script para testar o webhook da Hotmart
 * Este script simula uma requisição ao endpoint do webhook para verificar se está funcionando corretamente
 */

const fetch = require('node-fetch');

// Dados simulados de um evento de compra da Hotmart
const samplePurchaseData = {
  data: {
    purchase: {
      transaction: "TEST-TRANSACTION-123",
      status: "APPROVED",
      subscription: {
        subscriber: {
          code: "SUB-TEST-123",
          email: "test@example.com"
        },
        plan: {
          name: "Plano Mensal"
        },
        status: "ACTIVE",
        recurrenceNumber: 1,
        accession: {
          date: new Date().toISOString()
        }
      }
    },
    product: {
      id: process.env.HOTMART_MENSAL_PRODUCT_ID || "12345",
      name: "Plano Pro - Mensal"
    }
  },
  event: "PURCHASE_APPROVED",
  id: "test-event-" + Date.now(),
  creationDate: new Date().toISOString()
};

async function simulateWebhook() {
  try {
    // URL local para o endpoint do webhook
    const webhookUrl = 'http://localhost:5000/webhook/hotmart/simulate';
    
    console.log('Enviando requisição para:', webhookUrl);
    console.log('Dados:', JSON.stringify(samplePurchaseData, null, 2));
    
    // Enviar a requisição para o endpoint
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Event': 'PURCHASE_APPROVED',
        'X-Hotmart-Hottok': 'simulation-token'
      },
      body: JSON.stringify(samplePurchaseData)
    });
    
    // Verificar a resposta
    const result = await response.json();
    
    console.log('Status da resposta:', response.status);
    console.log('Resposta:', JSON.stringify(result, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Webhook processado com sucesso!');
    } else {
      console.log('❌ Erro ao processar webhook!');
    }
  } catch (error) {
    console.error('Erro ao simular webhook:', error);
  }
}

console.log('Iniciando simulação de webhook da Hotmart...');
simulateWebhook();