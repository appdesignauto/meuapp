/**
 * Script para fazer um rollback completo de todas as integrações
 * Remove TODAS as tabelas, configurações e entradas relacionadas às integrações
 * externas (Hotmart, Doppus, webhooks, etc.) para um recomeço limpo.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function completeIntegrationRollback() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando processo de rollback completo das integrações...');
    
    // Iniciar uma transação
    await client.query('BEGIN');
    
    // Lista expandida de todas as tabelas potencialmente relacionadas a integrações
    const integrationTables = [
      // Tabelas específicas da Hotmart
      'hotmartProductMappings',
      'hotmart_products',
      'hotmart_settings',
      'hotmart_subscriptions',
      'hotmart_transactions',
      'hotmart_events',
      
      // Tabelas específicas da Doppus
      'doppusProductMappings',
      'doppus_products',
      'doppus_settings',
      'doppus_transactions',
      
      // Tabelas de webhook
      'webhookLogs',
      'webhook_logs',
      'webhook_events',
      'webhook_errors',
      
      // Tabelas gerais de integração
      'integrationSettings',
      'integration_settings',
      'external_api_calls',
      'api_keys',
      'integration_logs'
    ];
    
    console.log('🗑️ Removendo todas as tabelas relacionadas a integrações...');
    
    // Remover cada tabela da lista
    for (const table of integrationTables) {
      try {
        // Verificar se a tabela existe
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          );
        `, [table]);
        
        if (tableExists.rows[0].exists) {
          console.log(`➡️ Removendo tabela "${table}"...`);
          await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
          console.log(`✅ Tabela "${table}" removida com sucesso.`);
        } else {
          console.log(`⏩ Tabela "${table}" não existe, pulando.`);
        }
      } catch (error) {
        console.error(`❌ Erro ao remover tabela "${table}":`, error);
        // Continuar mesmo se houver erro em uma tabela específica
      }
    }
    
    // Procurar e remover entradas em tabelas específicas
    console.log('🔍 Procurando por registros relacionados a integrações em outras tabelas...');
    
    // Lista de tabelas e condições para limpeza parcial
    const tablesToClean = [
      {
        name: 'users',
        condition: "origemassinatura IN ('hotmart', 'doppus', 'webhook')",
        action: "UPDATE users SET origemassinatura = NULL, tipoplano = NULL, dataassinatura = NULL, dataexpiracao = NULL, acessovitalicio = FALSE WHERE origemassinatura IN ('hotmart', 'doppus', 'webhook')"
      },
      {
        name: 'subscriptions',
        condition: "webhookData IS NOT NULL",
        action: "UPDATE subscriptions SET webhookData = NULL WHERE webhookData IS NOT NULL"
      }
    ];
    
    // Limpar tabelas que contêm dados de integração
    for (const tableInfo of tablesToClean) {
      try {
        // Verificar se a tabela existe
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          );
        `, [tableInfo.name]);
        
        if (tableExists.rows[0].exists) {
          // Verificar se a coluna mencionada na condição existe
          const columnQuery = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1
          `, [tableInfo.name]);
          
          const columns = columnQuery.rows.map(row => row.column_name);
          const conditionColumn = tableInfo.condition.split(' ')[0];
          
          if (columns.includes(conditionColumn)) {
            // Verificar se há registros afetados
            const checkResult = await client.query(`
              SELECT COUNT(*) FROM "${tableInfo.name}" 
              WHERE ${tableInfo.condition}
            `);
            
            const count = parseInt(checkResult.rows[0].count);
            
            if (count > 0) {
              console.log(`➡️ Limpando ${count} registros da tabela "${tableInfo.name}"...`);
              await client.query(tableInfo.action);
              console.log(`✅ Registros da tabela "${tableInfo.name}" limpos com sucesso.`);
            } else {
              console.log(`⏩ Nenhum registro afetado na tabela "${tableInfo.name}", pulando.`);
            }
          } else {
            console.log(`⏩ Coluna mencionada na condição não existe na tabela "${tableInfo.name}", pulando.`);
          }
        } else {
          console.log(`⏩ Tabela "${tableInfo.name}" não existe, pulando.`);
        }
      } catch (error) {
        console.error(`❌ Erro ao limpar tabela "${tableInfo.name}":`, error);
        // Continuar mesmo se houver erro em uma tabela específica
      }
    }
    
    // Confirmar a transação
    await client.query('COMMIT');
    console.log('✅ Rollback completo das integrações realizado com sucesso.');
    
    return true;
  } catch (error) {
    // Reverter a transação em caso de erro
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o rollback completo das integrações:', error);
    return false;
  } finally {
    client.release();
    pool.end();
  }
}

// Executar função principal
completeIntegrationRollback()
  .then(success => {
    console.log(`🏁 Script finalizado ${success ? 'com sucesso' : 'com falhas'}.`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro não tratado:', error);
    process.exit(1);
  });