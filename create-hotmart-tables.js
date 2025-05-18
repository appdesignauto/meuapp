/**
 * Script para criar as tabelas necessárias para integração com Hotmart e Doppus
 * Este script cria:
 * 1. integration_settings - Configurações das integrações (chaves, tokens, etc.)
 * 2. hotmart_products - Mapeamento de produtos Hotmart para planos da plataforma
 * 3. doppus_products - Mapeamento de produtos Doppus para planos da plataforma
 * 4. webhook_logs - Logs de webhooks recebidos
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createHotmartTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando criação das tabelas para integração com a Hotmart...');
    
    // Iniciar uma transação
    await client.query('BEGIN');
    
    // 1. Criar tabela hotmart_settings
    console.log('📋 Criando tabela hotmart_settings...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "hotmart_settings" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT,
        "description" TEXT,
        "is_secret" BOOLEAN DEFAULT FALSE,
        "is_active" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Inserir configurações padrão
    console.log('⚙️ Inserindo configurações padrão...');
    const defaultSettings = [
      { key: 'client_id', description: 'Client ID da API da Hotmart', is_secret: true },
      { key: 'client_secret', description: 'Client Secret da API da Hotmart', is_secret: true },
      { key: 'webhook_token', description: 'Token de segurança para validação dos webhooks', is_secret: true },
      { key: 'use_sandbox', description: 'Usar ambiente de sandbox (true/false)', value: 'false', is_secret: false },
      { key: 'webhook_url', description: 'URL do webhook configurada na Hotmart', value: '/webhook/hotmart', is_secret: false }
    ];
    
    for (const setting of defaultSettings) {
      await client.query(`
        INSERT INTO "hotmart_settings" ("key", "value", "description", "is_secret", "is_active")
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT ("key") DO NOTHING;
      `, [setting.key, setting.value || null, setting.description, setting.is_secret]);
    }
    
    // 2. Criar tabela hotmart_products
    console.log('📋 Criando tabela hotmart_products...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "hotmart_products" (
        "id" SERIAL PRIMARY KEY,
        "product_id" TEXT NOT NULL,
        "offer_id" TEXT,
        "product_name" TEXT NOT NULL,
        "plan_type" TEXT NOT NULL,
        "duration_days" INTEGER,
        "is_lifetime" BOOLEAN DEFAULT FALSE,
        "is_active" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE("product_id", "offer_id")
      );
    `);
    
    // 3. Criar tabela webhook_logs
    console.log('📋 Criando tabela webhook_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "webhook_logs" (
        "id" SERIAL PRIMARY KEY,
        "event_type" TEXT NOT NULL,
        "payload" JSONB,
        "status" TEXT NOT NULL,
        "error_message" TEXT,
        "user_id" INTEGER REFERENCES users(id),
        "email" TEXT,
        "transaction_id" TEXT,
        "source_ip" TEXT,
        "request_headers" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Criar índices para melhorar performance
    console.log('📊 Criando índices para melhorar performance...');
    
    // Índices para webhook_logs
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON "webhook_logs"("event_type");
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON "webhook_logs"("status");
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON "webhook_logs"("created_at");
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_email ON "webhook_logs"("email");
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_transaction_id ON "webhook_logs"("transaction_id");
    `);
    
    // Índices para hotmart_products
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hotmart_products_product_id ON "hotmart_products"("product_id");
      CREATE INDEX IF NOT EXISTS idx_hotmart_products_offer_id ON "hotmart_products"("offer_id");
      CREATE INDEX IF NOT EXISTS idx_hotmart_products_active ON "hotmart_products"("is_active");
    `);
    
    // Confirmar a transação
    await client.query('COMMIT');
    console.log('✅ Tabelas para integração com a Hotmart criadas com sucesso!');
    
    return true;
  } catch (error) {
    // Reverter a transação em caso de erro
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar tabelas:', error);
    return false;
  } finally {
    client.release();
    pool.end();
  }
}

// Executar função principal
createHotmartTables()
  .then(success => {
    console.log(`🏁 Script finalizado ${success ? 'com sucesso' : 'com falhas'}.`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro não tratado:', error);
    process.exit(1);
  });