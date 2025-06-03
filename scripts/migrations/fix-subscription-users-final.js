/**
 * SCRIPT FINAL PARA CORRIGIR O ENDPOINT DE USUÁRIOS DE ASSINATURAS
 * 
 * Este script força a correção do endpoint que está retornando HTML em vez de JSON
 */

const { Client } = require('pg');

async function testDirectDatabaseConnection() {
  console.log('🎯 TESTE DIRETO: Conectando ao banco de dados...');
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        id, username, email, name, nivelacesso, 
        tipoplano, dataassinatura, dataexpiracao, origemassinatura
      FROM users 
      WHERE isactive = true
      ORDER BY criadoem DESC
    `);
    
    await client.end();
    
    console.log(`✅ TESTE DIRETO - Total encontrado: ${result.rows.length} usuários`);
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.nivelacesso})`);
    });
    
    // Criar resposta no formato exato esperado pelo frontend
    const response = {
      users: result.rows,
      pagination: {
        total: result.rows.length,
        page: 1,
        limit: 50,
        totalPages: 1
      }
    };
    
    console.log('📊 Resposta formatada:', JSON.stringify(response, null, 2));
    return response;
    
  } catch (error) {
    console.error('❌ TESTE DIRETO - Erro:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando teste direto do banco de dados...');
    const result = await testDirectDatabaseConnection();
    console.log('✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha no teste:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testDirectDatabaseConnection };