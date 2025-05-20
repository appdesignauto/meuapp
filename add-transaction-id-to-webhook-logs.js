/**
 * Script para adicionar a coluna transactionId à tabela webhookLogs
 * 
 * Esta coluna é necessária para armazenar o ID da transação
 * dos webhooks recebidos da Hotmart
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
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
    await pool.connect();
    console.log('✅ Conexão com o banco de dados estabelecida');
    return pool;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

/**
 * Adiciona a coluna transactionId à tabela webhookLogs
 */
async function addTransactionIdColumn() {
  let pool;
  try {
    pool = await getDatabase();

    // Verificar se a tabela webhookLogs existe
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'webhookLogs'
      );
    `);

    const tableExists = tableCheckResult.rows[0].exists;
    if (!tableExists) {
      console.error('❌ Tabela webhookLogs não existe no banco de dados');
      return;
    }

    // Verificar se a coluna já existe
    const columnCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'webhookLogs' AND column_name = 'transactionId'
      );
    `);

    const columnExists = columnCheckResult.rows[0].exists;
    if (columnExists) {
      console.log('ℹ️ Coluna transactionId já existe na tabela webhookLogs');
      return;
    }

    // Adicionar a coluna
    await pool.query(`
      ALTER TABLE "webhookLogs" 
      ADD COLUMN "transactionId" TEXT;
    `);

    console.log('✅ Coluna transactionId adicionada com sucesso à tabela webhookLogs');

    // Verificar a estrutura atualizada da tabela
    const tableStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'webhookLogs';
    `);

    console.log('📊 Estrutura atual da tabela webhookLogs:');
    tableStructure.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type}`);
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar coluna transactionId:', error);
  } finally {
    if (pool) {
      pool.end();
      console.log('🔄 Conexão com o banco de dados encerrada');
    }
  }
}

// Executar o script
addTransactionIdColumn();