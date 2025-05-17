/**
 * Script simples para testar o endpoint de webhook da Hotmart
 * 
 * Este script envia um exemplo de webhook da Hotmart para testar a funcionalidade
 * sem depender de configurações complexas
 */

import fetch from 'node-fetch';
import 'dotenv/config';

// Dados de exemplo do webhook da Hotmart
const webhookData = {
  event: "PURCHASE_APPROVED",
  id: "ABC123" + Date.now(), // ID único com timestamp
  creation_date: new Date().toISOString(),
  hottok: process.env.HOTMART_SECRET, // Token de autenticação (opcional, também pode ser via cabeçalho)
  data: {
    buyer: {
      email: "cliente.teste@gmail.com",
      name: "Cliente Teste"
    },
    purchase: {
      transaction: "PAY-" + Date.now(),
      status: "APPROVED",
      approved_date: new Date().toISOString(),
    },
    product: {
      id: 123456,
      name: "Plano Premium DesignAuto"
    },
    subscription: {
      status: "ACTIVE",
      plan: {
        name: "Premium Mensal"
      }
    }
  }
};

// Função para enviar o webhook
async function enviarWebhook() {
  try {
    console.log("\n🔄 Iniciando teste do webhook Hotmart...");
    console.log(`📧 Email do comprador: ${webhookData.data.buyer.email}`);
    console.log(`🆔 ID da transação: ${webhookData.data.purchase.transaction}`);
    
    // URL do servidor Replit
    const replitUrl = "https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev";
    const url = `${replitUrl}/api/webhooks/hotmart`;
    console.log(`🌐 URL do webhook: ${url}`);
    
    // Enviar a requisição
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Token': process.env.HOTMART_SECRET || 'token-simulado'
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