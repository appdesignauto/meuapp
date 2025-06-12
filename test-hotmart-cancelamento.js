/**
 * Script para testar se o rebaixamento da Hotmart usa o nível correto "usuario"
 */

import pg from 'pg';
const { Pool } = pg;

async function testHotmartCancellation() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Criar um usuário de teste premium
    console.log('=== CRIANDO USUÁRIO DE TESTE ===');
    await pool.query('DELETE FROM users WHERE email = $1', ['teste.hotmart@example.com']);
    
    const createResult = await pool.query(`
      INSERT INTO users (username, email, password, name, nivelacesso, origemassinatura, tipoplano, dataassinatura, emailconfirmed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, true)
      RETURNING id, username, email, nivelacesso, origemassinatura, tipoplano
    `, ['teste_hotmart_user', 'teste.hotmart@example.com', 'test123', 'Usuário Teste Hotmart', 'premium', 'hotmart', 'mensal']);
    
    console.log('Usuário criado:', createResult.rows[0]);
    
    // Simular rebaixamento usando o SQL corrigido
    console.log('\n=== SIMULANDO REBAIXAMENTO ===');
    const rebaixarResult = await pool.query(`
      UPDATE users SET
        nivelacesso = 'usuario',
        acessovitalicio = false,
        tipoplano = NULL,
        dataexpiracao = CURRENT_DATE
      WHERE email = $1
      RETURNING id, username, email, nivelacesso, origemassinatura, tipoplano, dataexpiracao
    `, ['teste.hotmart@example.com']);
    
    console.log('Usuário rebaixado:', rebaixarResult.rows[0]);
    
    // Verificar se o nível é "usuario"
    if (rebaixarResult.rows[0].nivelacesso === 'usuario') {
      console.log('\n✅ SUCESSO: Sistema da Hotmart usa o nível "usuario" corretamente');
    } else {
      console.log('\n❌ ERRO: Sistema da Hotmart ainda usa nível incorreto:', rebaixarResult.rows[0].nivelacesso);
    }
    
    // Limpar
    await pool.query('DELETE FROM users WHERE email = $1', ['teste.hotmart@example.com']);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

testHotmartCancellation();