/**
 * Script para testar o webhook da Hotmart com o email kitescolinhacrista@gmail.com
 * Este script simula um webhook da Hotmart para criar uma assinatura para este usuário
 */

// Token da Hotmart deve vir de variável de ambiente
const HOTMART_TOKEN = process.env.HOTMART_TOKEN || "";

// Configuração do webhook
const email = 'kitescolinhacrista@gmail.com';
const name = 'Kites Colinha Crista';
const transactionId = 'test-kites-' + Date.now();
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
console.log(`Email: ${email}, Transação: ${transactionId}`);
console.log(`Oferta: ${offerId}, Produto: ${productId}, Plano: ${planName}`);

// Enviar a requisição
import fetch from 'node-fetch';

// Primeiro testar com X-Hotmart-Webhook-Token (novo padrão)
fetch(`${baseUrl}/api/webhooks/hotmart`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Hotmart-Webhook-Token': HOTMART_TOKEN
  },
  body: JSON.stringify(payload)
})
.then(response => {
  console.log(`\nStatus da resposta (X-Hotmart-Webhook-Token): ${response.status}`);
  return response.json().then(data => ({ status: response.status, data }));
})
.then(({ status, data }) => {
  console.log('Resposta do servidor:');
  console.log(JSON.stringify(data, null, 2));
  
  if (status >= 200 && status < 300) {
    console.log("\n✅ Webhook processado com sucesso com X-Hotmart-Webhook-Token!");
    
    // Verificar se o usuário foi criado/atualizado
    return fetch(`${baseUrl}/api/admin/users/search?query=${email}`, {
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
    console.log("\n❌ Erro ao processar webhook com X-Hotmart-Webhook-Token");
    console.log("\nTestando com nome alternativo de cabeçalho...");
    
    // Se falhar, testar com X-Hotmart-Hottok (formato antigo)
    return fetch(`${baseUrl}/api/webhooks/hotmart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': HOTMART_TOKEN
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      console.log(`\nStatus da resposta (X-Hotmart-Hottok): ${response.status}`);
      return response.json().then(data => ({ status: response.status, data }));
    })
    .then(({ status, data }) => {
      console.log('Resposta do servidor:');
      console.log(JSON.stringify(data, null, 2));
      
      if (status >= 200 && status < 300) {
        console.log("\n✅ Webhook processado com sucesso com X-Hotmart-Hottok!");
      } else {
        console.log("\n❌ Erro ao processar webhook com ambos os cabeçalhos");
      }
    });
  }
})
.catch(error => console.error('Erro ao testar webhook:', error.message));