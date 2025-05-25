/**
 * Script para remover completamente toda a integração com Doppus
 * Remove todas as configurações, tabelas e referências relacionadas à Doppus
 */

import pkg from 'pg';
const { Pool } = pkg;

async function removeDoppusIntegration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🧹 Iniciando remoção completa da integração Doppus...');

    // 1. Remover tabela doppusProductMappings
    try {
      await pool.query('DROP TABLE IF EXISTS "doppusProductMappings" CASCADE');
      console.log('✅ Tabela doppusProductMappings removida');
    } catch (error) {
      console.log('⚠️ Tabela doppusProductMappings não encontrada');
    }

    // 2. Remover configurações da Doppus na tabela integrationSettings
    try {
      const result = await pool.query(`
        DELETE FROM "integrationSettings" 
        WHERE "provider" = 'doppus'
      `);
      console.log(`✅ ${result.rowCount} configurações da Doppus removidas da tabela integrationSettings`);
    } catch (error) {
      console.log('⚠️ Não foi possível remover configurações da integrationSettings:', error.message);
    }

    // 3. Remover colunas relacionadas à Doppus da tabela subscriptionSettings
    const doppusColumns = ['doppusClientId', 'doppusClientSecret', 'doppusSecretKey', 'doppusApiKey'];
    
    for (const column of doppusColumns) {
      try {
        await pool.query(`ALTER TABLE "subscriptionSettings" DROP COLUMN IF EXISTS "${column}"`);
        console.log(`✅ Coluna ${column} removida da tabela subscriptionSettings`);
      } catch (error) {
        console.log(`⚠️ Coluna ${column} não encontrada ou erro ao remover:`, error.message);
      }
    }

    // 4. Atualizar usuários que tinham origem de assinatura 'doppus' para 'manual'
    try {
      const result = await pool.query(`
        UPDATE "users" 
        SET "origemassinatura" = 'manual'
        WHERE "origemassinatura" = 'doppus'
      `);
      console.log(`✅ ${result.rowCount} usuários atualizados de origem 'doppus' para 'manual'`);
    } catch (error) {
      console.log('⚠️ Erro ao atualizar usuários:', error.message);
    }

    // 5. Remover webhooks da Doppus
    try {
      const result = await pool.query(`
        DELETE FROM "webhookLogs" 
        WHERE "source" = 'doppus'
      `);
      console.log(`✅ ${result.rowCount} logs de webhook da Doppus removidos`);
    } catch (error) {
      console.log('⚠️ Erro ao remover logs de webhook da Doppus:', error.message);
    }

    console.log('🎉 Remoção completa da integração Doppus finalizada!');
    console.log('');
    console.log('📋 Resumo das ações realizadas:');
    console.log('- Tabela doppusProductMappings removida');
    console.log('- Configurações da Doppus removidas da integrationSettings');
    console.log('- Colunas da Doppus removidas da subscriptionSettings');
    console.log('- Usuários com origem Doppus migrados para manual');
    console.log('- Logs de webhook da Doppus removidos');

  } catch (error) {
    console.error('❌ Erro durante a remoção da integração Doppus:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar o script
removeDoppusIntegration()
  .then(() => {
    console.log('✅ Script concluído com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error);
    process.exit(1);
  });