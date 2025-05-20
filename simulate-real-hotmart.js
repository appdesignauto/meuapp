/**
 * Script para simular um webhook da Hotmart com a estrutura exata do webhook real
 * 
 * Este script usa o exato mesmo formato que o webhook real da Hotmart,
 * usando o payload que recebemos via interface da Hotmart
 */

import fetch from 'node-fetch';

// Configuração
const baseUrl = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}`
  : 'http://localhost:5000';

const HOTMART_TOKEN = process.env.HOTMART_SECRET;

// Usar o payload exato recebido da Hotmart
const payload = {
  "id": "083bb5a0-f7e0-414b-b600-585a015403f2",
  "creation_date": 1747447467789,
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 5381714,
      "ucode": "eef7f8c8-ce74-47aa-a8da-d1e7505dfa8a",
      "name": "App DesignAuto",
      "warranty_date": "2025-05-23T00:00:00Z",
      "has_co_production": false,
      "is_physical_product": false
    },
    "affiliates": [
      {
        "affiliate_code": "",
        "name": ""
      }
    ],
    "buyer": {
      "email": "ws.advogaciasm@gmail.com",
      "name": "Teste Fernando",
      "first_name": "Teste",
      "last_name": "Fernando",
      "address": {
        "country": "Brasil",
        "country_iso": "BR"
      },
      "document": "13164498748",
      "document_type": "CPF"
    },
    "producer": {
      "name": "EDITORA INOVE DIGITAL LTDA",
      "document": "52883206000100",
      "legal_nature": "Pessoa Jurídica"
    },
    "commissions": [
      {
        "value": 1.4,
        "source": "MARKETPLACE",
        "currency_value": "BRL"
      },
      {
        "value": 5.6,
        "source": "PRODUCER",
        "currency_value": "BRL"
      }
    ],
    "purchase": {
      "approved_date": 1747447464000,
      "full_price": {
        "value": 7,
        "currency_value": "BRL"
      },
      "price": {
        "value": 7,
        "currency_value": "BRL"
      },
      "checkout_country": {
        "name": "Brasil",
        "iso": "BR"
      },
      "order_bump": {
        "is_order_bump": false
      },
      "original_offer_price": {
        "value": 7,
        "currency_value": "BRL"
      },
      "order_date": 1747447427000,
      "status": "APPROVED",
      "transaction": "HP2363007968",
      "payment": {
        "installments_number": 1,
        "type": "PIX",
        "pix_qrcode": "https://live-us.adyen.com/hpp/generateQRCodeImage.shtml?url=00020101021226900014br.gov.bcb.pix2568pix.adyen.com%2Fpixqrcodelocation%2Fpixloc%2Fv1%2Floc%2FBeGxGYPFSt6WC59dSb3I4A5204000053039865802BR5902HT6009SAO+PAULO62070503***63048083",
        "pix_code": "00020101021226900014br.gov.bcb.pix2568pix.adyen.com/pixqrcodelocation/pixloc/v1/loc/BeGxGYPFSt6WC59dSb3I4A5204000053039865802BR5902HT6009SAO PAULO62070503***63048083",
        "pix_expiration_date": 1747620227000
      },
      "offer": {
        "code": "aukjngrt"
      },
      "invoice_by": "HOTMART",
      "subscription_anticipation_purchase": false,
      "date_next_charge": 1779019200000,
      "recurrence_number": 1,
      "is_funnel": false,
      "business_model": "I"
    },
    "subscription": {
      "status": "ACTIVE",
      "plan": {
        "id": 1038897,
        "name": "Plano Anual"
      },
      "subscriber": {
        "code": "IY8BW62L"
      }
    }
  },
  "hottok": HOTMART_TOKEN
};

console.log(`Simulando webhook REAL da Hotmart para ${baseUrl}/api/webhooks/hotmart`);
console.log(`Usando token: ${HOTMART_TOKEN.substring(0, 5)}...`);
console.log(`Email: ${payload.data.buyer.email}`);
console.log(`Transação: ${payload.data.purchase.transaction}`);
console.log("ID do produto:", payload.data.product.id);
console.log("ID da oferta:", payload.data.purchase.offer.code);
console.log("Nome do plano:", payload.data.subscription.plan.name);

// TESTE 1: Enviar com payload exato da Hotmart com hottok no corpo
console.log("\n1. Testando com formato exato da Hotmart (hottok no corpo):");
fetch(`${baseUrl}/api/webhooks/hotmart`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
.then(response => {
  console.log(`Status da resposta: ${response.status}`);
  return response.json().then(data => ({ status: response.status, data }));
})
.then(({ status, data }) => {
  console.log('Resposta do servidor:');
  console.log(JSON.stringify(data, null, 2));
  
  if (status >= 200 && status < 300 && data.success) {
    console.log("\n✅ Webhook processado com sucesso com hottok no corpo!");
    
    // Verificar se o usuário foi criado/atualizado
    return fetch(`${baseUrl}/api/admin/users/search?query=${payload.data.buyer.email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(userData => {
      console.log('\nVerificando usuário criado/atualizado:');
      console.log(JSON.stringify(userData, null, 2));
    });
  } else {
    console.log("\n❌ Erro ao processar webhook com hottok no corpo");
    
    // TESTE 2: Enviar com X-Hotmart-Webhook-Token no cabeçalho
    console.log("\n2. Testando com X-Hotmart-Webhook-Token no cabeçalho:");
    const payloadWithoutHottok = { ...payload };
    delete payloadWithoutHottok.hottok;
    
    return fetch(`${baseUrl}/api/webhooks/hotmart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Token': HOTMART_TOKEN
      },
      body: JSON.stringify(payloadWithoutHottok)
    })
    .then(response => {
      console.log(`Status da resposta: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log('Resposta do servidor:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log("\n✅ Webhook processado com sucesso com X-Hotmart-Webhook-Token!");
        
        // Verificar se o usuário foi criado/atualizado
        return fetch(`${baseUrl}/api/admin/users/search?query=${payload.data.buyer.email}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(userData => {
          console.log('\nVerificando usuário criado/atualizado:');
          console.log(JSON.stringify(userData, null, 2));
        });
      } else {
        console.log("\n❌ Erro ao processar webhook com ambos os métodos");
      }
    });
  }
})
.catch(error => {
  console.error('Erro ao executar teste:', error);
});