-- Adiciona o campo showLessonNumber à tabela courseLessons
ALTER TABLE "courseLessons" ADD COLUMN IF NOT EXISTS "showLessonNumber" BOOLEAN NOT NULL DEFAULT TRUE;