/**
 * Script para adicionar a coluna isPinned à tabela communityPosts
 * 
 * Este script adiciona a coluna necessária para o funcionamento da
 * funcionalidade de fixar posts no topo da comunidade.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// Configurações da conexão com o banco de dados
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Erro: DATABASE_URL não definida no arquivo .env');
  process.exit(1);
}

// Obtém conexão com o banco de dados
async function getDatabase() {
  try {
    const pool = new Pool({ 
      connectionString: dbUrl,
    });
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso');
    return pool;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Adiciona a coluna isPinned à tabela communityPosts
async function addIsPinnedColumn() {
  const pool = await getDatabase();
  
  try {
    // Verifica se a coluna já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'communityPosts' AND column_name = 'isPinned'
    `;
    
    const columnResult = await pool.query(checkColumnQuery);
    
    if (columnResult.rows.length === 0) {
      // A coluna ainda não existe, vamos criá-la
      const addColumnQuery = `
        ALTER TABLE "communityPosts" 
        ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT FALSE
      `;
      
      await pool.query(addColumnQuery);
      console.log('✅ Coluna isPinned adicionada com sucesso à tabela communityPosts');
    } else {
      console.log('ℹ️ A coluna isPinned já existe na tabela communityPosts');
    }
    
    console.log('✅ Operação concluída com sucesso');
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna isPinned:', error);
  } finally {
    await pool.end();
  }
}

// Executa o script
addIsPinnedColumn();