/**
 * Script para criar a tabela failedWebhooks no banco de dados
 * Esta tabela armazenará os webhooks que falharam durante o processamento
 */
const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Obtém conexão com o banco de dados
 */
async function getDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

/**
 * Cria a tabela failedWebhooks
 */
async function createFailedWebhooksTable() {
  let client;
  try {
    client = await getDatabase();
    
    // Verificar se a tabela já existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'failedWebhooks'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('A tabela failedWebhooks já existe.');
      return;
    }
    
    // Criar a tabela failedWebhooks
    console.log('Criando tabela failedWebhooks...');
    await client.query(`
      CREATE TABLE "failedWebhooks" (
        "id" SERIAL PRIMARY KEY,
        "webhookLogId" INTEGER,
        "source" VARCHAR(50) NOT NULL,
        "payload" JSONB NOT NULL,
        "errorMessage" TEXT NOT NULL,
        "retryCount" INTEGER DEFAULT 0,
        "lastRetryAt" TIMESTAMP,
        "status" VARCHAR(50) DEFAULT 'pending' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    
    console.log('Tabela failedWebhooks criada com sucesso!');
    
    // Adicionar índice na coluna status
    await client.query(`
      CREATE INDEX idx_failed_webhooks_status ON "failedWebhooks" ("status");
    `);
    
    // Adicionar índice na coluna source
    await client.query(`
      CREATE INDEX idx_failed_webhooks_source ON "failedWebhooks" ("source");
    `);
    
    console.log('Índices da tabela failedWebhooks criados com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar tabela failedWebhooks:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Executar a função principal
createFailedWebhooksTable()
  .then(() => {
    console.log('Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });