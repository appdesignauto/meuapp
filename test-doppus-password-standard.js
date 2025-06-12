/**
 * Script para testar se a senha padrão auto@123 está sendo aplicada
 * nos usuários criados via webhook da Doppus
 */

import pg from 'pg';
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Configuração
const baseUrl = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}`
  : 'http://localhost:5000';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDoppusPasswordStandard() {
  console.log('🧪 Testando senha padrão para usuários da Doppus...\n');

  const testEmail = `teste.senha.${Date.now()}@doppus.com`;
  
  // Payload do webhook da Doppus
  const webhookPayload = {
    customer: {
      name: "Teste Senha Padrão",
      email: testEmail,
      phone: "+5511999999999"
    },
    items: [
      {
        type: "principal",
        name: "Produto Teste",
        offer_name: "Oferta Mensal Teste"
      }
    ],
    transaction: {
      code: `DOP-TEST-${Date.now()}`,
      status: "approved"
    },
    status: {
      code: "approved",
      message: "Transação aprovada"
    },
    recurrence: {
      expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  };

  try {
    // 1. Enviar webhook para criar usuário
    console.log('📤 Enviando webhook da Doppus...');
    const response = await fetch(`${baseUrl}/webhook/doppus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook falhou: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Webhook processado:', result.message);

    // 2. Buscar usuário criado no banco
    console.log('\n🔍 Verificando usuário no banco de dados...');
    const userQuery = await pool.query(
      'SELECT id, email, username, password, nivelacesso, origemassinatura FROM users WHERE email = $1',
      [testEmail]
    );

    if (userQuery.rows.length === 0) {
      throw new Error('Usuário não foi criado no banco de dados');
    }

    const user = userQuery.rows[0];
    console.log('👤 Usuário encontrado:', {
      id: user.id,
      email: user.email,
      username: user.username,
      nivelacesso: user.nivelacesso,
      origemassinatura: user.origemassinatura
    });

    // 3. Testar a senha padrão
    console.log('\n🔐 Testando senha padrão auto@123...');
    const isPasswordCorrect = await bcrypt.compare('auto@123', user.password);
    
    if (isPasswordCorrect) {
      console.log('✅ SUCESSO: Senha padrão auto@123 funcionando corretamente!');
    } else {
      console.log('❌ ERRO: Senha padrão auto@123 NÃO está funcionando');
      
      // Testar se ainda está usando senha aleatória
      console.log('⚠️ Verificando se ainda usa senha aleatória...');
    }

    // 4. Teste de login via API
    console.log('\n🔑 Testando login via API...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'auto@123'
      })
    });

    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Login bem-sucedido via API!');
      console.log('👤 Dados do usuário logado:', {
        id: loginResult.user?.id,
        email: loginResult.user?.email,
        nivelacesso: loginResult.user?.nivelacesso
      });
    } else {
      const loginError = await loginResponse.text();
      console.log('❌ Falha no login via API:', loginError);
    }

    // 5. Limpeza - remover usuário de teste
    console.log('\n🧹 Removendo usuário de teste...');
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('✅ Usuário de teste removido');

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    // Limpeza em caso de erro
    try {
      await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
      console.log('🧹 Usuário de teste removido (limpeza)');
    } catch (cleanupError) {
      console.error('⚠️ Erro na limpeza:', cleanupError.message);
    }
  } finally {
    await pool.end();
  }
}

// Executar teste
testDoppusPasswordStandard().catch(console.error);