/**
 * Script para adicionar a coluna editLink à tabela communityPosts e 
 * renomear a coluna views para viewCount para manter a consistência
 */

import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não está definida");
  }

  return new Pool({ connectionString: process.env.DATABASE_URL });
}

async function addEditLinkToCommunityPosts() {
  console.log("Iniciando a adição da coluna editLink à tabela communityPosts...");
  
  const db = await getDatabase();
  
  try {
    // Verificar se a coluna editLink já existe
    const checkEditLinkColumn = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'communityPosts' AND column_name = 'editLink';
    `);
    
    if (checkEditLinkColumn.rows.length === 0) {
      console.log("Adicionando coluna editLink à tabela communityPosts...");
      await db.query(`
        ALTER TABLE "communityPosts"
        ADD COLUMN "editLink" TEXT;
      `);
      console.log("Coluna editLink adicionada com sucesso!");
    } else {
      console.log("A coluna editLink já existe na tabela communityPosts.");
    }
    
    // Verificar se a coluna views existe e renomeá-la para viewCount
    const checkViewsColumn = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'communityPosts' AND column_name = 'views';
    `);
    
    if (checkViewsColumn.rows.length > 0) {
      console.log("Renomeando coluna views para viewCount...");
      await db.query(`
        ALTER TABLE "communityPosts"
        RENAME COLUMN "views" TO "viewCount";
      `);
      console.log("Coluna views renomeada para viewCount com sucesso!");
    } else {
      // Verificar se viewCount já existe
      const checkViewCountColumn = await db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'communityPosts' AND column_name = 'viewCount';
      `);
      
      if (checkViewCountColumn.rows.length === 0) {
        console.log("Adicionando coluna viewCount à tabela communityPosts...");
        await db.query(`
          ALTER TABLE "communityPosts"
          ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
        `);
        console.log("Coluna viewCount adicionada com sucesso!");
      } else {
        console.log("A coluna viewCount já existe na tabela communityPosts.");
      }
    }
    
    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao executar a migração:", error);
  } finally {
    await db.end();
  }
}

// Executar a função
addEditLinkToCommunityPosts();