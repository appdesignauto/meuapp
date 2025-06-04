/**
 * Script para testar o sistema de cancelamento de assinaturas via webhook Hotmart
 * Este script simula os eventos PURCHASE_PROTEST, PURCHASE_REFUNDED e SUBSCRIPTION_CANCELLATION
 */

import fetch from 'node-fetch';

// Configuração
const BASE_URL = 'http://localhost:5000';

// Função para testar cancelamento
async function testCancellationWebhook() {
  console.log('🚫 Testando sistema de cancelamento de assinaturas...\n');

  // Dados de teste para cancelamento
  const testEmail = 'usuario.teste.cancelamento@designauto.com.br';
  const testTransactionId = 'HP' + Date.now();

  // Primeiro, vamos simular uma compra aprovada para ter dados para cancelar
  console.log('1️⃣ Criando assinatura de teste...');
  const purchasePayload = {
    event: 'PURCHASE_APPROVED',
    data: {
      buyer: {
        email: testEmail,
        name: 'Usuário Teste Cancelamento'
      },
      purchase: {
        transaction: testTransactionId,
        status: 'APPROVED',
        order_date: new Date().toISOString(),
        date_next_charge: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      },
      subscription: {
        plan: {
          name: 'Plano Mensal DesignAuto'
        }
      }
    }
  };

  // Criar assinatura
  try {
    const purchaseResponse = await fetch(`${BASE_URL}/webhook/hotmart-fixed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(purchasePayload)
    });

    const purchaseResult = await purchaseResponse.json();
    console.log('✅ Assinatura criada:', purchaseResult.message);
  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error.message);
    return;
  }

  // Aguardar 2 segundos para garantir que a assinatura foi processada
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Agora testar os diferentes tipos de cancelamento
  const cancellationEvents = [
    'PURCHASE_PROTEST',
    'PURCHASE_REFUNDED', 
    'SUBSCRIPTION_CANCELLATION'
  ];

  for (const eventType of cancellationEvents) {
    console.log(`\n2️⃣ Testando evento: ${eventType}`);
    
    const cancellationPayload = {
      event: eventType,
      data: {
        buyer: {
          email: testEmail,
          name: 'Usuário Teste Cancelamento'
        },
        purchase: {
          transaction: testTransactionId,
          status: 'CANCELLED'
        }
      }
    };

    try {
      const response = await fetch(`${BASE_URL}/webhook/hotmart-fixed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cancellationPayload)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`✅ ${eventType} processado com sucesso:`);
        console.log(`   - Email: ${result.email}`);
        console.log(`   - Transaction ID: ${result.transactionId}`);
        console.log(`   - Mensagem: ${result.message}`);
      } else {
        console.log(`❌ Erro ao processar ${eventType}:`, result.error || result.message);
      }
    } catch (error) {
      console.error(`❌ Erro de rede ao testar ${eventType}:`, error.message);
    }

    // Aguardar entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎯 Teste de cancelamento concluído!');
  console.log('\n📋 Verificações recomendadas:');
  console.log('1. Verificar se o usuário foi rebaixado para "free" na tabela users');
  console.log('2. Verificar se a assinatura foi marcada como "canceled" na tabela subscriptions');
  console.log('3. Verificar se os logs foram registrados na tabela webhookLogs');
}

// Executar teste
testCancellationWebhook().catch(console.error);