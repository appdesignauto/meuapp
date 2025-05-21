/**
 * Script para processar automaticamente todos os webhooks pendentes
 * Este script processa todos os webhooks da Hotmart com status 'received'
 */
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Função para encontrar o email no payload (pode estar em diferentes lugares dependendo do formato)
function findEmailInPayload(payload) {
  if (!payload) return null;
  
  // Se for string, tentar converter para objeto
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  
  return searchEmail(data);
  
  function searchEmail(obj) {
    // Verificar casos específicos conhecidos
    if (obj.data?.buyer?.email) return obj.data.buyer.email;
    if (obj.data?.subscriber?.email) return obj.data.subscriber.email;
    if (obj.data?.customer?.email) return obj.data.customer.email;
    if (obj.data?.client?.email) return obj.data.client.email;
    if (obj.buyer?.email) return obj.buyer.email;
    if (obj.user?.email) return obj.user.email;
    if (obj.email) return obj.email;
    
    // Busca recursiva em objetos aninhados
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const email = searchEmail(obj[key]);
          if (email) return email;
        } else if (key === 'email' && typeof obj[key] === 'string') {
          return obj[key];
        }
      }
    }
    
    return null;
  }
}

// Função para encontrar o nome no payload
function findNameInPayload(payload) {
  if (!payload) return null;
  
  // Se for string, tentar converter para objeto
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  
  return searchName(data);
  
  function searchName(obj) {
    // Verificar casos específicos conhecidos
    if (obj.data?.buyer?.name) return obj.data.buyer.name;
    if (obj.data?.subscriber?.name) return obj.data.subscriber.name;
    if (obj.data?.customer?.name) return obj.data.customer.name;
    if (obj.data?.client?.name) return obj.data.client.name;
    if (obj.buyer?.name) return obj.buyer.name;
    if (obj.user?.name) return obj.user.name;
    if (obj.name) return obj.name;
    
    // Para casos onde o nome está dividido em first_name e last_name
    if (obj.data?.buyer?.first_name && obj.data?.buyer?.last_name) {
      return `${obj.data.buyer.first_name} ${obj.data.buyer.last_name}`;
    }
    
    // Busca recursiva em objetos aninhados
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const name = searchName(obj[key]);
          if (name) return name;
        } else if (key === 'name' && typeof obj[key] === 'string') {
          return obj[key];
        }
      }
    }
    
    return null;
  }
}

// Função para encontrar o Transaction ID no payload
function findTransactionId(payload) {
  if (!payload) return null;
  
  // Se for string, tentar converter para objeto
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  
  return searchTransactionId(data);
  
  function searchTransactionId(obj) {
    // Verificar casos específicos conhecidos
    if (obj.data?.purchase?.transaction) return obj.data.purchase.transaction;
    if (obj.purchase?.transaction) return obj.purchase.transaction;
    if (obj.transaction) return obj.transaction;
    if (obj.id) return obj.id; // Alguns formatos usam 'id'
    
    // Busca recursiva em objetos aninhados
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const transactionId = searchTransactionId(obj[key]);
          if (transactionId) return transactionId;
        } else if ((key === 'transaction' || key === 'transaction_id') && typeof obj[key] === 'string') {
          return obj[key];
        }
      }
    }
    
    return null;
  }
}

// Função para identificar o plano no payload
function findPlanInfo(payload) {
  try {
    // Se for string, tentar converter para objeto
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    
    // Verificar diferentes possibilidades de localização do plano
    if (data.data?.subscription?.plan?.name) {
      return data.data.subscription.plan.name.toLowerCase();
    } else if (data.data?.plan?.name) {
      return data.data.plan.name.toLowerCase();
    } else if (data.data?.product?.name) {
      return data.data.product.name.toLowerCase();
    } else if (data.plan?.name) {
      return data.plan.name.toLowerCase();
    } else if (data.product?.name) {
      return data.product.name.toLowerCase();
    }
    
    // Se não encontrar plano específico, retornar 'premium' como padrão
    return 'premium';
  } catch (error) {
    console.error('❌ Erro ao buscar informações do plano:', error);
    return 'premium'; // Valor padrão em caso de erro
  }
}

