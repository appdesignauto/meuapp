/**
 * Script para adicionar a coluna 'email' à tabela webhookLogs
 * 
 * Esta coluna é necessária para exibir o email associado ao webhook
 * no novo layout de cartões da interface administrativa.
 */

const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');
// Não precisamos importar o schema para esta operação
// Vamos usar SQL puro
const dotenv = require('dotenv');

dotenv.config();

async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definido no arquivo .env');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

async function addEmailColumnToWebhookLogs() {
  const { db, pool } = await getDatabase();
  
  try {
    console.log('Verificando se a coluna email já existe...');
    
    // Verificar se a coluna já existe
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'webhookLogs' AND column_name = 'email'
    `);
    
    if (checkResult.length > 0) {
      console.log('A coluna email já existe na tabela webhookLogs.');
      await pool.end();
      return;
    }
    
    console.log('Adicionando coluna email à tabela webhookLogs...');
    
    // Adicionar a coluna email
    await db.execute(sql`
      ALTER TABLE "webhookLogs" 
      ADD COLUMN "email" TEXT
    `);
    
    console.log('Coluna email adicionada com sucesso!');
    
    // Preencher a coluna email com dados dos usuários relacionados
    console.log('Atualizando registros existentes com emails dos usuários...');
    
    await db.execute(sql`
      UPDATE "webhookLogs" wl
      SET email = u.email
      FROM users u
      WHERE wl.userId = u.id AND wl.email IS NULL
    `);
    
    console.log('Registros existentes atualizados com emails dos usuários.');
    
    // Extrair emails dos payloads para registros sem userId
    console.log('Tentando extrair emails dos payloads JSON...');
    
    // Extrai emails do campo payloadData para transações que não têm userId
    await db.execute(sql`
      UPDATE "webhookLogs" 
      SET email = COALESCE(
        -- Tenta extrair email do JSON para webhooks da Hotmart
        (CASE 
          WHEN source = 'hotmart' AND payloadData::json->>'buyer' IS NOT NULL 
          THEN payloadData::json->'buyer'->>'email'
          WHEN source = 'hotmart' AND payloadData::json->>'subscriber' IS NOT NULL 
          THEN payloadData::json->'subscriber'->>'email'
          WHEN source = 'hotmart' AND payloadData::json->>'customer' IS NOT NULL 
          THEN payloadData::json->'customer'->>'email'
          -- Tenta extrair email do JSON para webhooks do Doppus
          WHEN source = 'doppus' AND payloadData::json->>'user' IS NOT NULL 
          THEN payloadData::json->'user'->>'email'
          WHEN source = 'doppus' AND payloadData::json->>'client' IS NOT NULL 
          THEN payloadData::json->'client'->>'email'
          ELSE NULL
        END),
        email
      )
      WHERE email IS NULL AND payloadData IS NOT NULL AND payloadData != '';
    `);
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await pool.end();
  }
}

addEmailColumnToWebhookLogs()
  .then(() => {
    console.log('Script de migração concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro no script de migração:', error);
    process.exit(1);
  });