/**
 * Script para adicionar a coluna 'source' à tabela webhookLogs
 * 
 * Esta coluna é necessária para identificar a origem do webhook (Hotmart ou Doppus)
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

// Configurar o WebSocket para conexão com o Neon
neonConfig.webSocketConstructor = ws;

async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definida no ambiente');
  }
  
  try {
    return new Pool({ connectionString: process.env.DATABASE_URL });
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

async function addSourceColumnToWebhookLogs() {
  const pool = await getDatabase();
  console.log('Verificando se a coluna source já existe na tabela webhookLogs...');
  
  try {
    // Verificar se a coluna já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'webhookLogs' AND column_name = 'source'
    `;
    
    const { rowCount } = await pool.query(checkColumnQuery);
    
    if (rowCount > 0) {
      console.log('A coluna source já existe na tabela webhookLogs.');
      return;
    }
    
    // Adicionar a coluna source
    console.log('Adicionando coluna source à tabela webhookLogs...');
    const addColumnQuery = `
      ALTER TABLE "webhookLogs" 
      ADD COLUMN "source" TEXT NULL 
      DEFAULT NULL
    `;
    
    await pool.query(addColumnQuery);
    
    console.log('Coluna source adicionada com sucesso à tabela webhookLogs.');
    
    // Atualizar os webhooks existentes (opcional)
    console.log('Atualizando webhooks existentes com valor padrão para a coluna source...');
    const updateExistingQuery = `
      UPDATE "webhookLogs" 
      SET "source" = 'hotmart' 
      WHERE "source" IS NULL
    `;
    
    const { rowCount: updatedCount } = await pool.query(updateExistingQuery);
    console.log(`${updatedCount} registros atualizados com o valor padrão 'hotmart'.`);
    
    console.log('Operação concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar coluna source:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar o script
addSourceColumnToWebhookLogs()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha ao executar o script:', error);
    process.exit(1);
  });