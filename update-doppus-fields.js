/**
 * Script para adicionar novos campos de integração da Doppus na tabela subscriptionSettings
 * Este script adiciona os campos doppusClientId e doppusClientSecret e migra dados da doppusApiKey se existirem
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Obtém conexão com o banco de dados
 */
async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida no ambiente');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Testar conexão
  try {
    const client = await pool.connect();
    console.log('Conexão bem-sucedida com o banco de dados');
    client.release();
    return pool;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

/**
 * Adiciona os campos doppusClientId e doppusClientSecret na tabela subscriptionSettings
 */
async function updateDoppusFields() {
  const pool = await getDatabase();
  
  try {
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subscriptionSettings'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.error('Tabela subscriptionSettings não existe no banco de dados');
      return;
    }
    
    // Verificar se as colunas já existem
    const columnsExist = await pool.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptionSettings' AND column_name = 'doppusClientId') as client_id_exists,
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptionSettings' AND column_name = 'doppusClientSecret') as client_secret_exists,
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptionSettings' AND column_name = 'doppusApiKey') as api_key_exists
    `);
    
    if (columnsExist.rows[0].client_id_exists) {
      console.log('Coluna doppusClientId já existe. Pulando criação.');
    } else {
      // Adicionar coluna doppusClientId
      await pool.query(`
        ALTER TABLE "subscriptionSettings" 
        ADD COLUMN "doppusClientId" TEXT
      `);
      console.log('Coluna doppusClientId adicionada com sucesso');
    }
    
    if (columnsExist.rows[0].client_secret_exists) {
      console.log('Coluna doppusClientSecret já existe. Pulando criação.');
    } else {
      // Adicionar coluna doppusClientSecret
      await pool.query(`
        ALTER TABLE "subscriptionSettings" 
        ADD COLUMN "doppusClientSecret" TEXT
      `);
      console.log('Coluna doppusClientSecret adicionada com sucesso');
    }
    
    // Salvar as credenciais específicas da Doppus
    const doppusClientId = '619f23648b96ee0ef30214921f3f9b01';
    const doppusClientSecret = 'f58c3b45bc0a1c84b6e2f5a0ebb95fc17';
    const doppusSecretKey = 'f8bb3a727ac70b8217d01407febd0dc6';
    
    // Atualizar os valores
    await pool.query(`
      UPDATE "subscriptionSettings"
      SET 
        "doppusClientId" = $1,
        "doppusClientSecret" = $2,
        "doppusSecretKey" = $3
    `, [doppusClientId, doppusClientSecret, doppusSecretKey]);
    
    console.log('Credenciais da Doppus atualizadas com sucesso');
    
    // Verificar se apiKey existe e não está vazia, e migrar para clientId se necessário
    if (columnsExist.rows[0].api_key_exists) {
      const apiKeyData = await pool.query(`
        SELECT "doppusApiKey" FROM "subscriptionSettings" LIMIT 1
      `);
      
      if (apiKeyData.rows.length > 0 && apiKeyData.rows[0].doppusApiKey) {
        console.log('Migrando dados da coluna doppusApiKey para doppusClientId');
        await pool.query(`
          UPDATE "subscriptionSettings"
          SET "doppusClientId" = "doppusApiKey"
          WHERE "doppusClientId" IS NULL AND "doppusApiKey" IS NOT NULL
        `);
      }
    }
    
    console.log('Atualização da integração Doppus concluída com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar campos da Doppus:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar o script
updateDoppusFields()
  .then(() => console.log('Script concluído com sucesso'))
  .catch(error => console.error('Erro na execução do script:', error))
  .finally(() => process.exit());