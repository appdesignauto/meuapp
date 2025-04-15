-- Criar tabela para comentários da comunidade
CREATE TABLE IF NOT EXISTS "communityComments" (
  "id" serial PRIMARY KEY NOT NULL,
  "postId" integer NOT NULL,
  "userId" integer NOT NULL,
  "content" text NOT NULL,
  "isHidden" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Criar tabela para estatísticas do designer
CREATE TABLE IF NOT EXISTS "designerStats" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "artId" integer NOT NULL,
  "downloadCount" integer DEFAULT 0 NOT NULL,
  "viewCount" integer DEFAULT 0 NOT NULL,
  "favoriteCount" integer DEFAULT 0 NOT NULL,
  "conversionRate" integer DEFAULT 0 NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Criar tabela para preferências do usuário
CREATE TABLE IF NOT EXISTS "userPreferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "emailNotifications" boolean DEFAULT true NOT NULL,
  "darkMode" boolean DEFAULT false NOT NULL,
  "language" text DEFAULT 'pt-BR' NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "userPreferences_userId_unique" UNIQUE("userId")
);

-- Criar tabela para estatísticas do usuário
CREATE TABLE IF NOT EXISTS "userStats" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "totalDownloads" integer DEFAULT 0 NOT NULL,
  "totalFavorites" integer DEFAULT 0 NOT NULL,
  "totalViews" integer DEFAULT 0 NOT NULL,
  "lastActivityDate" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "userStats_userId_unique" UNIQUE("userId")
);

-- Criar tabela para permissões do usuário
CREATE TABLE IF NOT EXISTS "userPermissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "permission" text NOT NULL,
  "grantedBy" integer,
  "expiresAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Adicionar chaves estrangeiras
ALTER TABLE "communityComments" ADD CONSTRAINT "communityComments_postId_communityPosts_id_fk" FOREIGN KEY ("postId") REFERENCES "communityPosts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "communityComments" ADD CONSTRAINT "communityComments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "designerStats" ADD CONSTRAINT "designerStats_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "designerStats" ADD CONSTRAINT "designerStats_artId_arts_id_fk" FOREIGN KEY ("artId") REFERENCES "arts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "userPreferences" ADD CONSTRAINT "userPreferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "userStats" ADD CONSTRAINT "userStats_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "userPermissions" ADD CONSTRAINT "userPermissions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "userPermissions" ADD CONSTRAINT "userPermissions_grantedBy_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;