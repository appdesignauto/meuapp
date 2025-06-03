/**
 * Script para testar o sistema de logs de webhook da Hotmart
 * Este script envia um webhook simulado e verifica se o registro de logs está funcionando
 */

import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Função para simular um evento de compra da Hotmart
async function simulateWebhook() {
  console.log('🚀 Iniciando teste de registro de logs de webhook...');
  
  // Payload de exemplo de uma compra aprovada
  const payload = {
    data: {
      purchase: {
        transaction: 'TXID-' + Date.now(),
        status: 'APPROVED',
        subscription: {
          subscriber: {
            code: 'SUBCODE-' + Math.floor(Math.random() * 100000),
            email: 'teste@designauto.com.br'
          },
          plan: {
            name: 'Plano Mensal'
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
        name: 'DesignAuto Pro'
      }
    },
    event: 'PURCHASE_APPROVED',
    id: 'webhook-test-' + Date.now(),
    creationDate: new Date().toISOString()
  };

  // Token de teste para o webhook
  const webhookToken = process.env.HOTMART_WEBHOOK_SECRET || 'teste-secreto';

  try {
    // Enviar o webhook simulado para o endpoint local
    console.log('📦 Enviando webhook simulado...');
    const response = await fetch('http://localhost:5000/api/webhooks/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hotmart-hottok': webhookToken
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('📬 Resposta do servidor:', result);

    // Verificar se o log foi registrado no banco
    console.log('🔍 Verificando se o log foi registrado no banco...');
    await checkWebhookLogs(payload.data.purchase.subscription.subscriber.email);
  } catch (error) {
    console.error('❌ Erro ao simular webhook:', error);
  }
}

// Função para verificar se o log foi registrado no banco
async function checkWebhookLogs(email) {
  try {
    // Buscar logs no banco pelo email usado no teste
    console.log(`🔍 Buscando logs para o email: ${email}`);
    
    const logs = await prisma.$queryRaw`
      SELECT * FROM webhook_logs 
      WHERE email = ${email} 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    if (logs && logs.length > 0) {
      console.log('✅ Logs encontrados no banco:');
      console.table(logs.map(log => ({
        id: log.id,
        date: new Date(log.created_at).toLocaleString(),
        event: log.event_type,
        status: log.status,
        source: log.source || 'hotmart'
      })));
    } else {
      console.log('❌ Nenhum log encontrado para o email:', email);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar logs no banco:', error);
  }
}

// Função principal
async function main() {
  try {
    console.log('🔧 Verificando ambiente...');
    
    // Verificar se a tabela webhook_logs existe
    const tablesResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'webhook_logs'
      );
    `;
    
    const webhookLogsExists = tablesResult[0].exists;
    
    if (!webhookLogsExists) {
      console.log('❌ A tabela webhook_logs não existe! Criando...');
      
      // Criar a tabela webhook_logs se não existir
      await prisma.$executeRaw`
        CREATE TABLE webhook_logs (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          event_type VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          email VARCHAR(255),
          source VARCHAR(50) DEFAULT 'hotmart',
          raw_payload TEXT,
          error_message TEXT
        );
      `;
      
      console.log('✅ Tabela webhook_logs criada com sucesso!');
    } else {
      console.log('✅ Tabela webhook_logs já existe!');
    }

    // Simular o webhook
    await simulateWebhook();
  } catch (error) {
    console.error('❌ Erro ao executar o script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
main().catch(console.error);