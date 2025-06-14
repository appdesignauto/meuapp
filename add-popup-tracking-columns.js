/**
 * Script para adicionar colunas de rastreamento (views e clicks) na tabela popups
 */

import pkg from 'pg';
const { Pool } = pkg;

async function addPopupTrackingColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Adicionando colunas de rastreamento na tabela popups...');

    // Verificar se as colunas já existem
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'popups' 
      AND column_name IN ('views', 'clicks')
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    if (!existingColumns.includes('views')) {
      await pool.query(`
        ALTER TABLE popups 
        ADD COLUMN views INTEGER DEFAULT 0
      `);
      console.log('✅ Coluna "views" adicionada com sucesso');
    } else {
      console.log('⚠️ Coluna "views" já existe');
    }

    if (!existingColumns.includes('clicks')) {
      await pool.query(`
        ALTER TABLE popups 
        ADD COLUMN clicks INTEGER DEFAULT 0
      `);
      console.log('✅ Coluna "clicks" adicionada com sucesso');
    } else {
      console.log('⚠️ Coluna "clicks" já existe');
    }

    // Zerar todas as métricas existentes para começar o rastreamento do zero
    await pool.query(`
      UPDATE popups 
      SET views = 0, clicks = 0, "updatedAt" = NOW()
    `);
    console.log('✅ Todas as métricas zeradas para começar rastreamento do zero');

    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await pool.end();
  }
}

addPopupTrackingColumns();