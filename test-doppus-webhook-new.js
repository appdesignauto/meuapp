/**
 * Script para testar o novo formato de webhook da Doppus
 * Este script simula o envio de um webhook no formato atualizado que a Doppus está enviando
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

// Função para gerar assinatura HMAC igual à Doppus
function generateSignature(body, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  return hmac.digest('hex');
}

async function getSecretKey() {
  // Extrair a chave secreta do banco de dados
  const { Client } = require('pg');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    const result = await client.query(`
      SELECT value FROM integrationSettings 
      WHERE platform = 'doppus' AND key = 'secretKey'
    `);
    
    if (result.rows.length > 0) {
      return result.rows[0].value;
    } else {
      console.error('Chave secreta da Doppus não encontrada');
      return 'chave-secreta-de-teste'; // Valor padrão para testes
    }
  } catch (error) {
    console.error('Erro ao buscar chave secreta:', error);
    return 'chave-secreta-de-teste'; // Valor padrão para testes
  } finally {
    await client.end();
  }
}

async function simulateNewDoppusWebhook() {
  try {
    // Obter o secret key do banco de dados
    const secretKey = await getSecretKey();
    console.log(`Usando chave secreta: ${secretKey}`);
    
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
    
    // Converter payload para string
    const payloadString = JSON.stringify(payload);
    
    // Gerar assinatura
    const signature = generateSignature(payloadString, secretKey);
    
    console.log('Enviando webhook para http://localhost:3000/api/webhooks/doppus');
    console.log('Payload:', payloadString);
    console.log('Assinatura:', signature);
    
    // Enviar requisição
    const response = await fetch('http://localhost:3000/api/webhooks/doppus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Doppus-Signature': signature
      },
      body: payloadString
    });
    
    const responseText = await response.text();
    
    console.log('Status da resposta:', response.status);
    console.log('Resposta:', responseText);
    
    if (response.ok) {
      console.log('Webhook enviado com sucesso!');
    } else {
      console.error('Erro ao enviar webhook:', responseText);
    }
  } catch (error) {
    console.error('Erro ao simular webhook:', error);
  }
}

simulateNewDoppusWebhook();
