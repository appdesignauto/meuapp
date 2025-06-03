/**
 * Script para testar especificamente o webhook da Hotmart com o ID de produto 5381714 
 * e código de oferta aukjngrt
 * 
 * Este script simula um webhook da Hotmart com dados reais para validar
 * o funcionamento do mapeamento de produtos.
 */

import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Função para simular um evento de compra da Hotmart
async function simulateSpecificHotmartWebhook() {
  console.log('\n🚀 Iniciando teste de webhook específico da Hotmart...');
  console.log('📋 Usando: Product ID: 5381714, Offer Code: aukjngrt');
  
  // Gera um email de teste único para facilitar o rastreamento
  const testEmail = `teste.${Date.now()}@designauto.com.br`;
  
  // Payload de exemplo de uma compra aprovada com os dados específicos
  const payload = {
    data: {
      purchase: {
        transaction: 'TXTEST-' + Date.now(),
        status: 'APPROVED',
        offer: {
          code: 'aukjngrt' // Código da oferta específica
        },
        subscription: {
          subscriber: {
            code: 'SUBTEST-' + Math.floor(Math.random() * 100000),
            email: testEmail,
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
        id: '5381714', // ID do produto específico na Hotmart
        name: 'DesignAuto Premium'
      }
    },
    event: 'PURCHASE_APPROVED',
    id: 'webhook-specific-test-' + Date.now(),
    creationDate: new Date().toISOString()
  };

  // Token de webhook da Hotmart
  const webhookToken = process.env.HOTMART_WEBHOOK_SECRET || 'teste-secreto';

  try {
    // 1. Verificar o mapeamento de produtos na tabela
    await checkProductMapping('5381714', 'aukjngrt');
    
    // 2. Enviar o webhook simulado para o endpoint
    console.log('\n📦 Enviando webhook simulado para o servidor...');
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

    // 3. Verificar se o log foi registrado no banco
    console.log('\n🔍 Verificando logs no banco de dados...');
    await checkWebhookLogs(testEmail);
    
    // 4. Verificar se o usuário foi criado ou atualizado no banco
    console.log('\n👤 Verificando se a assinatura do usuário foi atualizada...');
    await checkUserSubscription(testEmail);
    
  } catch (error) {
    console.error('❌ Erro ao simular webhook específico:', error);
  }
}

// Função para verificar o mapeamento de produtos no banco
async function checkProductMapping(productId, offerId) {
  console.log(`\n🔍 Verificando mapeamento para: Product ID ${productId}, Offer ID ${offerId}`);
  
  try {
    // Verificar primeiro se a tabela existe
    const tablesResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'hotmart_product_mappings'
      );
    `;
    
    const tableExists = tablesResult[0].exists;
    
    if (!tableExists) {
      console.log('⚠️ A tabela hotmart_product_mappings não existe!');
      console.log('Criando tabela e adicionando mapeamento...');
      
      // Criar tabela se não existir
      await prisma.$executeRaw`
        CREATE TABLE hotmart_product_mappings (
          id SERIAL PRIMARY KEY,
          product_id VARCHAR(50) NOT NULL,
          offer_id VARCHAR(50),
          plan_type VARCHAR(50) NOT NULL,
          days_valid INTEGER NOT NULL,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE(product_id, offer_id)
        );
      `;
      
      // Inserir mapeamento do produto específico
      await prisma.$executeRaw`
        INSERT INTO hotmart_product_mappings 
        (product_id, offer_id, plan_type, days_valid, active)
        VALUES 
        (${productId}, ${offerId}, 'anual', 365, true);
      `;
      
      console.log('✅ Tabela e mapeamento criados com sucesso!');
    } else {
      console.log('✅ Tabela hotmart_product_mappings existe!');
      
      // Verificar se o mapeamento existe
      const mappingResult = await prisma.$queryRaw`
        SELECT * FROM hotmart_product_mappings
        WHERE product_id = ${productId}
        AND (offer_id = ${offerId} OR offer_id IS NULL)
        AND active = true;
      `;
      
      if (mappingResult && mappingResult.length > 0) {
        console.log('✅ Mapeamento encontrado:', mappingResult);
      } else {
        console.log('⚠️ Mapeamento não encontrado. Adicionando...');
        
        // Inserir mapeamento
        await prisma.$executeRaw`
          INSERT INTO hotmart_product_mappings 
          (product_id, offer_id, plan_type, days_valid, active)
          VALUES 
          (${productId}, ${offerId}, 'anual', 365, true)
          ON CONFLICT (product_id, offer_id) 
          DO UPDATE SET
            active = true,
            plan_type = 'anual',
            days_valid = 365,
            updated_at = NOW();
        `;
        
        console.log('✅ Mapeamento adicionado com sucesso!');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar mapeamento:', error);
  }
}

// Função para verificar os logs de webhook no banco
async function checkWebhookLogs(email) {
  try {
    // Buscar logs recentes relacionados a este email
    const logs = await prisma.$queryRaw`
      SELECT * FROM webhook_logs 
      WHERE email = ${email} 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    if (logs && logs.length > 0) {
      console.log('✅ Logs de webhook encontrados:');
      console.table(logs.map(log => ({
        id: log.id,
        data: new Date(log.created_at).toLocaleString(),
        evento: log.event_type,
        status: log.status,
        email: log.email
      })));
    } else {
      console.log('❌ Nenhum log encontrado para este email:', email);
      console.log('⚠️ Verificando todos os logs recentes...');
      
      // Buscar todos os logs recentes
      const allLogs = await prisma.$queryRaw`
        SELECT * FROM webhook_logs 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      
      if (allLogs && allLogs.length > 0) {
        console.log('ℹ️ Logs recentes encontrados:');
        console.table(allLogs.map(log => ({
          id: log.id,
          data: new Date(log.created_at).toLocaleString(),
          evento: log.event_type,
          email: log.email || 'N/A',
          status: log.status
        })));
      } else {
        console.log('❌ Nenhum log recente encontrado na tabela webhook_logs');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar logs:', error);
  }
}

// Função para verificar se a assinatura do usuário foi atualizada
async function checkUserSubscription(email) {
  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        tipoplano: true,
        origemassinatura: true,
        dataassinatura: true,
        dataexpiracao: true
      }
    });
    
    if (user) {
      console.log('✅ Usuário encontrado com assinatura:');
      console.table([{
        id: user.id,
        email: user.email,
        plano: user.tipoplano || 'N/A',
        origem: user.origemassinatura || 'N/A',
        inicio: user.dataassinatura ? new Date(user.dataassinatura).toLocaleString() : 'N/A',
        expiracao: user.dataexpiracao ? new Date(user.dataexpiracao).toLocaleString() : 'N/A'
      }]);
      
      // Verificar se o plano está correto (anual)
      if (user.tipoplano === 'anual' || user.tipoplano === 'premium') {
        console.log('✅ Plano atualizado corretamente para anual/premium!');
      } else {
        console.log('❌ Plano NÃO foi atualizado corretamente. Valor atual:', user.tipoplano);
      }
      
      // Verificar a data de expiração (deve ser cerca de 1 ano no futuro)
      if (user.dataexpiracao) {
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        const now = new Date();
        const expiryDate = new Date(user.dataexpiracao);
        const diffInDays = Math.round((expiryDate - now) / (24 * 60 * 60 * 1000));
        
        if (diffInDays > 350) { // Aproximadamente 1 ano com pequena margem
          console.log('✅ Data de expiração correta (aproximadamente 1 ano):', diffInDays, 'dias');
        } else {
          console.log('❌ Data de expiração incorreta. Dias restantes:', diffInDays);
        }
      } else {
        console.log('❌ Data de expiração não definida');
      }
    } else {
      console.log('❌ Usuário com email', email, 'não encontrado no banco');
      console.log('⚠️ O usuário deveria ter sido criado automaticamente pelo webhook');
      
      // Verificar se há algum usuário com email semelhante
      const similarUsers = await prisma.users.findMany({
        where: {
          email: {
            contains: email.split('@')[0]
          }
        },
        select: {
          id: true,
          email: true,
          tipoplano: true
        },
        take: 5
      });
      
      if (similarUsers.length > 0) {
        console.log('ℹ️ Usuários com email semelhante encontrados:');
        console.table(similarUsers);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar assinatura do usuário:', error);
  }
}

// Função principal
async function main() {
  console.log('\n🔧 Iniciando teste específico com dados reais do webhook Hotmart');
  console.log('📊 Product ID: 5381714, Offer Code: aukjngrt');
  
  try {
    // Verificar se as tabelas necessárias existem
    await checkRequiredTables();
    
    // Simular o webhook específico
    await simulateSpecificHotmartWebhook();
    
    console.log('\n✅ Teste concluído!');
  } catch (error) {
    console.error('\n❌ Erro ao executar o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Verificar se as tabelas necessárias existem
async function checkRequiredTables() {
  const requiredTables = [
    'webhook_logs',
    'hotmart_product_mappings',
    'users'
  ];
  
  console.log('\n🔍 Verificando tabelas necessárias...');
  
  for (const tableName of requiredTables) {
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${tableName}
        );
      `;
      
      const exists = result[0]?.exists;
      
      if (exists) {
        console.log(`✅ Tabela ${tableName} existe`);
      } else {
        console.log(`❌ Tabela ${tableName} NÃO existe!`);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar tabela ${tableName}:`, error);
    }
  }
}

// Executar o script
main().catch(e => {
  console.error('❌ Erro fatal:', e);
  process.exit(1);
});