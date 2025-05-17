/**
 * Script para simular um webhook da Hotmart
 * Este script envia uma requisição para o endpoint de webhook da Hotmart
 * usando exatamente os mesmos dados que a Hotmart enviaria
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import pg from 'pg';

// Configurar conexão direta com o banco de dados
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Função para obter a chave secreta da Hotmart do banco de dados
async function getHotmartSecret() {
  try {
    const result = await pool.query(`
      SELECT value
      FROM "subscriptionSettings"
      WHERE key = 'hotmart.secret'
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Chave hotmart.secret não encontrada no banco de dados');
    }
    
    return result.rows[0].value;
  } catch (error) {
    console.error('Erro ao buscar hotmart.secret:', error);
    throw error;
  }
}

// Função para gerar a assinatura HMAC SHA256 usando a chave secreta
function generateSignature(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
}

// Dados do webhook exatamente como enviados pela Hotmart
const webhookData = {
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
  "hottok": "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719"
};

// Função principal para enviar o webhook simulado
async function simulateWebhook() {
  try {
    // Obter a chave secreta da Hotmart
    const hotmartSecret = await getHotmartSecret();
    
    // URL do webhook
    const webhookUrl = "http://localhost:3000/api/webhooks/hotmart";
    
    console.log(`Usando servidor local: ${webhookUrl}`);
    console.log(`Email do comprador: ${webhookData.data.buyer.email}`);
    
    // Adicionar a assinatura HMAC correta
    webhookData.hottok = hotmartSecret;
    
    // Enviar o webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hotmart-Webhook/1.0'
      },
      body: JSON.stringify(webhookData)
    });
    
    const responseText = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Resposta: ${responseText}`);
    
    // Verificar se o webhook foi salvo no banco
    console.log('\nVerificando logs de webhook no banco de dados...');
    const webhookLogs = await pool.query(`
      SELECT id, status, "eventType", source, "createdAt" 
      FROM "webhookLogs"
      WHERE "payloadData"::text LIKE '%ws.advogaciasm%'
      ORDER BY "createdAt" DESC
      LIMIT 1;
    `);
    
    if (webhookLogs.rows.length > 0) {
      console.log('Webhook encontrado no banco de dados:');
      console.log(webhookLogs.rows[0]);
    } else {
      console.log('Nenhum webhook com o email ws.advogaciasm@gmail.com encontrado no banco.');
      
      // Verificar o webhook mais recente
      const recentWebhook = await pool.query(`
        SELECT id, status, "eventType", source, "createdAt" 
        FROM "webhookLogs"
        ORDER BY "createdAt" DESC
        LIMIT 1;
      `);
      
      if (recentWebhook.rows.length > 0) {
        console.log('\nWebhook mais recente:');
        console.log(recentWebhook.rows[0]);
      }
    }
  } catch (error) {
    console.error('Erro ao simular webhook:', error);
  } finally {
    // Fechar a conexão com o banco
    await pool.end();
  }
}

// Executar a simulação
simulateWebhook();