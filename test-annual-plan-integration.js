/**
 * Script para testar a integração do plano anual da Hotmart
 * Este script simula um webhook da Hotmart para o plano anual e verifica se o sistema
 * processa corretamente o mapeamento do produto.
 */
import fetch from 'node-fetch';

// Configuração da URL base
const BASE_URL = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}`
  : 'http://localhost:5000';

// Token da Hotmart para autenticação do webhook
const HOTMART_TOKEN = process.env.HOTMART_SECRET;

// Função para simular um webhook da Hotmart para o plano anual
async function testAnnualPlanWebhook() {
  console.log(`Enviando webhook de teste para: ${BASE_URL}/api/webhooks/hotmart`);
  
  // Cria um payload específico para o plano anual, usando o ID do produto e oferta corretos
  const payload = {
    event: 'PURCHASE_APPROVED',
    id: `test-${Date.now()}`,
    creation_date: new Date().toISOString(),
    data: {
      buyer: {
        email: 'teste-anual@example.com',
        name: 'Usuário Teste Plano Anual'
      },
      purchase: {
        transaction: `annual-test-${Date.now()}`,
        approved_date: new Date().toISOString(),
        status: 'APPROVED',
        product: {
          id: "5381714" // ID do produto App DesignAuto
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
    console.log("Enviando payload:", JSON.stringify(payload, null, 2));
    console.log("Usando token:", HOTMART_TOKEN);
    
    // Envia a requisição POST para o endpoint de webhook
    const response = await fetch(`${BASE_URL}/api/webhooks/hotmart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': HOTMART_TOKEN
      },
      body: JSON.stringify(payload)
    });
    
    const responseStatus = response.status;
    console.log(`Status da resposta: ${responseStatus}`);
    
    try {
      const responseData = await response.json();
      console.log("Resposta:", JSON.stringify(responseData, null, 2));
    } catch (e) {
      const responseText = await response.text();
      console.log("Resposta (texto):", responseText);
    }
    
    if (responseStatus >= 200 && responseStatus < 300) {
      console.log("✅ Webhook processado com sucesso!");
    } else {
      console.log("❌ Erro ao processar webhook!");
    }
  } catch (error) {
    console.error("Erro ao enviar webhook:", error);
  }
  
  // Aguarda um momento e então verifica se o usuário foi criado/atualizado corretamente
  console.log("Aguardando processamento...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log("Verificando se o usuário foi criado/atualizado corretamente...");
  await checkUserSubscription('teste-anual@example.com');
}

// Função para verificar se a assinatura do usuário foi atualizada corretamente
async function checkUserSubscription(email) {
  try {
    // Faz uma chamada para a API para verificar o status do usuário
    // Em um cenário real, seria necessário autenticação para esta chamada
    console.log(`Verificando assinatura para o e-mail: ${email}`);
    
    const response = await fetch(`${BASE_URL}/api/admin/users?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      const data = await response.json();
      
      if (data.users && data.users.length > 0) {
        const user = data.users[0];
        console.log("Usuário encontrado:", {
          id: user.id,
          email: user.email,
          name: user.name,
          plano: user.tipoplano,
          origem: user.origemassinatura,
          dataAssinatura: user.dataassinatura,
          dataExpiracao: user.dataexpiracao,
          acessoVitalicio: user.acessovitalicio
        });
        
        // Verifica se o plano e a data de expiração estão corretos
        if (user.tipoplano === 'premium_365') {
          console.log("✅ Plano anual configurado corretamente!");
        } else {
          console.log(`❌ Plano incorreto: ${user.tipoplano || 'não definido'} (esperado: premium_365)`);
        }
        
        // Calcula a data esperada de expiração (aproximadamente 1 ano a partir de hoje)
        const expectedExpiration = new Date();
        expectedExpiration.setFullYear(expectedExpiration.getFullYear() + 1);
        
        if (user.dataexpiracao) {
          const expirationDate = new Date(user.dataexpiracao);
          const diffDays = Math.round((expirationDate - new Date()) / (24 * 60 * 60 * 1000));
          
          if (diffDays > 350 && diffDays < 380) {
            console.log(`✅ Data de expiração configurada corretamente! (aproximadamente ${diffDays} dias)`);
          } else {
            console.log(`❌ Data de expiração incorreta: ${user.dataexpiracao} (diferença: ${diffDays} dias)`);
          }
        } else {
          console.log("❌ Data de expiração não definida");
        }
      } else {
        console.log(`❌ Usuário com e-mail ${email} não encontrado`);
      }
    } else {
      console.log(`❌ Erro ao verificar usuário: ${response.status}`);
      console.log(await response.text());
    }
  } catch (error) {
    console.error("Erro ao verificar assinatura do usuário:", error);
  }
}

// Executa o teste
testAnnualPlanWebhook();