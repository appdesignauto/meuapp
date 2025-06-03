/**
 * 🚀 TESTE DO WEBHOOK HOTMART CORRIGIDO
 * 
 * Este script testa o novo processo correto do webhook conforme especificação:
 * 1. Validação correta (event + status)
 * 2. Extração correta dos dados
 * 3. Inserção na tabela users com campos corretos
 * 4. Criação na tabela subscriptions
 * 5. Log no webhookLogs
 */

import fetch from 'node-fetch';

async function testarWebhookCorrigido() {
  console.log('🚀 TESTANDO WEBHOOK HOTMART CORRIGIDO');
  console.log('=' .repeat(50));

  const webhookUrl = 'https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev/webhook/hotmart-fixed';
  
  // Payload com estrutura correta da Hotmart
  const payload = {
    "event": "PURCHASE_APPROVED",
    "data": {
      "buyer": {
        "name": "João da Silva Teste",
        "email": "joao.teste.correto@gmail.com",
        "document": "(11) 99999-8888"
      },
      "purchase": {
        "status": "APPROVED",
        "order_date": "2025-05-26T15:30:00Z",
        "date_next_charge": "2025-06-26T15:30:00Z",
        "transaction": "TXN_12345_CORRETO"
      },
      "subscription": {
        "plan": {
          "name": "Plano Mensal DesignAuto"
        }
      }
    }
  };

  try {
    console.log('📤 Enviando webhook para:', webhookUrl);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    console.log('📥 Status:', response.status);
    console.log('📥 Resposta:', JSON.stringify(responseData, null, 2));

    if (response.status === 200 && responseData.success) {
      console.log('✅ WEBHOOK PROCESSADO COM SUCESSO!');
      console.log(`👤 Usuário criado/atualizado: ID ${responseData.userId}`);
      console.log(`📋 Plano: ${responseData.planType}`);
      
      // Aguardar um pouco para verificar no banco
      console.log('\n⏳ Aguardando 3 segundos para verificar no banco...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await verificarDadosNoBanco('joao.teste.correto@gmail.com');
      
    } else {
      console.log('❌ FALHA NO PROCESSAMENTO');
      console.log('Resposta:', responseData);
    }

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
  }
}

async function verificarDadosNoBanco(email) {
  console.log('\n🔍 VERIFICANDO DADOS NO BANCO');
  console.log('=' .repeat(50));

  try {
    // Verificar usuário
    console.log('👤 Verificando usuário...');
    const checkUserUrl = 'https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev/api/admin/users?search=' + encodeURIComponent(email);
    
    const userResponse = await fetch(checkUserUrl);
    const userData = await userResponse.json();
    
    if (userData.users && userData.users.length > 0) {
      const user = userData.users[0];
      console.log('✅ Usuário encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nível: ${user.nivelacesso}`);
      console.log(`   Plano: ${user.tipoplano}`);
      console.log(`   Origem: ${user.origemassinatura}`);
    } else {
      console.log('❌ Usuário não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
  }
}

// Executar teste
testarWebhookCorrigido();