const { Client } = require('pg');

async function testDatabase() {
  console.log('🎯 TESTE DIRETO DO BANCO DE DADOS');
  
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
    
    console.log(`✅ Total encontrado: ${result.rows.length} usuários`);
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.nivelacesso})`);
    });
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

testDatabase();