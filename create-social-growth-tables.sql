-- Script para criar tabelas do sistema de crescimento social
-- Execute este script diretamente no banco PostgreSQL

-- Tabela de perfis sociais dos usuários
CREATE TABLE IF NOT EXISTS "socialProfiles" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "platform" TEXT NOT NULL, -- 'instagram', 'facebook', 'tiktok', 'youtube'
  "profileName" TEXT NOT NULL,
  "profileUrl" TEXT NOT NULL,
  "currentFollowers" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de metas dos usuários
CREATE TABLE IF NOT EXISTS "socialGoals" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "profileId" INTEGER REFERENCES "socialProfiles"("id") ON DELETE CASCADE,
  "platform" TEXT NOT NULL, -- 'instagram', 'facebook', 'all'
  "goalType" TEXT NOT NULL, -- 'followers', 'sales'
  "currentValue" INTEGER NOT NULL DEFAULT 0,
  "targetValue" INTEGER NOT NULL,
  "deadline" TIMESTAMP NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de progresso mensal
CREATE TABLE IF NOT EXISTS "socialProgress" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "platform" TEXT NOT NULL, -- 'instagram', 'facebook'
  "month" INTEGER NOT NULL, -- 1-12
  "year" INTEGER NOT NULL,
  "followers" INTEGER NOT NULL DEFAULT 0,
  "sales" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "platform", "month", "year")
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS "idx_socialProfiles_userId" ON "socialProfiles"("userId");
CREATE INDEX IF NOT EXISTS "idx_socialGoals_userId" ON "socialGoals"("userId");
CREATE INDEX IF NOT EXISTS "idx_socialProgress_userId" ON "socialProgress"("userId");
CREATE INDEX IF NOT EXISTS "idx_socialProgress_year_month" ON "socialProgress"("year", "month");

-- Inserir alguns dados de exemplo para o usuário admin (ID 1)
INSERT INTO "socialProfiles" ("userId", "platform", "profileName", "profileUrl", "currentFollowers") VALUES
(1, 'instagram', '@designauto_oficial', 'https://instagram.com/designauto_oficial', 15420),
(1, 'facebook', 'Design Auto Facebook', 'https://facebook.com/designauto', 8350)
ON CONFLICT DO NOTHING;

INSERT INTO "socialGoals" ("userId", "platform", "goalType", "currentValue", "targetValue", "deadline") VALUES
(1, 'instagram', 'followers', 15420, 25000, '2025-08-15'),
(1, 'facebook', 'followers', 8350, 15000, '2025-09-30'),
(1, 'all', 'sales', 127, 300, '2025-07-31')
ON CONFLICT DO NOTHING;

INSERT INTO "socialProgress" ("userId", "platform", "month", "year", "followers", "sales") VALUES
(1, 'instagram', 1, 2025, 12500, 42),
(1, 'instagram', 2, 2025, 13200, 58),
(1, 'instagram', 3, 2025, 13800, 67),
(1, 'instagram', 4, 2025, 14500, 73),
(1, 'instagram', 5, 2025, 15100, 89),
(1, 'instagram', 6, 2025, 15420, 95),
(1, 'facebook', 1, 2025, 7200, 25),
(1, 'facebook', 2, 2025, 7500, 32),
(1, 'facebook', 3, 2025, 7800, 38),
(1, 'facebook', 4, 2025, 8000, 41),
(1, 'facebook', 5, 2025, 8200, 47),
(1, 'facebook', 6, 2025, 8350, 52)
ON CONFLICT ("userId", "platform", "month", "year") DO NOTHING;