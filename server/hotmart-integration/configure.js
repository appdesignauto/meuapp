/**
 * Script simples para configurar as credenciais da Hotmart
 */

import pg from 'pg';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const { Pool } = pg;

// Conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function configureHotmart() {
  console.log('\n===== Configuração da Integração Direta com a Hotmart =====\n');
  
  try {
    // Verificar se as tabelas necessárias existem
    await checkAndCreateTables();
    
    // Configurar credenciais da Hotmart através do .env
    await configureCredentials();
    
    // Criar arquivo .env
    await createEnvFile();
    
    console.log('\n✅ Configuração concluída com sucesso!\n');
    console.log('Para iniciar a integração, execute:');
    console.log('  node server/hotmart-integration/index.js\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
    console.error('Por favor, tente novamente ou contate o suporte.');
  } finally {
    await pool.end();
  }
}

/**
 * Verificar se as tabelas necessárias existem e criá-las se não existirem
 */
async function checkAndCreateTables() {
  console.log('Verificando tabelas necessárias...');
  
  // Verificar tabela integration_settings
  const integrationSettingsExists = await checkTableExists('integration_settings');
  if (!integrationSettingsExists) {
    console.log('Criando tabela integration_settings...');
    await pool.query(`
      CREATE TABLE integration_settings (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        key VARCHAR(255) NOT NULL,
        value TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(provider, key)
      );
    `);
    console.log('✅ Tabela integration_settings criada com sucesso.');
  } else {
    console.log('✅ Tabela integration_settings já existe.');
  }
  
  // Verificar tabela sync_logs
  const syncLogsExists = await checkTableExists('sync_logs');
  if (!syncLogsExists) {
    console.log('Criando tabela sync_logs...');
    await pool.query(`
      CREATE TABLE sync_logs (
        id SERIAL PRIMARY KEY,
        status VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Tabela sync_logs criada com sucesso.');
  } else {
    console.log('✅ Tabela sync_logs já existe.');
  }
  
  console.log('Todas as tabelas verificadas e criadas conforme necessário.');
}

/**
 * Verificar se uma tabela existe
 */
async function checkTableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = $1
    );
  `, [tableName]);
  
  return result.rows[0].exists;
}

/**
 * Configurar credenciais da Hotmart no banco de dados
 */
async function configureCredentials() {
  console.log('\nConfiguração das credenciais da Hotmart:');
  
  // Usar credenciais do ambiente
  const clientId = process.env.HOTMART_CLIENT_ID;
  const clientSecret = process.env.HOTMART_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Credenciais da Hotmart não encontradas nas variáveis de ambiente');
  }
  
  console.log('Encontradas credenciais nas variáveis de ambiente:');
  console.log(`- Client ID: ${clientId.substring(0, 5)}...`);
  console.log(`- Client Secret: ${'•'.repeat(8)}`);
  
  // Salvar credenciais no banco de dados
  await saveCredential('hotmart', 'client_id', clientId);
  await saveCredential('hotmart', 'client_secret', clientSecret);
  
  console.log('✅ Credenciais da Hotmart salvas com sucesso no banco de dados.');
}

/**
 * Salvar uma credencial no banco de dados
 */
async function saveCredential(provider, key, value) {
  const existingResult = await pool.query(
    `SELECT id FROM integration_settings WHERE provider = $1 AND key = $2`,
    [provider, key]
  );
  
  if (existingResult.rows.length > 0) {
    await pool.query(
      `UPDATE integration_settings SET value = $1, updated_at = NOW() 
       WHERE provider = $2 AND key = $3`,
      [value, provider, key]
    );
  } else {
    await pool.query(
      `INSERT INTO integration_settings (provider, key, value, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [provider, key, value]
    );
  }
}

/**
 * Criar arquivo .env com as configurações necessárias
 */
async function createEnvFile() {
  console.log('\nConfiguração do arquivo .env...');
  
  // Gerar um secret JWT aleatório
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  // Criar conteúdo do arquivo .env
  const envContent = `# Configurações da Hotmart
HOTMART_CLIENT_ID=${process.env.HOTMART_CLIENT_ID}
HOTMART_CLIENT_SECRET=${process.env.HOTMART_CLIENT_SECRET}

# Configuração do JWT
JWT_SECRET=${jwtSecret}

# Configuração do servidor
HOTMART_PORT=5050
  `;
  
  // Escrever arquivo .env
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);
  
  console.log(`✅ Arquivo .env criado com sucesso em ${envPath}`);
}

// Executar o script
configureHotmart();