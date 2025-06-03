/**
 * Script para criar as tabelas do sistema de denúncias
 * Este script cria as tabelas reportTypes e reports no banco de dados
 * e insere os tipos de denúncias padrão
 */

import * as dotenv from 'dotenv';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// Carrega variáveis de ambiente
dotenv.config();

// Verifica se a variável DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida. Por favor, configure suas variáveis de ambiente.");
  process.exit(1);
}

// Estabelece conexão com o banco de dados
async function getDatabase() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return drizzle(client);
}

async function createReportTables() {
  try {
    console.log("Iniciando criação das tabelas do sistema de denúncias...");
    const db = await getDatabase();
    
    // Verifica se a tabela reportTypes já existe
    const reportTypesExists = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reportTypes'
      );
    `);
    
    if (!reportTypesExists.rows[0].exists) {
      console.log("Criando tabela reportTypes...");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "reportTypes" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Tabela reportTypes criada com sucesso!");
      
      // Inserindo tipos de denúncias padrão
      console.log("Inserindo tipos de denúncias padrão...");
      await db.execute(`
        INSERT INTO "reportTypes" ("name", "description") VALUES
        ('Plágio', 'Conteúdo copiado de outro criador sem autorização ou crédito'),
        ('Conteúdo inadequado', 'Material ofensivo, inapropriado ou que viola diretrizes da comunidade'),
        ('Direitos autorais', 'Violação de direitos autorais ou propriedade intelectual'),
        ('Outro', 'Outros tipos de problemas não listados acima');
      `);
      console.log("Tipos de denúncias padrão inseridos com sucesso!");
    } else {
      console.log("Tabela reportTypes já existe. Pulando criação...");
    }
    
    // Verifica se a tabela reports já existe
    const reportsExists = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reports'
      );
    `);
    
    if (!reportsExists.rows[0].exists) {
      console.log("Criando tabela reports...");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "reports" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER REFERENCES "users"("id"),
          "artId" INTEGER REFERENCES "arts"("id"),
          "reportTypeId" INTEGER REFERENCES "reportTypes"("id"),
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "evidence" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pendente',
          "adminResponse" TEXT,
          "respondedBy" INTEGER REFERENCES "users"("id"),
          "respondedAt" TIMESTAMP,
          "isResolved" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Tabela reports criada com sucesso!");
    } else {
      console.log("Tabela reports já existe. Pulando criação...");
    }
    
    console.log("Criação das tabelas do sistema de denúncias concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabelas do sistema de denúncias:", error);
  }
}

// Executa a função principal
createReportTables().catch(console.error);