-- Criar tabela para comentários de videoaulas
CREATE TABLE IF NOT EXISTS "videoComments" (
  "id" serial PRIMARY KEY NOT NULL,
  "lessonId" integer NOT NULL,
  "userId" integer NOT NULL,
  "content" text NOT NULL,
  "isHidden" boolean DEFAULT false NOT NULL,
  "likes" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Adicionar chaves estrangeiras
ALTER TABLE "videoComments" ADD CONSTRAINT "videoComments_lessonId_courseLessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "courseLessons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "videoComments" ADD CONSTRAINT "videoComments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;