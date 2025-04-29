/**
 * Script para adicionar a coluna isVisible à tabela arts
 * Uso: node scripts/add-visibility-column.js
 */

import { db } from '../server/db.ts';
import { sql } from 'drizzle-orm';

async function addVisibilityColumn() {
  try {
    console.log('Adicionando coluna isVisible à tabela arts...');
    
    // Verificar se a coluna já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'arts' AND column_name = 'isVisible';
    `;
    
    const result = await db.execute(sql.raw(checkColumnQuery));
    
    if (result.rows.length > 0) {
      console.log('A coluna isVisible já existe na tabela arts.');
      return;
    }
    
    // Adicionar a coluna isVisible
    const addColumnQuery = `
      ALTER TABLE arts
      ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT TRUE;
    `;
    
    await db.execute(sql.raw(addColumnQuery));
    
    console.log('Coluna isVisible adicionada com sucesso à tabela arts.');
  } catch (error) {
    console.error('Erro ao adicionar coluna isVisible:', error);
  } finally {
    process.exit(0);
  }
}

addVisibilityColumn();