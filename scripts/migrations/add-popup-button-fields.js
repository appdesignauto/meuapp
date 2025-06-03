// Script para adicionar campos de personalização de botão na tabela de popups
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';
dotenv.config();

async function addPopupButtonFields() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Iniciando adição de campos de personalização de botão na tabela popups...');

    // Verificar se as colunas já existem
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'popups' 
      AND column_name IN ('buttonRadius', 'buttonWidth');
    `);

    const existingColumns = checkResult.rows.map(row => row.column_name);
    
    // Adicionar buttonRadius se não existir
    if (!existingColumns.includes('buttonRadius')) {
      console.log('Adicionando coluna buttonRadius...');
      await pool.query(`
        ALTER TABLE popups 
        ADD COLUMN buttonRadius integer DEFAULT 4;
      `);
      console.log('Coluna buttonRadius adicionada com sucesso.');
    } else {
      console.log('Coluna buttonRadius já existe.');
    }

    // Adicionar buttonWidth se não existir
    if (!existingColumns.includes('buttonWidth')) {
      console.log('Adicionando coluna buttonWidth...');
      await pool.query(`
        ALTER TABLE popups 
        ADD COLUMN buttonWidth text DEFAULT 'auto';
      `);
      console.log('Coluna buttonWidth adicionada com sucesso.');
    } else {
      console.log('Coluna buttonWidth já existe.');
    }

    // Verificar se já existem as colunas de segmentação
    const checkSegmentationResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'popups' 
      AND column_name IN ('pages', 'userRoles');
    `);

    const existingSegmentationColumns = checkSegmentationResult.rows.map(row => row.column_name);
    
    // Adicionar coluna pages se não existir
    if (!existingSegmentationColumns.includes('pages')) {
      console.log('Adicionando coluna pages...');
      await pool.query(`
        ALTER TABLE popups 
        ADD COLUMN pages text[] DEFAULT '{}';
      `);
      console.log('Coluna pages adicionada com sucesso.');
    } else {
      console.log('Coluna pages já existe.');
    }

    // Adicionar coluna userRoles se não existir
    if (!existingSegmentationColumns.includes('userRoles')) {
      console.log('Adicionando coluna userRoles...');
      await pool.query(`
        ALTER TABLE popups 
        ADD COLUMN userRoles text[] DEFAULT '{}';
      `);
      console.log('Coluna userRoles adicionada com sucesso.');
    } else {
      console.log('Coluna userRoles já existe.');
    }

    console.log('Todas as alterações foram aplicadas com sucesso!');
  } catch (err) {
    console.error('Erro ao adicionar campos:', err);
  } finally {
    await pool.end();
  }
}

addPopupButtonFields()
  .then(() => console.log('Script concluído.'))
  .catch(err => console.error('Erro no script:', err));