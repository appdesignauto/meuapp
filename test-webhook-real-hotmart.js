/**
 * Script para testar o webhook exato da Hotmart que aparece na imagem
 * Este script envia um webhook que corresponde exatamente ao formato real
 */

import fetch from 'node-fetch';

async function enviarWebhook() {
  const url = 'http://localhost:5000/webhook/hotmart-fixed';
  
  // Payload exato como mostrado na imagem compartilhada pelo usuário
  const payload = {
    "id": "42338ce6-7974-4519-854a-cae504d820a1",
    "creation_date": 1747540995368,
    "event": "PURCHASE_APPROVED",
    "version": "2.0.0",
    "data": {
      "product": {
        "id": 5381714,
        "ucode": "eef7f8c8-ce74-47aa-a8da-d1e7505df8a",
        "name": "App DesignAuto",
        "warranty_date": "2025-05-25T00:00:00Z",
        "has_co_production": false,
        "is_physical_product": false
      },
      // Adicionando mais campos que provavelmente existem no webhook real
      "purchase": {
        "transaction": "HP2363007968",
        "order_date": "2025-05-18T04:03:15.368Z",
        "status": "APPROVED"
      },
      "customer": {
        "email": "comprador-real@hotmart.com",
        "name": "Comprador Real"
      }
    }
  };

  console.log('Enviando webhook real da Hotmart para:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    // Adicionar o cabeçalho X-Hotmart-Hmac-SHA256 para simular autenticação
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hmac-SHA256': 'simulacao-de-assinatura'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();
    console.log('Status code:', response.status);
    console.log('Resposta:', responseData);
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
  }
}

enviarWebhook();