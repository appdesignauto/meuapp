/**
 * Script para simular um webhook da Hotmart e testar nossa implementação
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import pg from 'pg';
const { Pool } = pg;

async function simulateWebhook() {
  // Criar payload baseado na documentação da Hotmart
  const payload = {
    event: 'PURCHASE_APPROVED',
    data: {
      buyer: {
        name: 'Cliente de Teste',
        email: 'cliente-teste-webhook@example.com',
        checkout_phone: '5511999999999'
      },
      purchase: {
        status: 'APPROVED',
        order_date: new Date().toISOString(),
        date_next_charge: new Date(Date.now() + 31536000000).toISOString(), // +1 ano
        transaction: `TX-${Date.now()}`,
        payment: {
          type: 'CREDIT_CARD'
        },
        price: {
          value: 97.00,
          currency_value: 'BRL'
        }
      },
      subscription: {
        plan: {
          name: 'Plano Premium',
          id: '12345'
        },
        subscriber: {
          code: `SUB-${Date.now()}`
        }
      }
    }
  };

  try {
    console.log('Enviando webhook de teste para o endpoint...');
    
    // Enviar para o endpoint de webhook
    const response = await fetch('http://localhost:5000/webhook/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Resposta:', JSON.stringify(responseData, null, 2));
    
    // Verificar se o usuário foi criado
    console.log('\nVerificando se o usuário foi criado...');
    
    // Aguardar um momento para garantir que o processamento ocorreu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar no banco de dados
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = 'cliente-teste-webhook@example.com'"
    );
    
    if (userResult.rows.length > 0) {
      console.log('✅ Usuário criado com sucesso!');
      console.log(`ID: ${userResult.rows[0].id}`);
      console.log(`Username: ${userResult.rows[0].username}`);
      console.log(`Email: ${userResult.rows[0].email}`);
      console.log(`Nível de acesso: ${userResult.rows[0].nivelacesso}`);
    } else {
      console.log('❌ Usuário NÃO foi criado!');
      
      // Verificar se o webhook foi registrado
      const webhookResult = await pool.query(
        "SELECT * FROM webhook_logs WHERE email = 'cliente-teste-webhook@example.com' ORDER BY id DESC LIMIT 1"
      );
      
      if (webhookResult.rows.length > 0) {
        console.log('✅ Webhook foi registrado:');
        console.log(`ID: ${webhookResult.rows[0].id}`);
        console.log(`Status: ${webhookResult.rows[0].status}`);
        console.log(`Erro: ${webhookResult.rows[0].error_message || 'Nenhum'}`);
      } else {
        console.log('❌ Webhook não foi registrado!');
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Erro ao simular webhook:', error);
  }
}

simulateWebhook().catch(error => {
  console.error('Erro na execução do script:', error);
});