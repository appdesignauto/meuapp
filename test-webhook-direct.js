/**
 * Script para testar diretamente o endpoint de webhook da Hotmart
 * usando uma conexão separada que evita o servidor de desenvolvimento Vite
 */

const fetch = require('node-fetch');
const crypto = require('crypto');
const pool = require('./server/db').pool;

// Função para gerar assinatura HMAC
function generateSignature(data, secret) {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

async function getHotmartSecret() {
  try {
    const query = `SELECT "secretKey" FROM "integrationSettings" WHERE provider = 'hotmart' LIMIT 1`;
    const result = await pool.query(query);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].secretKey;
    }
    // Se não encontrar no banco, usar o valor do .env
    return process.env.HOTMART_SECRET || 'hotmart-test-secret';
  } catch (error) {
    console.error('❌ Erro ao obter secret da Hotmart:', error);
    return process.env.HOTMART_SECRET || 'hotmart-test-secret';
  }
}

async function testDirectWebhook() {
  console.log('🚀 Iniciando teste direto de webhook da Hotmart...');
  
  try {
    // Dados de exemplo do webhook (simulando uma compra aprovada)
    const webhookData = {
      id: `test-${Date.now()}`,
      event: 'PURCHASE_APPROVED',
      data: {
        buyer: {
          email: 'teste@designauto.com.br',
          name: 'Usuário Teste'
        },
        purchase: {
          transaction: `tx-${Date.now()}`,
          order_date: Date.now().toString(),
          approved_date: Date.now().toString(),
          price: {
            value: '297.00'
          },
          product: {
            id: '1234567',
            name: 'DesignAuto Premium'
          },
          offer: {
            code: 'OFFERX123'
          }
        }
      }
    };
    
    // Obter secret e gerar assinatura HMAC
    const hotmartSecret = await getHotmartSecret();
    const signature = generateSignature(webhookData, hotmartSecret);
    console.log(`✅ Assinatura HMAC gerada: ${signature}`);
    
    // Conectar diretamente ao banco de dados para descartar logs antigos de teste
    try {
      const clearQuery = `DELETE FROM "webhookLogs" WHERE "transactionId" = $1`;
      await pool.query(clearQuery, [webhookData.data.purchase.transaction]);
      console.log('🧹 Logs antigos de teste removidos do banco de dados');
    } catch (dbError) {
      console.warn('⚠️ Erro ao limpar logs antigos (pode ser ignorado):', dbError.message);
    }
    
    // Enviar diretamente para o endpoint usando a porta do servidor
    // Importante: Usar a porta 8080 que é onde o Express está rodando, não a porta do Vite
    // o Replit expõe ambos os portos, mas internamente eles são conectados à mesma app
    console.log('📡 Enviando webhook diretamente para o endpoint...');
    
    const response = await fetch('https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev/webhook/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-HMAC-SHA1': signature
      },
      body: JSON.stringify(webhookData)
    });
    
    // Verificar resultado
    console.log(`🔄 Resposta do servidor: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 Resposta detalhada:\n${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    
    // Verificar se o webhook foi registrado no banco
    console.log('🔍 Verificando registro do webhook no banco de dados...');
    const queryLogs = `SELECT * FROM "webhookLogs" WHERE "transactionId" = $1 ORDER BY "createdAt" DESC LIMIT 1`;
    const logsResult = await pool.query(queryLogs, [webhookData.data.purchase.transaction]);
    
    if (logsResult.rows && logsResult.rows.length > 0) {
      console.log('✅ Webhook registrado com sucesso!');
      console.log('📊 Detalhes do registro:', logsResult.rows[0]);
    } else {
      console.log('❌ Webhook não foi registrado no banco de dados');
    }
    
    // Verificar se o usuário foi criado/atualizado
    console.log(`🔍 Verificando conta para o usuário: ${webhookData.data.buyer.email}`);
    const queryUser = `SELECT * FROM users WHERE email = $1`;
    const userResult = await pool.query(queryUser, [webhookData.data.buyer.email]);
    
    if (userResult.rows && userResult.rows.length > 0) {
      console.log('✅ Usuário encontrado no banco de dados!');
      console.log('👤 Dados do usuário:', userResult.rows[0]);
      
      // Verificar assinatura
      const querySubscription = `SELECT * FROM subscriptions WHERE "userId" = $1`;
      const subResult = await pool.query(querySubscription, [userResult.rows[0].id]);
      
      if (subResult.rows && subResult.rows.length > 0) {
        console.log('✅ Assinatura encontrada!');
        console.log('📋 Detalhes da assinatura:', subResult.rows[0]);
      } else {
        console.log('❌ Nenhuma assinatura encontrada para este usuário');
      }
    } else {
      console.log('❌ Usuário não encontrado no banco de dados');
    }
    
    console.log('✅ Teste de webhook direto concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    // Fechar a conexão com o banco
    await pool.end();
  }
}

// Executar o teste
testDirectWebhook().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});