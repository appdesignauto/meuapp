// Script para testar o endpoint de webhook da Doppus diretamente
import fetch from 'node-fetch';

async function testDoppusEndpoint() {
  // Payload no novo formato da Doppus
  const payload = {
    "customer": {
      "name": "Cliente Teste Doppus",
      "email": "teste.doppus@exemplo.com"
    },
    "status": {
      "code": "approved",
      "date": "2025-05-17T16:30:00.000Z"
    },
    "transaction": {
      "code": "TX123456789",
      "total": 297.00,
      "payment_type": "credit_card"
    },
    "items": [
      {
        "code": "designauto-product",
        "name": "Design Auto Premium",
        "offer": "anual-platinum",
        "offer_name": "Plano Anual Platinum"
      }
    ],
    "recurrence": {
      "code": "REC123456",
      "periodicy": "yearly",
      "expiration_date": "2026-05-17T16:30:00.000Z"
    }
  };

  try {
    // Testar diretamente no endpoint local
    console.log('Testando rota de webhook Doppus diretamente...');
    
    const response = await fetch('http://localhost:3000/api/webhooks/doppus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status da resposta:', response.status);
    
    let responseText;
    try {
      responseText = await response.text();
      console.log('Corpo da resposta:', responseText);
    } catch (e) {
      console.log('Não foi possível extrair o corpo da resposta');
    }
    
    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      response: responseText
    };
  } catch (error) {
    console.error('Erro ao testar endpoint:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

testDoppusEndpoint().then(result => {
  console.log('Resultado do teste:', JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Erro durante execução do teste:', err);
});
