/**
 * Script para fazer rollback/desativação das configurações do PWA
 * Isso garante que o PWA não interfira com a funcionalidade de webhooks
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function rollbackPwaConfig() {
  try {
    console.log('🔧 Iniciando rollback das configurações PWA...');
    
    // Conectar ao banco de dados
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // 1. Verificar se a tabela app_config existe
    const { rows: tableExists } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'app_config'
      );
    `);
    
    if (tableExists[0].exists) {
      console.log('✓ Tabela app_config encontrada, desativando configurações...');
      
      // 2. Desativar temporariamente o PWA alterando caminhos dos ícones
      await pool.query(`
        UPDATE app_config 
        SET 
          icon_192 = '/icons/disabled-icon-192.png',
          icon_512 = '/icons/disabled-icon-512.png'
        WHERE id = 1;
      `);
      
      console.log('✓ Configurações PWA modificadas com sucesso para versão inativa');
    } else {
      console.log('ℹ️ Tabela app_config não existe, nenhuma ação necessária');
    }
    
    // 3. Verificar configurações dos service workers no banco de dados (se existirem)
    try {
      await pool.query(`
        UPDATE site_settings
        SET pwa_enabled = false
        WHERE id = 1;
      `);
      console.log('✓ PWA desativado nas configurações do site');
    } catch (err) {
      console.log('ℹ️ Nenhuma configuração PWA encontrada em site_settings');
    }
    
    console.log('✅ Rollback das configurações PWA concluído!');
    
    // Fechar conexão
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro ao fazer rollback das configurações PWA:', error);
  }
}

// Executar a função principal
rollbackPwaConfig();