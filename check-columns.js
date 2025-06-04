import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkColumns() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Verificando colunas da tabela popups...');

    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'popups';
    `);

    console.log('Colunas encontradas:');
    result.rows.forEach(row => {
      console.log(` - ${row.column_name}`);
    });

  } catch (err) {
    console.error('Erro ao verificar colunas:', err);
  } finally {
    await pool.end();
  }
}

checkColumns()
  .then(() => console.log('Script concluído.'))
  .catch(err => console.error('Erro:', err));