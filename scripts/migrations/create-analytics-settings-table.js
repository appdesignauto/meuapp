/**
 * Script para criar a tabela de configurações de analytics
 * 
 * Este script cria a tabela analyticsSettings no banco de dados e insere
 * um registro inicial com configurações padrão
 */

// Usar import para módulos ES
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';
import ws from 'ws';

async function createAnalyticsSettingsTable() {
  try {
    console.log('Configurando conexão com o banco de dados...');
    
    // Configuração para WebSockets com Neon
    neonConfig.webSocketConstructor = ws;
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não está definida');
    }
    
    // Criar pool de conexão
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });

    console.log('Verificando se a tabela de configurações de analytics existe...');
    
    try {
      const existingSettings = await db.select({ count: db.fn.count() }).from(schema.analyticsSettings);
      const settingsCount = parseInt(existingSettings[0].count);
      
      if (settingsCount > 0) {
        console.log(`A tabela já existe e contém ${settingsCount} registros.`);
        
        // Listar os registros existentes
        const settings = await db.select().from(schema.analyticsSettings);
        console.log('Registros existentes:');
        console.log(settings);
        
        return;
      }
    } catch (error) {
      console.log('A tabela ainda não existe ou ocorreu um erro ao verificar:', error.message);
      console.log('Vamos tentar criar a tabela e inserir os dados...');
    }
    
    console.log('Iniciando a criação das configurações de analytics...');
    
    // Inserir configuração padrão
    const result = await db.insert(schema.analyticsSettings).values({
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