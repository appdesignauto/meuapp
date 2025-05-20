/**
 * Script para simular o envio de um webhook específico da Hotmart
 * com o transaction_id "HP1863303991"
 */

const fetch = require('node-fetch');

async function simulateSpecificWebhook() {
  // Webhook payload com o ID de transação HP1863303991
  const webhookData = {
    id: "66d1c222-5fe2-4548-854a-08cd789d4ceb",
    data: {
      buyer: {
        name: "Fernando Oliveira",
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
        transaction: "HP1863303991",  // ID específico da transação
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
    },
    event: "PURCHASE_APPROVED",
    hottok: "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719",
    version: "2.0.0",
    creation_date: "2025-05-18T17:01:35.805Z"
  };

  try {
    // Enviar requisição para o servidor webhook local
    console.log('Enviando webhook para http://localhost:5001/hotmart...');
    
    const response = await fetch('http://localhost:5001/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    // Verificar se a resposta foi bem-sucedida
    if (response.ok) {
      const responseData = await response.json();
      console.log('Resposta do servidor webhook:', responseData);
      console.log('Webhook simulado com sucesso!');
    } else {
      console.error('Erro ao enviar webhook:', response.status, response.statusText);
      const responseText = await response.text();
      console.error('Detalhes do erro:', responseText);
    }
  } catch (error) {
    console.error('Erro durante a simulação do webhook:', error);
  }
}

// Executar a simulação
simulateSpecificWebhook();