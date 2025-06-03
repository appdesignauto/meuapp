/**
 * Script para simular um webhook da Hotmart
 * Este script utiliza o formato CommonJS (.cjs) para compatibilidade
 * 
 * Ele envia um webhook simulado para o endpoint local e verifica a resposta
 */

const fetch = require('node-fetch');
const crypto = require('crypto');
require('dotenv').config();

// Função para gerar a assinatura HMAC SHA-256
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Função principal para simular o webhook
async function simulateHotmartWebhook() {
  // URL do endpoint local
  const webhookUrl = 'http://localhost:5000/api/webhooks/hotmart';
  
  // Token de segurança (deve corresponder ao configurado no .env)
  const webhookSecret = process.env.HOTMART_WEBHOOK_SECRET || 'teste-secreto';
  
  // Criar payload de teste baseado nos dados reais da Hotmart
  const email = `teste${Date.now()}@designauto.com.br`;
  const payload = {
    data: {
      purchase: {
        transaction: `TX-${Date.now()}`,
        status: 'APPROVED',
        offer: {
          code: 'aukjngrt' // ID da oferta específica para plano anual
        },
        subscription: {
          subscriber: {
            code: `SUB-${Math.floor(Math.random() * 100000)}`,
            email: email,
            name: 'Usuário de Teste'
          },
          plan: {
            name: 'Plano Anual DesignAuto'
          },
          status: 'ACTIVE',
          recurrenceNumber: 1,
          accession: {
            date: new Date().toISOString()
          }
        }
      },
      product: {
        id: '5381714', // ID do produto na Hotmart
        name: 'DesignAuto Premium'
      }
    },
    event: 'PURCHASE_APPROVED',
    id: `webhook-test-${Date.now()}`,
    creationDate: new Date().toISOString()
  };
  
  try {
    console.log(`\n🚀 Enviando webhook simulado para ${webhookUrl}`);
    console.log(`📧 Email de teste: ${email}`);
    console.log(`🔑 Token utilizado: ${webhookSecret.substr(0, 3)}...${webhookSecret.substr(-3)}`);
    
    // Enviar requisição
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hotmart-hottok': webhookSecret
      },
      body: JSON.stringify(payload)
    });
    
    // Processar resposta
    const responseData = await response.json();
    
    console.log(`\n✅ Resposta recebida (status ${response.status}):`);
    console.log(JSON.stringify(responseData, null, 2));
    
    // Verificar se a resposta indica sucesso
    if (responseData.success) {
      console.log('\n🎉 Webhook processado com sucesso!');
    } else {
      console.log('\n⚠️ Webhook processado com avisos ou erros:', responseData.message);
    }
    
    console.log('\n📝 Os logs deste webhook devem ter sido registrados na tabela webhook_logs.');
    console.log('   Verifique o banco de dados para mais detalhes.');
    
  } catch (error) {
    console.error('\n❌ Erro ao enviar webhook simulado:', error.message);
    console.error('Detalhes:', error);
  }
}

// Executar a simulação
console.log('🔧 Simulador de Webhook da Hotmart');
console.log('==================================');
simulateHotmartWebhook();