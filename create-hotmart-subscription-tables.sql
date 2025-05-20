-- Script para criar as tabelas necessárias para o sistema de assinaturas da Hotmart

-- Tabela para logs de webhooks (caso não exista)
CREATE TABLE IF NOT EXISTS "HotmartWebhookLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event" TEXT NOT NULL,
  "transactionId" TEXT,
  "productId" TEXT,
  "email" TEXT,
  "status" TEXT NOT NULL,
  "request" JSONB,
  "response" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT DEFAULT 'hotmart'
);

-- Tabela para mapeamento de produtos Hotmart (caso não exista)
CREATE TABLE IF NOT EXISTS "hotmartProductMappings" (
  "id" SERIAL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "offerId" TEXT,
  "offerCode" TEXT,
  "productName" TEXT NOT NULL,
  "planType" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "isLifetime" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("productId", "offerId", "offerCode")
);

-- Tabela para assinaturas Hotmart (caso não exista)
CREATE TABLE IF NOT EXISTS "hotmartSubscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subscriberCode" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "offerId" TEXT,
  "offerCode" TEXT,
  "transactionId" TEXT,
  "planType" TEXT NOT NULL,
  "status" TEXT DEFAULT 'active',
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
  "canceledAt" TIMESTAMP WITH TIME ZONE,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("email", "productId")
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS "hotmartSubscriptions_subscriberCode_idx" ON "hotmartSubscriptions"("subscriberCode");
CREATE INDEX IF NOT EXISTS "hotmartSubscriptions_email_idx" ON "hotmartSubscriptions"("email");