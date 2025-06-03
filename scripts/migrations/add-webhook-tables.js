/**
 * Script para adicionar as tabelas e colunas necessárias para o módulo de gerenciamento de assinaturas
 * 
 * Este script cria a tabela webhookLogs e adiciona novos campos à tabela subscriptions
 */

// Usando importações ESM
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

// Inicialização do banco de dados
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL deve estar definida");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function addWebhookTables() {
  try {
    console.log('Iniciando migração das tabelas de webhooks e assinaturas...');

    // Adicionando colunas à tabela users
    console.log('Adicionando campos de integração à tabela users...');
    try {
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS hotmartId TEXT,
        ADD COLUMN IF NOT EXISTS doppusId TEXT;
      `);
      console.log('✅ Campos adicionados à tabela users com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar campos à tabela users:', error);
      throw error;
    }

    // Adicionando colunas à tabela subscriptions
    console.log('Adicionando campos à tabela subscriptions...');
    try {
      await db.execute(sql`
        ALTER TABLE subscriptions
        ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS transactionId TEXT,
        ADD COLUMN IF NOT EXISTS lastEvent TEXT,
        ADD COLUMN IF NOT EXISTS modifiedBy INTEGER REFERENCES users(id);
      `);
      console.log('✅ Campos adicionados à tabela subscriptions com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar campos à tabela subscriptions:', error);
      throw error;
    }

    // Criando a tabela webhookLogs
    console.log('Criando tabela webhookLogs...');
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "webhookLogs" (
          "id" SERIAL PRIMARY KEY,
          "provider" TEXT NOT NULL,
          "event" TEXT NOT NULL,
          "payload" TEXT,
          "status" TEXT NOT NULL,
          "userId" INTEGER REFERENCES users(id),
          "error" TEXT,
          "processed" BOOLEAN NOT NULL DEFAULT false,
          "processedAt" TIMESTAMP,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "ip" TEXT,
          "transactionId" TEXT
        );
      `);
      console.log('✅ Tabela webhookLogs criada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar tabela webhookLogs:', error);
      throw error;
    }

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Executar a função principal
addWebhookTables();