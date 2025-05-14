// Script para testar o sistema de logging de webhooks da Hotmart
require('dotenv').config();
const fetch = require('node-fetch');

// Configuração
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HOTMART_TOKEN = process.env.HOTMART_SECRET || 'teste_local';

// Função para simular um webhook da Hotmart
async function simulateHotmartWebhook() {
  // Exemplo de payload de um webhook de aprovação de compra
  const payload = {
    event: 'PURCHASE_APPROVED',
    id: '123456789',
    creation_date: new Date().toISOString(),
    data: {
      buyer: {
        email: 'teste@example.com',
        name: 'Usuário Teste'
      },
      purchase: {
        transaction: '987654321',
        approved_date: new Date().toISOString(),
        status: 'APPROVED',
        payment: {
          method: 'CREDIT_CARD',
          installments_number: 1
        },
        offer: {
          code: 'TEST123',
          key: 'curso-premium'
        },
        plan: {
          name: 'Plano Premium Mensal',
          duration: {
            type: 'MONTH',
            quantity: 1
          }
        }
      },
      subscription: {
        plan: {
          name: 'Plano Premium Mensal',
          recurrency_period: 'MONTHLY'
        },
        status: 'ACTIVE',
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  };

  try {
    console.log('Enviando webhook simulado...');
    
    // Enviar a requisição para o endpoint do webhook
    const response = await fetch(`${BASE_URL}/api/webhooks/hotmart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Token': HOTMART_TOKEN,
        'X-Forwarded-For': '1.2.3.4' // IP simulado
      },
      body: JSON.stringify(payload)
    });
    
    // Processar a resposta
    const result = await response.json();
    
    console.log(`Status da resposta: ${response.status}`);
    console.log('Resposta:', JSON.stringify(result, null, 2));
    
    // Verificar logs do webhook
    if (response.status === 200) {
      console.log('\nBuscando logs de webhooks...');
      await checkWebhookLogs();
    }
    
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
  }
}

// Função para buscar os logs de webhooks registrados
async function checkWebhookLogs() {
  try {
    // Esta chamada requer autenticação como admin, por isso pode falhar em testes locais
    // sem autenticação adequada
    const response = await fetch(`${BASE_URL}/api/admin/webhook-logs?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Inclui cookies se autenticado no browser
    });
    
    if (response.status === 401) {
      console.log('Não foi possível buscar logs (acesso não autorizado - precisa estar logado como admin)');
      return;
    }
    
    const result = await response.json();
    console.log('Logs de webhooks recentes:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Erro ao buscar logs de webhooks:', error);
  }
}

// Executar a simulação
simulateHotmartWebhook();