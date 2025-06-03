#!/usr/bin/env node

/**
 * Script para adicionar coluna parentId à tabela communityComments e
 * criar a tabela communityCommentLikes para funcionalidades de curtir comentários e
 * responder comentários
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import dotenv from 'dotenv';

// Configurar ambiente
dotenv.config();
neonConfig.webSocketConstructor = ws;

async function getDatabase() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return drizzle(pool);
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

async function addCommentLikesAndReplies() {
  let db;
  
  try {
    db = await getDatabase();
    console.log('Conectado ao banco de dados');
    
    // Verificar se a coluna parentId já existe
    const checkParentIdColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'communityComments' 
      AND column_name = 'parentId'
    `);
    
    if (checkParentIdColumn.rows.length === 0) {
      console.log('Adicionando coluna parentId à tabela communityComments...');
      
      await db.execute(sql`
        ALTER TABLE "communityComments"
        ADD COLUMN "parentId" INTEGER REFERENCES "communityComments"(id)
      `);
      
      console.log('Coluna parentId adicionada com sucesso');
    } else {
      console.log('Coluna parentId já existe na tabela communityComments');
    }
    
    // Verificar se a tabela communityCommentLikes já existe
    const checkTable = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'communityCommentLikes'
    `);
    
    if (checkTable.rows.length === 0) {
      console.log('Criando tabela communityCommentLikes...');
      
      await db.execute(sql`
        CREATE TABLE "communityCommentLikes" (
          id SERIAL PRIMARY KEY,
          "commentId" INTEGER NOT NULL REFERENCES "communityComments"(id) ON DELETE CASCADE,
          "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE("commentId", "userId")
        )
      `);
      
      console.log('Tabela communityCommentLikes criada com sucesso');
    } else {
      console.log('Tabela communityCommentLikes já existe');
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
}

addCommentLikesAndReplies();