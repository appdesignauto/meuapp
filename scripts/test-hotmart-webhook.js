/**
 * Script para testar o webhook da Hotmart
 * 
 * Este script envia requisições de teste para o endpoint do webhook
 * simulando diferentes eventos da Hotmart
 */

const fetch = require('node-fetch');

// URL base (ajustar conforme necessário para seu ambiente)
const BASE_URL = 'http://localhost:3000';

// Endpoint do webhook
const WEBHOOK_URL = `${BASE_URL}/api/webhook-hotmart`;

// Dados de exemplo para um evento de compra aprovada
const PURCHASE_APPROVED_PAYLOAD = {
  event: 'PURCHASE_APPROVED',
  data: {
    buyer: {
      email: 'cliente.teste@exemplo.com',
      name: 'Cliente Teste'
    },
    purchase: {
      transaction: 'HOTM-123456789',
      status: 'APPROVED',
      payment_method: 'CREDIT_CARD'
    },
    subscription: {
      plan: {
        name: 'Plano Premium Mensal'
      },
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
    }
  }
};

// Dados de exemplo para um evento de assinatura cancelada
const SUBSCRIPTION_CANCELED_PAYLOAD = {
  event: 'SUBSCRIPTION_CANCELED',
  data: {
    buyer: {
      email: 'cliente.teste@exemplo.com',
      name: 'Cliente Teste'
    },
    purchase: {
      transaction: 'HOTM-123456789',
      status: 'CANCELED'
    }
  }
};

// Função para enviar uma requisição de teste
async function testWebhook(payload) {
  try {
    console.log(`\n\n==== TESTE DE WEBHOOK: ${payload.event} ====`);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    console.log(`Status HTTP: ${response.status}`);
    console.log('Resposta:');
    console.log(JSON.stringify(result, null, 2));
    
    return {
      success: response.status === 200,
      status: response.status,
      data: result
    };
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

// Função principal que executa todos os testes
async function runTests() {
  console.log('==========================================');
  console.log('  TESTE DE INTEGRAÇÃO WEBHOOK HOTMART');
  console.log('==========================================');
  console.log(`URL: ${WEBHOOK_URL}\n`);
  
  // Teste 1: Compra aprovada
  await testWebhook(PURCHASE_APPROVED_PAYLOAD);
  
  // Pausa de 2 segundos entre testes
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: Assinatura cancelada
  await testWebhook(SUBSCRIPTION_CANCELED_PAYLOAD);
  
  console.log('\n==========================================');
  console.log('  TESTES FINALIZADOS');
  console.log('==========================================');
}

// Executa os testes
runTests();