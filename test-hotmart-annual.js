/**
 * Script de teste específico para o plano anual da Hotmart
 */

// Para testar com o plano anual, precisamos de um payload mais específico
const payload = {
  data: {
    buyer: {
      email: "example@test.com",
      name: "Usuário de Teste Anual"
    },
    purchase: {
      transaction: "test-annual-" + Date.now(),
      offer: {
        code: "aukjngrt"
      },
      product: {
        id: "5381714"
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

// Função para obter a URL base do ambiente atual
function getBaseUrl() {
  return process.env.REPLIT_DOMAIN
    ? `https://${process.env.REPLIT_DOMAIN}`
    : 'http://localhost:5000';
}

// Token usado para autenticação
const token = 'afb3c81b-19a6-42f2-93b0-e3cd7def0b0c';

// URL do webhook
const url = `${getBaseUrl()}/api/webhooks/hotmart`;

// Fazer a requisição usando fetch através de exec + curl
const curlCommand = `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${JSON.stringify(payload)}'`;

// Mostrar detalhes do que vamos enviar
console.log("[Teste Anual] Enviando webhook para oferta:", payload.data.purchase.offer.code);
console.log("[Teste Anual] ID do produto:", payload.data.purchase.product.id);
console.log("[Teste Anual] Plano do usuário:", payload.data.subscription.plan.name);
console.log("[Teste Anual] Data final:", payload.data.subscription.end_date);

// Executar o comando curl
require('child_process').exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao enviar webhook: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  try {
    const response = JSON.parse(stdout);
    console.log("[Teste Anual] Resposta do servidor:");
    console.log(JSON.stringify(response, null, 2));
    
    if (response.success) {
      console.log("\n✅ Webhook processado com sucesso!");
      if (response.result && response.result.planType === "anual") {
        console.log("✅ O mapeamento do plano anual está funcionando corretamente!");
      } else {
        console.log("❌ O mapeamento do plano não está correto! Verifique se a oferta está mapeada corretamente.");
      }
    } else {
      console.log("❌ Erro ao processar webhook:", response.message);
    }
  } catch (e) {
    console.error("Erro ao analisar resposta:", e.message);
    console.log("Resposta bruta:", stdout);
  }
});
