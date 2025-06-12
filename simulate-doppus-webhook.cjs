#!/usr/bin/env node

// Script para simular webhook da Doppus e testar a integração
const https = require('https');
const http = require('http');

// Configuração do teste
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5000/webhook/doppus';
const TEST_EMAIL = process.env.TEST_EMAIL || 'teste.doppus@exemplo.com';

// Payload simulado baseado no exemplo fornecido pelo usuário
const webhookPayload = {
  "id": "txn_test_12345",
  "customer": {
    "id": "cus_test_67890",
    "email": TEST_EMAIL,
    "name": "João Silva",
    "document": "123.456.789-00",
    "phone": "+5511999887766",
    "address": {
      "street": "Rua das Flores, 123",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "postal_code": "01234-567",
      "country": "BR"
    }
  },
  "items": [
    {
      "id": "item_001",
      "name": "Acesso Premium Design Auto",
      "description": "Plano premium mensal com acesso completo",
      "quantity": 1,
      "unit_price": 2997,
      "total_price": 2997
    }
  ],
  "recurrence": {
    "type": "monthly",
    "interval": 1,
    "trial_days": 0,
    "installments": null
  },
  "transaction": {
    "id": "txn_test_12345",
    "amount": 2997,
    "currency": "BRL",
    "gateway": "pix",
    "installments": 1,
    "fees": 150,
    "net_amount": 2847
  },
  "payment": {
    "method": "pix",
    "processor": "doppus",
    "processor_id": "dop_pay_12345",
    "created_at": "2025-06-12T03:40:00Z",
    "paid_at": "2025-06-12T03:41:30Z"
  },
  "links": {
    "self": "https://api.doppus.com/v1/transactions/txn_test_12345",
    "customer": "https://api.doppus.com/v1/customers/cus_test_67890"
  },
  "tracking": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "design_auto_premium",
    "utm_content": "banner_principal",
    "utm_term": "design+automotivo"
  },
  "status": {
    "code": "approved",
    "message": "Pagamento aprovado com sucesso"
  },
  "created_at": "2025-06-12T03:40:00Z",
  "updated_at": "2025-06-12T03:41:30Z"
};

function sendWebhook() {
  console.log('🚀 Iniciando teste do webhook da Doppus...');
  console.log('📧 Email de teste:', TEST_EMAIL);
  console.log('🌐 URL do webhook:', WEBHOOK_URL);
  
  const data = JSON.stringify(webhookPayload);
  
  const url = new URL(WEBHOOK_URL);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'User-Agent': 'Doppus-Webhook/1.0',
      'X-Doppus-Event': 'transaction.approved',
      'X-Doppus-Signature': 'simulated_signature_for_testing'
    }
  };

  const req = client.request(options, (res) => {
    console.log(`📈 Status da resposta: ${res.statusCode}`);
    console.log(`📋 Headers da resposta:`, res.headers);

    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('📦 Resposta completa:');
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log(JSON.stringify(jsonResponse, null, 2));
        
        if (res.statusCode === 200) {
          console.log('✅ Webhook processado com sucesso!');
          if (jsonResponse.success) {
            console.log('✅ Integração da Doppus funcionando corretamente');
            console.log('📋 Resultado:', jsonResponse.result);
          } else {
            console.log('⚠️ Webhook recebido mas houve erro no processamento');
            console.log('❌ Erro:', jsonResponse.message);
          }
        } else {
          console.log('❌ Erro no webhook - Status:', res.statusCode);
        }
      } catch (error) {
        console.log('📄 Resposta (texto):', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro ao enviar webhook:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Dica: Verifique se o servidor está rodando na porta correta');
      console.log('   Execute: npm run dev');
    }
  });

  req.write(data);
  req.end();
}

// Executar o teste
console.log('🎯 Script de Teste - Webhook Doppus');
console.log('=====================================');
sendWebhook();