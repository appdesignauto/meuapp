/**
 * Script para adicionar as tabelas userFollows e notifications ao banco de dados
 * 
 * Este script cria as tabelas necessárias para:
 * 1. Permitir que usuários sigam outros usuários
 * 2. Gerenciar notificações para os usuários
 */

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Função para conectar ao banco de dados
async function getDatabase() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  return pool;
}

// Função principal para criar as tabelas
async function addFollowAndNotificationTables() {
  let pool;
  try {
    pool = await getDatabase();
    console.log("Conectado ao banco de dados com sucesso");

    // Verifica se a tabela userFollows já existe
    const checkFollowTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'userFollows'
      );
    `);

    if (!checkFollowTableResult.rows[0].exists) {
      console.log("Criando tabela userFollows...");
      
      // Cria a tabela userFollows
      await pool.query(`
        CREATE TABLE "userFollows" (
          "id" SERIAL PRIMARY KEY,
          "followerId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "followedId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE("followerId", "followedId")
        );
      `);

      console.log("Tabela userFollows criada com sucesso");
    } else {
      console.log("Tabela userFollows já existe");
    }

    // Verifica se a tabela notifications já existe
    const checkNotificationsTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
      );
    `);

    if (!checkNotificationsTableResult.rows[0].exists) {
      console.log("Criando tabela notifications...");
      
      // Cria a tabela notifications
      await pool.query(`
        CREATE TABLE "notifications" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "type" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "sourceUserId" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
          "relatedPostId" INTEGER REFERENCES "communityPosts"("id") ON DELETE CASCADE,
          "relatedCommentId" INTEGER REFERENCES "communityComments"("id") ON DELETE CASCADE,
          "read" BOOLEAN NOT NULL DEFAULT FALSE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Cria índice na coluna userId para melhorar a performance da consulta
      await pool.query(`
        CREATE INDEX "idx_notifications_userId" ON "notifications"("userId");
      `);

      // Cria índice na coluna read para melhorar a performance da consulta
      await pool.query(`
        CREATE INDEX "idx_notifications_read" ON "notifications"("read");
      `);

      console.log("Tabela notifications criada com sucesso");
    } else {
      console.log("Tabela notifications já existe");
    }

    console.log("Script concluído com sucesso");
  } catch (error) {
    console.error("Erro ao executar o script:", error);
  } finally {
    if (pool) {
      pool.end();
    }
  }
}

// Executa a função principal
addFollowAndNotificationTables();