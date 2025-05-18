/**
 * Script para testar o novo endpoint aprimorado de webhook da Hotmart
 * Este script envia exatamente o mesmo payload que falhou anteriormente
 * para validar o processamento correto pelo novo manipulador.
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Função principal para testar o webhook aprimorado
async function testEnhancedWebhook() {
  console.log('🧪 Iniciando teste do webhook aprimorado...');
  
  try {
    // Usar o payload exato que falhou anteriormente (PURCHASE_APPROVED com formato Hotmart 2.0.0)
    // Exemplo de payload real que falhou no processamento regular
    const webhookPayload = {
      "id": "42338ce6-7974-4519-854a-cae504d820a1",
      "creation_date": 1747540995368,
      "event": "PURCHASE_APPROVED",
      "version": "2.0.0",
      "data": {
        "product": {
          "id": 5381714,
          "ucode": "eef7f8c8-ce74-47aa-a8da-d1e7505dfa8a",
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
        ],
        "buyer": {
          "email": "canvaparamusicos@gmail.com",
          "name": "Fernando Oliveira ",
          "first_name": "Fernando",
          "last_name": "Oliveira",
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
          "approved_date": 1747540992000,
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
          "order_date": 1747540956000,
          "status": "APPROVED",
          "transaction": "HP1787159814",
          "payment": {
            "installments_number": 1,
            "type": "PIX",
            "pix_qrcode": "https://live-us.adyen.com/hpp/generateQRCodeImage.shtml?url=00020101021226900014br.gov.bcb.pix2568pix.adyen.com%2Fpixqrcodelocation%2Fpixloc%2Fv1%2Floc%2FQyn_eP58SW2RwN8MID0AAQ5204000053039865802BR5902HT6009SAO+PAULO62070503***6304135C",
            "pix_code": "00020101021226900014br.gov.bcb.pix2568pix.adyen.com/pixqrcodelocation/pixloc/v1/loc/Qyn_eP58SW2RwN8MID0AAQ5204000053039865802BR5902HT6009SAO PAULO62070503***6304135C",
            "pix_expiration_date": 1747713756000
          },
          "offer": {
            "code": "aukjngrt"
          },
          "invoice_by": "HOTMART",
          "subscription_anticipation_purchase": false,
          "date_next_charge": 1779105600000,
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
            "code": "9OL3KY4O"
          }
        }
      },
      "hottok": "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719"
    };

    // Enviar para o endpoint aprimorado
    console.log('📤 Enviando webhook para o endpoint aprimorado...');
    
    // A URL local no ambiente Replit
    const webhookUrl = 'http://localhost:5000/webhook/hotmart-enhanced';
    
    // Configurar cabeçalhos para simular a Hotmart
    const headers = {
      'Content-Type': 'application/json',
      'X-Hotmart-Webhooks-Signature': 'teste-de-assinatura',
      'User-Agent': 'Hotmart-Webhooks/1.0'
    };
    
    // Realizar a requisição
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(webhookPayload)
    });
    
    // Verificar o código de status
    console.log(`🔍 Status da resposta: ${response.status} ${response.statusText}`);
    
    // Obter o corpo da resposta
    const responseBody = await response.json();
    console.log('📥 Resposta do servidor:');
    console.log(JSON.stringify(responseBody, null, 2));
    
    // Verificar se o webhook foi processado com sucesso
    if (responseBody.success) {
      console.log('✅ Webhook processado com sucesso pelo endpoint aprimorado!');
      console.log(`📧 Email extraído: ${responseBody.email}`);
      console.log(`🆔 Transaction ID: ${responseBody.transactionId}`);
      
      // Verificar logs de webhook no banco de dados
      console.log('\n📊 Verificação de logs de webhook:');
      console.log('- Execute SQL na tabela webhookLogs para verificar o registro');
      console.log('- Consulta sugerida: SELECT * FROM "webhookLogs" ORDER BY "createdAt" DESC LIMIT 1;');
    } else {
      console.log('❌ Erro no processamento do webhook:');
      console.log(`- Mensagem: ${responseBody.message}`);
      console.log(`- Nota: ${responseBody.note || 'Nenhuma nota adicional'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook aprimorado:', error);
  }
}

// Executar o teste
testEnhancedWebhook();