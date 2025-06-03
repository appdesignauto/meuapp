/**
 * 🚀 SCRIPT DE TESTE COMPLETO - INTEGRAÇÃO HOTMART WEBHOOK AUTOMÁTICO
 * 
 * Este script testa o sistema completo de automação de compras da Hotmart
 * simulando um webhook real de compra aprovada.
 */

import fetch from 'node-fetch';

// 📦 PAYLOAD DE TESTE - Simula uma compra real da Hotmart
const webhookPayload = {
  event: 'PURCHASE_APPROVED',
  data: {
    purchase: {
      status: 'APPROVED',
      transaction: 'HP12345678901234567890',
      offer: {
        code: 'aukjngrt'
      },
      price: {
        value: 497.00,
        currency_code: 'BRL'
      }
    },
    buyer: {
      email: 'cliente.teste@designauto.com.br',
      name: 'João Silva Cliente'
    },
    product: {
      id: 5381714,
      name: 'DesignAuto Premium - Acesso Anual'
    }
  },
  creation_date: new Date().toISOString(),
  version: '2.0.0'
};

async function testarWebhookHotmart() {
  try {
    console.log('🚀 INICIANDO TESTE DO SISTEMA HOTMART AUTOMÁTICO');
    console.log('=' * 50);
    
    // 📤 Enviar webhook para o endpoint
    console.log('📤 Enviando webhook de teste...');
    console.log('📧 Cliente: ', webhookPayload.data.buyer.email);
    console.log('👤 Nome: ', webhookPayload.data.buyer.name);
    console.log('💰 Valor: R$', webhookPayload.data.purchase.price.value);
    
    const response = await fetch('http://localhost:5000/webhook/hotmart-fixed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hotmart-Webhook/2.0'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const resultado = await response.json();
    
    // ✅ Verificar resposta
    if (response.status === 200 && resultado.success) {
      console.log('');
      console.log('🎉 SUCESSO! Webhook processado com êxito!');
      console.log('✅ Status:', response.status);
      console.log('✅ Resposta:', JSON.stringify(resultado, null, 2));
      console.log('');
      console.log('📊 RESUMO DO PROCESSAMENTO:');
      console.log(`   👤 Usuário: ${resultado.email}`);
      console.log(`   🆔 User ID: ${resultado.userId}`);
      console.log(`   📋 Plano: ${resultado.planType}`);
      console.log(`   ⚡ Processado: ${resultado.processed ? 'SIM' : 'NÃO'}`);
      
    } else {
      console.error('❌ FALHA no processamento do webhook');
      console.error('Status:', response.status);
      console.error('Resposta:', JSON.stringify(resultado, null, 2));
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// 🔄 Executar teste
console.log('🔥 TESTE DE INTEGRAÇÃO HOTMART - SISTEMA COMPLETO');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('');

testarWebhookHotmart();