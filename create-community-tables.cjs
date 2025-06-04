require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/pg-core');

// Configuração do banco de dados
if (!process.env.DATABASE_URL) {
  console.error('❌ Erro: A variável de ambiente DATABASE_URL não está definida');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('🚀 Iniciando criação das tabelas da comunidade...');

const createTablesSQL = `
-- Tabela communityPosts (caso não exista)
CREATE TABLE IF NOT EXISTS "communityPosts" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageUrl" TEXT,
  "views" INTEGER DEFAULT 0 NOT NULL,
  "isApproved" BOOLEAN DEFAULT FALSE NOT NULL,
  "isWeeklyFeatured" BOOLEAN DEFAULT FALSE NOT NULL,
  "featuredUntil" TIMESTAMP,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
);

-- Tabela communityComments (caso não exista)
CREATE TABLE IF NOT EXISTS "communityComments" (
  "id" SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES "communityPosts"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "isHidden" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
);

-- Tabela communityLikes (caso não exista)
CREATE TABLE IF NOT EXISTS "communityLikes" (
  "id" SERIAL,
  "postId" INTEGER NOT NULL REFERENCES "communityPosts"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
  PRIMARY KEY ("postId", "userId")
);

-- Tabela communitySaves (caso não exista)
CREATE TABLE IF NOT EXISTS "communitySaves" (
  "id" SERIAL,
  "postId" INTEGER NOT NULL REFERENCES "communityPosts"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
  PRIMARY KEY ("postId", "userId")
);

-- Tabela communityPoints (caso não exista)
CREATE TABLE IF NOT EXISTS "communityPoints" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "points" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "sourceId" INTEGER,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "period" TEXT NOT NULL
);

-- Tabela communityLeaderboard (caso não exista)
CREATE TABLE IF NOT EXISTS "communityLeaderboard" (
  "id" SERIAL,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "totalPoints" INTEGER DEFAULT 0 NOT NULL,
  "postCount" INTEGER DEFAULT 0 NOT NULL,
  "likesReceived" INTEGER DEFAULT 0 NOT NULL,
  "savesReceived" INTEGER DEFAULT 0 NOT NULL,
  "featuredCount" INTEGER DEFAULT 0 NOT NULL,
  "period" TEXT NOT NULL,
  "rank" INTEGER DEFAULT 0 NOT NULL,
  "level" TEXT DEFAULT 'Iniciante KDG' NOT NULL,
  "lastUpdated" TIMESTAMP DEFAULT now() NOT NULL,
  PRIMARY KEY ("userId", "period")
);

-- Tabela communitySettings (caso não exista)
CREATE TABLE IF NOT EXISTS "communitySettings" (
  "id" SERIAL PRIMARY KEY,
  "pointsForPost" INTEGER DEFAULT 20 NOT NULL,
  "pointsForLike" INTEGER DEFAULT 5 NOT NULL,
  "pointsForSave" INTEGER DEFAULT 10 NOT NULL,
  "pointsForWeeklyFeatured" INTEGER DEFAULT 50 NOT NULL,
  "prize1stPlace" TEXT DEFAULT 'R$ 0' NOT NULL,
  "prize2ndPlace" TEXT DEFAULT 'R$ 0' NOT NULL,
  "prize3rdPlace" TEXT DEFAULT 'R$ 0' NOT NULL,
  "levelThresholds" JSONB DEFAULT '{"Iniciante KDG": 0, "Colaborador KDG": 501, "Destaque KDG": 2001, "Elite KDG": 5001, "Lenda KDG": 10001}' NOT NULL,
  "requireApproval" BOOLEAN DEFAULT TRUE NOT NULL,
  "allowComments" BOOLEAN DEFAULT TRUE NOT NULL,
  "showRanking" BOOLEAN DEFAULT TRUE NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedBy" INTEGER REFERENCES "users"("id")
);

-- Inserir configurações padrão se não existirem
INSERT INTO "communitySettings" ("id", "pointsForPost", "pointsForLike", "pointsForSave", "pointsForWeeklyFeatured", "requireApproval", "allowComments", "showRanking")
VALUES (1, 20, 5, 10, 50, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;
`;

async function createCommunityTables() {
  try {
    console.log('🔍 Verificando e criando tabelas da comunidade...');
    
    // Executar SQL diretamente usando pool
    await pool.query(createTablesSQL);
    
    console.log('✅ Tabelas da comunidade foram verificadas/criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas corretamente
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_name IN ('communityPosts', 'communityComments', 'communityLikes', 'communitySaves', 'communityPoints', 'communityLeaderboard', 'communitySettings');
    `);
    
    console.log('📋 Tabelas encontradas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    pool.end();
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    pool.end();
    process.exit(1);
  }
}

createCommunityTables();