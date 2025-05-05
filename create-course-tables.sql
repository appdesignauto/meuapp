-- Criação da tabela de cursos
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

-- Criação da tabela de módulos
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

-- Criação da tabela de configurações
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

-- Inserção de dados iniciais na tabela de configurações
INSERT INTO "courseSettings" ("bannerTitle", "bannerDescription", "showModuleNumbers", "enableComments")
VALUES ('Aprenda com nossos cursos', 'Conteúdo exclusivo para você evoluir', true, true)
ON CONFLICT (id) DO NOTHING;

-- Inserção de curso de exemplo se não existir
INSERT INTO "courses" ("title", "description", "slug", "level", "isPremium", "createdBy")
SELECT 'Curso Introdutório', 'Este é um curso introdutório para novos usuários', 'curso-introdutorio', 'iniciante', false, 1
WHERE NOT EXISTS (SELECT 1 FROM "courses" LIMIT 1);

-- Inserção de módulo de exemplo se não existir
INSERT INTO "courseModules" ("courseId", "title", "description", "thumbnailUrl", "order", "createdBy")
SELECT (SELECT id FROM "courses" LIMIT 1), 'Módulo Inicial', 'Módulo introdutório do curso', '/images/default-module.jpg', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "courseModules" LIMIT 1);