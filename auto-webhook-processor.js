/**
 * Processador automático de webhooks para integração Hotmart
 * Este script processa automaticamente todos os webhooks pendentes
 * e cria os usuários correspondentes
 */

import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// Função para encontrar informações no payload
function findInPayload(payload, type) {
  if (!payload) return null;
  
  switch (type) {
    case 'email':
      if (payload.data?.buyer?.email) return payload.data.buyer.email;
      if (payload.data?.customer?.email) return payload.data.customer.email;
      if (payload.data?.subscription?.subscriber?.email) return payload.data.subscription.subscriber.email;
      break;
    
    case 'name':
      if (payload.data?.buyer?.name) return payload.data.buyer.name;
      if (payload.data?.customer?.name) return payload.data.customer.name;
      if (payload.data?.subscription?.subscriber?.name) return payload.data.subscription.subscriber.name;
      break;
      
    case 'transaction':
      if (payload.data?.purchase?.transaction) return payload.data.purchase.transaction;
      if (payload.data?.transaction) return payload.data.transaction;
      if (payload.transaction) return payload.transaction;
      break;
  }
  
  return null;
}

// Processar um webhook específico
async function processarWebhook(webhook) {
  console.log(`🔄 Processando webhook ID: ${webhook.id} (Email: ${webhook.email})`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Parse do payload
    let payload;
    try {
      if (typeof webhook.raw_payload === 'string') {
        payload = JSON.parse(webhook.raw_payload);
      } else {
        payload = webhook.raw_payload;
      }
    } catch (error) {
      console.error(`❌ Erro ao parsear payload: ${error.message}`);
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = $1 WHERE id = $2`,
        [`Erro ao parsear payload: ${error.message}`, webhook.id]
      );
      await pool.end();
      return false;
    }
    
    // Extrair dados do webhook
    const email = webhook.email;
    const name = findInPayload(payload, 'name') || email.split('@')[0];
    const transactionId = findInPayload(payload, 'transaction') || `TX-${Date.now()}`;
    
    console.log(`📋 Dados extraídos: Nome=${name}, Email=${email}, Transação=${transactionId}`);
    
    // Verificar se o usuário já existe
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    
    if (userResult.rows.length > 0) {
      // Atualizar usuário existente
      userId = userResult.rows[0].id;
      console.log(`🔄 Atualizando usuário existente com ID: ${userId}`);
      
      await pool.query(
        `UPDATE users SET 
         nivelacesso = 'premium', 
         tipoplano = 'premium', 
         origemassinatura = 'hotmart', 
         dataassinatura = NOW(), 
         dataexpiracao = NOW() + INTERVAL '1 year',
         atualizadoem = NOW()
         WHERE id = $1`,
        [userId]
      );
    } else {
      // Criar novo usuário
      console.log(`🔧 Criando novo usuário para ${email}...`);
      
      // Gerar username e senha
      const username = `${email.split('@')[0]}_${Date.now().toString(36).substr(-6)}`;
      const password = 'auto@123';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      const hashedPassword = `${hash}.${salt}`;
      
      // Inserir usuário no banco de dados
      const insertResult = await pool.query(
        `INSERT INTO users 
         (username, email, name, password, role, isactive, emailconfirmed,
          nivelacesso, tipoplano, origemassinatura, dataassinatura, dataexpiracao,
          criadoem, atualizadoem)
         VALUES 
         ($1, $2, $3, $4, 'user', true, true,
          'premium', 'premium', 'hotmart', NOW(), NOW() + INTERVAL '1 year',
          NOW(), NOW())
         RETURNING id`,
        [username, email, name, hashedPassword]
      );
      
      userId = insertResult.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
    }
    
    // Registrar assinatura
    const existingSubscription = await pool.query(
      'SELECT id FROM subscriptions WHERE "userId" = $1 AND origin = $2',
      [userId, 'hotmart']
    );
    
    if (existingSubscription.rows.length === 0) {
      await pool.query(
        `INSERT INTO subscriptions 
         ("userId", "planType", status, "startDate", "endDate", 
          origin, transactionid, "createdAt", "updatedAt")
         VALUES 
         ($1, $2, $3, NOW(), NOW() + INTERVAL '1 year',
          $4, $5, NOW(), NOW())`,
        [userId, 'premium', 'active', 'hotmart', transactionId]
      );
      
      console.log(`✅ Assinatura registrada para usuário ${userId}`);
    } else {
      console.log(`ℹ️ Usuário ${userId} já possui assinatura. Ignorando.`);
    }
    
    // Marcar webhook como processado
    await pool.query(
      `UPDATE webhook_logs SET status = 'processed', updated_at = NOW() WHERE id = $1`,
      [webhook.id]
    );
    
    console.log(`✅ Webhook ${webhook.id} processado com sucesso!`);
    await pool.end();
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${webhook.id}:`, error);
    
    try {
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
        [error.message, webhook.id]
      );
    } catch (updateError) {
      console.error('Erro ao atualizar status do webhook:', updateError);
    }
    
    await pool.end();
    return false;
  }
}

// Função principal para processar todos os webhooks pendentes
export async function processPendingWebhooks() {
  console.log('🔄 Iniciando processamento automático de webhooks pendentes');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar todos os webhooks com status "received"
    const { rows: webhooks } = await pool.query(
      `SELECT * FROM webhook_logs 
       WHERE status = 'received' 
       ORDER BY created_at ASC`
    );
    
    console.log(`🔍 Encontrados ${webhooks.length} webhooks pendentes`);
    
    if (webhooks.length === 0) {
      await pool.end();
      return { success: true, message: 'Nenhum webhook pendente', processed: 0 };
    }
    
    let sucessos = 0;
    let falhas = 0;
    
    for (const webhook of webhooks) {
      try {
        const success = await processarWebhook(webhook);
        if (success) {
          sucessos++;
        } else {
          falhas++;
        }
      } catch (error) {
        console.error(`❌ Erro fatal ao processar webhook ${webhook.id}:`, error);
        falhas++;
      }
    }
    
    console.log(`✅ Processamento finalizado: ${sucessos} sucessos, ${falhas} falhas`);
    await pool.end();
    
    return {
      success: true,
      message: 'Processamento concluído',
      processed: sucessos,
      failed: falhas
    };
  } catch (error) {
    console.error('❌ Erro geral ao processar webhooks:', error);
    await pool.end();
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Se executado diretamente da linha de comando, processar os webhooks
if (process.argv[1] === import.meta.url.substring(7)) {
  processPendingWebhooks()
    .then(result => {
      console.log('Resultado:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}