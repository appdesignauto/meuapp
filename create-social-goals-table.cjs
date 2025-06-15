/**
 * Script para criar a tabela socialGoals no banco de dados
 * Esta tabela armazenará as metas de crescimento social dos usuários
 */

const { Pool } = require('pg');

async function getDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return pool;
}

async function createSocialGoalsTable() {
  const db = await getDatabase();
  
  try {
    // Criar tabela socialGoals
    await db.query(`
      CREATE TABLE IF NOT EXISTS "socialGoals" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "networkId" INTEGER NOT NULL REFERENCES "socialNetworks"("id") ON DELETE CASCADE,
        "goalType" VARCHAR(50) NOT NULL CHECK ("goalType" IN ('followers', 'engagement', 'sales')),
        "targetValue" INTEGER NOT NULL,
        "deadline" DATE NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "networkId", "goalType", "deadline")
      )
    `);

    console.log('✅ Tabela socialGoals criada com sucesso!');

    // Criar índices para otimização
    await db.query(`
      CREATE INDEX IF NOT EXISTS "idx_socialGoals_userId" ON "socialGoals"("userId");
      CREATE INDEX IF NOT EXISTS "idx_socialGoals_networkId" ON "socialGoals"("networkId");
      CREATE INDEX IF NOT EXISTS "idx_socialGoals_deadline" ON "socialGoals"("deadline");
      CREATE INDEX IF NOT EXISTS "idx_socialGoals_active" ON "socialGoals"("isActive");
    `);

    console.log('✅ Índices da tabela socialGoals criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela socialGoals:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createSocialGoalsTable()
    .then(() => {
      console.log('✅ Setup da tabela socialGoals concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no setup:', error);
      process.exit(1);
    });
}

module.exports = { createSocialGoalsTable };