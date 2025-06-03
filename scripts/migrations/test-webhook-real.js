/**
 * Script para testar um webhook real da Hotmart
 * Este script simula o exato payload recebido da interface Hotmart
 */

import fetch from 'node-fetch';

async function enviarWebhook() {
  const url = 'http://localhost:5000/webhook/hotmart-fixed';
  
  // Payload exato como mostrado nas imagens
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
      "affiliates": [
        {
          "affiliate_code": "",
          "name": ""
        }
      ]
      // Nota: resto do payload truncado para simplificar
    }
  };

  console.log('Enviando webhook para:', url);
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