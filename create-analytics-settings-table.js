/**
 * Script para criar a tabela de configurações de analytics
 * 
 * Este script cria a tabela analyticsSettings no banco de dados e insere
 * um registro inicial com configurações padrão
 */

import { db } from './server/db.js';
import { analyticsSettings } from './shared/schema.js';
import { drizzle } from 'drizzle-orm/neon-serverless';

async function createAnalyticsSettingsTable() {
  try {
    console.log('Verificando se a tabela de configurações de analytics existe...');
    
    const existingSettings = await db.select({ count: db.fn.count() }).from(analyticsSettings);
    const settingsCount = parseInt(existingSettings[0].count);
    
    if (settingsCount > 0) {
      console.log(`A tabela já existe e contém ${settingsCount} registros.`);
      
      // Listar os registros existentes
      const settings = await db.select().from(analyticsSettings);
      console.log('Registros existentes:');
      console.log(settings);
      
      return;
    }
    
    console.log('Iniciando a criação das configurações de analytics...');
    
    // Inserir configuração padrão
    const result = await db.insert(analyticsSettings).values({
      metaPixelId: '',
      metaAdsEnabled: false, 
      metaAdsAccessToken: '',
      
      ga4MeasurementId: '',
      ga4ApiSecret: '',
      
      gtmContainerId: '',
      
      clarityProjectId: '',
      
      hotjarSiteId: '',
      
      linkedinPartnerId: '',
      
      tiktokPixelId: '',
      
      amplitudeApiKey: '',
      mixpanelToken: '',
      
      metaPixelEnabled: false,
      ga4Enabled: false,
      gtmEnabled: false,
      clarityEnabled: false,
      hotjarEnabled: false,
      linkedinEnabled: false,
      tiktokEnabled: false,
      amplitudeEnabled: false,
      mixpanelEnabled: false,
      
      trackPageviews: true,
      trackClicks: false,
      trackFormSubmissions: false,
      trackArtsViewed: true,
      trackArtsDownloaded: true,
      
      customScriptHead: '',
      customScriptBody: '',
      customScriptEnabled: false,
      
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
    
    console.log('Configurações de analytics criadas com sucesso:', result);
    
  } catch (error) {
    console.error('Erro ao criar a tabela de configurações de analytics:', error);
  } finally {
    process.exit(0);
  }
}

createAnalyticsSettingsTable();