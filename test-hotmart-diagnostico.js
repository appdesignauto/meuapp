/**
 * Script para teste de diagnóstico do webhook da Hotmart
 * Baseado no diagnóstico recomendado
 */

import fetch from 'node-fetch';

// Configuração
const baseUrl = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}`
  : 'http://localhost:5000';

// URL do webhook
const webhookUrl = `${baseUrl}/webhook/hotmart`;

// Payload de teste baseado no formato real da Hotmart
const payload = {
  id: "TEST-" + Date.now(),
  creation_date: new Date().toISOString(),
  event: "PURCHASE_APPROVED",
  version: "2.0.0",
  data: {
    product: {
      id: 5381714,
      name: "App DesignAuto"
    },
    offer: {
      code: "aukjngrt"
    },
    buyer: {
      email: "canvaparamusicos@gmail.com",
      name: "Usuário Teste Canva"
    },
    subscription: {
      status: "ACTIVE",
      plan: {
        id: 1234,
        name: "Plano Anual"
      },
      subscriber: {
        code: "TEST123"
      }
    }
  }
};

// Função para testar o webhook
async function testarWebhook() {
  try {
    console.log('🔍 Iniciando diagnóstico do webhook da Hotmart');
    console.log(`📡 URL do webhook: ${webhookUrl}`);
    console.log(`📧 Email usado: ${payload.data.buyer.email}`);
    
    // Enviar o webhook sem cabeçalhos especiais primeiro
    console.log('\n🧪 TESTE 1: Enviando webhook sem cabeçalhos especiais');
    const response1 = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const status1 = response1.status;
    const data1 = await response1.json();
    
    console.log(`Status HTTP: ${status1}`);
    console.log('Resposta:', JSON.stringify(data1, null, 2));
    
    // Teste com cabeçalho X-Hotmart-Webhook-Token
    console.log('\n🧪 TESTE 2: Enviando com cabeçalho X-Hotmart-Webhook-Token');
    const response2 = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Token': 'teste-token'
      },
      body: JSON.stringify(payload)
    });
    
    const status2 = response2.status;
    const data2 = await response2.json();
    
    console.log(`Status HTTP: ${status2}`);
    console.log('Resposta:', JSON.stringify(data2, null, 2));
    
    // Diagnóstico final
    console.log('\n📊 DIAGNÓSTICO FINAL:');
    if (status1 === 200 && status2 === 200) {
      console.log('✅ O servidor está respondendo corretamente com código 200 para o webhook');
    } else {
      console.log('❌ O servidor não está respondendo com código 200');
    }
    
    // Verificar se o endpoint existe
    console.log('\n🧪 TESTE 3: Verificando se o endpoint de diagnóstico existe');
    try {
      const response3 = await fetch(`${webhookUrl}/test`, {
        method: 'GET'
      });
      
      const status3 = response3.status;
      console.log(`Status HTTP: ${status3}`);
      
      if (status3 === 200) {
        console.log('✅ O endpoint de diagnóstico está acessível');
        const data3 = await response3.json();
        console.log('Resposta:', JSON.stringify(data3, null, 2));
      } else {
        console.log('❌ O endpoint de diagnóstico não está acessível');
      }
    } catch (error) {
      console.log('❌ Erro ao acessar endpoint de diagnóstico:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
  }
}

// Executar o teste
testarWebhook().then(() => {
  console.log('\n🏁 Diagnóstico concluído!');
});