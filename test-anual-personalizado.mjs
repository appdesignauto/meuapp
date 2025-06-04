/**
 * Script para testar o webhook da Hotmart com o plano anual
 * Este script usa o token personalizado fornecido
 */
import fetch from 'node-fetch';

// Token deve vir de variável de ambiente
const HOTMART_TOKEN = process.env.HOTMART_TOKEN || "";

// Configuração do webhook
const email = 'teste-anual@example.com';
const name = 'Usuário Teste Plano Anual';
const transactionId = 'test-annual-' + Date.now();
const offerId = 'aukjngrt'; // ID da oferta do plano anual
const productId = '5381714'; // ID do produto do DesignAuto
const planName = 'Premium Anual';
const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

// Payload do webhook
const payload = {
  event: 'PURCHASE_APPROVED',
  id: `test-${Date.now()}`,
  creation_date: new Date().toISOString(),
  data: {
    buyer: { 
      email,
      name 
    },
    purchase: { 
      transaction: transactionId,
      approved_date: new Date().toISOString(),
      status: 'APPROVED',
      product: { 
        id: productId 
      },
      offer: { 
        code: offerId 
      }
    },
    subscription: {
      plan: { 
        name: planName,
        recurrency_period: 'YEARLY'
      },
      status: 'ACTIVE',
      end_date: endDate
    }
  }
};

// URL para o endpoint do webhook
const baseUrl = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}`
  : 'http://localhost:5000';

console.log(`Enviando webhook para ${baseUrl}/api/webhooks/hotmart`);
console.log(`Token: ${HOTMART_TOKEN}`);
console.log(`Oferta: ${offerId}, Produto: ${productId}, Plano: ${planName}`);

// Primeiro testar com X-Hotmart-Webhook-Token (novo padrão)
console.log("\nTestando com X-Hotmart-Webhook-Token (padrão atual):");
try {
  const response = await fetch(`${baseUrl}/api/webhooks/hotmart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hotmart-Webhook-Token': HOTMART_TOKEN
    },
    body: JSON.stringify(payload)
  });
  
  console.log(`Status da resposta: ${response.status}`);
  
  try {
    const responseData = await response.json();
    console.log("Resposta:", JSON.stringify(responseData, null, 2));
    
    if (response.status >= 200 && response.status < 300) {
      console.log("\n✅ Webhook processado com sucesso com X-Hotmart-Webhook-Token!");
    } else {
      console.log("\n❌ Erro ao processar webhook com X-Hotmart-Webhook-Token");
      console.log("\nTestando com nome alternativo de cabeçalho...");
      
      // Se falhar, testar com X-Hotmart-Hottok (formato antigo)
      console.log("\nTestando com X-Hotmart-Hottok (formato alternativo):");
      const response2 = await fetch(`${baseUrl}/api/webhooks/hotmart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hotmart-Hottok': HOTMART_TOKEN
        },
        body: JSON.stringify(payload)
      });
      
      console.log(`Status da resposta: ${response2.status}`);
      const responseData2 = await response2.json();
      console.log("Resposta:", JSON.stringify(responseData2, null, 2));
      
      if (response2.status >= 200 && response2.status < 300) {
        console.log("\n✅ Webhook processado com sucesso com X-Hotmart-Hottok!");
      } else {
        console.log("\n❌ Erro ao processar webhook com ambos os cabeçalhos");
      }
    }
  } catch (e) {
    const responseText = await response.text();
    console.log("Resposta (texto):", responseText);
  }
} catch (error) {
  console.error('Erro ao testar webhook:', error.message);
}