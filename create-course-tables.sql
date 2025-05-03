-- Script para criar tabelas de videoaulas

-- Tabela de Módulos de Curso
CREATE TABLE IF NOT EXISTS "courseModules" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "thumbnailUrl" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'iniciante',
  "order" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "isPremium" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdBy" INTEGER NOT NULL REFERENCES "users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Tabela de Aulas de Curso
CREATE TABLE IF NOT EXISTS "courseLessons" (
  "id" SERIAL PRIMARY KEY,
  "moduleId" INTEGER NOT NULL REFERENCES "courseModules"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "videoProvider" TEXT NOT NULL,
  "duration" INTEGER,
  "thumbnailUrl" TEXT,
  "order" INTEGER NOT NULL,
  "isPremium" BOOLEAN NOT NULL DEFAULT FALSE,
  "additionalMaterialsUrl" TEXT,
  "createdBy" INTEGER NOT NULL REFERENCES "users"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Tabela de Progresso do Usuário
CREATE TABLE IF NOT EXISTS "courseProgress" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id"),
  "lessonId" INTEGER NOT NULL REFERENCES "courseLessons"("id"),
  "progress" INTEGER NOT NULL DEFAULT 0,
  "isCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "lastWatchedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "lessonId")
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS "courseRatings" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id"),
  "lessonId" INTEGER NOT NULL REFERENCES "courseLessons"("id"),
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "lessonId")
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS "idx_courseModules_createdBy" ON "courseModules"("createdBy");
CREATE INDEX IF NOT EXISTS "idx_courseLessons_moduleId" ON "courseLessons"("moduleId");
CREATE INDEX IF NOT EXISTS "idx_courseLessons_createdBy" ON "courseLessons"("createdBy");
CREATE INDEX IF NOT EXISTS "idx_courseProgress_userId" ON "courseProgress"("userId");
CREATE INDEX IF NOT EXISTS "idx_courseProgress_lessonId" ON "courseProgress"("lessonId");
CREATE INDEX IF NOT EXISTS "idx_courseRatings_userId" ON "courseRatings"("userId");
CREATE INDEX IF NOT EXISTS "idx_courseRatings_lessonId" ON "courseRatings"("lessonId");