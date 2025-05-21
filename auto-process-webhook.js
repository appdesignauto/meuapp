/**
 * Script para processar automaticamente o último webhook recebido
 * Este script faz parte da solução de processamento automático de webhooks da Hotmart
 */

import pg from 'pg';
const { Pool } = pg;

// Função para processar o webhook
async function processWebhook(webhookId) {
  console.log(`🔄 Processando webhook ID: ${webhookId} automaticamente`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar o webhook pelo ID
    const webhookResult = await pool.query(
      'SELECT * FROM webhook_logs WHERE id = $1',
      [webhookId]
    );
    
    if (webhookResult.rows.length === 0) {
      console.error(`❌ Webhook ID ${webhookId} não encontrado`);
      await pool.end();
      return false;
    }
    
    const webhook = webhookResult.rows[0];
    console.log(`✅ Webhook encontrado: ${webhook.id}, Email: ${webhook.email}`);
    
    // Verificar se o webhook já foi processado
    if (webhook.status === 'processed') {
      console.log(`⏩ Webhook ${webhookId} já foi processado anteriormente`);
      await pool.end();
      return true;
    }
    
    // Analisar o payload para extrair informações
    const payload = webhook.raw_payload;
    const email = webhook.email;
    
    if (!email) {
      console.error('❌ Email não encontrado no payload');
      await pool.end();
      return false;
    }
    
    // Extrair nome do comprador
    const name = findNameInPayload(payload) || email.split('@')[0];
    const planType = findPlanInfo(payload);
    
    console.log(`📋 Dados extraídos: ${name}, ${email}, Plano: ${planType}`);
    
    // Verificar se o usuário já existe
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
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
         tipoplano = $1, 
         origemassinatura = 'hotmart', 
         dataassinatura = NOW(), 
         dataexpiracao = NOW() + INTERVAL '1 year',
         atualizadoem = NOW()
         WHERE id = $2`,
        [planType, userId]
      );
    } else {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário para ${email}...`);
      
      // Gerar username único baseado no email
      const username = `${email.split('@')[0]}_${Math.random().toString(16).slice(2, 10)}`;
      
      const insertResult = await pool.query(
        `INSERT INTO users 
         (username, email, name, nivelacesso, tipoplano, origemassinatura, dataassinatura, dataexpiracao, criadoem, atualizadoem, isactive, emailconfirmed)
         VALUES ($1, $2, $3, 'premium', $4, 'hotmart', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW(), true, true)
         RETURNING id`,
        [username, email, name, planType]
      );
      
      userId = insertResult.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
    }
    
    // Registrar a assinatura
    console.log(`📝 Registrando assinatura para usuário ${userId}...`);
    
    await pool.query(
      `INSERT INTO subscriptions 
       (userid, planid, subscriptioncode, paymentmethod, price, currency, status, datacriacao, dataatualizacao)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())`,
      [
        userId,
        1, // ID padrão para plano premium
        webhook.transaction_id || `MANUAL-${Date.now()}`,
        'hotmart',
        0, // Preço padrão (será atualizado posteriormente)
        'BRL'
      ]
    );
    
    // Marcar webhook como processado
    await pool.query(
      `UPDATE webhook_logs SET status = 'processed', updated_at = NOW() WHERE id = $1`,
      [webhookId]
    );
    
    console.log(`✅ Webhook ${webhookId} processado com sucesso!`);
    await pool.end();
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${webhookId}:`, error);
    
    try {
      // Marcar como erro no banco de dados
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await pool.query(
        `UPDATE webhook_logs SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
        [errorMessage, webhookId]
      );
    } catch (updateError) {
      console.error('Erro ao atualizar status do webhook:', updateError);
    }
    
    await pool.end();
    return false;
  }
}

// Função para encontrar nome em qualquer parte do payload
function findNameInPayload(payload) {
  if (!payload) return null;
  
  try {
    payload = typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch (e) {
    console.error('Erro ao parsear payload:', e);
    return null;
  }
  
  // Verificar locais comuns primeiro
  if (payload.data?.buyer?.name) return payload.data.buyer.name;
  if (payload.data?.customer?.name) return payload.data.customer.name;
  if (payload.data?.subscription?.subscriber?.name) return payload.data.subscription.subscriber.name;
  
  // Função recursiva para busca profunda
  function searchName(obj) {
    if (!obj || typeof obj !== 'object') return null;
    
    // Verificar chaves comuns
    if (obj.name && typeof obj.name === 'string') return obj.name;
    if (obj.fullName && typeof obj.fullName === 'string') return obj.fullName;
    if (obj.firstName && obj.lastName) return `${obj.firstName} ${obj.lastName}`;
    
    // Buscar em propriedades
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        const result = searchName(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchName(payload);
}

// Função para extrair plano do payload
function findPlanInfo(payload) {
  try {
    payload = typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch (e) {
    console.error('Erro ao parsear payload:', e);
    return 'plano premium';
  }
  
  // Tenta encontrar em diferentes posições no payload
  if (payload.data?.subscription?.plan?.name) {
    return payload.data.subscription.plan.name.toLowerCase();
  }
  
  if (payload.data?.purchase?.offer?.code === 'aukjngrt') {
    return 'plano anual';
  }
  
  if (payload.data?.product?.name) {
    return payload.data.product.name.toLowerCase();
  }
  
  // Se não encontrar, retorna um valor padrão
  return 'plano premium';
}

// Função principal
async function main() {
  if (process.argv.length > 2) {
    // Se foi passado um ID específico
    const webhookId = parseInt(process.argv[2]);
    console.log(`🔍 Processando webhook específico ID: ${webhookId}`);
    await processWebhook(webhookId);
  } else {
    // Buscar o último webhook recebido
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    try {
      const result = await pool.query(
        "SELECT id FROM webhook_logs WHERE status = 'received' ORDER BY created_at DESC LIMIT 1"
      );
      
      if (result.rows.length > 0) {
        const webhookId = result.rows[0].id;
        console.log(`🔍 Processando o último webhook recebido (ID: ${webhookId})`);
        await processWebhook(webhookId);
      } else {
        console.log('ℹ️ Nenhum webhook pendente encontrado');
      }
      
      await pool.end();
    } catch (error) {
      console.error('❌ Erro ao buscar webhook pendente:', error);
      await pool.end();
    }
  }
}

// Executar o processamento
main().catch(err => {
  console.error('❌ Erro geral ao processar webhook:', err);
  process.exit(1);
});