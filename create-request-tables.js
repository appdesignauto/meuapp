/**
 * Script para criar as tabelas de solicitações de colaboração e afiliação
 */

import { Client } from 'pg';

async function createTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Criar tabela de solicitações de colaboração
    await client.query(`
      CREATE TABLE IF NOT EXISTS "collaborationRequests" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "portfolio" TEXT,
        "socialMedia" TEXT NOT NULL,
        "experience" TEXT NOT NULL,
        "designTools" TEXT NOT NULL,
        "categories" TEXT NOT NULL,
        "motivation" TEXT NOT NULL,
        "availableTime" TEXT NOT NULL,
        "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "adminNotes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela collaborationRequests criada com sucesso');

    // Criar tabela de solicitações de afiliação
    await client.query(`
      CREATE TABLE IF NOT EXISTS "affiliateRequests" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "company" TEXT,
        "website" TEXT,
        "socialMedia" TEXT NOT NULL,
        "audience" TEXT NOT NULL,
        "niche" TEXT NOT NULL,
        "experience" TEXT NOT NULL,
        "promotionStrategy" TEXT NOT NULL,
        "motivation" TEXT NOT NULL,
        "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "adminNotes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela affiliateRequests criada com sucesso');

    console.log('Todas as tabelas foram criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    await client.end();
  }
}

createTables();