/**
 * Script para testar webhook da Hotmart com dados reais
 */
const https = require('https');
const http = require('http');

// Dados do webhook real da Hotmart
const webhookData = {
  "id": "465d040b-89a8-4ce3-98e7-97e478f0ba36",
  "creation_date": 1747517645598,
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 5381714,
      "ucode": "eef7f8c8-ce74-47aa-a8da-d1e7505dfa8a",
      "name": "App DesignAuto",
      "warranty_date": "2025-05-24T00:00:00Z",
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
      "email": "kitescolinhacrista@gmail.com",
      "name": "Fernando Teste 3",
      "first_name": "Fernando",
      "last_name": "3",
      "address": {
        "country": "Brasil",
        "country_iso": "BR"
      },
      "document": "",
      "document_type": ""
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
      "approved_date": 1747517642000,
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
      "order_date": 1747517610000,
      "status": "APPROVED",
      "transaction": "HP0260583448",
      "payment": {
        "installments_number": 1,
        "type": "PIX",
        "pix_qrcode": "https://live-us.adyen.com/hpp/generateQRCodeImage.shtml?url=00020101021226900014br.gov.bcb.pix2568pix.adyen.com%2Fpixqrcodelocation%2Fpixloc%2Fv1%2Floc%2Ft24zEdO2Rkicsl8Y9qxG_Q5204000053039865802BR5902HT6009SAO+PAULO62070503***63044AAA",
        "pix_code": "00020101021226900014br.gov.bcb.pix2568pix.adyen.com/pixqrcodelocation/pixloc/v1/loc/t24zEdO2Rkicsl8Y9qxG_Q5204000053039865802BR5902HT6009SAO PAULO62070503***63044AAA",
        "pix_expiration_date": 1747690410000
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
        "code": "9GYG4EOB"
      }
    }
  },
  "hottok": "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719"
};

console.log("🔄 Enviando webhook real da Hotmart...");

// Determinar URL do webhook
const baseUrl = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
  : "http://localhost:5000";

// URL relativa do endpoint
const webhookPath = "/webhook/hotmart";

// Parse a URL para obter as partes
const url = new URL(baseUrl);
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: webhookPath,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Hotmart-Webhook-Token': webhookData.hottok
  }
};

// Escolher o módulo HTTP correto baseado no protocolo
const httpModule = url.protocol === 'https:' ? https : http;

// Enviar a requisição
const req = httpModule.request(options, (res) => {
  console.log(`📊 Status da resposta: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log(`📄 Corpo da resposta: ${responseData}`);
    
    if (res.statusCode === 200) {
      console.log("✅ Webhook processado com sucesso!");
    } else {
      console.log("❌ Erro ao processar webhook!");
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Erro na requisição: ${error.message}`);
});

// Enviar os dados do webhook
req.write(JSON.stringify(webhookData));
req.end();
