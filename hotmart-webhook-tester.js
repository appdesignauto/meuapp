/**
 * Script para testar o sistema de webhooks assíncronos da Hotmart
 * 
 * Este script simula o envio de webhooks da Hotmart para o servidor
 * e pode ser usado para testar a implementação sem depender da Hotmart.
 */

const fetch = require('node-fetch');

// URL do endpoint de webhook (altere para seu domínio)
const WEBHOOK_URL = 'http://localhost:3000/api/webhook-hotmart';

// Exemplos de payloads de webhook da Hotmart
const webhookExamples = [
  // Exemplo 1: Assinatura aprovada
  {
    event: 'PURCHASE_APPROVED',
    data: {
      product: {
        id: 'PRODUTO123',
        name: 'Plano Mensal DesignAuto',
        price: 29.90
      },
      purchase: {
        transaction: 'TRANS123456',
        status: 'PURCHASE_APPROVED',
        customer: {
          name: 'Cliente de Teste',
          email: 'cliente@teste.com.br'
        },
        plan: {
          name: 'Mensal'
        }
      }
    }
  },
  
  // Exemplo 2: Renovação de assinatura
  {
    event: 'SUBSCRIPTION_RENEWED',
    data: {
      product: {
        id: 'PRODUTO123',
        name: 'Plano Anual DesignAuto',
        price: 299.90
      },
      purchase: {
        transaction: 'TRANS789012',
        status: 'SUBSCRIPTION_RENEWED',
        customer: {
          name: 'Outro Cliente',
          email: 'outro@cliente.com.br'
        },
        plan: {
          name: 'Anual'
        }
      }
    }
  },
  
  // Exemplo 3: Cancelamento de assinatura
  {
    event: 'SUBSCRIPTION_CANCELLED',
    data: {
      product: {
        id: 'PRODUTO123',
        name: 'Plano Mensal DesignAuto'
      },
      purchase: {
        transaction: 'TRANS345678',
        status: 'SUBSCRIPTION_CANCELLED',
        customer: {
          name: 'Cliente Cancelado',
          email: 'cancelado@cliente.com.br'
        }
      }
    }
  }
];

// Função para enviar um webhook de teste
async function sendTestWebhook(payload) {
  try {
    console.log(`Enviando webhook para ${WEBHOOK_URL}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hotmart-Webhook-Simulator/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    console.log(`Resposta (Status ${response.status}):`);
    console.log(responseText);
    console.log('-----------------------------------');
    
    return { status: response.status, body: responseText };
  } catch (error) {
    console.error('Erro ao enviar webhook:', error.message);
    return { status: 0, error: error.message };
  }
}

// Enviar todos os webhooks de teste com intervalo entre eles
async function sendAllTestWebhooks() {
  console.log('Iniciando envio de webhooks de teste...');
  
  for (let i = 0; i < webhookExamples.length; i++) {
    console.log(`\nEnviando webhook de teste #${i+1}...`);
    await sendTestWebhook(webhookExamples[i]);
    
    // Esperar um pouco entre cada envio
    if (i < webhookExamples.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\nTodos os webhooks de teste foram enviados!');
}

// Executar o teste automaticamente
sendAllTestWebhooks()
  .then(() => {
    console.log('Testes concluídos.');
  })
  .catch(error => {
    console.error('Erro nos testes:', error);
  });