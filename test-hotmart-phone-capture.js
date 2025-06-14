/**
 * Script para testar a captura de telefone nos webhooks da Hotmart
 * Este script simula webhooks com diferentes formatos de telefone
 */

import fetch from 'node-fetch';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Webhooks de teste com diferentes configurações de telefone
const testWebhooks = [
  {
    name: "Webhook com telefone no buyer",
    payload: {
      id: `test-phone-buyer-${Date.now()}`,
      event: 'PURCHASE_APPROVED',
      data: {
        buyer: {
          email: 'teste.phone.buyer@designauto.com.br',
          name: 'Usuário Com Telefone Buyer',
          phone: '+5511999887766'
        },
        purchase: {
          transaction: `tx-phone-buyer-${Date.now()}`,
          status: 'APPROVED',
          price: {
            value: 7
          }
        },
        subscription: {
          plan: {
            name: 'Plano Anual'
          }
        }
      }
    }
  },
  {
    name: "Webhook com telefone no address",
    payload: {
      id: `test-phone-address-${Date.now()}`,
      event: 'PURCHASE_APPROVED',
      data: {
        buyer: {
          email: 'teste.phone.address@designauto.com.br',
          name: 'Usuário Com Telefone Address',
          address: {
            phone: '+5511888776655',
            country: 'Brasil'
          }
        },
        purchase: {
          transaction: `tx-phone-address-${Date.now()}`,
          status: 'APPROVED',
          price: {
            value: 7
          }
        },
        subscription: {
          plan: {
            name: 'Plano Mensal'
          }
        }
      }
    }
  },
  {
    name: "Webhook com telefone no customer",
    payload: {
      id: `test-phone-customer-${Date.now()}`,
      event: 'PURCHASE_APPROVED',
      data: {
        buyer: {
          email: 'teste.phone.customer@designauto.com.br',
          name: 'Usuário Com Telefone Customer'
        },
        customer: {
          phone: '+5511777665544'
        },
        purchase: {
          transaction: `tx-phone-customer-${Date.now()}`,
          status: 'APPROVED',
          price: {
            value: 7
          }
        },
        subscription: {
          plan: {
            name: 'Plano Anual'
          }
        }
      }
    }
  },
  {
    name: "Webhook SEM telefone (como Fernando Oliveira)",
    payload: {
      id: `test-no-phone-${Date.now()}`,
      event: 'PURCHASE_APPROVED',
      data: {
        buyer: {
          email: 'teste.sem.telefone@designauto.com.br',
          name: 'Usuário Sem Telefone',
          address: {
            country: 'Brasil'
          }
        },
        purchase: {
          transaction: `tx-no-phone-${Date.now()}`,
          status: 'APPROVED',
          price: {
            value: 7
          }
        },
        subscription: {
          plan: {
            name: 'Plano Mensal'
          }
        }
      }
    }
  }
];

async function testPhoneCapture() {
  console.log('🚀 Iniciando testes de captura de telefone nos webhooks da Hotmart');
  console.log('==========================================');

  for (let i = 0; i < testWebhooks.length; i++) {
    const test = testWebhooks[i];
    console.log(`\n📱 Teste ${i + 1}: ${test.name}`);
    
    try {
      // Limpar usuário de teste se existir
      const email = test.payload.data.buyer.email;
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
      console.log(`🧹 Usuário de teste limpo: ${email}`);
      
      // Enviar webhook para o endpoint
      const response = await fetch('http://localhost:5000/webhook/hotmart-fixed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.payload)
      });

      const result = await response.json();
      console.log(`✅ Webhook enviado. Status: ${response.status}`);
      
      // Verificar se o usuário foi criado com telefone
      const userQuery = await pool.query(
        'SELECT email, name, phone FROM users WHERE email = $1', 
        [email]
      );
      
      if (userQuery.rowCount > 0) {
        const user = userQuery.rows[0];
        console.log(`👤 Usuário criado: ${user.name}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`📞 Telefone capturado: ${user.phone || 'NENHUM'}`);
        
        // Verificar se o telefone foi capturado corretamente
        const expectedPhone = test.payload.data.buyer.phone || 
                             test.payload.data.buyer.address?.phone || 
                             test.payload.data.customer?.phone || 
                             null;
        
        if (expectedPhone && user.phone === expectedPhone) {
          console.log(`✅ SUCESSO: Telefone capturado corretamente!`);
        } else if (!expectedPhone && !user.phone) {
          console.log(`✅ SUCESSO: Nenhum telefone esperado, nenhum telefone salvo.`);
        } else {
          console.log(`❌ ERRO: Telefone esperado: ${expectedPhone}, mas salvo: ${user.phone}`);
        }
      } else {
        console.log(`❌ ERRO: Usuário não foi criado!`);
      }
      
    } catch (error) {
      console.error(`❌ Erro no teste ${i + 1}:`, error.message);
    }
    
    console.log('------------------------------------------');
  }
  
  // Limpar dados de teste
  console.log('\n🧹 Limpando dados de teste...');
  for (const test of testWebhooks) {
    const email = test.payload.data.buyer.email;
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
  }
  
  await pool.end();
  console.log('✅ Teste de captura de telefone concluído!');
}

// Executar teste
testPhoneCapture().catch(console.error);