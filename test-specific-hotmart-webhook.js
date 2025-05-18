/**
 * Script para testar o endpoint de webhook da Hotmart com dados específicos
 * 
 * Este script envia um webhook com os dados exatos que estamos tentando validar:
 * - productId: 5381714
 * - offerCode: aukjngrt
 */
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Gerar assinatura HMAC com o segredo da Hotmart
function generateSignature(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const signature = hmac.update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
  return signature;
}

async function getHotmartSecret() {
  try {
    // Usar o segredo definido no .env
    const secret = process.env.HOTMART_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('⚠️ HOTMART_WEBHOOK_SECRET não encontrado no .env. Usando valor padrão para testes.');
      return 'test-secret';
    }
    return secret;
  } catch (error) {
    console.error('Erro ao buscar segredo da Hotmart:', error);
    return 'test-secret';
  }
}

async function testarWebhook() {
  try {
    console.log('🔍 Enviando teste de webhook da Hotmart para os dados específicos...');
    
    // Dados exatos do formato da Hotmart (com base no exemplo fornecido)
    const webhookData = {
      id: "webhook-test-" + Date.now(),
      creation_date: Date.now(),
      event: "PURCHASE_APPROVED",
      version: "2.0.0",
      data: {
        product: {
          id: 5381714,
          ucode: "eef7f8c8-ce74-47aa-a8da-d1e7505dfa8a",
          name: "App DesignAuto",
          warranty_date: "2025-05-24T00:00:00Z",
          has_co_production: false,
          is_physical_product: false
        },
        affiliates: [
          {
            affiliate_code: "",
            name: ""
          }
        ],
        buyer: {
          email: "teste.especifico@example.com",
          name: "Cliente Teste Hotmart",
          first_name: "Cliente",
          last_name: "Teste",
          address: {
            country: "Brasil",
            country_iso: "BR"
          },
          document: "",
          document_type: ""
        },
        producer: {
          name: "EDITORA INOVE DIGITAL LTDA",
          document: "52883206000100",
          legal_nature: "Pessoa Jurídica"
        },
        commissions: [
          {
            value: 1.4,
            source: "MARKETPLACE",
            currency_value: "BRL"
          },
          {
            value: 5.6,
            source: "PRODUCER",
            currency_value: "BRL"
          }
        ],
        purchase: {
          approved_date: Date.now(),
          full_price: {
            value: 7,
            currency_value: "BRL"
          },
          price: {
            value: 7,
            currency_value: "BRL"
          },
          checkout_country: {
            name: "Brasil",
            iso: "BR"
          },
          order_bump: {
            is_order_bump: false
          },
          original_offer_price: {
            value: 7,
            currency_value: "BRL"
          },
          order_date: Date.now(),
          status: "APPROVED",
          transaction: "HP0" + Date.now(),
          payment: {
            installments_number: 1,
            type: "PIX"
          },
          offer: {
            code: "aukjngrt"
          },
          invoice_by: "HOTMART",
          subscription_anticipation_purchase: false,
          date_next_charge: Date.now() + 31536000000, // +1 ano
          recurrence_number: 1,
          is_funnel: false,
          business_model: "I"
        },
        subscription: {
          status: "ACTIVE",
          plan: {
            id: 1038897,
            name: "Plano Anual"
          },
          subscriber: {
            code: "SUB" + Date.now()
          }
        }
      },
      hottok: process.env.HOTMART_WEBHOOK_SECRET || "test-secret" // O token também vai no corpo do JSON
    };
    
    // Obter o segredo para a assinatura
    const secret = await getHotmartSecret();
    
    // Gerar assinatura
    const payload = JSON.stringify(webhookData);
    const signature = generateSignature(payload, secret);
    
    console.log('📦 Enviando dados:', {
      productId: webhookData.data.product.id,
      offerCode: webhookData.data.purchase.offer.code,
      email: webhookData.data.buyer.email,
      subscriberCode: webhookData.data.subscription.subscriber.code
    });
    
    // Enviar para o endpoint do webhook (porta 5000 para Replit)
    const response = await fetch("http://localhost:5000/webhook/hotmart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hotmart-Webhook-Token": secret,
        "X-Hotmart-Signature": signature
      },
      body: payload
    });
    
    const responseData = await response.json();
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📄 Resposta do servidor:', responseData);
    
    if (responseData.success === false) {
      console.error('❌ Falha no processamento do webhook:', responseData.message);
      console.log('🔍 Verificando estrutura do payload...');
      
      // Sugestões de depuração
      console.log('🛠️ Dicas de depuração:');
      console.log('1. Verifique se offerId/offerCode está sendo extraído corretamente do payload');
      console.log('2. Confirme que o mapeamento com productId: 5381714 e offerId: aukjngrt existe e está ativo');
      console.log('3. Tente verificar os logs para entender melhor o erro');
    } else {
      console.log('✅ Webhook processado com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar webhook de teste:', error);
  }
}

// Executar o teste
testarWebhook();