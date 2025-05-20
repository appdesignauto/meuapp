/**
 * Script para testar a integração do plano anual da Hotmart
 * Este script simula um webhook da Hotmart para o plano anual
 */

import fetch from 'node-fetch';

// Token personalizado da Hotmart configurado no sistema
// Usando o token real que está configurado no ambiente
const HOTMART_TOKEN = process.env.HOTMART_SECRET;

// Configuração da URL base
const BASE_URL = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}`
  : 'http://localhost:5000';

// Função para simular um webhook da Hotmart para o plano anual
async function testarWebhookPlanoAnual() {
  console.log(`Enviando webhook de teste para: ${BASE_URL}/api/webhooks/hotmart`);
  
  // Email do usuário de teste - pode ser um email existente ou novo
  const email = 'teste-anual@example.com';
  const name = 'Usuário Teste Plano Anual';
  
  // Cria um payload específico para o plano anual, usando o ID do produto e oferta corretos
  const payload = {
    event: 'PURCHASE_APPROVED',
    id: `test-${Date.now()}`,
    creation_date: new Date().toISOString(),
    data: {
      buyer: {
        email,
        name
      },
      purchase: {
        transaction: `annual-test-${Date.now()}`,
        approved_date: new Date().toISOString(),
        status: 'APPROVED',
        product: {
          id: "5381714" // ID do produto DesignAuto
        },
        offer: {
          code: "aukjngrt" // ID da oferta do plano anual
        }
      },
      subscription: {
        plan: {
          name: 'Premium Anual',
          recurrency_period: 'YEARLY'
        },
        status: 'ACTIVE',
        // Define a data de término para 1 ano a partir de hoje
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  };
  
  try {
    console.log("Enviando payload com os seguintes detalhes:");
    console.log("- Email do usuário:", email);
    console.log("- Nome do usuário:", name);
    console.log("- Plano: Premium Anual (365 dias)");
    console.log("- ID do produto:", payload.data.purchase.product.id);
    console.log("- ID da oferta:", payload.data.purchase.offer.code);
    console.log("- Usando token:", HOTMART_TOKEN.substring(0, 5) + '...');
    
    // Envia a requisição POST para o endpoint de webhook com diferentes cabeçalhos
    console.log("\n1. Testando com X-Hotmart-Webhook-Token (formato padrão):");
    const response = await fetch(`${BASE_URL}/api/webhooks/hotmart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Webhook-Token': HOTMART_TOKEN
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`Status da resposta: ${response.status}`);
    
    try {
      const responseData = await response.json();
      console.log("Resposta:", JSON.stringify(responseData, null, 2));
      
      if (response.status >= 200 && response.status < 300) {
        console.log("\n✅ Webhook processado com sucesso!");
        
        // Verificar o usuário após processamento
        console.log("\nVerificando se o usuário foi criado/atualizado corretamente...");
        await verificarUsuario(email);
      } else {
        console.log("\n❌ Erro ao processar webhook!");
        
        if (response.status === 403) {
          console.log("\n2. Testando com X-Hotmart-Hottok (formato alternativo):");
          const response2 = await fetch(`${BASE_URL}/api/webhooks/hotmart`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Hotmart-Hottok': HOTMART_TOKEN
            },
            body: JSON.stringify(payload)
          });
          
          console.log(`Status da resposta: ${response2.status}`);
          const responseData2 = await response2.json();
          console.log("Resposta:", JSON.stringify(responseData2, null, 2));
          
          if (response2.status >= 200 && response2.status < 300) {
            console.log("\n✅ Webhook processado com sucesso com X-Hotmart-Hottok!");
            // Verificar o usuário após processamento
            console.log("\nVerificando se o usuário foi criado/atualizado corretamente...");
            await verificarUsuario(email);
          } else {
            console.log("\n❌ Erro ao processar webhook com ambos os cabeçalhos");
          }
        }
      }
    } catch (e) {
      console.error("Erro ao processar resposta:", e);
    }
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
  }
}

// Função para verificar se o usuário foi criado/atualizado corretamente
async function verificarUsuario(email) {
  try {
    // Esta é uma simplificação. Normalmente, você precisaria de uma API para buscar usuários
    // Aqui apenas mostramos o conceito de verificação após o webhook
    console.log(`Verificando usuário com email: ${email}`);
    console.log("Nota: Esta verificação requer uma API para buscar usuários.");
    console.log("Verifique manualmente no banco de dados se o usuário foi criado com o plano anual.");
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
  }
}

// Executar o teste
testarWebhookPlanoAnual();