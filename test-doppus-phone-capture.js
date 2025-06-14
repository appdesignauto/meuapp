/**
 * Script para testar a captura de telefone nos webhooks da Doppus
 * Este script simula webhooks com diferentes formatos de telefone
 */

import fetch from 'node-fetch';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Webhooks de teste da Doppus com diferentes configurações de telefone
const testWebhooks = [
  {
    name: "Webhook Doppus com telefone no customer",
    payload: {
      id: `test-doppus-phone-${Date.now()}`,
      customer: {
        email: 'teste.doppus.phone@designauto.com.br',
        name: 'Usuário Doppus Com Telefone',
        phone: '+5511987654321'
      },
      status: {
        code: 'approved',
        message: 'Pagamento aprovado'
      },
      transaction: {
        amount: 2997,
        id: `doppus-tx-phone-${Date.now()}`
      },
      items: [{
        name: 'DesignAuto Premium',
        type: 'principal',
        offer_name: 'Plano Mensal'
      }]
    }
  },
  {
    name: "Webhook Doppus SEM telefone",
    payload: {
      id: `test-doppus-no-phone-${Date.now()}`,
      customer: {
        email: 'teste.doppus.sem.telefone@designauto.com.br',
        name: 'Usuário Doppus Sem Telefone'
        // Sem campo phone
      },
      status: {
        code: 'approved',
        message: 'Pagamento aprovado'
      },
      transaction: {
        amount: 2997,
        id: `doppus-tx-no-phone-${Date.now()}`
      },
      items: [{
        name: 'DesignAuto Premium',
        type: 'principal',
        offer_name: 'Plano Anual'
      }]
    }
  },
  {
    name: "Webhook Doppus com telefone vazio",
    payload: {
      id: `test-doppus-empty-phone-${Date.now()}`,
      customer: {
        email: 'teste.doppus.telefone.vazio@designauto.com.br',
        name: 'Usuário Doppus Telefone Vazio',
        phone: ''
      },
      status: {
        code: 'approved',
        message: 'Pagamento aprovado'
      },
      transaction: {
        amount: 2997,
        id: `doppus-tx-empty-phone-${Date.now()}`
      },
      items: [{
        name: 'DesignAuto Premium',
        type: 'principal',
        offer_name: 'Plano Anual'
      }]
    }
  },
  {
    name: "Webhook Doppus para atualizar telefone de usuário existente",
    payload: {
      id: `test-doppus-update-phone-${Date.now()}`,
      customer: {
        email: 'teste.doppus.update.phone@designauto.com.br',
        name: 'Usuário Para Atualizar Telefone',
        phone: '+5511999888777'
      },
      status: {
        code: 'approved',
        message: 'Pagamento aprovado'
      },
      transaction: {
        amount: 2997,
        id: `doppus-tx-update-phone-${Date.now()}`
      },
      items: [{
        name: 'DesignAuto Premium',
        type: 'principal',
        offer_name: 'Plano Vitalício'
      }]
    }
  }
];

async function testDoppusPhoneCapture() {
  console.log('🚀 Iniciando testes de captura de telefone nos webhooks da Doppus');
  console.log('==========================================');

  for (let i = 0; i < testWebhooks.length; i++) {
    const test = testWebhooks[i];
    console.log(`\n📱 Teste ${i + 1}: ${test.name}`);
    
    try {
      // Limpar usuário de teste se existir
      const email = test.payload.customer.email;
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
      console.log(`🧹 Usuário de teste limpo: ${email}`);
      
      // Para o teste de atualização, criar usuário sem telefone primeiro
      if (test.name.includes('atualizar telefone')) {
        await pool.query(`
          INSERT INTO users (email, name, username, password, nivelacesso, isactive, emailconfirmed)
          VALUES ($1, $2, $3, $4, 'usuario', true, true)
        `, [email, 'Usuario Sem Telefone', email.split('@')[0], 'auto@123']);
        console.log(`👤 Usuário criado sem telefone para teste de atualização`);
      }
      
      // Enviar webhook para o endpoint da Doppus
      const response = await fetch('http://localhost:5000/webhook/doppus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.payload)
      });

      const result = await response.json();
      console.log(`✅ Webhook enviado. Status: ${response.status}`);
      
      // Verificar se o usuário foi criado/atualizado com telefone
      const userQuery = await pool.query(
        'SELECT email, name, phone, nivelacesso, origemassinatura FROM users WHERE email = $1', 
        [email]
      );
      
      if (userQuery.rowCount > 0) {
        const user = userQuery.rows[0];
        console.log(`👤 Usuário processado: ${user.name}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`📞 Telefone capturado: ${user.phone || 'NENHUM'}`);
        console.log(`🏆 Nível: ${user.nivelacesso}`);
        console.log(`🔗 Origem: ${user.origemassinatura}`);
        
        // Verificar se o telefone foi capturado corretamente
        const expectedPhone = test.payload.customer.phone || null;
        
        // Tratar string vazia como null
        const actualPhone = user.phone === '' ? null : user.phone;
        const expectedPhoneNormalized = expectedPhone === '' ? null : expectedPhone;
        
        if (expectedPhoneNormalized && actualPhone === expectedPhoneNormalized) {
          console.log(`✅ SUCESSO: Telefone capturado corretamente!`);
        } else if (!expectedPhoneNormalized && !actualPhone) {
          console.log(`✅ SUCESSO: Nenhum telefone esperado, nenhum telefone salvo.`);
        } else {
          console.log(`❌ ERRO: Telefone esperado: ${expectedPhoneNormalized}, mas salvo: ${actualPhone}`);
        }
      } else {
        console.log(`❌ ERRO: Usuário não foi processado!`);
      }
      
    } catch (error) {
      console.error(`❌ Erro no teste ${i + 1}:`, error.message);
    }
    
    console.log('------------------------------------------');
  }
  
  // Limpar dados de teste
  console.log('\n🧹 Limpando dados de teste...');
  for (const test of testWebhooks) {
    const email = test.payload.customer.email;
    try {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    } catch (error) {
      // Ignorar erros de foreign key constraint
    }
  }
  
  await pool.end();
  console.log('✅ Teste de captura de telefone da Doppus concluído!');
}

// Executar teste
testDoppusPhoneCapture().catch(console.error);