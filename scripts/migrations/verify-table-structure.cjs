// Script para verificar a estrutura da tabela analyticsSettings

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

// Configuração para WebSockets com Neon
neonConfig.webSocketConstructor = ws;

async function verifyTable() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não está definida');
    }
    
    // Criar pool de conexão
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Verificar estrutura da tabela
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'analyticsSettings'
      ORDER BY ordinal_position;
    `);
    
    console.log('Estrutura da tabela analyticsSettings:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
  } finally {
    process.exit(0);
  }
}

verifyTable();