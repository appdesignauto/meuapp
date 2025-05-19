/**
 * Utilitário para testar o webhook da Hotmart
 * Este script simula uma requisição de webhook da Hotmart
 */

const axios = require('axios');

// Configuração do teste
const webhookUrl = 'http://localhost:3000/api/webhook-hotmart';
const eventType = process.argv[2] || 'PURCHASE_APPROVED'; // Tipo de evento (padrão: PURCHASE_APPROVED)

// Criar payload de teste baseado no tipo de evento
function createTestPayload(event) {
  const basePayload = {
    event: event,
    data: {
      purchase: {
        transaction: Math.random().toString(36).substring(2, 15),
        status: 'APPROVED'
      },
      buyer: {
        email: 'teste@example.com',
        name: 'Cliente Teste'
      },
      subscription: {
        plan: {
          name: 'Plano Premium',
          price: 97.00
        },
        status: event.includes('CANCELLED') ? 'CANCELLED' : 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  };
  
  return basePayload;
}

// Função principal
async function testWebhook() {
  try {
    console.log(`🔍 Testando webhook com evento: ${eventType}`);
    
    const payload = createTestPayload(eventType);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    // Enviar requisição para o webhook
    console.log(`📤 Enviando requisição para: ${webhookUrl}`);
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hotmart-Webhook-Test'
      }
    });
    
    console.log('✅ Resposta do servidor:', response.status, response.statusText);
    if (response.data) {
      console.log('📄 Corpo da resposta:', JSON.stringify(response.data, null, 2));
    }
    
    console.log('🎉 Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
    if (error.response) {
      console.error('📄 Resposta de erro:', error.response.status, error.response.statusText);
      console.error('📄 Corpo da resposta:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Executar o teste
testWebhook();

/**
 * Instruções de uso:
 * 
 * 1. Inicie o servidor webhook:
 *    $ node server/webhook-hotmart.cjs
 * 
 * 2. Em outra janela, execute este script:
 *    $ node test-webhook.js PURCHASE_APPROVED
 * 
 * Outros tipos de eventos para testar:
 * - PURCHASE_APPROVED (padrão)
 * - SUBSCRIPTION_ACTIVATED
 * - SUBSCRIPTION_CANCELLED
 * - PURCHASE_CANCELED
 * - PURCHASE_REFUNDED
 * - SUBSCRIPTION_EXPIRED
 */