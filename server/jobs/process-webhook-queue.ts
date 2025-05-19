/**
 * Processador da fila de webhooks da Hotmart
 * 
 * Este script processa webhooks pendentes na fila, atualizando assinaturas
 * e realizando outras ações conforme o tipo de evento recebido
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env') });

// Tipos de eventos da Hotmart
enum HotmartEventType {
  PURCHASE_APPROVED = 'PURCHASE_APPROVED',
  PURCHASE_COMPLETE = 'PURCHASE_COMPLETE',
  PURCHASE_CANCELED = 'PURCHASE_CANCELED',
  PURCHASE_REFUNDED = 'PURCHASE_REFUNDED',
  PURCHASE_CHARGEBACK = 'PURCHASE_CHARGEBACK',
  PURCHASE_DELAYED = 'PURCHASE_DELAYED',
  SUBSCRIPTION_CANCELLATION = 'SUBSCRIPTION_CANCELLATION',
  SUBSCRIPTION_REACTIVATION = 'SUBSCRIPTION_REACTIVATION',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
  DISPUTE_CLOSED = 'DISPUTE_CLOSED',
  TEST_EVENT = 'TEST_EVENT'
}

// Interface para os dados processados
interface ProcessedWebhook {
  id: number;
  eventType: string;
  transactionCode: string;
  status: 'processed' | 'error';
  details?: string;
}

// Função principal que processa a fila de webhooks
export async function processWebhookQueue(): Promise<{ 
  processed: number; 
  errors: number; 
  details: ProcessedWebhook[] 
}> {
  // Conectar ao banco de dados
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  // Resultados do processamento
  const results: ProcessedWebhook[] = [];
  let processedCount = 0;
  let errorCount = 0;
  
  try {
    // 1. Buscar webhooks pendentes na fila
    const pendingWebhooks = await pool.query(
      `SELECT id, event_type, transaction_code, raw_data 
       FROM webhook_queue 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT 50`
    );
    
    // Se não houver webhooks pendentes, retornar
    if (pendingWebhooks.rows.length === 0) {
      return { processed: 0, errors: 0, details: [] };
    }
    
    // 2. Processar cada webhook
    for (const webhook of pendingWebhooks.rows) {
      try {
        // Parsear os dados do webhook
        const webhookData = JSON.parse(webhook.raw_data);
        
        // Processar o webhook com base no tipo de evento
        await processWebhookByEventType(pool, webhook.event_type, webhookData);
        
        // Atualizar status do webhook para processado
        await pool.query(
          `UPDATE webhook_queue 
           SET status = 'processed', processed_at = NOW(), 
               process_details = $1
           WHERE id = $2`,
          [JSON.stringify({ success: true, message: 'Processado com sucesso' }), webhook.id]
        );
        
        // Adicionar ao resultado
        results.push({
          id: webhook.id,
          eventType: webhook.event_type,
          transactionCode: webhook.transaction_code,
          status: 'processed'
        });
        
        processedCount++;
      } catch (error) {
        // Em caso de erro, marcar o webhook com erro e continuar com os próximos
        await pool.query(
          `UPDATE webhook_queue 
           SET status = 'error', processed_at = NOW(), 
               process_details = $1
           WHERE id = $2`,
          [JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            stack: error instanceof Error ? error.stack : undefined
          }), webhook.id]
        );
        
        // Adicionar ao resultado
        results.push({
          id: webhook.id,
          eventType: webhook.event_type,
          transactionCode: webhook.transaction_code,
          status: 'error',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        
        errorCount++;
      }
    }
    
    return {
      processed: processedCount,
      errors: errorCount,
      details: results
    };
  } catch (error) {
    console.error('Erro ao processar fila de webhooks:', error);
    throw error;
  } finally {
    // Fechar a conexão com o banco
    await pool.end();
  }
}

// Função para processar webhook com base no tipo de evento
async function processWebhookByEventType(
  pool: Pool,
  eventType: string,
  webhookData: any
): Promise<void> {
  // Extrair informações importantes do webhook
  const purchase = webhookData.data?.purchase || {};
  const buyer = webhookData.data?.buyer || {};
  const product = webhookData.data?.product || {};
  
  // Email do comprador (chave para identificar o usuário)
  const buyerEmail = buyer.email;
  if (!buyerEmail) {
    throw new Error('Email do comprador não encontrado no webhook');
  }
  
  // Código da transação
  const transactionCode = purchase.transaction || purchase.transaction_code;
  if (!transactionCode) {
    throw new Error('Código da transação não encontrado no webhook');
  }
  
  // ID do produto
  const productId = product.id;
  
  // Nome do produto (plano)
  const productName = product.name;
  
  // Objeto com dados essenciais para atualização de assinatura
  const subscriptionData = {
    transactionCode,
    productId,
    productName,
    buyerEmail,
    purchaseDate: new Date().toISOString(),
    expirationDate: null as string | null,
    status: 'active'
  };
  
  // Verificar se há informação de data de expiração (para assinaturas recorrentes)
  if (purchase.next_charge_date) {
    subscriptionData.expirationDate = purchase.next_charge_date;
  } else if (purchase.warranty_expire_date) {
    // Para produtos de pagamento único, usar a data de término da garantia como expiração
    subscriptionData.expirationDate = purchase.warranty_expire_date;
  }
  
  // Processar o evento com base no tipo
  switch (eventType) {
    case HotmartEventType.PURCHASE_APPROVED:
    case HotmartEventType.PURCHASE_COMPLETE:
      // Novas assinaturas/compras
      await createOrUpdateSubscription(pool, buyerEmail, {
        ...subscriptionData,
        status: 'active'
      });
      break;
      
    case HotmartEventType.PURCHASE_CANCELED:
    case HotmartEventType.PURCHASE_REFUNDED:
    case HotmartEventType.PURCHASE_CHARGEBACK:
    case HotmartEventType.SUBSCRIPTION_CANCELLATION:
      // Cancelamentos, reembolsos, chargebacks
      await createOrUpdateSubscription(pool, buyerEmail, {
        ...subscriptionData,
        status: 'inactive'
      });
      break;
      
    case HotmartEventType.SUBSCRIPTION_REACTIVATION:
      // Reativações de assinatura
      await createOrUpdateSubscription(pool, buyerEmail, {
        ...subscriptionData,
        status: 'active'
      });
      break;
      
    case HotmartEventType.TEST_EVENT:
      // Eventos de teste - não fazer nada no banco, apenas registrar
      console.log('Evento de teste recebido:', transactionCode);
      break;
      
    default:
      // Eventos desconhecidos - registrar, mas não processar
      console.log(`Evento desconhecido recebido: ${eventType}, Transação: ${transactionCode}`);
      break;
  }
  
  // Registrar dados de processamento para análise
  await pool.query(
    `INSERT INTO webhook_processing_log (
      event_type, transaction_code, buyer_email, processing_date, details
    ) VALUES ($1, $2, $3, NOW(), $4)
    ON CONFLICT (transaction_code) 
    DO UPDATE SET
      event_type = $1,
      buyer_email = $3,
      processing_date = NOW(),
      details = $4`,
    [eventType, transactionCode, buyerEmail, JSON.stringify(webhookData)]
  ).catch(error => {
    // Se a tabela de log não existir, isso não deve impedir o processamento principal
    console.warn('Não foi possível registrar no log de processamento:', error.message);
  });
}

// Função para criar ou atualizar assinaturas com base nos dados do webhook
async function createOrUpdateSubscription(
  pool: Pool,
  email: string,
  subscriptionData: {
    transactionCode: string;
    productId: string;
    productName: string;
    purchaseDate: string;
    expirationDate: string | null;
    status: string;
  }
): Promise<void> {
  // 1. Verificar se o usuário existe
  const userResult = await pool.query(
    'SELECT id, nivelacesso FROM users WHERE email = $1',
    [email]
  );
  
  if (userResult.rows.length === 0) {
    throw new Error(`Usuário com e-mail ${email} não encontrado no sistema`);
  }
  
  const user = userResult.rows[0];
  const userId = user.id;
  
  // Determinar o tipo de plano com base no nome do produto
  let tipoplano = 'PRO';
  if (subscriptionData.productName) {
    const productNameLower = subscriptionData.productName.toLowerCase();
    if (productNameLower.includes('premium')) {
      tipoplano = 'PREMIUM';
    } else if (productNameLower.includes('basic')) {
      tipoplano = 'BASIC';
    }
  }
  
  // Determinar o nível de acesso com base no status
  const nivelacesso = subscriptionData.status === 'active' ? 'premium' : 'free';
  
  // 2. Atualizar os dados de assinatura do usuário
  await pool.query(
    `UPDATE users 
     SET 
       nivelacesso = $1,
       origemassinatura = 'Hotmart',
       tipoplano = $2,
       dataassinatura = $3,
       dataexpiracao = $4,
       acessovitalicio = $5,
       atualizadoem = NOW()
     WHERE id = $6`,
    [
      nivelacesso,
      tipoplano,
      subscriptionData.purchaseDate ? new Date(subscriptionData.purchaseDate) : new Date(),
      subscriptionData.expirationDate ? new Date(subscriptionData.expirationDate) : null,
      false, // acessovitalicio
      userId
    ]
  );
  
  // 3. Registrar a transação na tabela de assinaturas (se existir)
  try {
    await pool.query(
      `INSERT INTO subscriptions (
        user_id, transaction_code, plan_type, origin, start_date, 
        expiration_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (user_id, transaction_code) 
      DO UPDATE SET
        plan_type = $3,
        expiration_date = $6,
        status = $7,
        updated_at = NOW()`,
      [
        userId,
        subscriptionData.transactionCode,
        tipoplano,
        'Hotmart',
        subscriptionData.purchaseDate ? new Date(subscriptionData.purchaseDate) : new Date(),
        subscriptionData.expirationDate ? new Date(subscriptionData.expirationDate) : null,
        subscriptionData.status
      ]
    );
  } catch (error) {
    // Se a tabela de assinaturas não existir, registrar o erro mas continuar
    console.warn('Não foi possível registrar na tabela de assinaturas:', error.message);
  }
  
  console.log(`Assinatura ${subscriptionData.status === 'active' ? 'ativada' : 'desativada'} para usuário ${email}`);
}

// Se for executado diretamente
if (require.main === module) {
  processWebhookQueue()
    .then(result => {
      console.log('Processamento concluído:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Erro ao processar fila:', error);
      process.exit(1);
    });
}