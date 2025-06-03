/**
 * Script para adicionar a coluna featuredUntil e isWeeklyFeatured à tabela communityPosts
 * 
 * Este script adiciona as colunas necessárias para o funcionamento do
 * recurso de posts em destaque na comunidade.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getDatabase() {
  return pool;
}

async function addFeaturedUntilColumn() {
  console.log("Iniciando a adição das colunas para destacar posts da comunidade...");
  
  const db = await getDatabase();
  
  try {
    // Verificar se a coluna featuredUntil já existe
    const checkFeaturedUntilColumn = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'communityPosts' AND column_name = 'featuredUntil';
    `);
    
    if (checkFeaturedUntilColumn.rows.length === 0) {
      console.log("Adicionando coluna featuredUntil à tabela communityPosts...");
      await db.query(`
        ALTER TABLE "communityPosts"
        ADD COLUMN "featuredUntil" TIMESTAMP;
      `);
      console.log("Coluna featuredUntil adicionada com sucesso!");
    } else {
      console.log("A coluna featuredUntil já existe na tabela communityPosts.");
    }
    
    // Verificar se a coluna isWeeklyFeatured já existe
    const checkIsWeeklyFeaturedColumn = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'communityPosts' AND column_name = 'isWeeklyFeatured';
    `);
    
    if (checkIsWeeklyFeaturedColumn.rows.length === 0) {
      console.log("Adicionando coluna isWeeklyFeatured à tabela communityPosts...");
      await db.query(`
        ALTER TABLE "communityPosts"
        ADD COLUMN "isWeeklyFeatured" BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log("Coluna isWeeklyFeatured adicionada com sucesso!");
    } else {
      console.log("A coluna isWeeklyFeatured já existe na tabela communityPosts.");
    }
    
    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao executar a migração:", error);
  } finally {
    await db.end();
  }
}

// Executar a migração
addFeaturedUntilColumn()
  .then(() => {
    console.log("Script executado com sucesso.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro durante a execução do script:", error);
    process.exit(1);
  });