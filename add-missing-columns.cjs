/**
 * Script para adicionar as colunas que estão faltando na tabela analyticsSettings
 */

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

// Configuração para WebSockets com Neon
neonConfig.webSocketConstructor = ws;

async function addMissingColumns() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não está definida');
    }
    
    // Criar pool de conexão
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('Adicionando colunas que estão faltando na tabela analyticsSettings...');
    
    // Verificar se a coluna customScriptHead existe
    const checkCustomScriptHead = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'analyticsSettings' 
        AND column_name = 'customScriptHead'
      );
    `);
    
    if (!checkCustomScriptHead.rows[0].exists) {
      console.log('Adicionando coluna customScriptHead...');
      await pool.query(`
        ALTER TABLE "analyticsSettings" 
        ADD COLUMN "customScriptHead" TEXT;
      `);
      console.log('Coluna customScriptHead adicionada com sucesso!');
    } else {
      console.log('Coluna customScriptHead já existe.');
    }
    
    // Verificar se a coluna customScriptBody existe
    const checkCustomScriptBody = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'analyticsSettings' 
        AND column_name = 'customScriptBody'
      );
    `);
    
    if (!checkCustomScriptBody.rows[0].exists) {
      console.log('Adicionando coluna customScriptBody...');
      await pool.query(`
        ALTER TABLE "analyticsSettings" 
        ADD COLUMN "customScriptBody" TEXT;
      `);
      console.log('Coluna customScriptBody adicionada com sucesso!');
    } else {
      console.log('Coluna customScriptBody já existe.');
    }
    
    // Verificar se a coluna customScriptEnabled existe
    const checkCustomScriptEnabled = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'analyticsSettings' 
        AND column_name = 'customScriptEnabled'
      );
    `);
    
    if (!checkCustomScriptEnabled.rows[0].exists) {
      console.log('Adicionando coluna customScriptEnabled...');
      await pool.query(`
        ALTER TABLE "analyticsSettings" 
        ADD COLUMN "customScriptEnabled" BOOLEAN DEFAULT FALSE;
      `);
      console.log('Coluna customScriptEnabled adicionada com sucesso!');
    } else {
      console.log('Coluna customScriptEnabled já existe.');
    }
    
    // Verificar se a coluna createdAt existe
    const checkCreatedAt = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'analyticsSettings' 
        AND column_name = 'createdAt'
      );
    `);
    
    if (!checkCreatedAt.rows[0].exists) {
      console.log('Adicionando coluna createdAt...');
      await pool.query(`
        ALTER TABLE "analyticsSettings" 
        ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      console.log('Coluna createdAt adicionada com sucesso!');
    } else {
      console.log('Coluna createdAt já existe.');
    }
    
    // Verificar tipo da coluna updatedBy (deve ser integer, não text)
    const checkUpdatedByType = await pool.query(`
      SELECT data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'analyticsSettings' 
      AND column_name = 'updatedBy';
    `);
    
    if (checkUpdatedByType.rows.length > 0 && checkUpdatedByType.rows[0].data_type === 'text') {
      console.log('Corrigindo tipo da coluna updatedBy de text para integer...');
      
      // Primeiro criamos uma coluna temporária
      await pool.query(`
        ALTER TABLE "analyticsSettings" 
        ADD COLUMN "updatedBy_temp" INTEGER;
      `);
      
      // Depois removemos a coluna antiga
      await pool.query(`
        ALTER TABLE "analyticsSettings" 
        DROP COLUMN "updatedBy";
      `);
      
      // Renomeamos a coluna temporária para o nome original
      await pool.query(`
        ALTER TABLE "analyticsSettings" 
        RENAME COLUMN "updatedBy_temp" TO "updatedBy";
      `);
      
      console.log('Tipo da coluna updatedBy corrigido com sucesso!');
    } else {
      console.log('Coluna updatedBy já está com o tipo correto (integer) ou não existe.');
    }
    
    // Inserir um registro padrão se a tabela estiver vazia
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM "analyticsSettings";
    `);
    
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log('Tabela vazia, inserindo configuração padrão...');
      
      await pool.query(`
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
        );
      `);
      
      console.log('Configuração padrão inserida com sucesso!');
    } else {
      console.log(`A tabela já contém ${countResult.rows[0].count} registro(s), não é necessário inserir dados padrão.`);
    }
    
    console.log('Verificando estrutura final da tabela...');
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'analyticsSettings'
      ORDER BY ordinal_position;
    `);
    
    console.log('Estrutura atual da tabela analyticsSettings:');
    console.table(result.rows);
    
    console.log('Operação concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  } finally {
    process.exit(0);
  }
}

addMissingColumns();