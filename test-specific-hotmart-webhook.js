/**
 * Script para testar o endpoint de webhook da Hotmart com dados específicos
 * 
 * Este script envia um webhook com os dados exatos que estamos tentando validar:
 * - productId: 5381714
 * - offerCode: aukjngrt
 */
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Gerar assinatura HMAC com o segredo da Hotmart
function generateSignature(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const signature = hmac.update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
  return signature;
}

async function getHotmartSecret() {
  try {
    // Usar o segredo definido no .env
    const secret = process.env.HOTMART_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('⚠️ HOTMART_WEBHOOK_SECRET não encontrado no .env. Usando valor padrão para testes.');
      return 'test-secret';
    }
    return secret;
  } catch (error) {
    console.error('Erro ao buscar segredo da Hotmart:', error);
    return 'test-secret';
  }
}

async function testarWebhook() {
  try {
    console.log('🔍 Enviando teste de webhook da Hotmart para os dados específicos...');
    
    // Dados específicos para o teste - formato atualizado com base na estrutura real da Hotmart
    const webhookData = {
      event: "PURCHASE_APPROVED",
      id: "webhook-test-" + Date.now(),
      creation_date: new Date().toISOString(),
      data: {
        purchase: {
          transaction: "TRANS-" + Date.now(),
          status: "APPROVED",
          offer_code: "aukjngrt",  // Formato correto do campo
          buyer: {
            email: "teste.especifico@example.com",
            name: "Cliente Teste Específico"
          },
          subscription: {
            subscriber: {
              code: "SUB-" + Date.now(),
              email: "teste.especifico@example.com",
              name: "Cliente Teste Específico"
            },
            plan: {
              name: "App Design Auto - Premium Anual"
            },
            status: "ACTIVE",
            recurrenceNumber: 1,
            accession: {
              date: new Date().toISOString()
            }
          }
        },
        product: {
          id: "5381714",  // Este é o productId que deve ser reconhecido
          name: "App Design Auto - Premium Anual"
        }
      },
      hottok: process.env.HOTMART_WEBHOOK_SECRET || "test-secret" // O token também vai no corpo do JSON
    };
    
    // Obter o segredo para a assinatura
    const secret = await getHotmartSecret();
    
    // Gerar assinatura
    const payload = JSON.stringify(webhookData);
    const signature = generateSignature(payload, secret);
    
    console.log('📦 Enviando dados:', {
      productId: webhookData.data.product.id,
      offerCode: webhookData.data.purchase.offer_code,
      email: webhookData.data.purchase.subscription.subscriber.email,
      subscriberCode: webhookData.data.purchase.subscription.subscriber.code
    });
    
    // Enviar para o endpoint do webhook (porta 5000 para Replit)
    const response = await fetch("http://localhost:5000/webhook/hotmart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hotmart-Webhook-Token": secret,
        "X-Hotmart-Signature": signature
      },
      body: payload
    });
    
    const responseData = await response.json();
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📄 Resposta do servidor:', responseData);
    
    if (responseData.success === false) {
      console.error('❌ Falha no processamento do webhook:', responseData.message);
      console.log('🔍 Verificando estrutura do payload...');
      
      // Sugestões de depuração
      console.log('🛠️ Dicas de depuração:');
      console.log('1. Verifique se offerId/offerCode está sendo extraído corretamente do payload');
      console.log('2. Confirme que o mapeamento com productId: 5381714 e offerId: aukjngrt existe e está ativo');
      console.log('3. Tente verificar os logs para entender melhor o erro');
    } else {
      console.log('✅ Webhook processado com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar webhook de teste:', error);
  }
}

// Executar o teste
testarWebhook();