/**
 * Script para criar a tabela webhookLogs no banco de dados
 * Esta tabela armazenará os logs de webhooks recebidos da Hotmart
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { exit } from 'process';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function getDatabase() {
  return pool;
}

async function createWebhookLogsTable() {
  const db = await getDatabase();
  
  try {
    console.log('Criando tabela webhookLogs...');
    
    // Verificar se a tabela já existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'webhookLogs'
      );
    `;
    
    const tableExists = await db.query(tableExistsQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('A tabela webhookLogs já existe.');
      
      // Verificar estrutura atual
      console.log('Verificando estrutura da tabela...');
      const columnsQuery = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'webhookLogs';
      `;
      
      const columns = await db.query(columnsQuery);
      const existingColumns = columns.rows.map(row => row.column_name);
      console.log('Colunas existentes:', existingColumns);
      
      // Verificar e adicionar colunas que faltam
      const requiredColumns = [
        { name: 'id', type: 'SERIAL PRIMARY KEY' },
        { name: 'eventType', type: 'TEXT NOT NULL' },
        { name: 'payloadData', type: 'TEXT' },
        { name: 'status', type: 'TEXT NOT NULL' },
        { name: 'errorMessage', type: 'TEXT' },
        { name: 'userId', type: 'INTEGER REFERENCES users(id)' },
        { name: 'sourceIp', type: 'TEXT' },
        { name: 'retryCount', type: 'INTEGER DEFAULT 0' },
        { name: 'createdAt', type: 'TIMESTAMP DEFAULT NOW()' },
        { name: 'updatedAt', type: 'TIMESTAMP DEFAULT NOW()' },
        { name: 'transactionId', type: 'TEXT' }
      ];
      
      for (const column of requiredColumns) {
        if (!existingColumns.includes(column.name)) {
          console.log(`Adicionando coluna ${column.name}...`);
          await db.query(`
            ALTER TABLE "webhookLogs" 
            ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type};
          `);
        }
      }
      
      // Verificar se há colunas antigas não utilizadas
      const oldColumns = [
        'provider', 'event', 'payload', 'error', 'processed', 'processedAt', 'ip'
      ];
      
      for (const oldColumn of oldColumns) {
        if (existingColumns.includes(oldColumn)) {
          console.log(`Atualizando dados da coluna ${oldColumn} para campos novos...`);
          
          // Migrar dados se necessário
          if (oldColumn === 'event' && existingColumns.includes('eventType') === false) {
            await db.query(`
              UPDATE "webhookLogs" 
              SET "eventType" = "event" 
              WHERE "event" IS NOT NULL;
            `);
          }
          
          if (oldColumn === 'payload' && existingColumns.includes('payloadData') === false) {
            await db.query(`
              UPDATE "webhookLogs" 
              SET "payloadData" = "payload" 
              WHERE "payload" IS NOT NULL;
            `);
          }
          
          if (oldColumn === 'error' && existingColumns.includes('errorMessage') === false) {
            await db.query(`
              UPDATE "webhookLogs" 
              SET "errorMessage" = "error" 
              WHERE "error" IS NOT NULL;
            `);
          }
          
          if (oldColumn === 'ip' && existingColumns.includes('sourceIp') === false) {
            await db.query(`
              UPDATE "webhookLogs" 
              SET "sourceIp" = "ip" 
              WHERE "ip" IS NOT NULL;
            `);
          }
          
          console.log(`Removendo coluna antiga ${oldColumn}...`);
          await db.query(`
            ALTER TABLE "webhookLogs" 
            DROP COLUMN IF EXISTS "${oldColumn}";
          `);
        }
      }
      
      console.log('Tabela webhookLogs atualizada com sucesso.');
    } else {
      // Criar tabela do zero
      await db.query(`
        CREATE TABLE "webhookLogs" (
          "id" SERIAL PRIMARY KEY,
          "eventType" TEXT NOT NULL,
          "payloadData" TEXT,
          "status" TEXT NOT NULL,
          "errorMessage" TEXT,
          "userId" INTEGER REFERENCES users(id),
          "sourceIp" TEXT,
          "retryCount" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          "transactionId" TEXT
        );
      `);
      
      console.log('Tabela webhookLogs criada com sucesso.');
    }
    
    // Verificar índices
    console.log('Criando índices para melhorar performance de consultas...');
    
    // Índice para consultas por status
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_webhookLogs_status 
      ON "webhookLogs"("status");
    `);
    
    // Índice para consultas por tipo de evento
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_webhookLogs_eventType 
      ON "webhookLogs"("eventType");
    `);
    
    // Índice para consultas por usuário
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_webhookLogs_userId 
      ON "webhookLogs"("userId");
    `);
    
    // Índice para ordenação por data de criação
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_webhookLogs_createdAt 
      ON "webhookLogs"("createdAt");
    `);
    
    console.log('Índices criados ou atualizados com sucesso.');
    
    return true;
  } catch (error) {
    console.error('Erro ao criar ou atualizar tabela webhookLogs:', error);
    return false;
  } finally {
    // Fechar conexão com o banco
    db.end();
  }
}

// Executar a função principal
const main = async () => {
  try {
    const success = await createWebhookLogsTable();
    console.log('Script concluído', success ? 'com sucesso' : 'com falhas');
    exit(success ? 0 : 1);
  } catch (error) {
    console.error('Erro ao executar script:', error);
    exit(1);
  }
};

main();