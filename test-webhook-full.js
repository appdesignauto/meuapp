/**
 * Script para testar um webhook COMPLETO da Hotmart
 * Este script simula um payload completo baseado no webhook real recebido
 */

import fetch from 'node-fetch';

async function enviarWebhook() {
  const url = 'http://localhost:5000/webhook/hotmart-fixed';
  
  // Payload completo baseado no webhook real
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
      "purchase": {
        "transaction": "HP2363007968",
        "order_date": "2025-05-18T04:03:15.368Z",
        "status": "APPROVED",
        "payment": {
          "method": "CREDIT_CARD",
          "installments_number": 1
        },
        "offer": {
          "code": "aukjngrt",
          "payment_mode": "PAYMENT_SINGLE"
        }
      },
      "customer": {
        "email": "cliente-teste@example.com",
        "name": "Cliente Teste",
        "checkout_phone": "+5511987654321"
      },
      "affiliates": [
        {
          "affiliate_code": "",
          "name": ""
        }
      ],
      "producer": {
        "name": "DesignAuto"
      }
    }
  };

  console.log('Enviando webhook completo para:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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