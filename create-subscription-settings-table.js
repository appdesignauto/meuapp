/**
 * Script para criar a tabela subscriptionSettings no banco de dados
 * Esta tabela armazenará as configurações de webhooks da Hotmart e outras
 * configurações relacionadas a assinaturas.
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import 'dotenv/config';

// Configuração para WebSockets com Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL deve estar definida");
}

async function getDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle(pool);
}

async function createSubscriptionSettingsTable() {
  try {
    console.log("Iniciando criação da tabela subscriptionSettings...");
    
    const db = await getDatabase();
    
    // Criar a tabela executando uma query SQL direta
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "subscriptionSettings" (
        "id" SERIAL PRIMARY KEY,
        "webhookUrl" TEXT,
        "webhookSecretKey" TEXT,
        "hotmartEnvironment" TEXT NOT NULL DEFAULT 'sandbox',
        "hotmartClientId" TEXT,
        "hotmartClientSecret" TEXT,
        "hotmartBasicPlanId" TEXT,
        "hotmartProPlanId" TEXT,
        "defaultSubscriptionDuration" INTEGER NOT NULL DEFAULT 12,
        "graceHoursAfterExpiration" INTEGER NOT NULL DEFAULT 48,
        "autoDowngradeAfterExpiration" BOOLEAN NOT NULL DEFAULT TRUE,
        "autoMapProductCodes" BOOLEAN NOT NULL DEFAULT TRUE,
        "sendExpirationWarningDays" INTEGER NOT NULL DEFAULT 3,
        "sendExpirationWarningEmails" BOOLEAN NOT NULL DEFAULT TRUE,
        "notificationEmailSubject" TEXT,
        "notificationEmailTemplate" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Verificar se precisamos inicializar um registro padrão
    const result = await db.execute(`SELECT COUNT(*) FROM "subscriptionSettings"`);
    const count = parseInt(result.rows[0].count, 10);
    
    if (count === 0) {
      console.log("Criando registro padrão na tabela subscriptionSettings...");
      
      await db.execute(`
        INSERT INTO "subscriptionSettings" (
          "hotmartEnvironment",
          "defaultSubscriptionDuration", 
          "graceHoursAfterExpiration", 
          "autoDowngradeAfterExpiration",
          "autoMapProductCodes",
          "sendExpirationWarningDays",
          "sendExpirationWarningEmails",
          "notificationEmailSubject",
          "notificationEmailTemplate"
        ) VALUES (
          'sandbox',
          12, 
          48, 
          TRUE,
          TRUE,
          3,
          TRUE,
          'Sua assinatura do DesignAuto irá expirar em breve',
          'Olá {{nome}}, \n\nSua assinatura do DesignAuto irá expirar em {{dias_restantes}} dias ({{data_expiracao}}). \n\nPara continuar tendo acesso a todos os recursos premium, por favor renove sua assinatura.\n\nAtenciosamente,\nEquipe DesignAuto'
        )
      `);
      
      console.log("Registro padrão criado com sucesso!");
    }
    
    console.log("Tabela subscriptionSettings criada e inicializada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar tabela subscriptionSettings:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Executar a função
createSubscriptionSettingsTable();