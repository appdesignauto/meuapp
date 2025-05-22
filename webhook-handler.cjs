/**
 * Script para processamento de webhooks da Hotmart
 * Implementação simplificada para processamento direto de webhooks
 * 
 * Uso: node webhook-handler.cjs [webhookId] [payloadFilePath]
 */

const fs = require('fs');
const { Pool } = require('pg');
const crypto = require('crypto');

// Função para gerar username e senha para novos usuários
function gerarCredenciais(email) {
  const username = email.split('@')[0] + '-' + Date.now();
  const senha = 'auto@123'; // Senha padrão conforme solicitado
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  const hashedPassword = `${hash}.${salt}`;
  
  return { username, password: hashedPassword };
}

// Função principal para processar um webhook
async function processarWebhook(webhookId, payloadFilePath) {
  console.log(`🔄 Processando webhook #${webhookId} com payload de ${payloadFilePath}`);
  
  try {
    // Ler o payload do arquivo
    const payloadRaw = fs.readFileSync(payloadFilePath, 'utf-8');
    const payload = JSON.parse(payloadRaw);
    
    // Configurar conexão com banco de dados
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Extrair dados essenciais do payload
    const event = payload?.event || 'UNKNOWN';
    const buyerName = payload?.data?.buyer?.name || 'Novo Cliente';
    const buyerEmail = payload?.data?.buyer?.email || null;
    const transactionId = payload?.data?.purchase?.transaction || `TX-${Date.now()}`;
    
    if (!buyerEmail) {
      console.log('❌ Email não encontrado no payload');
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = 'Email não encontrado' WHERE id = $1`,
        [webhookId]
      );
      await pool.end();
      return;
    }
    
    console.log(`📊 Dados principais: evento=${event}, email=${buyerEmail}, transação=${transactionId}`);
    
    // Verificar se o usuário já existe
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [buyerEmail]
    );
    
    let userId;
    
    if (userCheck.rowCount === 0) {
      // Criar novo usuário
      const { username, password } = gerarCredenciais(buyerEmail);
      console.log(`🔑 Credenciais geradas para ${buyerEmail}: username=${username}`);
      
      try {
        // Inserir apenas os campos essenciais primeiro
        const userInsert = await pool.query(
          `INSERT INTO users (username, password, email, name, role, isactive, emailconfirmed)
           VALUES ($1, $2, $3, $4, 'user', true, true)
           RETURNING id`,
          [username, password, buyerEmail, buyerName]
        );
        
        userId = userInsert.rows[0].id;
        console.log(`✅ Novo usuário #${userId} criado com sucesso`);
        
        // Atualizar campos adicionais separadamente para evitar problemas
        await pool.query(
          `UPDATE users 
           SET nivelacesso = 'premium',
               origemassinatura = 'hotmart',
               tipoplano = 'premium',
               dataassinatura = NOW(),
               dataexpiracao = NOW() + INTERVAL '1 year',
               criadoem = NOW(),
               atualizadoem = NOW()
           WHERE id = $1`,
          [userId]
        );
      } catch (userError) {
        console.error('❌ Erro ao criar usuário:', userError);
        
        // Registrar erro no webhook
        await pool.query(
          `UPDATE webhook_logs SET status = 'error', error_message = $1 WHERE id = $2`,
          [userError.message, webhookId]
        );
        
        await pool.end();
        return;
      }
    } else {
      // Atualizar usuário existente
      userId = userCheck.rows[0].id;
      console.log(`🔄 Atualizando usuário existente #${userId}`);
      
      await pool.query(
        `UPDATE users 
         SET nivelacesso = 'premium',
             origemassinatura = 'hotmart',
             tipoplano = 'premium',
             dataassinatura = NOW(),
             dataexpiracao = NOW() + INTERVAL '1 year',
             atualizadoem = NOW()
         WHERE id = $1`,
        [userId]
      );
    }
    
    // Registrar assinatura (evitando duplicidades)
    const subCheck = await pool.query(
      'SELECT id FROM subscriptions WHERE transactionid = $1',
      [transactionId]
    );
    
    if (subCheck.rowCount === 0) {
      await pool.query(
        `INSERT INTO subscriptions 
         ("userId", "planType", status, "startDate", "endDate", origin,
          transactionid, "createdAt", "updatedAt", "paymentmethod", price, currency)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '1 year', $4,
                $5, NOW(), NOW(), $6, $7, $8)`,
        [userId, 'premium', 'active', 'hotmart', 
         transactionId, 'credit_card', 97.00, 'BRL']
      );
      
      console.log(`✅ Nova assinatura registrada para usuário #${userId}`);
    } else {
      console.log(`ℹ️ Assinatura com transactionId ${transactionId} já existe`);
    }
    
    // Marcar webhook como processado
    await pool.query(
      `UPDATE webhook_logs SET status = 'processed' WHERE id = $1`,
      [webhookId]
    );
    
    console.log(`✅ Webhook #${webhookId} processado com sucesso`);
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro no processamento de webhook:', error);
    
    // Tentar registrar o erro no banco de dados
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = $1 WHERE id = $2`,
        [error.message, webhookId]
      );
      
      await pool.end();
    } catch (dbError) {
      console.error('❌ Erro ao registrar falha no banco de dados:', dbError);
    }
  }
}

// Verificar se foi passado o ID do webhook como argumento
const webhookId = process.argv[2];
const payloadFilePath = process.argv[3];

if (!webhookId || !payloadFilePath) {
  console.error('❌ Uso: node webhook-handler.cjs <webhookId> <payloadFilePath>');
  process.exit(1);
}

// Iniciar processamento
processarWebhook(webhookId, payloadFilePath).then(() => {
  console.log('✅ Processamento concluído');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});