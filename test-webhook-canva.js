/**
 * Script para testar o endpoint de webhook da Hotmart
 * com o email canvaparamusicos@gmail.com
 */

import fetch from 'node-fetch';

async function enviarWebhook() {
  try {
    console.log('Iniciando teste de webhook...');
    
    // URL do endpoint de webhook (deve ser a URL local do seu servidor)
    const webhookUrl = 'http://localhost:5000/api/webhooks/hotmart';
    
    // Dados específicos do webhook com o email solicitado
    const payload = {
      data: {
        id: 'TEST-' + Date.now(),
        purchase: {
          transaction: 'TEST-TXN-' + Math.floor(Math.random() * 1000000),
          status: 'APPROVED'
        },
        product: {
          id: 12345,
          name: 'Produto de Teste'
        },
        offer: {
          code: 'TESTCODE'
        },
        subscriber: {
          email: 'canvaparamusicos@gmail.com',
          name: 'Usuário Canva Para Músicos'
        },
        commissions: [],
        event: 'PURCHASE_APPROVED'
      },
      token: 'teste-token',
      creation_date: new Date().toISOString(),
      event: 'PURCHASE_APPROVED'
    };
    
    // Header simulado
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Hotmart-Webhook/1.0',
      'X-Hotmart-Signature': 'teste-signature'
    };
    
    console.log('Enviando payload para:', webhookUrl);
    console.log('Email usado no webhook:', payload.data.subscriber.email);
    
    // Enviar a requisição POST
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    // Verificar a resposta
    const responseText = await response.text();
    
    console.log('Status da resposta:', response.status);
    console.log('Corpo da resposta:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook enviado com sucesso!');
    } else {
      console.error('❌ Falha ao enviar webhook:', responseText);
    }
  } catch (error) {
    console.error('Erro ao enviar webhook:', error.message);
  }
}

// Executar o teste
enviarWebhook().finally(() => {
  console.log('Teste de webhook concluído');
});