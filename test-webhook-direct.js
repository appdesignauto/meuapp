/**
 * Script simplificado para testar diretamente o endpoint de webhook da Hotmart
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
    // Dados de exemplo do webhook da Hotmart com formato real
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
          "name": "Cliente Teste Webhook",
          "email": "cliente.teste.webhook@example.com",
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
    console.log(`Corpo da resposta: ${responseData}`);
    console.log(`Email do cliente simulado: ${webhookData.data.buyer.email}`);
    console.log(`Transação: ${webhookData.data.purchase.transaction}`);
    
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
  }
}

// Executa o teste
testWebhook();