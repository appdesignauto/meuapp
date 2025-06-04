/**
 * Teste simples do webhook Hotmart corrigido
 */

const https = require('https');

const webhookData = JSON.stringify({
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "name": "Ana Silva Teste",
      "email": "ana.teste.webhook@gmail.com",
      "document": "(11) 99876-5432"
    },
    "purchase": {
      "status": "APPROVED",
      "order_date": "2025-05-26T20:05:00Z",
      "date_next_charge": "2025-06-26T20:05:00Z",
      "transaction": "TXN_TESTE_67890"
    },
    "subscription": {
      "plan": {
        "name": "Plano Mensal DesignAuto Premium"
      }
    }
  }
});

const options = {
  hostname: 'e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev',
  port: 443,
  path: '/webhook/hotmart-fixed',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(webhookData)
  }
};

console.log('🚀 TESTANDO WEBHOOK HOTMART CORRIGIDO');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Payload:', webhookData);
console.log('');

const req = https.request(options, (res) => {
  console.log(`📥 Status: ${res.statusCode}`);
  console.log(`📥 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Resposta:', data);
    
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('✅ WEBHOOK PROCESSADO COM SUCESSO!');
        console.log(`👤 Usuário: ID ${response.userId}`);
        console.log(`📋 Plano: ${response.planType}`);
      } else {
        console.log('❌ FALHA NO PROCESSAMENTO');
      }
    } catch (e) {
      console.log('⚠️ Resposta não é JSON válido');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ ERRO:', e.message);
});

req.write(webhookData);
req.end();