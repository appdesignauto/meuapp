/**
 * Script para criar a tabela subscriptionSettings no banco de dados
 * Esta tabela armazenará as configurações de webhooks da Hotmart e outras
 * configurações relacionadas a assinaturas.
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./shared/schema.js";

neonConfig.webSocketConstructor = ws;

async function getDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle(pool, { schema });
}

async function createSubscriptionSettingsTable() {
  try {
    console.log("Iniciando criação da tabela subscriptionSettings...");
    
    const db = await getDatabase();
    
    // Verificar se a tabela já existe
    try {
      const result = await db.query.subscriptionSettings.findFirst();
      if (result) {
        console.log("A tabela subscriptionSettings já existe e contém dados.");
        return;
      }
    } catch (error) {
      console.log("A tabela subscriptionSettings ainda não existe. Criando...");
    }
    
    // Criar a tabela executando uma query SQL direta
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "subscriptionSettings" (
        "id" SERIAL PRIMARY KEY,
        "hotmartWebhookUrl" TEXT,
        "hotmartWebhookSecret" TEXT,
        "hotmartEnvironment" TEXT NOT NULL DEFAULT 'sandbox',
        "hotmartClientId" TEXT,
        "hotmartClientSecret" TEXT,
        "hotmartBasicPlanId" TEXT,
        "hotmartProPlanId" TEXT,
        "graceHoursAfterExpiration" INTEGER NOT NULL DEFAULT 48,
        "sendExpirationWarningDays" INTEGER NOT NULL DEFAULT 3,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Inserir registro padrão para configurações iniciais
    await db.insert(schema.subscriptionSettings).values({
      hotmartEnvironment: "sandbox",
      graceHoursAfterExpiration: 48,
      sendExpirationWarningDays: 3
    }).onConflictDoNothing();
    
    console.log("Tabela subscriptionSettings criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela subscriptionSettings:", error);
  }
}

// Executar a função
createSubscriptionSettingsTable();