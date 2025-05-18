/**
 * Script para testar o webhook simulando exatamente o que a Hotmart envia
 * incluindo os cabeçalhos corretos de autenticação e a estrutura do payload
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para obter o segredo da Hotmart do banco de dados
async function getHotmartSecret() {
  try {
    const integrationSettings = await prisma.integrationSettings.findFirst({
      where: { 
        provider: 'hotmart',
        key: 'webhook_secret'
      }
    });
    
    if (integrationSettings && integrationSettings.value) {
      return integrationSettings.value;
    }
    
    return process.env.HOTMART_SECRET || 'hotmart_test_secret';
  } catch (error) {
    console.error('Erro ao buscar segredo da Hotmart:', error);
    return process.env.HOTMART_SECRET || 'hotmart_test_secret';
  }
}

// Função para gerar a assinatura HMAC SHA-256
function generateSignature(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const signature = hmac.update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
  return signature;
}

// Função para executar o teste
async function testarWebhookReal() {
  try {
    console.log('🔍 Iniciando teste de webhook real da Hotmart...');
    
    // Obter o segredo da Hotmart
    const secret = await getHotmartSecret();
    console.log('✅ Segredo da Hotmart obtido');
    
    // Payload de teste - exatamente igual ao da Hotmart
    const payload = {
      "id": "webhook-test-real",
      "event": "PURCHASE_APPROVED",
      "version": "2.0.0",
      "creation_date": new Date().toISOString(),
      "hottok": "azjZzEUU43jb4zN4NqEUrvRu1MO1XQ1167719",
      "data": {
        "buyer": {
          "name": "Fernando Oliveira",
          "email": "teste@example.com",
          "document": "",
          "address": {
            "country": "Brasil",
            "country_iso": "BR"
          },
          "first_name": "Fernando",
          "last_name": "Oliveira",
          "document_type": ""
        },
        "product": {
          "id": 5381714,
          "name": "App DesignAuto",
          "ucode": "eef7f8c8-ce74-47aa-a8da-d1e7505dfa8a",
          "warranty_date": "2025-05-25T00:00:00Z",
          "has_co_production": false,
          "is_physical_product": false
        },
        "purchase": {
          "offer": {
            "code": "aukjngrt"
          },
          "price": {
            "value": 7,
            "currency_value": "BRL"
          },
          "status": "APPROVED",
          "payment": {
            "type": "PIX",
            "installments_number": 1
          },
          "transaction": "HP" + Math.floor(1000000000 + Math.random() * 9000000000),
          "approved_date": new Date().toISOString(),
          "order_date": new Date().toISOString()
        },
        "subscription": {
          "plan": {
            "id": 1038897,
            "name": "Plano Anual"
          },
          "status": "ACTIVE",
          "subscriber": {
            "code": "9OL3KY" + Math.floor(10 + Math.random() * 90)
          }
        }
      }
    };
    
    // Testar múltiplas combinações de cabeçalhos
    const testURLs = [
      "http://localhost:5001/hotmart",
      "http://localhost:5000/webhook/hotmart",
      "http://localhost:5000/webhook/hotmart-enhanced",
      "http://localhost:3000/webhook/hotmart"
    ];
    
    const testHeadersVariants = [
      // Variante 1: X-Hotmart-Signature
      {
        "Content-Type": "application/json",
        "X-Hotmart-Signature": generateSignature(payload, secret)
      },
      // Variante 2: X-Hotmart-Webhook-Token
      {
        "Content-Type": "application/json",
        "X-Hotmart-Webhook-Token": secret,
        "X-Hotmart-Signature": generateSignature(payload, secret)
      },
      // Variante 3: Sem headers de segurança
      {
        "Content-Type": "application/json"
      }
    ];
    
    console.log(`📝 Transação de teste: ${payload.data.purchase.transaction}`);
    
    // Executar todos os testes
    for (const url of testURLs) {
      console.log(`\n🌐 Testando URL: ${url}`);
      
      for (const [index, headers] of testHeadersVariants.entries()) {
        console.log(`\n📋 Teste ${index + 1}: com cabeçalhos ${JSON.stringify(headers)}`);
        
        try {
          const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
          });
          
          console.log(`📊 Status: ${response.status}`);
          
          const responseText = await response.text();
          console.log(`📄 Resposta: ${responseText}`);
          
          // Verificar se o webhook foi registrado no banco de dados
          const registeredWebhook = await prisma.webhookLogs.findFirst({
            where: {
              transaction_id: payload.data.purchase.transaction
            },
            orderBy: {
              created_at: 'desc'
            }
          });
          
          if (registeredWebhook) {
            console.log(`✅ Webhook registrado no banco de dados com ID: ${registeredWebhook.id}`);
          } else {
            console.log(`❌ Webhook NÃO encontrado no banco de dados`);
          }
        } catch (error) {
          console.error(`❌ Erro ao testar ${url} com variante ${index + 1}: ${error.message}`);
        }
      }
    }
    
    console.log("\n🏁 Testes concluídos!");
  } catch (error) {
    console.error(`❌ Erro geral: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testarWebhookReal();