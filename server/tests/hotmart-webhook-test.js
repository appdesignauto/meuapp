/**
 * Script para testar a rota de webhook da Hotmart
 * 
 * Este script simula o envio de diferentes tipos de eventos de webhook
 * da Hotmart para a rota /api/webhook-hotmart
 */

const fetch = require('node-fetch');

// URL base da aplicação (ajuste conforme necessário)
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

// Endpoint do webhook
const WEBHOOK_URL = `${BASE_URL}/api/webhook-hotmart`;

// Modelo de payload para teste de assinatura aprovada
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
        name: 'Plano Mensal Premium'
      },
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
    }
  }
};

// Modelo de payload para teste de assinatura cancelada
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

// Modelo de payload para teste de pagamento em atraso
const PURCHASE_DELAYED_PAYLOAD = {
  event: 'PURCHASE_DELAYED',
  data: {
    buyer: {
      email: 'cliente.teste@exemplo.com',
      name: 'Cliente Teste'
    },
    purchase: {
      transaction: 'HOTM-123456789',
      status: 'DELAYED'
    }
  }
};

// Função para enviar um payload de teste para o webhook
async function testWebhook(payload) {
  try {
    console.log(`\n\n======= ENVIANDO ${payload.event} =======`);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Resposta:');
    console.log(JSON.stringify(data, null, 2));
    
    return { success: response.status === 200, data };
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
    return { success: false, error: String(error) };
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log('============== TESTE DE WEBHOOK HOTMART ==============');
  console.log(`Servidor alvo: ${WEBHOOK_URL}`);
  console.log('======================================================\n');
  
  // Teste 1: Assinatura aprovada
  await testWebhook(PURCHASE_APPROVED_PAYLOAD);
  
  // Pequena pausa entre os testes
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Teste 2: Assinatura cancelada
  await testWebhook(SUBSCRIPTION_CANCELED_PAYLOAD);
  
  // Pequena pausa entre os testes
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Teste 3: Pagamento em atraso
  await testWebhook(PURCHASE_DELAYED_PAYLOAD);
  
  console.log('\n======================================================');
  console.log('Testes concluídos!');
  console.log('======================================================');
}

// Executar todos os testes
runAllTests();