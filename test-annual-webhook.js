/**
 * Script para testar especificamente o plano anual da Hotmart
 */

import fetch from 'node-fetch';

const baseUrl = process.env.BASE_URL || "http://localhost:5000";
const token = process.env.TEST_TOKEN || ""; // Use environment variable for test token

// Payload específico para testar plano anual
const payload = {
  data: {
    buyer: {
      email: "test-annual@example.com",
      name: "Usuário de Teste Anual"
    },
    purchase: {
      transaction: "test-annual-" + Date.now(),
      offer: {
        code: "aukjngrt"  // ID da oferta anual
      },
      product: {
        id: "5381714"     // ID do produto
      }
    },
    subscription: {
      plan: {
        name: "Premium Anual"
      },
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  event: "PURCHASE_APPROVED"
};

console.log("Testando webhook para plano anual");
console.log(`ID da Oferta: ${payload.data.purchase.offer.code}`);
console.log(`ID do Produto: ${payload.data.purchase.product.id}`);
console.log(`Nome do Plano: ${payload.data.subscription.plan.name}`);
console.log(`Data de expiração: ${payload.data.subscription.end_date}`);

async function testAnnualPlan() {
  try {
    console.log(`\nEnviando requisição para: ${baseUrl}/api/webhooks/hotmart`);
    
    const response = await fetch(`${baseUrl}/api/webhooks/hotmart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`\nStatus: ${response.status}`);
    console.log("Resposta do servidor:");
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log("\n✅ Webhook processado com sucesso!");
      
      if (data.result && data.result.planType === "anual") {
        console.log("✅ Mapeamento do plano anual funcionando corretamente!");
      } else {
        console.log(`❌ Tipo de plano incorreto: ${data.result?.planType} (esperado: anual)`);
        console.log("Verifique o mapeamento do produto/oferta no painel admin.");
      }
    } else {
      console.log(`\n❌ Erro ao processar webhook: ${data.message}`);
    }
  } catch (error) {
    console.error("Erro na requisição:", error.message);
  }
}

testAnnualPlan();