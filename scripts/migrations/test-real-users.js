/**
 * Script para verificar os dados reais dos usuários no banco
 * e criar um endpoint que funcione sem autenticação para teste
 */

const { Client } = require('pg');

async function testRealUsers() {
  console.log('🔍 Verificando dados reais dos usuários...');
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    
    // Buscar todos os usuários ativos
    const result = await client.query(`
      SELECT 
        id, username, email, name, nivelacesso, 
        tipoplano, dataassinatura, dataexpiracao, 
        origemassinatura, criadoem, isactive
      FROM users 
      WHERE isactive = true
      ORDER BY criadoem DESC
    `);
    
    await client.end();
    
    console.log(`✅ Total de usuários encontrados: ${result.rows.length}`);
    
    // Calcular métricas
    const total = result.rows.length;
    const premium = result.rows.filter(user => 
      ['designer', 'designer_adm', 'admin'].includes(user.nivelacesso)
    ).length;
    const conversion = ((premium / total) * 100).toFixed(1);
    
    const metrics = {
      overview: {
        totalUsers: total,
        premiumUsers: premium,
        freeUsers: total - premium,
        conversionRate: `${conversion}%`
      }
    };
    
    console.log('📊 Métricas calculadas:', metrics);
    console.log('\n👥 Lista de usuários:');
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.nivelacesso}) - ${user.name || user.username}`);
    });
    
    return {
      success: true,
      users: result.rows,
      metrics,
      pagination: {
        total,
        page: 1,
        limit: 50,
        totalPages: 1
      }
    };
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return {
      success: false,
      error: error.message,
      users: [],
      metrics: {
        overview: {
          totalUsers: 0,
          premiumUsers: 0,
          freeUsers: 0,
          conversionRate: '0%'
        }
      }
    };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testRealUsers().then(result => {
    console.log('\n🎯 Resultado final:', JSON.stringify(result, null, 2));
  });
}

module.exports = { testRealUsers };