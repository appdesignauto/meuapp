/**
 * Script simples para testar o endpoint de webhook da Doppus
 * 
 * Este script envia um exemplo de webhook da Doppus para testar a funcionalidade
 * sem depender de configurações complexas
 */

import fetch from 'node-fetch';
import 'dotenv/config';

// Dados de exemplo do webhook da Doppus
const webhookData = {
  event: "PURCHASE_APPROVED",
  id: "DOP" + Date.now(), // ID único com timestamp
  creation_date: new Date().toISOString(),
  data: {
    client: {
      email: "clientedoppus@teste.com",
      name: "Cliente Teste Doppus"
    },
    transaction: {
      id: "TRX-" + Date.now(),
      status: "APPROVED",
      approved_date: new Date().toISOString(),
      product_id: "PRD-12345",
      plan: "Plano Premium"
    }
  }
};

// Função para enviar o webhook
async function enviarWebhook() {
  try {
    console.log("\n🔄 Iniciando teste do webhook Doppus...");
    console.log(`📧 Email do cliente: ${webhookData.data.client.email}`);
    console.log(`🆔 ID da transação: ${webhookData.data.transaction.id}`);
    
    // URL do servidor Replit
    const replitUrl = "https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev";
    const url = `${replitUrl}/api/webhooks/doppus`;
    console.log(`🌐 URL do webhook: ${url}`);
    
    // Obter o segredo da Doppus a partir da variável de ambiente
    const doppusSecret = process.env.DOPPUS_SECRET || 'secret-simulado';
    
    // Enviar a requisição
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Doppus-Signature': doppusSecret
      },
      body: JSON.stringify(webhookData)
    });
    
    // Obter resposta
    const responseText = await response.text();
    
    console.log(`\n📊 Status da resposta: ${response.status}`);
    console.log(`📄 Corpo da resposta: ${responseText}`);
    
    if (response.status >= 200 && response.status < 300) {
      console.log("\n✅ Webhook processado com sucesso!");
    } else {
      console.log("\n❌ Erro ao processar webhook!");
    }
  } catch (error) {
    console.error("\n💥 Erro ao testar webhook:", error.message);
  }
}

// Executar o teste
enviarWebhook();