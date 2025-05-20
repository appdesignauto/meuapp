/**
 * Script para testar o mapeamento de produto anual da Hotmart
 */
import fetch from 'node-fetch';

async function testAnnualPlan() {
  // Obter a URL base do ambiente atual
  const baseUrl = process.env.REPLIT_DOMAIN 
    ? `https://${process.env.REPLIT_DOMAIN}`
    : 'http://localhost:5000';

  // Token de exemplo para teste
  const token = 'afb3c81b-19a6-42f2-93b0-e3cd7def0b0c';

  // Criar payload de teste
  const payload = {
    data: {
      buyer: {
        email: "example@test.com",
        name: "Usuário de Teste"
      },
      purchase: {
        transaction: "test-annual-" + Date.now(),
        due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        offer: {
          code: "aukjngrt"  // ID da oferta anual que você cadastrou
        },
        product: {
          id: "5381714"    // ID do produto que você cadastrou
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

  console.log(`[Teste] Usando URL base: ${baseUrl}`);
  console.log(`[Teste] Usando token: ${token}`);
  console.log(`\n[Teste Webhook Hotmart] Payload:\n${JSON.stringify(payload, null, 2)}`);
  console.log(`\n[Teste Webhook Hotmart] Enviando evento PURCHASE_APPROVED para example@test.com com oferta anual...`);

  try {
    // Enviar requisição para o endpoint de webhook da Hotmart
    const response = await fetch(`${baseUrl}/api/webhooks/hotmart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    // Obter resposta
    const responseStatus = response.status;
    const responseData = await response.json();

    console.log(`\n[Teste Webhook Hotmart] Status: ${responseStatus}`);
    console.log(`[Teste Webhook Hotmart] Resposta:\n${JSON.stringify(responseData, null, 2)}`);

    // Verificar se o webhook foi processado com sucesso
    if (responseStatus === 200 && responseData.success) {
      console.log(`\n[Teste Webhook Hotmart] SUCESSO: Evento PURCHASE_APPROVED para plano anual processado corretamente!`);
    } else {
      console.log(`\n[Teste Webhook Hotmart] ERRO: Falha ao processar evento PURCHASE_APPROVED.`);
    }
  } catch (error) {
    console.error(`\n[Teste Webhook Hotmart] ERRO: ${error.message}`);
  }
}

testAnnualPlan();
