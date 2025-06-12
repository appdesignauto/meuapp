/**
 * Script para testar webhook de estorno da Doppus
 * Este script simula o webhook que você enviou com status "reversed"
 */

async function testDoppusRefundWebhook() {
  console.log('🔄 Testando webhook de estorno da Doppus...');

  const webhookData = {
    "customer": {
      "name": "Fernando Simões Doppus",
      "email": "soguruscursos@gmail.com",
      "phone": "55 (27) 99871-1558",
      "doc_type": "CPF",
      "doc": "138.304.117-23",
      "ip_address": "179.180.240.95"
    },
    "items": [
      {
        "code": "50110338",
        "name": "App Design Auto",
        "offer": "83779723",
        "offer_name": "Premium Anual",
        "type": "principal",
        "value": 500
      }
    ],
    "recurrence": {
      "code": "6KDCNBLO8R",
      "periodicy": "yearly",
      "expiration_date": "2026-06-12"
    },
    "transaction": {
      "code": "7ZXKHPGEFR",
      "registration_date": "2025-06-12 00:50:30",
      "items": 500,
      "subtotal": 500,
      "total": 500,
      "fee_producer": 500
    },
    "payment": {
      "method": "pix",
      "plots": 1
    },
    "status": {
      "registration_date": "2025-06-12 01:43:09",
      "code": "reversed",
      "message": "Transação com pagamento estornado.",
      "log": [
        {
          "registration_date": "2025-06-12 00:50:30",
          "code": "waiting",
          "message": "PIX gerado com sucesso."
        },
        {
          "registration_date": "2025-06-12 00:51:13",
          "code": "approved",
          "message": "Pagamento aprovado."
        },
        {
          "registration_date": "2025-06-12 01:42:55",
          "code": "reversing",
          "message": "Devolução do pagamento em processamento."
        },
        {
          "registration_date": "2025-06-12 01:43:09",
          "code": "reversed",
          "message": "Transação estornada."
        }
      ]
    }
  };

  try {
    console.log('📦 Enviando webhook de estorno para:', webhookData.customer.email);
    console.log('🔄 Status:', webhookData.status.code);
    console.log('💰 Valor:', webhookData.transaction.total);
    console.log('📱 Plano:', webhookData.items[0].offer_name);

    const response = await fetch('https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev/webhook/doppus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Doppus-Webhook/1.0'
      },
      body: JSON.stringify(webhookData)
    });

    const result = await response.text();
    
    console.log('\n📊 RESULTADO DO TESTE:');
    console.log('Status:', response.status);
    console.log('Response:', result);

    if (response.status === 200) {
      console.log('✅ Webhook de estorno processado com sucesso!');
      console.log('👤 Usuário deve ter sido rebaixado para "free"');
    } else {
      console.log('❌ Erro no processamento do webhook');
    }

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
  }
}

// Executar o teste
testDoppusRefundWebhook();