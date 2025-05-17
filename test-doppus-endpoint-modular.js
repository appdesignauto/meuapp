/**
 * Script para testar o endpoint modular do webhook da Doppus
 * Este script simula uma chamada para o novo endpoint modular '/webhook/doppus'
 */

import fetch from 'node-fetch';

async function testEndpoint() {
  try {
    // URL do webhook da Doppus (usando a nova estrutura)
    const webhookUrl = 'http://localhost:5000/webhook/doppus';
    
    // Dados de exemplo no formato da Doppus (maio/2025)
    const testWebhookData = {
      id: "083bb5a0-f7e0-414b-b600-585a015403f2",
      creation_date: "2025-05-17T12:30:45.123Z",
      event: "PURCHASE",
      status: "APPROVED",
      buyer_email: "cliente@exemplo.com.br",
      buyer_name: "Cliente Teste",
      payment_type: "CREDIT_CARD",
      offer_code: "PLANO-SEMESTRAL",
      product_id: "DESIGNAUTO-PRO"
    };
    
    // Enviar requisição para o endpoint
    console.log('Enviando dados para o webhook da Doppus...');
    console.log('URL:', webhookUrl);
    console.log('Dados:', JSON.stringify(testWebhookData, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Signature': 'assinatura-de-teste'
      },
      body: JSON.stringify(testWebhookData)
    });
    
    // Verificar resposta
    const responseBody = await response.text();
    console.log('\nResposta do servidor:');
    console.log('Status:', response.status);
    console.log('Corpo:', responseBody);
    
    // Verificar se a resposta foi 200 (success)
    if (response.status === 200) {
      console.log('\n✅ Teste bem-sucedido! O webhook da Doppus está retornando 200 OK imediatamente.');
    } else {
      console.log('\n❌ Teste falhou! O webhook da Doppus deveria retornar 200 OK, mas retornou', response.status);
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao testar o webhook da Doppus:', error.message);
  }
}

// Executar o teste
testEndpoint();