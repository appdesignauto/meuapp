/**
 * Script para criar a tabela failedWebhooks no banco de dados
 * Esta tabela armazenará os webhooks que falharam durante o processamento
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Obtém conexão com o banco de dados
 */
async function getDatabase() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso');
    return pool;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

/**
 * Cria a tabela failedWebhooks e suas relações
 */
async function createFailedWebhooksTable() {
  const pool = await getDatabase();

  try {
    // Verificar se a tabela já existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'failedWebhooks'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('ℹ️ Tabela failedWebhooks já existe, pulando criação');
      return;
    }

    // Verificar se a tabela webhookLogs existe (dependência)
    const webhookLogsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'webhookLogs'
      );
    `);

    if (!webhookLogsExists.rows[0].exists) {
      console.error('❌ Erro: Tabela webhookLogs não existe (dependência necessária)');
      console.log('ℹ️ Por favor, execute o script add-webhook-logs-table.js primeiro');
      process.exit(1);
    }

    // Criar a tabela failedWebhooks
    await pool.query(`
      CREATE TABLE "failedWebhooks" (
        "id" SERIAL PRIMARY KEY,
        "webhookLogId" INTEGER REFERENCES "webhookLogs"("id"),
        "source" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "errorMessage" TEXT NOT NULL,
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "lastRetryAt" TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Tabela failedWebhooks criada com sucesso');

    // Criar índices para melhorar a performance
    await pool.query(`
      CREATE INDEX "idx_failedWebhooks_source" ON "failedWebhooks" ("source");
      CREATE INDEX "idx_failedWebhooks_status" ON "failedWebhooks" ("status");
      CREATE INDEX "idx_failedWebhooks_webhookLogId" ON "failedWebhooks" ("webhookLogId");
    `);

    console.log('✅ Índices para a tabela failedWebhooks criados com sucesso');

  } catch (error) {
    console.error('❌ Erro ao criar tabela failedWebhooks:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar o script
createFailedWebhooksTable()
  .then(() => {
    console.log('✓ Script concluído com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Erro ao executar o script:', error);
    process.exit(1);
  });