/**
 * Script otimizado para simular um webhook da Hotmart
 * 
 * Este script envia uma requisição para o endpoint de webhook do DesignAuto
 * usando o formato exato que a Hotmart usa, simulando uma compra real.
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import crypto from 'crypto';
import pg from 'pg';
const { Pool } = pg;

// Payload padrão para simulação
const DEFAULT_PAYLOAD = {
  id: "f995599c-d722-4701-89c7-21276cb6f17b",
  data: {
    buyer: {
      name: "Fernando Teste",
      email: "soguruscursos@gmail.com",
      address: {
        country: "Brasil",
        country_iso: "BR"
      },
      document: "13164498748",
      last_name: "Teste",
      first_name: "Fernando",
      document_type: "CPF"
    },
    product: {
      id: 5381714,
      name: "App DesignAuto",
      ucode: "eef7f8c8-ce74-47aa-a8da-d1e7505dfa8a",
      warranty_date: "2025-05-26T00:00:00Z",
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
        pix_code: "00020101021226900014br.gov.bcb.pix2568pix.adyen.com/pixqrcodelocation/pixloc/v1/loc/oaxrDmEIT8iA4xR7oQd1Og5204000053039865802BR5902HT6009SAO PAULO62070503***630463BA",
        pix_qrcode: "https://live-us.adyen.com/hpp/generateQRCodeImage.shtml?url=00020101021226900014br.gov.bcb.pix2568pix.adyen.com%2Fpixqrcodelocation%2Fpixloc%2Fv1%2Floc%2FoaxrDmEIT8iA4xR7oQd1Og5204000053039865802BR5902HT6009SAO+PAULO62070503***630463BA",
        installments_number: 1,
        pix_expiration_date: 1747849948000
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
      order_date: 1747677148000,
      transaction: `HP${Date.now()}`, // Gerar transaction ID único baseado na hora atual
      approved_date: 1747677195000,
      business_model: "I",
      checkout_country: {
        iso: "BR",
        name: "Brasil"
      },
      date_next_charge: 1779192000000,
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
        code: `${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      }
    }
  },
  event: "PURCHASE_APPROVED",
  hottok: "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719",
  version: "2.0.0",
  creation_date: Date.now()
};

// Gera uma assinatura HMAC para o payload
function generateSignature(data, secret = 'test_secret') {
  try {
    // Converter o objeto para string JSON se necessário
    const jsonData = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Gerar HMAC SHA-256
    return crypto
      .createHmac('sha256', secret)
      .update(jsonData)
      .digest('hex');
  } catch (error) {
    console.error('❌ Erro ao gerar assinatura:', error);
    return null;
  }
}

// Busca o secret da Hotmart no banco de dados 
async function getHotmartSecret() {
  try {
    console.log('🔍 Buscando secret da Hotmart no banco de dados...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Buscar primeiro na tabela integration_settings
    let result = await pool.query(
      `SELECT setting_value FROM integration_settings WHERE provider = 'hotmart' AND setting_key = 'webhook_secret'`
    );
    
    if (result.rows.length > 0) {
      pool.end();
      return result.rows[0].setting_value;
    }
    
    // Buscar em subscriptionsettings como fallback
    result = await pool.query(
      `SELECT webhook_secret FROM subscriptionsettings WHERE provider = 'hotmart' LIMIT 1`
    );
    
    if (result.rows.length > 0 && result.rows[0].webhook_secret) {
      pool.end();
      return result.rows[0].webhook_secret;
    }
    
    // Fallback para test_secret
    console.log('⚠️ Secret não encontrado, usando valor padrão para teste');
    pool.end();
    return 'test_secret';
  } catch (error) {
    console.error('❌ Erro ao buscar hotmart.secret:', error);
    return 'test_secret';
  }
}

// Simula um webhook da Hotmart
async function simulateWebhook() {
  try {
    console.log('🚀 Iniciando simulação de webhook...');
    
    // Criar payload personalizado com timestamp atual
    const timestamp = Date.now();
    const payload = {
      ...DEFAULT_PAYLOAD,
      creation_date: timestamp
    };
    
    // Gerar ID de transação único
    payload.data.purchase.transaction = `HP${timestamp}`;
    
    // Gerar código de assinante único
    payload.data.subscription.subscriber.code = `C${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Buscar secret para assinatura
    const secret = await getHotmartSecret();
    
    // Gerar assinatura
    const signature = generateSignature(payload, secret);
    
    // Endpoing alvo
    const targetUrl = 'http://localhost:5000/webhook/hotmart';
    
    console.log('📦 Enviando payload...');
    console.log('🔄 Transaction ID:', payload.data.purchase.transaction);
    console.log('📧 Email:', payload.data.buyer.email);
    
    // Enviar requisição
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': signature,
        'User-Agent': 'Hotmart-Webhooks/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    // Verificar resposta
    const responseData = await response.json();
    
    console.log(`✅ Resposta do servidor (${response.status}):`);
    console.log(responseData);
    
    // Verificar se o webhook foi registrado no banco de dados
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const result = await pool.query(
      `SELECT * FROM webhook_logs WHERE transaction_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [payload.data.purchase.transaction]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Webhook registrado no banco de dados com sucesso!');
      console.log('📝 ID do registro:', result.rows[0].id);
      console.log('📝 Status:', result.rows[0].status);
    } else {
      console.log('⚠️ Webhook não encontrado no banco de dados após envio');
    }
    
    pool.end();
    return true;
  } catch (error) {
    console.error('❌ Erro ao simular webhook:', error);
    return false;
  }
}

// Executar simulação
simulateWebhook().then(() => {
  console.log('🏁 Simulação de webhook concluída!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro durante simulação:', error);
  process.exit(1);
});