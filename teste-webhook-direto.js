/**
 * Script de teste direto para webhook da Hotmart
 * Este script envia um payload simulado para o endpoint de webhook
 */

import fetch from 'node-fetch';

async function testarWebhook() {
  // Simulando o payload da Hotmart
  const payload = {
    event: 'PURCHASE_APPROVED',
    data: {
      buyer: {
        name: 'Cliente Teste Webhook',
        email: 'teste-webhook@example.com',
        document: '12345678900'
      },
      purchase: {
        status: 'APPROVED',
        order_date: new Date().toISOString(),
        date_next_charge: new Date(Date.now() + 31536000000).toISOString(),
        transaction: `TX-${Date.now()}`,
        payment: {
          type: 'CREDIT_CARD'
        },
        price: {
          value: 97.00,
          currency_value: 'BRL'
        },
        offer: {
          code: 'aukjngrt'
        }
      },
      subscription: {
        plan: {
          name: 'Plano Anual',
          id: '1'
        },
        subscriber: {
          code: `SUB-${Date.now()}`
        }
      }
    }
  };

  console.log('🔄 Enviando payload de teste para o webhook...');
  
  try {
    const response = await fetch('http://localhost:5000/webhook/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    
    console.log(`✅ Resposta: ${response.status}`);
    console.log(responseData);
    
    console.log('\n🔍 Verificando se o webhook foi processado...');
    
    // Mostrar instruções ao usuário
    console.log(`
    Para verificar se o usuário foi criado, execute:
    
    SELECT * FROM users WHERE email = 'teste-webhook@example.com';
    
    Para verificar o log do webhook, execute:
    
    SELECT * FROM webhook_logs WHERE email = 'teste-webhook@example.com' ORDER BY id DESC LIMIT 1;
    `);
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
  }
}

testarWebhook().catch(error => {
  console.error('Erro ao executar teste:', error);
});