/**
 * Script para criar a tabela hotmartProductMappings no banco de dados
 * Esta tabela armazenará os mapeamentos entre produtos da Hotmart e planos no DesignAuto
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Função principal para criar a tabela e inserir dados de exemplo
 */
async function createHotmartMappingsTable() {
  try {
    console.log('🚀 Iniciando criação da tabela hotmartProductMappings...');
    
    // Verificar se a tabela já existe
    const tableExists = await checkIfTableExists('hotmart_product_mappings');
    
    if (tableExists) {
      console.log('⚠️ A tabela hotmart_product_mappings já existe!');
      console.log('Atualizando registros existentes...');
      
      // Atualizar registros existentes
      await updateExistingMappings();
    } else {
      console.log('Criando tabela hotmart_product_mappings...');
      
      // Criar a tabela usando SQL direto para evitar problemas com o Prisma
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS hotmart_product_mappings (
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
      
      console.log('✅ Tabela criada com sucesso!');
      
      // Inserir mapeamentos de exemplo
      await insertExampleMappings();
    }
    
    // Imprimir os mapeamentos atuais
    await listCurrentMappings();
    
    console.log('✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar tabela:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verifica se a tabela já existe no banco de dados
 */
async function checkIfTableExists(tableName) {
  const result = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = ${tableName}
    );
  `;
  return result[0].exists;
}

/**
 * Atualiza os mapeamentos existentes
 */
async function updateExistingMappings() {
  try {
    // Atualizar o mapeamento do produto mensal se existir
    await prisma.$executeRaw`
      INSERT INTO hotmart_product_mappings 
        (product_id, offer_id, plan_type, days_valid, active, updated_at)
      VALUES 
        ('5381714', null, 'mensal', 30, true, NOW())
      ON CONFLICT (product_id, offer_id) 
      DO UPDATE SET
        plan_type = 'mensal',
        days_valid = 30,
        active = true,
        updated_at = NOW();
    `;
    
    // Atualizar o mapeamento do produto anual
    await prisma.$executeRaw`
      INSERT INTO hotmart_product_mappings 
        (product_id, offer_id, plan_type, days_valid, active, updated_at)
      VALUES 
        ('5381714', 'aukjngrt', 'anual', 365, true, NOW())
      ON CONFLICT (product_id, offer_id) 
      DO UPDATE SET
        plan_type = 'anual',
        days_valid = 365,
        active = true,
        updated_at = NOW();
    `;
    
    console.log('✅ Mapeamentos atualizados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar mapeamentos:', error);
    throw error;
  }
}

/**
 * Insere mapeamentos de exemplo na tabela
 */
async function insertExampleMappings() {
  try {
    // Inserir mapeamento para plano mensal (sem oferta específica)
    await prisma.$executeRaw`
      INSERT INTO hotmart_product_mappings 
        (product_id, offer_id, plan_type, days_valid, active)
      VALUES 
        ('5381714', null, 'mensal', 30, true);
    `;
    
    // Inserir mapeamento para plano anual (com oferta específica)
    await prisma.$executeRaw`
      INSERT INTO hotmart_product_mappings 
        (product_id, offer_id, plan_type, days_valid, active)
      VALUES 
        ('5381714', 'aukjngrt', 'anual', 365, true);
    `;
    
    console.log('✅ Mapeamentos de exemplo inseridos com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inserir mapeamentos de exemplo:', error);
    throw error;
  }
}

/**
 * Lista os mapeamentos atuais da tabela
 */
async function listCurrentMappings() {
  try {
    const mappings = await prisma.$queryRaw`
      SELECT * FROM hotmart_product_mappings ORDER BY id ASC
    `;
    
    console.log('\n📋 Mapeamentos atuais:');
    console.table(mappings.map(m => ({
      id: m.id,
      produto: m.product_id,
      oferta: m.offer_id || '(padrão)',
      plano: m.plan_type,
      dias: m.days_valid,
      ativo: m.active ? '✅' : '❌'
    })));
    
    return mappings;
  } catch (error) {
    console.error('❌ Erro ao listar mapeamentos:', error);
    return [];
  }
}

// Executar o script
createHotmartMappingsTable().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});