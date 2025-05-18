/**
 * Script de configuração da integração com a Hotmart
 * 
 * Este script configura a integração direta com a API da Hotmart,
 * criando as tabelas necessárias e configurando as credenciais.
 */

const { Pool } = require('pg');
const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');
require('dotenv').config();

// Criar interface para leitura do terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Função principal que executa a configuração
 */
async function setup() {
  console.log('\n===== Configuração da Integração Direta com a Hotmart =====\n');
  
  try {
    // Verificar se as tabelas necessárias existem
    await checkAndCreateTables();
    
    // Configurar credenciais da Hotmart
    await configureHotmartCredentials();
    
    // Gerar arquivo .env
    await generateEnvFile();
    
    console.log('\n✅ Configuração concluída com sucesso!\n');
    console.log('Para iniciar a integração, execute:');
    console.log('  node server/hotmart-integration/index.js\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
    console.error('Por favor, tente novamente ou contate o suporte.');
  } finally {
    rl.close();
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
async function configureHotmartCredentials() {
  console.log('\nConfiguração das credenciais da Hotmart:');
  console.log('(Você pode obter essas credenciais no painel da Hotmart em Ferramentas de Desenvolvedor > Credenciais)');
  
  // Verificar se já existem credenciais configuradas
  const existingCredentials = await pool.query(`
    SELECT key, value FROM integration_settings
    WHERE provider = 'hotmart'
    AND (key = 'client_id' OR key = 'client_secret')
  `);
  
  const credentials = {
    clientId: '',
    clientSecret: ''
  };
  
  existingCredentials.rows.forEach(row => {
    if (row.key === 'client_id') {
      credentials.clientId = row.value;
    } else if (row.key === 'client_secret') {
      credentials.clientSecret = row.value;
    }
  });
  
  if (credentials.clientId && credentials.clientSecret) {
    console.log('\nCredenciais já configuradas:');
    console.log(`- Client ID: ${credentials.clientId}`);
    console.log(`- Client Secret: ${'•'.repeat(8)}`);
    
    const answer = await askQuestion('\nDeseja atualizar as credenciais? (s/N): ');
    if (answer.toLowerCase() !== 's') {
      console.log('Mantendo as credenciais existentes.');
      return;
    }
  }
  
  // Solicitar novas credenciais
  const clientId = await askQuestion('Client ID: ');
  const clientSecret = await askQuestion('Client Secret: ');
  
  if (!clientId || !clientSecret) {
    throw new Error('Client ID e Client Secret são obrigatórios para a integração.');
  }
  
  // Salvar credenciais no banco de dados
  await saveCredential('hotmart', 'client_id', clientId);
  await saveCredential('hotmart', 'client_secret', clientSecret);
  
  console.log('✅ Credenciais da Hotmart salvas com sucesso.');
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
 * Gerar arquivo .env com as configurações necessárias
 */
async function generateEnvFile() {
  console.log('\nConfiguração do arquivo .env...');
  
  // Gerar um secret JWT aleatório
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  // Obter credenciais da Hotmart do banco de dados
  const credentialsResult = await pool.query(`
    SELECT key, value FROM integration_settings
    WHERE provider = 'hotmart'
    AND (key = 'client_id' OR key = 'client_secret')
  `);
  
  const credentials = {
    clientId: '',
    clientSecret: ''
  };
  
  credentialsResult.rows.forEach(row => {
    if (row.key === 'client_id') {
      credentials.clientId = row.value;
    } else if (row.key === 'client_secret') {
      credentials.clientSecret = row.value;
    }
  });
  
  // Solicitar porta para o servidor
  const port = await askQuestion('Porta para o servidor Hotmart (padrão: 5050): ') || '5050';
  
  // Criar conteúdo do arquivo .env
  const envContent = `# Configurações da Hotmart
HOTMART_CLIENT_ID=${credentials.clientId}
HOTMART_CLIENT_SECRET=${credentials.clientSecret}

# Configuração do JWT
JWT_SECRET=${jwtSecret}

# Configuração do servidor
HOTMART_PORT=${port}
  `;
  
  // Escrever arquivo .env
  fs.writeFileSync('./server/hotmart-integration/.env', envContent);
  
  console.log('✅ Arquivo .env criado com sucesso.');
}

/**
 * Função auxiliar para fazer perguntas via terminal
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Executar o script
setup();