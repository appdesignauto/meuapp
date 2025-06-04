/**
 * Script para adicionar a coluna isPopular à tabela ferramentas
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

async function getDatabase() {
  const pool = new Pool({ connectionString: dbUrl });
  return pool;
}

async function addIsPopularColumn() {
  const pool = await getDatabase();

  try {
    console.log('Verificando se a coluna isPopular já existe...');
    const columnExists = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ferramentas' AND column_name = 'isPopular'
    `);

    if (columnExists.rowCount > 0) {
      console.log('A coluna isPopular já existe na tabela ferramentas');
    } else {
      console.log('Adicionando coluna isPopular à tabela ferramentas...');
      await pool.query(`
        ALTER TABLE ferramentas
        ADD COLUMN "isPopular" BOOLEAN NOT NULL DEFAULT false
      `);
      console.log('Coluna isPopular adicionada com sucesso!');
    }

    // Verificando algumas ferramentas como populares para fins de demonstração
    console.log('Atualizando algumas ferramentas como populares...');
    // Pegamos as 3 primeiras ferramentas para marcar como populares
    await pool.query(`
      UPDATE ferramentas
      SET "isPopular" = true
      WHERE id IN (SELECT id FROM ferramentas ORDER BY id LIMIT 3)
    `);
    console.log('Ferramentas atualizadas como populares com sucesso!');

  } catch (error) {
    console.error('Erro ao adicionar coluna isPopular:', error);
  } finally {
    await pool.end();
  }
}

addIsPopularColumn()
  .then(() => console.log('Processo concluído com sucesso!'))
  .catch(err => console.error('Erro durante o processo:', err));