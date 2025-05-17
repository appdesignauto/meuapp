/**
 * Script para testar diretamente o endpoint de webhook da Hotmart
 * Não depende de consultas ao banco de dados para obter o segredo
 */
import 'dotenv/config';
import fetch from 'node-fetch';

// Dados de exemplo de um webhook da Hotmart (similar ao payload real)
const webhookData = {
  "event": "PURCHASE_APPROVED",
  "hottok": process.env.HOTMART_SECRET,
  "data": {
    "product": {
      "id": 3189345,
      "name": "DesignAuto - Plano Anual",
      "price": {
        "currency": "BRL",
        "value": "297.00"
      }
    },
    "buyer": {
      "email": "ws.advogaciasm@gmail.com",
      "name": "Teste Fernando",
      "first_name": "Teste",
      "last_name": "Fernando",
      "document": "13164498748",
      "document_type": "CPF"
    },
    "purchase": {
      "transaction": "HOT-23456789",
      "date": new Date().toISOString(),
      "approved_date": new Date().toISOString(),
      "price": {
        "currency": "BRL",
        "value": "297.00"
      },
      "payment": {
        "type": "credit_card",
        "installments": 1
      }
    }
  }
};

// Função principal para enviar o webhook simulado
async function simulateWebhook() {
  try {
    // URL do webhook (ajuste para acessar o servidor em execução)
    const webhookUrl = "http://localhost:5000/api/webhooks/hotmart";
    
    console.log(`Enviando webhook para: ${webhookUrl}`);
    console.log(`Email do comprador: ${webhookData.data.buyer.email}`);
    console.log(`Token de segurança: ${webhookData.hottok ? 'Presente (valor escondido)' : 'Ausente'}`);
    
    // Enviar o webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hotmart-Webhook/1.0',
        'X-Hotmart-Webhook-Token': process.env.HOTMART_SECRET
      },
      body: JSON.stringify(webhookData)
    });
    
    const responseText = await response.text();
    
    console.log(`Status da resposta: ${response.status}`);
    console.log(`Resposta do servidor: ${responseText}`);
    
    // Se o servidor respondeu com sucesso, o webhook foi processado corretamente
    if (response.status >= 200 && response.status < 300) {
      console.log('\n✅ Webhook processado com sucesso!');
    } else {
      console.log('\n❌ Erro ao processar webhook!');
    }
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
  }
}

// Executar o teste
simulateWebhook();