/**
 * Script para simular um webhook com cliente novo
 * Este script envia um webhook com um cliente completamente novo para teste
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

// Gera uma assinatura HMAC SHA1 (como a Hotmart faz)
function generateSignature(data, secret = 'test_secret') {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

async function testWebhook() {
  try {
    // Email único para garantir que sempre seja um cliente novo
    const uniqueEmail = `cliente.novo.${Date.now()}@example.com`;
    
    // Dados de exemplo do webhook da Hotmart com formato real e email único
    const webhookData = {
      "id": "test-" + Date.now(),
      "creation_date": Date.now(),
      "event": "PURCHASE_APPROVED",
      "version": "2",
      "data": {
        "purchase": {
          "offer": {
            "code": "abc123xyz",
            "key": 987654
          },
          "transaction": "HP" + Math.floor(Math.random() * 10000000),
          "approved_date": new Date().toISOString()
        },
        "product": {
          "id": 12345,
          "name": "Plano Premium DesignAuto",
          "has_co_production": false
        },
        "buyer": {
          "name": "Cliente Novo Único",
          "email": uniqueEmail,
          "checkout_phone": "+5511999887766"
        },
        "subscription": {
          "subscriber": {
            "code": "SUB" + Math.floor(Math.random() * 10000000)
          },
          "plan": {
            "name": "plano anual",
            "frequency": "YEARLY"
          },
          "status": "ACTIVE"
        },
        "price": {
          "value": 197.00
        }
      }
    };

    // Gera a assinatura
    const signature = generateSignature(webhookData);
    
    // URL do webhook no ambiente atual
    const serverUrl = 'https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev';
    const webhookUrl = `${serverUrl}/api/webhook/hotmart`;
    
    console.log(`Enviando webhook para: ${webhookUrl}`);
    console.log(`Email do cliente simulado: ${uniqueEmail}`);
    
    // Envia a requisição para o endpoint de webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': signature
      },
      body: JSON.stringify(webhookData)
    });
    
    const responseData = await response.text();
    
    console.log(`Resposta do servidor: ${response.status}`);
    console.log(`Corpo da resposta: ${responseData.substring(0, 100)}...`); // Mostra apenas parte da resposta
    console.log(`Transação: ${webhookData.data.purchase.transaction}`);
    
    return {
      email: uniqueEmail,
      transaction: webhookData.data.purchase.transaction,
      success: response.status === 200
    };
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
    return { success: false, error: error.message };
  }
}

// Executa o teste
testWebhook().then(result => {
  console.log('\nRESUMO DO TESTE:');
  console.log('---------------');
  console.log(`Email: ${result.email}`);
  console.log(`Transação: ${result.transaction}`);
  console.log(`Sucesso: ${result.success ? 'SIM' : 'NÃO'}`);
  
  if (result.error) {
    console.log(`Erro: ${result.error}`);
  }
  
  console.log('\nAgora execute o comando a seguir para verificar se o webhook foi registrado:');
  console.log(`node fix-webhook-processor.mjs | grep "${result.email}"`);
});