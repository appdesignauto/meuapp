-- Adiciona a coluna supabaseId na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "supabaseId" TEXT UNIQUE;