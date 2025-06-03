/**
 * Script para simular um webhook de diagnóstico
 * Este script envia uma requisição para o endpoint de diagnóstico webhook
 * usando o formato esperado da Hotmart
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

// URL de destino - ajuste para o seu ambiente
const WEBHOOK_URL = 'http://localhost:5000/webhook/debug';

// Payload baseado no formato Hotmart versão 2.0
const payload = {
  id: "42338ce6-7974-4519-854a-cae504d820a1",
  event: "PURCHASE_APPROVED",
  version: "2.0.0",
  creation_date: new Date().toISOString(),
  hottok: "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719",
  data: {
    buyer: {
      name: "Fernando Oliveira ",
      email: "testuser@example.com",
      address: {
        country: "Brasil",
        country_iso: "BR"
      },
      document: "",
      last_name: "Oliveira",
      first_name: "Fernando",
      document_type: ""
    },
    product: {
      id: 5381714,
      name: "App DesignAuto",
      ucode: "eef7f8c8-ce74-47aa-a8da-d1e7505dfa8a",
      warranty_date: "2025-05-25T00:00:00Z",
      has_co_production: false,
      is_physical_product: false
    },
    producer: {
      name: "EDITORA INOVE DIGITAL LTDA",
      document: "52883206000100",
      legal_nature: "Pessoa Jurídica"
    },
    purchase: {
      offer: {
        code: "aukjngrt"
      },
      price: {
        value: 7,
        currency_value: "BRL"
      },
      status: "APPROVED",
      payment: {
        type: "PIX",
        pix_code: "00020101021226900014br.gov.bcb.pix2568pix.test",
        pix_qrcode: "https://test-url/qrcode",
        installments_number: 1,
        pix_expiration_date: "2025-05-20T04:02:36.000Z"
      },
      is_funnel: false,
      full_price: {
        value: 7,
        currency_value: "BRL"
      },
      invoice_by: "HOTMART",
      order_bump: {
        is_order_bump: false
      },
      order_date: "2025-05-18T04:02:36.000Z",
      transaction: "HP1787159814",
      approved_date: "2025-05-18T04:03:12.000Z",
      business_model: "I",
      checkout_country: {
        iso: "BR",
        name: "Brasil"
      },
      date_next_charge: "2026-05-18T12:00:00.000Z",
      recurrence_number: 1,
      original_offer_price: {
        value: 7,
        currency_value: "BRL"
      },
      subscription_anticipation_purchase: false
    },
    affiliates: [{
      name: "",
      affiliate_code: ""
    }],
    commissions: [{
      value: 1.4,
      source: "MARKETPLACE",
      currency_value: "BRL"
    }, {
      value: 5.6,
      source: "PRODUCER",
      currency_value: "BRL"
    }],
    subscription: {
      plan: {
        id: 1038897,
        name: "Plano Anual"
      },
      status: "ACTIVE",
      subscriber: {
        code: "9OL3KY4O"
      }
    }
  }
};

// Função para gerar assinatura (simulando o formato da Hotmart)
function generateSignature(data, secret = 'test_secret') {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

async function simulateWebhook() {
  try {
    console.log(`🚀 Enviando payload de diagnóstico para ${WEBHOOK_URL}...`);
    
    // Gerar assinatura para simular validação
    const signature = generateSignature(payload);
    
    // Enviar requisição para o endpoint de webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Signature': signature,
        'User-Agent': 'Hotmart-Webhook/1.0'
      },
      body: JSON.stringify(payload),
    });
    
    // Obter resposta
    const responseData = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Resposta:`, JSON.stringify(responseData, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Simulação de webhook de diagnóstico enviada com sucesso!');
    } else {
      console.error('❌ Erro ao enviar webhook de diagnóstico');
    }
  } catch (error) {
    console.error('❌ Erro durante a simulação:', error.message);
  }
}

// Executar simulação
simulateWebhook();