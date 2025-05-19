/**
 * Script para simular envio de webhook da Hotmart
 * 
 * Este script executa uma requisição local para testar o funcionamento
 * do endpoint de webhook sem precisar de uma conexão externa.
 */

const https = require('https');
const http = require('http');

// Configurações da simulação
const webhookUrl = 'http://localhost:3000/api/webhook-hotmart';

// Simulando um evento de compra aprovada da Hotmart
const payload = {
  event: "PURCHASE_APPROVED",
  data: {
    purchase: {
      transaction: "TX" + Math.floor(Math.random() * 1000000),
      status: "APPROVED"
    },
    buyer: {
      email: "cliente@example.com",
      name: "Cliente Teste"
    },
    subscription: {
      plan: {
        name: "Plano Premium",
        price: 97.00
      }
    }
  }
};

// Converter payload para string JSON
const dataString = JSON.stringify(payload);

// Determinar se é HTTP ou HTTPS
const client = webhookUrl.startsWith('https') ? https : http;
const urlObj = new URL(webhookUrl);

// Opções da requisição
const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || (webhookUrl.startsWith('https') ? 443 : 80),
  path: urlObj.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': dataString.length,
    'User-Agent': 'Hotmart-Webhook-Simulator'
  }
};

console.log(`🔌 Enviando webhook simulado para: ${webhookUrl}`);
console.log(`📦 Payload: ${dataString}`);

// Executar requisição
const req = client.request(options, (res) => {
  console.log(`🔄 Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`📄 Resposta: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('✅ Teste concluído');
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`);
});

// Enviar dados
req.write(dataString);
req.end();

/**
 * Para usar este script:
 * 
 * 1. Certifique-se que o servidor webhook está rodando
 * 2. Execute: node simulate-webhook.js
 * 
 * Você verá os logs tanto no console deste script quanto no servidor
 */