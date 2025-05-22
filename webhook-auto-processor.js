/**
 * Processador automático para webhooks da Hotmart
 * Este script é responsável por processar automaticamente webhooks recebidos
 * Ele deve ser integrado nas rotas para executar sem intervenção manual
 */

import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// Função principal para processar webhooks pendentes
export async function processarWebhooksPendentes() {
  console.log('🔄 Processando webhooks pendentes automaticamente...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar webhooks com status "received"
    const { rows: webhooks } = await pool.query(
      `SELECT * FROM webhook_logs 
      WHERE status = 'received' 
      ORDER BY created_at ASC`
    );
    
    console.log(`🔍 Encontrados ${webhooks.length} webhooks pendentes`);
    
    if (webhooks.length === 0) {
      return { success: true, message: 'Nenhum webhook pendente', processed: 0 };
    }
    
    let sucessos = 0;
    let falhas = 0;
    
    for (const webhook of webhooks) {
      try {
        const resultado = await processarWebhook(webhook);
        if (resultado) {
          sucessos++;
        } else {
          falhas++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar webhook ${webhook.id}:`, error);
        falhas++;
        
        // Marcar webhook como erro
        await pool.query(
          `UPDATE webhook_logs SET 
          status = 'error',
          error_message = $1,
          updated_at = NOW()
          WHERE id = $2`,
          [error.message, webhook.id]
        );
      }
    }
    
    console.log(`✅ Processamento concluído: ${sucessos} sucessos, ${falhas} falhas`);
    return { success: true, message: 'Processamento concluído', successCount: sucessos, errorCount: falhas };
  } catch (error) {
    console.error('❌ Erro ao processar webhooks pendentes:', error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Função para processar um webhook específico
async function processarWebhook(webhook) {
  console.log(`🔄 Processando webhook ID: ${webhook.id}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Obter dados do webhook
    const email = webhook.email;
    let payload;
    
    try {
      // O payload pode já ser um objeto ou uma string JSON
      if (typeof webhook.raw_payload === 'string') {
        payload = JSON.parse(webhook.raw_payload);
      } else {
        payload = webhook.raw_payload;
      }
    } catch (e) {
      console.log('⚠️ Erro ao processar payload, usando valores padrão');
      payload = { data: { buyer: { name: email.split('@')[0] } } };
    }
    
    // Extrair nome do comprador e tipo de plano
    const name = payload.data?.buyer?.name || email.split('@')[0];
    const planType = 'premium'; // Default para tipo de plano
    
    console.log(`📋 Dados extraídos: Nome=${name}, Email=${email}, Plano=${planType}`);
    
    // Verificar se o usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    
    if (existingUser.rows.length > 0) {
      // Atualizar usuário existente
      userId = existingUser.rows[0].id;
      console.log(`🔄 Atualizando usuário existente com ID: ${userId}`);
      
      await pool.query(
        `UPDATE users SET 
          nivelacesso = 'premium',
          origemassinatura = 'hotmart',
          tipoplano = $1,
          dataassinatura = NOW(),
          dataexpiracao = NOW() + INTERVAL '1 year',
          atualizadoem = NOW()
          WHERE id = $2`,
        [planType, userId]
      );
      
      console.log(`✅ Usuário atualizado com sucesso`);
    } else {
      // Criar novo usuário
      const username = email.split('@')[0] + '-' + Date.now().toString().slice(-6);
      const password = 'auto@' + Math.floor(100000 + Math.random() * 900000);
      
      // Gerar hash seguro da senha
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      const hashedPassword = `${hash}.${salt}`;
      
      console.log(`🔧 Gerando novo usuário: username=${username}`);
      
      // Inserir o novo usuário no banco de dados
      const insertUser = await pool.query(
        `INSERT INTO users (
          username, password, email, name, 
          role, isactive, emailconfirmed
        ) VALUES (
          $1, $2, $3, $4, 
          'user', true, true
        ) RETURNING id`,
        [username, hashedPassword, email, name]
      );
      
      userId = insertUser.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
      
      // Atualizar campos adicionais do usuário
      await pool.query(
        `UPDATE users SET 
          nivelacesso = 'premium',
          origemassinatura = 'hotmart', 
          tipoplano = $1,
          dataassinatura = NOW(),
          dataexpiracao = NOW() + INTERVAL '1 year',
          criadoem = NOW(),
          atualizadoem = NOW()
          WHERE id = $2`,
        [planType, userId]
      );
    }
    
    // Criar ou atualizar assinatura do usuário
    const subscriptionExists = await pool.query(
      'SELECT id FROM subscriptions WHERE "userId" = $1 AND origin = $2',
      [userId, 'hotmart']
    );
    
    const transactionId = payload.data?.purchase?.transaction || `AUTO-${Date.now()}`;
    
    if (subscriptionExists.rows.length > 0) {
      // Atualizar assinatura existente
      await pool.query(
        `UPDATE subscriptions SET 
          "planType" = $1,
          status = 'active',
          "startDate" = NOW(),
          "endDate" = NOW() + INTERVAL '1 year',
          transactionid = $2,
          updated_at = NOW()
          WHERE "userId" = $3 AND origin = 'hotmart'`,
        [planType, transactionId, userId]
      );
      
      console.log(`✅ Assinatura atualizada para usuário ${userId}`);
    } else {
      // Criar nova assinatura
      await pool.query(
        `INSERT INTO subscriptions (
          "userId", "planType", status, "startDate", "endDate", 
          origin, transactionid, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, 'active', NOW(), NOW() + INTERVAL '1 year',
          'hotmart', $3, NOW(), NOW()
        )`,
        [userId, planType, transactionId]
      );
      
      console.log(`✅ Assinatura criada para usuário ${userId}`);
    }
    
    // Atualizar status do webhook para processado
    await pool.query(
      `UPDATE webhook_logs SET 
        status = 'processed',
        updated_at = NOW()
        WHERE id = $1`,
      [webhook.id]
    );
    
    console.log(`✅ Webhook ${webhook.id} processado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${webhook.id}:`, error);
    
    // Marcar webhook como erro
    await pool.query(
      `UPDATE webhook_logs SET 
        status = 'error',
        error_message = $1,
        updated_at = NOW()
        WHERE id = $2`,
      [error.message, webhook.id]
    );
    
    return false;
  } finally {
    await pool.end();
  }
}

// Se executado diretamente, processar webhooks pendentes
if (process.argv[1] === import.meta.url.substring(7)) { // Remove 'file://' prefix
  processarWebhooksPendentes()
    .then(result => {
      console.log('\nResultado:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\nErro fatal:', error);
      process.exit(1);
    });
}