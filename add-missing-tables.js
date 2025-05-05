#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ws from 'ws';
import dotenv from 'dotenv';

// Configurar ambiente
dotenv.config();
neonConfig.webSocketConstructor = ws;

// Definir caminho para migrações
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsFolder = join(__dirname, 'migrations');

console.log('Iniciando criação de tabelas faltantes do sistema de cursos...');

// Verificar se DATABASE_URL está definido
if (!process.env.DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não está definido no ambiente');
  process.exit(1);
}

// Criar pool e instância do Drizzle
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// SQL para criar as tabelas
const createCourseSQL = `
CREATE TABLE IF NOT EXISTS "courses" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "featuredImage" TEXT,
  "level" TEXT NOT NULL DEFAULT 'iniciante',
  "status" TEXT NOT NULL DEFAULT 'active',
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "isPremium" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" INTEGER REFERENCES "users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

const createCourseModulesSQL = `
CREATE TABLE IF NOT EXISTS "courseModules" (
  "id" SERIAL PRIMARY KEY,
  "courseId" INTEGER REFERENCES "courses"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "thumbnailUrl" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'iniciante',
  "order" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPremium" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" INTEGER NOT NULL REFERENCES "users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

const createCourseSettingsSQL = `
CREATE TABLE IF NOT EXISTS "courseSettings" (
  "id" SERIAL PRIMARY KEY,
  "bannerTitle" TEXT,
  "bannerDescription" TEXT,
  "bannerImageUrl" TEXT,
  "welcomeMessage" TEXT,
  "showModuleNumbers" BOOLEAN DEFAULT true,
  "useCustomPlayerColors" BOOLEAN DEFAULT false,
  "enableComments" BOOLEAN DEFAULT true,
  "allowNonPremiumEnrollment" BOOLEAN DEFAULT false,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedBy" INTEGER REFERENCES "users"("id")
);
`;

// Verificar e criar tabelas faltantes
async function createMissingTables() {
  try {
    console.log('🔍 Verificando tabelas existentes...');
    
    // Verificar quais tabelas existem
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name IN ('courses', 'courseModules', 'courseSettings');
    `);
    
    const existingTables = tables.map(row => row.table_name);
    console.log(`📋 Tabelas encontradas: ${existingTables.length > 0 ? existingTables.join(', ') : 'nenhuma'}`);
    
    // Criar tabelas faltantes
    if (!existingTables.includes('courses')) {
      console.log('🔧 Criando tabela "courses"...');
      await db.execute(sql.raw(createCourseSQL));
      console.log('✅ Tabela "courses" criada com sucesso!');
    }
    
    if (!existingTables.includes('courseModules')) {
      console.log('🔧 Criando tabela "courseModules"...');
      await db.execute(sql.raw(createCourseModulesSQL));
      console.log('✅ Tabela "courseModules" criada com sucesso!');
    }
    
    if (!existingTables.includes('courseSettings')) {
      console.log('🔧 Criando tabela "courseSettings"...');
      await db.execute(sql.raw(createCourseSettingsSQL));
      console.log('✅ Tabela "courseSettings" criada com sucesso!');
      
      // Inserir configuração padrão
      console.log('🔧 Inserindo configuração padrão na tabela "courseSettings"...');
      await db.execute(sql`
        INSERT INTO "courseSettings" ("bannerTitle", "bannerDescription", "showModuleNumbers", "enableComments") 
        VALUES ('Aprenda com nossos cursos', 'Conteúdo exclusivo para você evoluir', true, true)
      `);
      console.log('✅ Configuração padrão inserida com sucesso!');
    }
    
    console.log('✅ Processo de criação de tabelas concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a criação das tabelas:', error);
  } finally {
    await pool.end();
  }
}

// Executar
createMissingTables();