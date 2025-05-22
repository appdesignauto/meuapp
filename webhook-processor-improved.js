/**
 * Processador de webhooks da Hotmart melhorado
 * Implementa as melhores práticas para validação e mapeamento de dados
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function getDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  return client;
}

/**
 * Validação correta do Webhook
 * Verifica tanto o event quanto o status da compra
 */
function isValidWebhook(payload) {
  return payload?.event === 'PURCHASE_APPROVED' && 
         payload?.data?.purchase?.status === 'APPROVED';
}

/**
 * Extração correta dos dados do webhook da Hotmart
 * Mapeia os dados exatamente como a Hotmart envia
 */
function extractWebhookData(payload) {
  const buyer = payload.data.buyer;
  const purchase = payload.data.purchase;
  const subscription = payload.data.subscription;

  const full_name = buyer?.name;
  const email = buyer?.email?.toLowerCase().trim();
  const phone = buyer?.document;

  // Mapeia o nome do plano para nosso sistema
  let planType = subscription?.plan?.name?.toLowerCase();
  if (planType?.includes('anual') || planType?.includes('annual')) {
    planType = 'anual';
  } else if (planType?.includes('mensal') || planType?.includes('monthly')) {
    planType = 'mensal';
  } else {
    planType = 'premium'; // fallback
  }

  const startDate = new Date(purchase?.order_date);
  const endDate = new Date(purchase?.date_next_charge);

  const transactionId = purchase?.transaction;
  const event = payload.event;
  const origin = "hotmart";

  return {
    full_name,
    email,
    phone,
    planType,
    startDate,
    endDate,
    transactionId,
    event,
    origin,
    payload
  };
}

/**
 * Cria ou atualiza usuário com os dados corretos
 */
async function createOrUpdateUser(client, data) {
  const { full_name, email, phone, planType, startDate, endDate, origin } = data;

  // Verifica se usuário já existe
  const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  let userId;

  if (existingUser.rowCount === 0) {
    // Cria novo usuário
    const insertUser = await client.query(`
      INSERT INTO users (
        name, email, phone, nivelacesso, origemassinatura,
        tipoplano, dataassinatura, dataexpiracao, acessovitalicio, isactive
      ) VALUES (
        $1, $2, $3, 'premium', $4,
        $5, $6, $7, false, true
      ) RETURNING id
    `, [full_name, email, phone, origin, planType, startDate, endDate]);

    userId = insertUser.rows[0].id;
    console.log(`✅ Novo usuário criado: ${full_name} (ID: ${userId})`);
  } else {
    // Atualiza usuário existente
    userId = existingUser.rows[0].id;

    await client.query(`
      UPDATE users SET
        nivelacesso = 'premium',
        origemassinatura = $1,
        tipoplano = $2,
        dataassinatura = $3,
        dataexpiracao = $4,
        acessovitalicio = false
      WHERE id = $5
    `, [origin, planType, startDate, endDate, userId]);

    console.log(`🔄 Usuário atualizado: ${full_name} (ID: ${userId})`);
  }

  return userId;
}

/**
 * Cria assinatura na tabela subscriptions
 */
async function createSubscription(client, userId, data) {
  const { planType, startDate, endDate, transactionId, event, payload } = data;

  await client.query(`
    INSERT INTO subscriptions (
      "userId", "planType", status, "startDate", "endDate",
      origin, transactionid, lastevent, "webhookData"
    ) VALUES (
      $1, $2, 'active', $3, $4,
      'hotmart', $5, $6, $7
    )
  `, [
    userId, planType, startDate, endDate,
    transactionId, event, JSON.stringify(payload)
  ]);

  console.log(`✅ Assinatura criada para usuário ${userId}: ${planType} até ${endDate.toISOString().split('T')[0]}`);
}

/**
 * Processa um webhook específico pelo ID
 */
async function processWebhookById(webhookId) {
  const client = await getDatabase();
  
  try {
    console.log(`🔄 Processando webhook ID: ${webhookId}`);

    // Busca o webhook
    const webhookResult = await client.query(
      'SELECT * FROM webhook_logs WHERE id = $1',
      [webhookId]
    );

    if (webhookResult.rowCount === 0) {
      throw new Error(`Webhook ${webhookId} não encontrado`);
    }

    const webhook = webhookResult.rows[0];
    let payload;

    try {
      // Tenta fazer parse do payload
      if (typeof webhook.payload === 'string') {
        // Se for string, pode estar double-encoded
        let parsedOnce = JSON.parse(webhook.payload);
        if (typeof parsedOnce === 'string') {
          payload = JSON.parse(parsedOnce);
        } else {
          payload = parsedOnce;
        }
      } else {
        payload = webhook.payload;
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do payload:', parseError);
      throw new Error('Payload inválido');
    }

    // Validação melhorada
    if (!isValidWebhook(payload)) {
      console.log(`⚠️ Webhook ${webhookId} não é válido (event: ${payload?.event}, status: ${payload?.data?.purchase?.status})`);
      await client.query(
        'UPDATE webhook_logs SET status = $1 WHERE id = $2',
        ['invalid', webhookId]
      );
      return { success: false, reason: 'Webhook inválido' };
    }

    // Extrai dados melhorados
    const data = extractWebhookData(payload);
    
    if (!data.email) {
      throw new Error('Email não encontrado no payload');
    }

    console.log(`📋 Dados extraídos: Nome=${data.full_name}, Email=${data.email}, Plano=${data.planType}, Transação=${data.transactionId}`);

    // Cria ou atualiza usuário
    const userId = await createOrUpdateUser(client, data);

    // Cria assinatura
    await createSubscription(client, userId, data);

    // Atualiza status do webhook
    await client.query(
      'UPDATE webhook_logs SET status = $1 WHERE id = $2',
      ['processed', webhookId]
    );

    console.log(`✅ Webhook ${webhookId} processado com sucesso!`);
    return { success: true, userId };

  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${webhookId}:`, error);
    
    // Marca webhook como erro
    await client.query(
      'UPDATE webhook_logs SET status = $1 WHERE id = $2',
      ['error', webhookId]
    );

    return { success: false, error: error.message };
  } finally {
    await client.end();
  }
}

/**
 * Processa todos os webhooks pendentes
 */
async function processPendingWebhooks() {
  const client = await getDatabase();
  
  try {
    console.log('🔍 Buscando webhooks pendentes...');
    
    const result = await client.query(
      "SELECT id FROM webhook_logs WHERE status = 'received' ORDER BY id ASC"
    );

    console.log(`🔍 Encontrados ${result.rowCount} webhooks pendentes`);

    let processed = 0;
    let failed = 0;

    for (const row of result.rows) {
      const webhookResult = await processWebhookById(row.id);
      if (webhookResult.success) {
        processed++;
      } else {
        failed++;
      }
    }

    console.log(`✅ Processamento finalizado: ${processed} sucessos, ${failed} falhas`);
    return { success: true, processed, failed };

  } catch (error) {
    console.error('❌ Erro no processamento em lote:', error);
    return { success: false, error: error.message };
  } finally {
    await client.end();
  }
}

// Exporta as funções
export { processWebhookById, processPendingWebhooks, isValidWebhook, extractWebhookData };

// Se executado diretamente, processa webhooks pendentes
if (import.meta.url === `file://${process.argv[1]}`) {
  processPendingWebhooks().then(result => {
    console.log('Resultado:', result);
    process.exit(result.success ? 0 : 1);
  });
}