// Processa um webhook específico
async function processWebhook(webhook) {
  console.log(`🔄 Processando webhook ID: ${webhook.id}, Status: ${webhook.status}`);
  
  try {
    const payload = webhook.raw_payload ? JSON.parse(webhook.raw_payload) : {};
    const email = webhook.email || findEmailInPayload(payload);
    const name = findNameInPayload(payload);
    const transactionId = webhook.transaction_id || findTransactionId(payload);
    const planName = findPlanInfo(payload).toLowerCase();
    
    if (!email) {
      throw new Error('❌ Email não encontrado no payload do webhook');
    }
    
    // Conectar ao banco
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log(`📋 Dados extraídos: ${name || 'Nome não encontrado'}, ${email}, Plano: ${planName}`);
    
    // Verificar se o usuário já existe
    const userResult = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    let userId;
    
    if (userResult.rows.length > 0) {
      // Usuário já existe, atualizar
      userId = userResult.rows[0].id;
      console.log(`✏️ Atualizando usuário existente com ID: ${userId}`);
      
      await pool.query(
        'UPDATE users SET nivelacesso = $1, tipoplano = $2, dataassinatura = NOW(), dataexpiracao = NOW() + INTERVAL \'1 year\', atualizadoem = NOW() WHERE id = $3',
        ['premium', planName, userId]
      );
      
      console.log('✅ Usuário atualizado com sucesso');
    } else {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário para ${email}`);
      
      // Gerar username baseado no email
      const baseUsername = email.split('@')[0];
      
      // Verificar se o username já existe
      const usernameResult = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [baseUsername]
      );
      
      // Se username existir, adicionar um sufixo aleatório
      const username = usernameResult.rows.length > 0 
        ? `${baseUsername}${Math.floor(Math.random() * 10000)}`
        : baseUsername;
      
      const result = await pool.query(
        'INSERT INTO users (username, email, name, nivelacesso, tipoplano, dataassinatura, dataexpiracao, origemassinatura, isactive, criadoem, atualizadoem, emailconfirmed) VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL \'1 year\', $6, true, NOW(), NOW(), true) RETURNING id',
        [username, email, name || email.split('@')[0], 'premium', planName, 'hotmart']
      );
      
      userId = result.rows[0].id;
      console.log(`✅ Novo usuário criado com ID: ${userId}`);
    }
    
    // Verificar se a assinatura já existe para este transaction_id
    if (transactionId) {
      const subscriptionResult = await pool.query(
        'SELECT * FROM subscriptions WHERE transaction_id = $1',
        [transactionId]
      );
      
      if (subscriptionResult.rows.length === 0) {
        // Criar nova assinatura
        await pool.query(
          'INSERT INTO subscriptions (user_id, plan_name, status, provider, transaction_id, start_date, end_date, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL \'1 year\', NOW(), NOW())',
          [userId, planName, 'active', 'hotmart', transactionId]
        );
        
        console.log(`✅ Nova assinatura criada para transação: ${transactionId}`);
      } else {
        console.log(`⚠️ Assinatura com transactionId ${transactionId} já existe`);
      }
    } else {
      console.log('⚠️ Nenhum transaction_id encontrado no webhook');
    }
    
    // Atualizar o status do webhook
    await pool.query(
      'UPDATE webhook_logs SET status = $1, updated_at = NOW() WHERE id = $2',
      ['processed', webhook.id]
    );
    
    console.log(`✅ Webhook ${webhook.id} processado com sucesso!`);
    pool.end();
    return true;
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${webhook.id}:`, error);
    
    // Marcar webhook como erro
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      await pool.query(
        'UPDATE webhook_logs SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        ['error', error.message, webhook.id]
      );
      
      pool.end();
    } catch (dbError) {
      console.error('❌ Erro ao atualizar status do webhook:', dbError);
    }
    
    return false;
  }
}

// Função principal para processar todos os webhooks pendentes
async function processPendingWebhooks() {
  try {
    console.log('🔍 Buscando webhooks pendentes...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Buscar todos os webhooks com status 'received'
    const result = await pool.query(
      "SELECT * FROM webhook_logs WHERE status = 'received' AND source = 'hotmart' ORDER BY created_at ASC"
    );
    
    console.log(`🔍 Encontrados ${result.rows.length} webhooks pendentes`);
    
    if (result.rows.length === 0) {
      console.log('✅ Nenhum webhook pendente para processar.');
      pool.end();
      return;
    }
    
    // Processar cada webhook
    let sucessCount = 0;
    let errorCount = 0;
    
    for (const webhook of result.rows) {
      const success = await processWebhook(webhook);
      if (success) {
        sucessCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log(`
📊 Resumo do processamento:
✅ ${sucessCount} webhooks processados com sucesso
❌ ${errorCount} webhooks com erros
🔄 Total: ${result.rows.length} webhooks
    `);
    
    pool.end();
  } catch (error) {
    console.error('❌ Erro ao processar webhooks pendentes:', error);
  }
}

// Executar processamento
processPendingWebhooks().then(() => {
  console.log('🏁 Processamento de webhooks pendentes concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro durante o processamento de webhooks:', error);
  process.exit(1);
});