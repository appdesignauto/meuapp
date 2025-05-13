/**
 * Script para testar o endpoint de webhook da Hotmart
 * 
 * Este script simula diferentes eventos da Hotmart, enviando payloads para o endpoint /api/webhooks/hotmart
 * Útil para testar localmente a integração sem precisar configurar na Hotmart
 * 
 * Uso:
 * 1. Execute este script após iniciar o servidor:
 *    node test-hotmart-webhook.js [evento]
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

const fetch = require('node-fetch');

// Configuração
const BASE_URL = 'http://localhost:5000'; // URL base do servidor local
const WEBHOOK_PATH = '/api/webhooks/hotmart';
const HOTMART_SECRET = process.env.HOTMART_SECRET || 'seu_token_secreto_hotmart'; // Use o mesmo valor da env HOTMART_SECRET
const TEST_EMAIL = process.env.TEST_EMAIL || 'example@test.com';

// Obter evento dos argumentos da linha de comando
const EVENT_TYPE = process.argv[2] || 'approved';

// Função para criar payloads de teste com base no tipo de evento
function createTestPayload(eventType) {
  const currentDate = new Date();
  const futureDate = new Date();
  
  // Simular data de término um mês no futuro
  futureDate.setMonth(futureDate.getMonth() + 1);
  
  const basePayload = {
    data: {
      buyer: {
        email: TEST_EMAIL,
        name: 'Usuário de Teste'
      },
      purchase: {
        transaction: `test-${Date.now()}`,
        due_date: futureDate.toISOString()
      },
      subscription: {
        plan: {
          name: 'Premium Mensal'
        },
        end_date: futureDate.toISOString()
      }
    }
  };
  
  switch (eventType.toLowerCase()) {
    case 'approved':
      return {
        ...basePayload,
        event: 'PURCHASE_APPROVED'
      };
    
    case 'canceled':
      return {
        ...basePayload,
        event: 'SUBSCRIPTION_CANCELED'
      };
    
    case 'refunded':
      return {
        ...basePayload,
        event: 'PURCHASE_REFUNDED'
      };
    
    case 'expired':
      return {
        ...basePayload,
        event: 'PURCHASE_EXPIRED'
      };
    
    case 'delayed':
      return {
        ...basePayload,
        event: 'PURCHASE_DELAYED'
      };
      
    default:
      console.error(`Evento '${eventType}' desconhecido. Usando 'approved' como padrão.`);
      return {
        ...basePayload,
        event: 'PURCHASE_APPROVED'
      };
  }
}

// Função para enviar a requisição de teste
async function sendTestWebhook(payload) {
  try {
    console.log(`\n[Teste Webhook Hotmart] Enviando evento ${payload.event} para ${TEST_EMAIL}...`);
    
    const response = await fetch(`${BASE_URL}${WEBHOOK_PATH}?token=${HOTMART_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Token': HOTMART_SECRET
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    
    console.log(`\n[Teste Webhook Hotmart] Status: ${response.status}`);
    console.log('[Teste Webhook Hotmart] Resposta:');
    console.log(JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      console.error(`\n[Teste Webhook Hotmart] ERRO: A requisição falhou com status ${response.status}`);
    } else {
      console.log(`\n[Teste Webhook Hotmart] SUCESSO: Evento ${payload.event} processado corretamente!`);
    }
  } catch (error) {
    console.error('\n[Teste Webhook Hotmart] ERRO na requisição:');
    console.error(error);
  }
}

// Execução principal
async function main() {
  const payload = createTestPayload(EVENT_TYPE);
  console.log('\n[Teste Webhook Hotmart] Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  await sendTestWebhook(payload);
}

// Executar
main().catch(error => {
  console.error('\n[Teste Webhook Hotmart] Erro fatal:');
  console.error(error);
  process.exit(1);
});