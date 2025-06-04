/**
 * Script simples para testar o endpoint de webhook da Hotmart
 * 
 * Este script envia um exemplo de webhook da Hotmart para testar a funcionalidade
 * sem depender de configurações complexas
 */
const fetch = require('node-fetch');

async function enviarWebhook() {
  try {
    console.log('🔍 Enviando teste de webhook da Hotmart para a URL local...');
    
    // Dados de exemplo do webhook da Hotmart (estrutura básica)
    const webhookData = {
      event: "PURCHASE_APPROVED",
      data: {
        buyer: {
          email: "ws.advogaciasm@gmail.com"
        },
        purchase: {
          transaction: "WS-TEST-" + Date.now()
        },
        product: {
          id: "PROD-WS-TEST"
        }
      }
    };
    
    // Enviar para o endpoint do webhook
    const response = await fetch("http://localhost:3000/webhook/hotmart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(webhookData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    const responseText = await response.text();
    console.log('📄 Resposta do servidor:', responseText);
    
    // Verificar se o webhook foi registrado no banco de dados
    setTimeout(async () => {
      try {
        console.log('\n🔍 Verificando se o webhook foi registrado no banco de dados...');
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL
        });
        
        const result = await pool.query('SELECT * FROM "webhookLogs" WHERE email = $1 ORDER BY id DESC LIMIT 1', ['ws.advogaciasm@gmail.com']);
        
        if (result.rows.length > 0) {
          console.log('✅ Webhook registrado com sucesso no banco de dados!');
          console.log('📋 Detalhes:', result.rows[0]);
        } else {
          console.log('❌ Webhook não foi registrado no banco de dados.');
          console.log('🔍 Verificando todos os webhooks recentes...');
          
          const allLogs = await pool.query('SELECT id, email, status, "eventType", "createdAt" FROM "webhookLogs" ORDER BY id DESC LIMIT 5');
          console.log('📋 Últimos 5 webhooks registrados:');
          console.table(allLogs.rows);
        }
        
        await pool.end();
      } catch (dbError) {
        console.error('❌ Erro ao verificar o banco de dados:', dbError);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erro ao enviar webhook de teste:', error);
  }
}

enviarWebhook();
