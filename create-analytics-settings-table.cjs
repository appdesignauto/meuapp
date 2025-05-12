/**
 * Script para criar a tabela de configurações de analytics
 * 
 * Este script cria a tabela analyticsSettings no banco de dados e insere
 * um registro inicial com configurações padrão
 */

// Usar require para compatibilidade com CommonJS
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const { sql } = require('drizzle-orm');
require('dotenv').config();

// Configuração para WebSockets com Neon
neonConfig.webSocketConstructor = ws;

async function createAnalyticsSettingsTable() {
  try {
    console.log('Configurando conexão com o banco de dados...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não está definida');
    }
    
    // Criar pool de conexão
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);

    console.log('Verificando se a tabela analyticsSettings existe...');
    
    try {
      // Verificar se a tabela existe
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'analyticsSettings'
        );
      `);
      
      const exists = tableExists[0]?.exists === true;
      
      if (exists) {
        console.log('A tabela analyticsSettings já existe.');
        
        // Verificar se já existe algum registro
        const count = await db.execute(sql`
          SELECT COUNT(*) FROM "analyticsSettings";
        `);
        
        const recordCount = parseInt(count[0]?.count || '0');
        
        if (recordCount > 0) {
          console.log(`A tabela já contém ${recordCount} registros.`);
          
          // Listar os registros existentes
          const settings = await db.execute(sql`SELECT * FROM "analyticsSettings";`);
          console.log('Registros existentes:', settings);
          
          return;
        }
      } else {
        console.log('A tabela analyticsSettings não existe. Criando...');
        
        // Criar a tabela
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "analyticsSettings" (
            "id" SERIAL PRIMARY KEY,
            "metaPixelId" TEXT,
            "metaPixelEnabled" BOOLEAN DEFAULT FALSE,
            "metaAdsEnabled" BOOLEAN DEFAULT FALSE,
            "metaAdsAccessToken" TEXT,
            
            "ga4MeasurementId" TEXT,
            "ga4ApiSecret" TEXT,
            "ga4Enabled" BOOLEAN DEFAULT FALSE,
            
            "gtmContainerId" TEXT,
            "gtmEnabled" BOOLEAN DEFAULT FALSE,
            
            "clarityProjectId" TEXT,
            "clarityEnabled" BOOLEAN DEFAULT FALSE,
            
            "hotjarSiteId" TEXT,
            "hotjarEnabled" BOOLEAN DEFAULT FALSE,
            
            "linkedinPartnerId" TEXT,
            "linkedinEnabled" BOOLEAN DEFAULT FALSE,
            
            "tiktokPixelId" TEXT,
            "tiktokEnabled" BOOLEAN DEFAULT FALSE,
            
            "amplitudeApiKey" TEXT,
            "amplitudeEnabled" BOOLEAN DEFAULT FALSE,
            
            "mixpanelToken" TEXT,
            "mixpanelEnabled" BOOLEAN DEFAULT FALSE,
            
            "trackPageviews" BOOLEAN DEFAULT TRUE,
            "trackClicks" BOOLEAN DEFAULT FALSE,
            "trackFormSubmissions" BOOLEAN DEFAULT FALSE,
            "trackArtsViewed" BOOLEAN DEFAULT TRUE,
            "trackArtsDownloaded" BOOLEAN DEFAULT TRUE,
            
            "customScriptHead" TEXT,
            "customScriptBody" TEXT,
            "customScriptEnabled" BOOLEAN DEFAULT FALSE,
            
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedBy" INTEGER
          );
        `);
        
        console.log('Tabela analyticsSettings criada com sucesso!');
      }
    } catch (error) {
      console.log('Erro ao verificar tabela:', error);
      throw error;
    }
    
    console.log('Inserindo configuração padrão...');
    
    // Inserir configuração padrão
    const result = await db.execute(sql`
      INSERT INTO "analyticsSettings" (
        "metaPixelId", "metaPixelEnabled", "metaAdsEnabled", "metaAdsAccessToken",
        "ga4MeasurementId", "ga4ApiSecret", "ga4Enabled",
        "gtmContainerId", "gtmEnabled",
        "clarityProjectId", "clarityEnabled",
        "hotjarSiteId", "hotjarEnabled",
        "linkedinPartnerId", "linkedinEnabled",
        "tiktokPixelId", "tiktokEnabled",
        "amplitudeApiKey", "amplitudeEnabled",
        "mixpanelToken", "mixpanelEnabled",
        "trackPageviews", "trackClicks", "trackFormSubmissions", "trackArtsViewed", "trackArtsDownloaded",
        "customScriptHead", "customScriptBody", "customScriptEnabled",
        "createdAt", "updatedAt"
      ) VALUES (
        '', FALSE, FALSE, '',
        '', '', FALSE,
        '', FALSE,
        '', FALSE,
        '', FALSE,
        '', FALSE,
        '', FALSE,
        '', FALSE,
        '', FALSE,
        TRUE, FALSE, FALSE, TRUE, TRUE,
        '', '', FALSE,
        NOW(), NOW()
      ) RETURNING *;
    `);
    
    console.log('Configuração padrão inserida com sucesso:', result[0]);
    
  } catch (error) {
    console.error('Erro ao criar a tabela de configurações de analytics:', error);
  } finally {
    process.exit(0);
  }
}

createAnalyticsSettingsTable();