/**
 * Script para criar as tabelas do Sistema de Crescimento Social
 * Baseado no PRD - DesignAuto: Painel de Crescimento Social
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

async function getDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql);
}

async function createSocialGrowthTables() {
  const db = await getDatabase();
  
  try {
    console.log('🚀 Criando tabelas do Sistema de Crescimento Social...');

    // Criar tabela socialProfiles
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "socialProfiles" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "platform" TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
        "profileName" TEXT NOT NULL,
        "profileUrl" TEXT NOT NULL,
        "profileHandle" TEXT,
        "isVerified" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "followersCount" INTEGER DEFAULT 0,
        "lastSyncAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE("userId", "platform", "profileHandle")
      );
    `);
    console.log('✅ Tabela socialProfiles criada');

    // Criar tabela socialGoals
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "socialGoals" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "platform" TEXT NOT NULL CHECK ("platform" IN ('instagram', 'facebook')),
        "goalType" TEXT NOT NULL CHECK ("goalType" IN ('followers', 'sales', 'engagement')),
        "targetValue" INTEGER NOT NULL CHECK ("targetValue" > 0),
        "currentValue" INTEGER DEFAULT 0,
        "startDate" DATE NOT NULL,
        "deadline" DATE NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK ("deadline" > "startDate")
      );
    `);
    console.log('✅ Tabela socialGoals criada');

    // Criar tabela socialProgress
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "socialProgress" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "platform" TEXT NOT NULL CHECK ("platform" IN ('instagram', 'facebook')),
        "metricType" TEXT NOT NULL CHECK ("metricType" IN ('followers', 'sales', 'engagement')),
        "monthYear" VARCHAR(7) NOT NULL,
        "value" INTEGER NOT NULL CHECK ("value" >= 0),
        "growthRate" INTEGER,
        "dataSource" TEXT DEFAULT 'manual' CHECK ("dataSource" IN ('manual', 'api', 'import')),
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE("userId", "platform", "metricType", "monthYear")
      );
    `);
    console.log('✅ Tabela socialProgress criada');

    // Criar tabela socialAlerts
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "socialAlerts" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "goalId" INTEGER REFERENCES "socialGoals"("id") ON DELETE CASCADE,
        "alertType" TEXT NOT NULL CHECK ("alertType" IN ('warning', 'success', 'info', 'danger')),
        "title" VARCHAR(100) NOT NULL,
        "message" TEXT NOT NULL,
        "isRead" BOOLEAN DEFAULT false,
        "isDismissed" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Tabela socialAlerts criada');

    // Criar índices para performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS "idx_social_profiles_user_platform" 
      ON "socialProfiles"("userId", "platform");
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS "idx_social_goals_user_active" 
      ON "socialGoals"("userId", "isActive");
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS "idx_social_progress_user_month" 
      ON "socialProgress"("userId", "monthYear" DESC);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS "idx_social_alerts_user_unread" 
      ON "socialAlerts"("userId", "isRead", "createdAt" DESC);
    `);

    console.log('✅ Índices criados para performance');

    console.log('🎉 Sistema de Crescimento Social configurado com sucesso!');
    console.log('\n📊 Tabelas criadas:');
    console.log('- socialProfiles: Perfis das redes sociais');
    console.log('- socialGoals: Metas de crescimento');
    console.log('- socialProgress: Histórico de progresso mensal');
    console.log('- socialAlerts: Alertas inteligentes');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

// Executar o script
createSocialGrowthTables()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });