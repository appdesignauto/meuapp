/**
 * Script para criar a tabela doppusProductMappings no banco de dados
 * Esta tabela armazenará os mapeamentos entre produtos da Doppus e planos no DesignAuto
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

/**
 * Obtém conexão com o banco de dados
 */
async function getDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  return pool;
}

/**
 * Cria a tabela doppusProductMappings
 */
async function createDoppusProductMappingsTable() {
  try {
    const pool = await getDatabase();
    
    console.log('Verificando se a tabela doppusProductMappings já existe...');
    
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'doppusProductMappings'
      );
    `);
    
    const tableExists = checkTableResult.rows[0].exists;
    
    if (tableExists) {
      console.log('A tabela doppusProductMappings já existe. Operação cancelada.');
      await pool.end();
      return;
    }
    
    console.log('Criando tabela doppusProductMappings...');
    
    // Criar a tabela doppusProductMappings
    await pool.query(`
      CREATE TABLE "doppusProductMappings" (
        id SERIAL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        "planId" TEXT NOT NULL UNIQUE,
        "productName" TEXT NOT NULL,
        "planType" TEXT NOT NULL,
        "durationDays" INTEGER,
        "isLifetime" BOOLEAN DEFAULT FALSE,
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Tabela doppusProductMappings criada com sucesso!');
    
    await pool.end();
  } catch (error) {
    console.error('Erro ao criar tabela doppusProductMappings:', error);
    process.exit(1);
  }
}

createDoppusProductMappingsTable();