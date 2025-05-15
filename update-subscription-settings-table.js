/**
 * Script para atualizar a tabela subscriptionSettings adicionando novos campos
 * necessários para o painel de configurações de assinaturas
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

async function updateSubscriptionSettingsTable() {
  try {
    console.log("Iniciando atualização da tabela subscriptionSettings...");
    
    const db = await getDatabase();
    
    // Verificar se a tabela já existe
    try {
      // Primeiro renomear os campos existentes para compatibilidade com a nova estrutura
      await db.execute(`
        ALTER TABLE "subscriptionSettings" 
        RENAME COLUMN "hotmartWebhookUrl" TO "webhookUrl"
      `).catch(err => console.log('Campo webhookUrl já modificado ou não existe:', err.message));
      
      await db.execute(`
        ALTER TABLE "subscriptionSettings" 
        RENAME COLUMN "hotmartWebhookSecret" TO "webhookSecretKey"
      `).catch(err => console.log('Campo webhookSecretKey já modificado ou não existe:', err.message));
      
      // Adicionar os novos campos necessários
      await db.execute(`
        ALTER TABLE "subscriptionSettings" 
        ADD COLUMN IF NOT EXISTS "defaultSubscriptionDuration" INTEGER NOT NULL DEFAULT 12
      `);
      
      await db.execute(`
        ALTER TABLE "subscriptionSettings" 
        ADD COLUMN IF NOT EXISTS "autoDowngradeAfterExpiration" BOOLEAN NOT NULL DEFAULT TRUE
      `);
      
      await db.execute(`
        ALTER TABLE "subscriptionSettings" 
        ADD COLUMN IF NOT EXISTS "autoMapProductCodes" BOOLEAN NOT NULL DEFAULT TRUE
      `);
      
      await db.execute(`
        ALTER TABLE "subscriptionSettings" 
        ADD COLUMN IF NOT EXISTS "sendExpirationWarningEmails" BOOLEAN NOT NULL DEFAULT TRUE
      `);
      
      await db.execute(`
        ALTER TABLE "subscriptionSettings" 
        ADD COLUMN IF NOT EXISTS "notificationEmailSubject" TEXT
      `);
      
      await db.execute(`
        ALTER TABLE "subscriptionSettings" 
        ADD COLUMN IF NOT EXISTS "notificationEmailTemplate" TEXT
      `);
      
      console.log("Tabela subscriptionSettings atualizada com sucesso!");
      
      // Verificar se precisamos inicializar um registro padrão
      const result = await db.execute(`SELECT COUNT(*) FROM "subscriptionSettings"`);
      const count = parseInt(result.rows[0].count, 10);
      
      if (count === 0) {
        console.log("Criando registro padrão na tabela subscriptionSettings...");
        
        await db.execute(`
          INSERT INTO "subscriptionSettings" (
            "hotmartEnvironment", 
            "graceHoursAfterExpiration", 
            "sendExpirationWarningDays",
            "defaultSubscriptionDuration",
            "autoDowngradeAfterExpiration",
            "autoMapProductCodes",
            "sendExpirationWarningEmails",
            "notificationEmailSubject",
            "notificationEmailTemplate"
          ) VALUES (
            'sandbox', 
            48, 
            3,
            12,
            TRUE,
            TRUE,
            TRUE,
            'Sua assinatura do DesignAuto irá expirar em breve',
            'Olá {{nome}}, \n\nSua assinatura do DesignAuto irá expirar em {{dias_restantes}} dias ({{data_expiracao}}). \n\nPara continuar tendo acesso a todos os recursos premium, por favor renove sua assinatura.\n\nAtenciosamente,\nEquipe DesignAuto'
          )
        `);
        
        console.log("Registro padrão criado com sucesso!");
      }
      
    } catch (error) {
      console.error("Erro ao atualizar tabela:", error);
      throw error;
    }
    
  } catch (error) {
    console.error("Erro ao atualizar tabela subscriptionSettings:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Executar a função
updateSubscriptionSettingsTable();