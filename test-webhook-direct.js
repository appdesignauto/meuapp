/**
 * Script para testar o endpoint de webhook diretamente
 * 
 * Este script envia uma requisição para o endpoint fixo de webhook
 * usando um corpo fictício semelhante ao utilizado pela Hotmart
 */
import fetch from 'node-fetch';

// Payload para teste
const payload = {
  id: `test-webhook-${Date.now()}`,
  data: {
    buyer: {
      name: "Usuário de Teste Final",
      email: "teste-final@designauto.com",
      address: {
        country: "Brasil",
        country_iso: "BR"
      }
    },
    product: {
      id: 5381714,
      name: "App DesignAuto"
    },
    purchase: {
      status: "APPROVED",
      transaction: `TEST-FINAL-${Date.now()}`,
    },
    subscription: {
      plan: {
        name: "Plano Anual Premium"
      },
      status: "ACTIVE",
      subscriber: {
        code: `TEST-SUB-${Date.now()}`
      }
    }
  },
  event: "PURCHASE_APPROVED",
  version: "2.0.0",
  creation_date: Date.now()
};

// Realizar o teste
async function testWebhook() {
  try {
    console.log('🧪 Iniciando teste do webhook fixo...');
    console.log(`📧 Email: ${payload.data.buyer.email}`);
    console.log(`🔄 Transaction ID: ${payload.data.purchase.transaction}`);
    
    // Enviar requisição
    const response = await fetch('http://localhost:5000/webhook/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source-IP': '34.27.222.49', // IP da Hotmart para simulação
        'User-Agent': 'Hotmart-Webhooks/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    // Verificar resposta
    const responseText = await response.text();
    
    console.log(`\n✅ Resposta do servidor (${response.status}):`);
    console.log(responseText);
    
    console.log('\n📊 Teste concluído!');
    console.log('Aguarde 10 segundos para verificar o processamento automático nos logs...');
    
    // Aguardar para os logs de processamento aparecerem
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n📝 Teste finalizado. Verifique os logs acima para confirmar se o processamento automático foi iniciado.');
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
  }
}

// Executar teste
testWebhook().catch(console.error);