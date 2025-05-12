/**
 * Script para criar a tabela de configurações de analytics
 */
const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function createAnalyticsSettingsTable() {
  try {
    // Primeiro, verifica se a tabela já existe
    const checkTableQuery = "SELECT to_regclass('public.\"analyticsSettings\"')";
    const checkResult = await pool.query(checkTableQuery);
    
    if (checkResult.rows[0].to_regclass) {
      console.log('A tabela de configurações de analytics já existe.');
      return;
    }
    
    // Cria a tabela se ela não existir
    const query = `
      CREATE TABLE "analyticsSettings" (
        id SERIAL PRIMARY KEY,
        
        -- Meta Pixel (Facebook Pixel)
        "metaPixelId" TEXT,
        "metaAdsEnabled" BOOLEAN DEFAULT false,
        "metaAdsAccessToken" TEXT,
        
        -- Google Analytics 4
        "ga4MeasurementId" TEXT,
        "ga4ApiSecret" TEXT,
        
        -- Google Tag Manager
        "gtmContainerId" TEXT,
        
        -- Microsoft Clarity
        "clarityProjectId" TEXT,
        
        -- Hotjar
        "hotjarSiteId" TEXT,
        
        -- LinkedIn Insight Tag
        "linkedinPartnerId" TEXT,
        
        -- TikTok Pixel
        "tiktokPixelId" TEXT,
        
        -- Amplitude ou Mixpanel
        "amplitudeApiKey" TEXT,
        "mixpanelToken" TEXT,
        
        -- Status de ativação para cada serviço
        "metaPixelEnabled" BOOLEAN DEFAULT false,
        "ga4Enabled" BOOLEAN DEFAULT false,
        "gtmEnabled" BOOLEAN DEFAULT false,
        "clarityEnabled" BOOLEAN DEFAULT false,
        "hotjarEnabled" BOOLEAN DEFAULT false,
        "linkedinEnabled" BOOLEAN DEFAULT false,
        "tiktokEnabled" BOOLEAN DEFAULT false,
        "amplitudeEnabled" BOOLEAN DEFAULT false,
        "mixpanelEnabled" BOOLEAN DEFAULT false,
        
        -- Configurações de eventos
        "trackPageviews" BOOLEAN DEFAULT true,
        "trackClicks" BOOLEAN DEFAULT false,
        "trackFormSubmissions" BOOLEAN DEFAULT false,
        "trackArtsViewed" BOOLEAN DEFAULT true,
        "trackArtsDownloaded" BOOLEAN DEFAULT true,
        
        -- Metadados
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" TEXT
      );
    `;
    
    await pool.query(query);
    console.log('Tabela de configurações de analytics criada com sucesso!');
    
    // Insere um registro inicial vazio
    const insertQuery = `
      INSERT INTO "analyticsSettings" (
        "metaPixelEnabled", "ga4Enabled", "gtmEnabled", "clarityEnabled", 
        "hotjarEnabled", "linkedinEnabled", "tiktokEnabled", "amplitudeEnabled", "mixpanelEnabled",
        "trackPageviews", "trackClicks", "trackFormSubmissions", "trackArtsViewed", "trackArtsDownloaded"
      ) VALUES (
        false, false, false, false, 
        false, false, false, false, false,
        true, false, false, true, true
      );
    `;
    
    await pool.query(insertQuery);
    console.log('Configurações iniciais de analytics inseridas com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar tabela de configurações de analytics:', error);
  } finally {
    await pool.end();
  }
}

// Executa a criação da tabela
createAnalyticsSettingsTable();