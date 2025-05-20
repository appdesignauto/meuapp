/**
 * Script para testar diretamente o endpoint de webhook da Hotmart
 * 
 * Este script envia uma requisição para o endpoint de webhook da Hotmart
 * com um payload de teste para verificar se o servidor está processando
 * corretamente a requisição e retornando um JSON válido (não HTML)
 */

import fetch from 'node-fetch';

// URL do webhook (porta 5000 para o servidor Express)
const webhookUrl = 'http://localhost:5000/webhook/hotmart';

// Payload de teste simulando um evento da Hotmart
const testPayload = {
  event: 'PURCHASE_APPROVED',
  creation_date: Date.now(),
  data: {
    product: {
      id: '1234567',
      name: 'Produto Teste',
      has_co_production: false
    },
    purchase: {
      transaction: 'TX-' + Math.floor(Math.random() * 1000000),
      approved_date: Date.now(),
      status: 'APPROVED',
      payment: {
        type: 'CREDIT_CARD',
        installments_number: 1
      }
    },
    buyer: {
      email: 'teste@example.com',
      name: 'Cliente Teste',
      checkout_phone: '+5511999999999'
    },
    subscription: {
      subscriber: {
        code: 'SUB-' + Math.floor(Math.random() * 1000000),
        email: 'teste@example.com',
        name: 'Cliente Teste'
      },
      plan: {
        name: 'Plano Premium',
        status: 'ACTIVE'
      }
    }
  }
};

// Cabeçalhos simulando requisição da Hotmart
const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Hotmart-Webhook/1.0',
  'X-Hotmart-Webhook-Signature': 'test-signature'
};

async function testWebhook() {
  console.log('🧪 Testando endpoint de webhook da Hotmart...');
  console.log(`📮 Enviando requisição para: ${webhookUrl}`);
  console.log(`📦 Payload de teste:`, JSON.stringify(testPayload, null, 2));

  try {
    // Enviar requisição POST para o endpoint de webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testPayload)
    });

    // Obter texto da resposta para analisar
    const responseText = await response.text();

    // Verificar status da resposta
    console.log(`📥 Status da resposta: ${response.status} ${response.statusText}`);
    console.log(`📄 Tipo de conteúdo: ${response.headers.get('content-type')}`);

    try {
      // Tentar parsear como JSON
      const jsonResponse = JSON.parse(responseText);
      console.log('✅ Resposta JSON válida:');
      console.log(JSON.stringify(jsonResponse, null, 2));
      return true;
    } catch (jsonError) {
      // Se não for um JSON válido, mostrar o início do texto (pode ser HTML)
      console.error('❌ Resposta não é um JSON válido!');
      console.log(`📃 Primeiros 200 caracteres da resposta:`);
      console.log(responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      console.error('Erro ao parsear JSON:', jsonError.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
    return false;
  }
}

// Executar o teste
console.log('📊 TESTE DE WEBHOOK HOTMART');
console.log('===========================');
testWebhook()
  .then(success => {
    if (success) {
      console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
      console.log('O servidor está respondendo corretamente com JSON');
    } else {
      console.log('❌ TESTE FALHOU!');
      console.log('O servidor não retornou uma resposta JSON válida');
    }
  })
  .catch(err => {
    console.error('❌ ERRO FATAL:', err);
  });