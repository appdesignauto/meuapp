/**
 * Script para fazer rollback das integrações Hotmart e Doppus
 * Este script remove todas as tabelas e entradas relacionadas às integrações existentes
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function rollbackHotmartIntegration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando processo de rollback da integração Hotmart...');
    
    // Iniciar uma transação
    await client.query('BEGIN');
    
    // 1. Remover tabelas específicas das integrações
    console.log('🗑️ Removendo tabelas específicas das integrações...');
    
    const tablesToDrop = [
      // Tabelas da Hotmart
      'hotmartProductMappings',
      'webhookLogs',
      // Tabelas da Doppus
      'doppusProductMappings'
    ];
    
    for (const table of tablesToDrop) {
      try {
        // Verificar se a tabela existe antes de tentar removê-la
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          );
        `, [table]);
        
        if (tableExists.rows[0].exists) {
          console.log(`➡️ Removendo tabela ${table}...`);
          await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
          console.log(`✅ Tabela ${table} removida com sucesso.`);
        } else {
          console.log(`⏩ Tabela ${table} não existe, pulando.`);
        }
      } catch (error) {
        console.error(`❌ Erro ao remover tabela ${table}:`, error);
        throw error;
      }
    }
    
    // 2. Remover configurações das integrações da tabela integrationSettings
    console.log('🗑️ Removendo configurações das integrações da tabela integrationSettings...');
    
    try {
      // Verificar se a tabela existe
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'integrationSettings'
        );
      `);
      
      if (tableExists.rows[0].exists) {
        console.log('➡️ Removendo configurações relacionadas às integrações...');
        await client.query(`
          DELETE FROM "integrationSettings" 
          WHERE "provider" IN ('hotmart', 'doppus');
        `);
        console.log('✅ Configurações das integrações removidas com sucesso.');
      } else {
        console.log('⏩ Tabela integrationSettings não existe, pulando.');
      }
    } catch (error) {
      console.error('❌ Erro ao remover configurações das integrações:', error);
      throw error;
    }
    
    // 3. Remover endpoints de webhook do código (isso será feito manualmente)
    console.log('⚠️ IMPORTANTE: Os endpoints de webhook da Hotmart e Doppus no código (server/index.ts, server/routes.ts) devem ser removidos manualmente.');
    
    // Confirmar transação
    await client.query('COMMIT');
    console.log('✅ Rollback da integração Hotmart concluído com sucesso.');
    
    return true;
  } catch (error) {
    // Reverter transação em caso de erro
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o rollback da integração Hotmart:', error);
    return false;
  } finally {
    client.release();
    pool.end();
  }
}

// Executar função principal
rollbackHotmartIntegration()
  .then(success => {
    console.log(`🏁 Script finalizado ${success ? 'com sucesso' : 'com falhas'}.`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro não tratado:', error);
    process.exit(1);
  });