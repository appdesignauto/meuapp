/**
 * Script para criar a tabela integrationSettings no banco de dados
 * Esta tabela armazenará as configurações das integrações externas como Hotmart e Doppus
 */
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

// Função para obter o banco de dados
async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida no ambiente");
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  const db = drizzle(pool);
  return { pool, db };
}

// Função para criar ou atualizar a tabela
async function createIntegrationSettingsTable() {
  try {
    console.log("Iniciando criação/atualização da tabela integrationSettings...");
    const { pool, db } = await getDatabase();
    
    // Verificar se a tabela já existe
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'integrationSettings'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log("Criando tabela integrationSettings...");
      
      // Criar a tabela
      await db.execute(sql`
        CREATE TABLE "integrationSettings" (
          "id" SERIAL PRIMARY KEY,
          "provider" TEXT NOT NULL,
          "key" TEXT NOT NULL,
          "value" TEXT,
          "description" TEXT,
          "isActive" BOOLEAN DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          UNIQUE("provider", "key")
        );
      `);
      
      console.log("Tabela integrationSettings criada com sucesso!");
      
      // Inserir configurações iniciais
      await db.execute(sql`
        INSERT INTO "integrationSettings" ("provider", "key", "value", "description") 
        VALUES 
          ('hotmart', 'secret', '', 'Chave secreta para validação de webhooks da Hotmart'),
          ('hotmart', 'clientId', '', 'Client ID da API da Hotmart'),
          ('hotmart', 'clientSecret', '', 'Client Secret da API da Hotmart'),
          ('hotmart', 'useSandbox', 'true', 'Usar ambiente de sandbox da Hotmart'),
          ('doppus', 'secret', '', 'Chave secreta para validação de webhooks da Doppus');
      `);
      
      console.log("Configurações iniciais inseridas com sucesso!");
    } else {
      console.log("Tabela integrationSettings já existe, verificando estrutura...");
      
      // Verificar se todas as colunas necessárias existem
      const columns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'integrationSettings';
      `);
      
      const existingColumns = columns.rows.map(row => row.column_name);
      
      // Adicionar colunas que possam estar faltando
      if (!existingColumns.includes('isActive')) {
        console.log("Adicionando coluna isActive...");
        await db.execute(sql`
          ALTER TABLE "integrationSettings" 
          ADD COLUMN "isActive" BOOLEAN DEFAULT TRUE;
        `);
      }
      
      if (!existingColumns.includes('description')) {
        console.log("Adicionando coluna description...");
        await db.execute(sql`
          ALTER TABLE "integrationSettings" 
          ADD COLUMN "description" TEXT;
        `);
      }
      
      console.log("Estrutura da tabela verificada e atualizada!");
      
      // Verificar se já existem as configurações básicas
      const configs = await db.execute(sql`
        SELECT provider, key FROM "integrationSettings";
      `);
      
      const existingConfigs = configs.rows.map(row => `${row.provider}_${row.key}`);
      
      const requiredConfigs = [
        {provider: 'hotmart', key: 'secret', desc: 'Chave secreta para validação de webhooks da Hotmart'},
        {provider: 'hotmart', key: 'clientId', desc: 'Client ID da API da Hotmart'},
        {provider: 'hotmart', key: 'clientSecret', desc: 'Client Secret da API da Hotmart'},
        {provider: 'hotmart', key: 'useSandbox', desc: 'Usar ambiente de sandbox da Hotmart', value: 'true'},
        {provider: 'doppus', key: 'secret', desc: 'Chave secreta para validação de webhooks da Doppus'}
      ];
      
      // Adicionar configurações que estão faltando
      for (const config of requiredConfigs) {
        if (!existingConfigs.includes(`${config.provider}_${config.key}`)) {
          console.log(`Adicionando configuração ${config.provider}_${config.key}...`);
          await db.execute(sql`
            INSERT INTO "integrationSettings" ("provider", "key", "value", "description") 
            VALUES (${config.provider}, ${config.key}, ${config.value || ''}, ${config.desc});
          `);
        }
      }
      
      console.log("Configurações verificadas e atualizadas!");
    }
    
    // Fechar a conexão com o banco
    await pool.end();
    
    console.log("Processo concluído com sucesso!");
  } catch (error) {
    console.error("Erro ao criar/atualizar tabela integrationSettings:", error);
    process.exit(1);
  }
}

// Executar a função principal
createIntegrationSettingsTable();