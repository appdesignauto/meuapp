/**
 * Script para adicionar colunas email e whatsapp à tabela reports
 * 
 * Este script adiciona as colunas necessárias para o funcionamento do
 * formulário de denúncias com suporte a usuários não autenticados.
 */

// Usando o pool diretamente do módulo pg para acesso direto ao banco de dados
import pg from 'pg';
const { Pool } = pg;

async function addEmailAndWhatsappColumns() {
  // Criar um pool de conexão para o banco de dados
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Adicionando colunas email e whatsapp à tabela reports...');
    
    // Verificar se as colunas já existem
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reports' 
      AND column_name IN ('email', 'whatsapp');
    `;
    
    const { rows: existingColumns } = await pool.query(checkColumnsQuery);
    const existingColumnNames = existingColumns.map(row => row.column_name);
    
    console.log('Colunas existentes:', existingColumnNames);
    
    // Construir a query para adicionar as colunas que ainda não existem
    let alterTableQueries = [];
    
    if (!existingColumnNames.includes('email')) {
      alterTableQueries.push(`ALTER TABLE reports ADD COLUMN "email" TEXT;`);
      console.log('Coluna email será adicionada');
    }
    
    if (!existingColumnNames.includes('whatsapp')) {
      alterTableQueries.push(`ALTER TABLE reports ADD COLUMN "whatsapp" TEXT;`);
      console.log('Coluna whatsapp será adicionada');
    }
    
    // Executar as queries se houver colunas para adicionar
    if (alterTableQueries.length > 0) {
      const alterQuery = alterTableQueries.join('\n');
      console.log('Executando query:', alterQuery);
      
      await pool.query(alterQuery);
      console.log('Colunas adicionadas com sucesso!');
    } else {
      console.log('Todas as colunas já existem, nenhuma alteração necessária.');
    }
    
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Executar a função principal
addEmailAndWhatsappColumns();