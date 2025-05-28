#!/usr/bin/env node

/**
 * Correção imediata para o dashboard de assinaturas
 * Vai inspecionar diretamente o banco de dados para identificar dados reais
 */

const { Pool } = require('pg');

async function fixSubscriptionDashboard() {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Corrigindo dashboard de assinaturas...');
    
    // Verificar dados reais no banco
    const totalResult = await client.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(totalResult.rows[0].total);
    
    const premiumResult = await client.query(`
      SELECT COUNT(*) as premium FROM users 
      WHERE (nivelacesso IN ('premium', 'designer', 'designer_adm', 'admin')) 
         OR (acessovitalicio = true) 
         OR (tipoplano IS NOT NULL AND tipoplano != '' AND tipoplano != 'null')
    `);
    const premium = parseInt(premiumResult.rows[0].premium);
    
    console.log(`✅ Dados reais: ${total} total, ${premium} premium`);
    
    // Buscar usuários com assinatura para debug
    const usersResult = await client.query(`
      SELECT id, email, nivelacesso, tipoplano, acessovitalicio 
      FROM users 
      WHERE (nivelacesso IN ('premium', 'designer', 'designer_adm', 'admin')) 
         OR (acessovitalicio = true) 
         OR (tipoplano IS NOT NULL AND tipoplano != '' AND tipoplano != 'null')
      ORDER BY criadoem DESC
      LIMIT 5
    `);
    
    console.log('📋 Usuários com assinatura:');
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.email}: nivel="${user.nivelacesso}", plano="${user.tipoplano}"`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

fixSubscriptionDashboard();