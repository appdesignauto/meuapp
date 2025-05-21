/**
 * Script para simular um webhook real da Hotmart
 * Este script envia uma requisição para o endpoint de webhook do DesignAuto
 * usando o formato exato que a Hotmart envia
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import pg from 'pg';
const { Client } = pg;

// Função para gerar assinatura HMAC para Hotmart
function generateSignature(data, secret) {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

// Função para obter o segredo da Hotmart do banco de dados
async function getHotmartSecret() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    const query = 'SELECT value FROM integration_settings WHERE key = $1';
    const result = await client.query(query, ['hotmart_webhook_secret']);
    
    await client.end();
    
    if (result.rows.length > 0) {
      return result.rows[0].value;
    } else {
      return 'test_secret'; // Segredo padrão para testes
    }
  } catch (error) {
    console.error('Erro ao buscar segredo Hotmart:', error);
    return 'test_secret'; // Segredo padrão em caso de erro
  }
}

// Função principal para simular o webhook
async function simulateWebhook() {
  try {
    // Dados de exemplo que simulam o payload real da Hotmart
    const webhookData = {
      "id": "98b87cc5-5839-4591-8b64-b3b253335ce4",
      "creation_date": new Date().getTime(),
      "event": "PURCHASE_APPROVED",
      "version": "2",
      "data": {
        "purchase": {
          "offer": {
            "code": "abc123xyz",
            "key": 987654
          },
          "transaction": "HP" + Math.floor(Math.random() * 10000000),
          "approved_date": new Date().toISOString()
        },
        "product": {
          "id": 12345,
          "name": "Plano Premium DesignAuto",
          "has_co_production": false
        },
        "buyer": {
          "name": "Cliente Novo Teste",
          "email": "cliente.novo.teste@example.com",
          "checkout_phone": "+5511999887766"
        },
        "subscription": {
          "subscriber": {
            "code": "SUB" + Math.floor(Math.random() * 10000000)
          },
          "plan": {
            "name": "plano anual",
            "frequency": "YEARLY"
          },
          "status": "ACTIVE"
        },
        "price": {
          "value": 197.00
        }
      }
    };

    // Obter o segredo configurado ou usar o padrão
    const secret = await getHotmartSecret();
    
    // Gerar a assinatura HMAC
    const signature = generateSignature(webhookData, secret);
    
    // URL do webhook no DesignAuto
    // Obtém a URL do servidor atual do ambiente
    const serverUrl = process.env.REPLIT_DOMAIN || 'localhost:3000';
    const protocol = serverUrl.startsWith('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${serverUrl}/api/webhook/hotmart`;
    
    // Enviar a requisição para o endpoint de webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Signature': signature
      },
      body: JSON.stringify(webhookData)
    });
    
    const responseData = await response.text();
    
    console.log('Resposta do servidor:', response.status);
    console.log('Corpo da resposta:', responseData);
    
    // Log para debug
    console.log('Webhook simulado enviado com sucesso');
    console.log('ID do evento:', webhookData.id);
    console.log('Email do cliente:', webhookData.data.buyer.email);
    console.log('Transação:', webhookData.data.purchase.transaction);
    console.log('Assinatura gerada:', signature);
    
  } catch (error) {
    console.error('Erro ao simular webhook:', error);
  }
}

// Executar a simulação
simulateWebhook();