/**
 * Script para adicionar a coluna groupId à tabela arts
 * Uso: node scripts/add-group-id-column.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const { Pool } = pg;

// Configuração da conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addGroupIdColumn() {
  let client;

  try {
    console.log('Conectando ao banco de dados...');
    client = await pool.connect();

    // Verificar se a coluna já existe
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'arts' AND column_name = 'groupId';
    `);

    if (checkResult.rows.length > 0) {
      console.log('A coluna groupId já existe na tabela arts.');
      return;
    }

    // Adicionar a coluna groupId
    console.log('Adicionando coluna groupId à tabela arts...');
    await client.query(`
      ALTER TABLE arts
      ADD COLUMN "groupId" TEXT;
    `);

    console.log('Coluna groupId adicionada com sucesso!');

  } catch (error) {
    console.error('Erro ao adicionar coluna groupId:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar a função principal
addGroupIdColumn()
  .then(() => {
    console.log('Processo concluído');
  })
  .catch((err) => {
    console.error('Erro no processo:', err);
    process.exit(1);
  });