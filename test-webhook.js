/**
 * Script de teste SIMPLIFICADO para webhook da Hotmart
 * Usa ESModules conforme exigido pelo projeto
 */

import fetch from 'node-fetch';

// Payload simplificado de teste
const payload = {
  event: 'PURCHASE_APPROVED',
  data: {
    buyer: {
      name: 'Cliente Teste Final',
      email: 'cliente-teste-final@example.com',
      document: '12345678900'
    },
    purchase: {
      status: 'APPROVED',
      order_date: new Date().toISOString(),
      transaction: `TX-FINAL-${Date.now()}`,
      price: {
        value: 97.00
      }
    }
  }
};

// Função para testar o webhook
async function testWebhook() {
  console.log('Enviando payload para o webhook...');
  
  try {
    const response = await fetch('http://localhost:5000/webhook/hotmart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', data);
    
    console.log('\nTeste concluído!\n');
    console.log('Para verificar o webhook e usuário criado, execute:');
    console.log("1. SELECT * FROM webhook_logs WHERE email = 'cliente-teste-final@example.com' ORDER BY id DESC LIMIT 1;");
    console.log("2. SELECT * FROM users WHERE email = 'cliente-teste-final@example.com';");
    
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
  }
}

// Executar o teste
testWebhook();