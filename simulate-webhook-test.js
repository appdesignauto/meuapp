/**
 * Script para testar o servidor de webhook
 * 
 * Este script envia uma requisição para o servidor webhook dedicado
 * para verificar se ele está funcionando corretamente.
 */

import fetch from 'node-fetch';

// Payload de teste baseado em um webhook real da Hotmart
const testPayload = {
  "id": "66d1c222-5fe2-4548-854a-08cd789d4ceb",
  "creation_date": Date.now(),
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 5381714,
      "ucode": "fb056612-bcc6-4217-9e6d-2a5d1110ac2f",
      "name": "Produto test postback2",
      "warranty_date": "2025-05-18T00:00:00Z"
    },
    "buyer": {
      "email": "teste@designauto.com.br",
      "name": "Teste Comprador",
      "first_name": "Teste",
      "last_name": "Comprador"
    },
    "purchase": {
      "approved_date": Date.now(),
      "transaction": "HP" + Math.floor(Math.random() * 100000000000),
      "status": "APPROVED"
    },
    "subscription": {
      "status": "ACTIVE",
      "plan": {
        "id": 123,
        "name": "plano de teste"
      }
    }
  }
};

async function testWebhook() {
  console.log('🧪 Iniciando teste do servidor webhook...');
  
  try {
    // Primeiro, verificamos se o servidor está online
    console.log('1️⃣ Verificando status do servidor...');
    const statusResponse = await fetch('http://localhost:3333/status');
    const statusData = await statusResponse.json();
    
    console.log('✅ Servidor online:', statusData);
    
    // Agora, enviamos o payload de teste para o webhook
    console.log('\n2️⃣ Enviando payload de teste para o webhook...');
    const webhookResponse = await fetch('http://localhost:3333/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Signature': 'test-signature'
      },
      body: JSON.stringify(testPayload)
    });
    
    const webhookData = await webhookResponse.json();
    
    console.log('✅ Resposta do webhook:', webhookData);
    console.log('⏱️ Tempo de resposta:', webhookResponse.headers.get('X-Response-Time') || 'N/A');
    
    // Verificamos se o status code é 200
    if (webhookResponse.status === 200) {
      console.log('\n🎉 TESTE BEM-SUCEDIDO!');
      console.log('O servidor webhook está funcionando corretamente e respondendo rapidamente.');
    } else {
      console.log('\n⚠️ ATENÇÃO: O servidor respondeu, mas com status diferente de 200');
      console.log('Status code:', webhookResponse.status);
    }
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔴 O servidor webhook não está rodando ou não está acessível na porta 3333');
      console.log('Certifique-se de iniciar o servidor com: node server/webhook-express-server.js');
    }
  }
}

testWebhook();