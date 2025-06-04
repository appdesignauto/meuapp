/**
 * Script para criar a tabela app_config no banco de dados
 * Esta tabela armazenará as configurações do Progressive Web App (PWA)
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function createAppConfigTable() {
  try {
    console.log('🔍 Verificando/criando tabela de configuração do PWA...');
    
    // Conectar ao banco de dados
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Criar tabela se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "app_config" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL DEFAULT 'DesignAuto',
        "short_name" TEXT NOT NULL DEFAULT 'DesignAuto',
        "theme_color" TEXT NOT NULL DEFAULT '#1e40af',
        "background_color" TEXT NOT NULL DEFAULT '#ffffff',
        "icon_192" TEXT NOT NULL DEFAULT '/icons/icon-192.png',
        "icon_512" TEXT NOT NULL DEFAULT '/icons/icon-512.png',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_by" INTEGER REFERENCES "users"("id")
      );
    `);
    
    // Verificar se já existe um registro
    const { rows: existingConfig } = await pool.query(`
      SELECT * FROM "app_config" LIMIT 1;
    `);
    
    // Se não existir nenhum registro, cria um com valores padrão
    if (existingConfig.length === 0) {
      console.log('📝 Criando configuração inicial do PWA...');
      
      await pool.query(`
        INSERT INTO "app_config" 
        ("name", "short_name", "theme_color", "background_color") 
        VALUES 
        ('DesignAuto', 'DesignAuto', '#1e40af', '#ffffff');
      `);
      
      console.log('✅ Configuração inicial criada com sucesso!');
    } else {
      console.log('✅ Configuração existente encontrada, pulando criação do registro inicial.');
    }
    
    console.log('✅ Tabela app_config está pronta!');
    
    // Fechar conexão
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela app_config:', error);
    process.exit(1);
  }
}

// Executar a função principal
createAppConfigTable();