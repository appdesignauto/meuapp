/**
 * Script para testar o evento SUBSCRIPTION_CANCELLATION em todas as rotas de webhook da Hotmart
 * 
 * Este script envia um webhook simulado de cancelamento para cada uma das rotas:
 * 1. /webhook/hotmart (index.ts)
 * 2. /api/webhook/hotmart (webhook-routes.ts)
 * 3. /api/webhooks/hotmart (routes.ts)
 */

const axios = require('axios');

// Endereço base do servidor
const BASE_URL = 'http://localhost:3000';

// Obter o segredo da Hotmart do ambiente
const HOTMART_SECRET = process.env.HOTMART_SECRET || 'test-secret';

// Payload de teste simulando um evento de cancelamento de assinatura
const testPayload = {
  event: 'SUBSCRIPTION_CANCELLATION',
  data: {
    subscriber: {
      email: 'teste@example.com'
    },
    subscription: {
      code: 'CAN-TEST-123',
      status: 'CANCELLED'
    }
  },
  hottok: HOTMART_SECRET
};

// Função para testar uma rota de webhook
async function testWebhookRoute(route) {
  try {
    console.log(`\n🔍 Testando rota: ${route}`);
    
    const response = await axios.post(`${BASE_URL}${route}`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Token': HOTMART_SECRET
      }
    });
    
    console.log(`✅ Resposta da rota ${route}:`);
    console.log(`Status: ${response.status}`);
    console.log('Corpo da resposta:', response.data);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao testar rota ${route}:`, error.message);
    if (error.response) {
      console.error('Resposta de erro:', error.response.data);
    }
    return false;
  }
}

// Executar testes para cada rota
async function runTests() {
  console.log('🚀 Iniciando testes de webhook de cancelamento da Hotmart');
  
  const routes = [
    '/webhook/hotmart',
    '/api/webhook/hotmart',
    '/api/webhooks/hotmart'
  ];
  
  let successCount = 0;
  
  for (const route of routes) {
    const success = await testWebhookRoute(route);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Resultado dos testes: ${successCount}/${routes.length} rotas funcionando corretamente`);
}

// Executar testes
runTests();