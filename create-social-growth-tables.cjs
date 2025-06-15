/**
 * Script para criar as tabelas do sistema de crescimento social
 */

const { Pool } = require('pg');

async function getDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return pool;
}

async function createSocialGrowthTables() {
  const db = await getDatabase();
  
  try {
    console.log('🚀 Criando tabelas do sistema de crescimento social...');

    // Criar tabela socialNetworks
    await db.query(`
      CREATE TABLE IF NOT EXISTS "socialNetworks" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "platform" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "profileUrl" TEXT,
        "isActive" BOOLEAN DEFAULT true NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log('✅ Tabela socialNetworks criada');

    // Criar tabela socialGrowthData  
    await db.query(`
      CREATE TABLE IF NOT EXISTS "socialGrowthData" (
        "id" SERIAL PRIMARY KEY,
        "socialNetworkId" INTEGER NOT NULL REFERENCES "socialNetworks"("id") ON DELETE CASCADE,
        "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "recordDate" DATE NOT NULL,
        "followers" INTEGER NOT NULL,
        "averageLikes" INTEGER DEFAULT 0,
        "averageComments" INTEGER DEFAULT 0,
        "salesFromPlatform" INTEGER DEFAULT 0,
        "usedDesignAutoArts" BOOLEAN DEFAULT false,
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE("socialNetworkId", "recordDate")
      )
    `);

    console.log('✅ Tabela socialGrowthData criada');

    // Criar índices para melhor performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS "idx_social_networks_user_id" ON "socialNetworks"("userId");
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS "idx_social_growth_data_user_id" ON "socialGrowthData"("userId");
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS "idx_social_growth_data_date" ON "socialGrowthData"("recordDate");
    `);

    console.log('✅ Índices criados');
    console.log('🎉 Sistema de crescimento social configurado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createSocialGrowthTables()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { createSocialGrowthTables };