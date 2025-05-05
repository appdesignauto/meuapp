#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import dotenv from 'dotenv';

// Configurar ambiente
dotenv.config();
neonConfig.webSocketConstructor = ws;

console.log('Criando tabela de configurações de cursos...');

// Verificar se DATABASE_URL está definido
if (!process.env.DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não está definido no ambiente');
  process.exit(1);
}

// Criar pool e instância do Drizzle
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// SQL para criar a tabela
const createCourseSettingsSQL = `
CREATE TABLE IF NOT EXISTS "courseSettings" (
  "id" SERIAL PRIMARY KEY,
  "bannerTitle" TEXT DEFAULT 'DesignAuto Videoaulas',
  "bannerDescription" TEXT DEFAULT 'A formação completa para você criar designs profissionais para seu negócio automotivo',
  "bannerImageUrl" TEXT DEFAULT 'https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop',
  "welcomeMessage" TEXT DEFAULT 'Bem-vindo aos nossos cursos! Aprenda com os melhores profissionais.',
  "showModuleNumbers" BOOLEAN DEFAULT true,
  "useCustomPlayerColors" BOOLEAN DEFAULT false,
  "enableComments" BOOLEAN DEFAULT true,
  "allowNonPremiumEnrollment" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedBy" INTEGER REFERENCES "users"("id")
);

-- Inserir configuração padrão se não existir
INSERT INTO "courseSettings" ("id", "bannerTitle", "bannerDescription", "bannerImageUrl", "welcomeMessage")
SELECT 1, 'DesignAuto Videoaulas', 'A formação completa para você criar designs profissionais para seu negócio automotivo', 'https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop', 'Bem-vindo aos nossos cursos! Aprenda com os melhores profissionais.'
WHERE NOT EXISTS (SELECT 1 FROM "courseSettings" WHERE id = 1);
`;

// Executar script
async function createCourseSettingsTable() {
  try {
    console.log('🔍 Verificando e criando tabela de configurações de cursos...');
    
    // Executar o SQL
    await db.execute(sql.raw(createCourseSettingsSQL));
    
    console.log('✅ Tabela "courseSettings" criada ou atualizada com sucesso!');
    
    // Fechar a conexão com o banco
    await pool.end();
    
    console.log('🎉 Script concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabela courseSettings:', error);
    await pool.end();
    process.exit(1);
  }
}

createCourseSettingsTable();
