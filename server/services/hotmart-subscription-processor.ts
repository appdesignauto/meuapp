/**
 * hotmart-subscription-processor.ts
 * 
 * Processador de assinaturas a partir dos webhooks da Hotmart
 * Responsável por atualizar usuários e registrar assinaturas no sistema
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Cria apenas uma instância do pool para reutilização entre chamadas
// Isso evita o overhead de criar e destruir conexões em cada chamada
let dbPool: Pool | null = null;

function getPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Limita o número máximo de conexões
      idleTimeoutMillis: 30000, // Fecha conexões ociosas após 30 segundos
      connectionTimeoutMillis: 5000 // Timeout para obter uma conexão
    });
    
    // Log quando o pool for criado pela primeira vez
    console.log('[HotmartProcessor] Criando pool de conexões de banco de dados');
  }
  return dbPool;
}

/**
 * Processa um webhook de pagamento/assinatura da Hotmart
 * 
 * @param payload Dados do webhook completo
 * @returns Promise que resolve quando o processamento for concluído
 */
export async function processHotmartSubscription(payload: any): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Início da transação para garantir integridade dos dados
    await client.query('BEGIN');
    
    // Verifica se é um evento de pagamento válido
    const isValidPurchase = 
      payload?.event === 'PURCHASE_APPROVED' &&
      payload?.data?.purchase?.status === 'APPROVED';

    if (!isValidPurchase) {
      console.log('[HotmartProcessor] Ignorando evento que não é PURCHASE_APPROVED com status APPROVED');
      await client.query('COMMIT');
      return;
    }

    const buyer = payload.data.buyer;
    const purchase = payload.data.purchase;
    const subscription = payload.data.subscription;

    // Validação e tratamento de campos obrigatórios
    if (!buyer?.email) {
      console.error('[HotmartProcessor] Email do comprador não encontrado no payload');
      await client.query('COMMIT');
      return;
    }

    if (!purchase?.transaction) {
      console.error('[HotmartProcessor] ID da transação não encontrado no payload');
      await client.query('COMMIT');
      return;
    }

    const full_name = buyer?.name || 'Cliente Hotmart';
    const email = buyer?.email;
    const phone = buyer?.document || null;

    const planType = subscription?.plan?.name?.toLowerCase() || 'mensal';
    const startDate = new Date(purchase.order_date || Date.now());
    const endDate = new Date(purchase.date_next_charge || Date.now() + 30*24*60*60*1000); // Default +30 dias
    const transactionId = purchase.transaction;
    const paymentMethod = purchase.payment?.type || 'Unknown';
    const price = purchase.price?.value || 0;
    const currency = purchase.price?.currency_value || 'BRL';
    const subscriptionCode = subscription?.subscriber?.code || transactionId;
    const planId = subscription?.plan?.id || 0;
    const event = payload.event;

    console.log(`[HotmartProcessor] Processando assinatura para ${email} - Plano: ${planType}`);

    // Verifica se a transação já existe para evitar duplicidade
    const existingTransactionResult = await client.query(
      'SELECT id FROM subscriptions WHERE transactionid = $1', 
      [transactionId]
    );

    if (existingTransactionResult.rowCount > 0) {
      console.log(`[HotmartProcessor] Transação ${transactionId} já registrada, ignorando`);
      await client.query('COMMIT');
      return;
    }

    // Verifica se o usuário já existe
    const userQueryResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;

    if (userQueryResult.rowCount === 0) {
      // Criar novo usuário
      console.log(`[HotmartProcessor] Criando novo usuário para ${email}`);
      
      // Gerar username único a partir do email com timestamp para evitar colisões
      const timestamp = Date.now().toString().slice(-6);
      const username = `${email.split('@')[0]}_${timestamp}`;
      
      const insertUserResult = await client.query(`
        INSERT INTO users (
          name, email, phone, username, nivelacesso, origemassinatura, 
          tipoplano, dataassinatura, dataexpiracao, acessovitalicio, 
          isactive, hotmartid, criadoem, atualizadoem
        )
        VALUES (
          $1, $2, $3, $4, 'premium', 'hotmart',
          $5, $6, $7, false,
          true, $8, NOW(), NOW()
        )
        RETURNING id
      `, [
        full_name, 
        email, 
        phone, 
        username,
        planType, 
        startDate, 
        endDate, 
        subscriptionCode
      ]);

      if (insertUserResult.rows.length === 0) {
        throw new Error(`Falha ao criar usuário para ${email}`);
      }

      userId = insertUserResult.rows[0].id;
      console.log(`[HotmartProcessor] Usuário criado com ID: ${userId}`);
    } else {
      // Atualizar usuário existente
      userId = userQueryResult.rows[0].id;
      console.log(`[HotmartProcessor] Atualizando usuário existente ID ${userId}`);

      await client.query(`
        UPDATE users SET
          nivelacesso = 'premium',
          origemassinatura = 'hotmart',
          tipoplano = $1,
          dataassinatura = $2,
          dataexpiracao = $3,
          acessovitalicio = false,
          hotmartid = $4,
          atualizadoem = NOW()
        WHERE id = $5
      `, [planType, startDate, endDate, subscriptionCode, userId]);
    }

    // Registrar nova assinatura
    console.log(`[HotmartProcessor] Registrando nova assinatura para usuário ${userId}`);
    await client.query(`
      INSERT INTO subscriptions (
        "userId", "planType", status, "startDate", "endDate", origin,
        transactionid, lastevent, "webhookData", subscriptioncode,
        planid, paymentmethod, price, currency, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, 'active', $3, $4, 'hotmart',
        $5, $6, $7, $8,
        $9, $10, $11, $12, NOW(), NOW()
      )
    `, [
      userId, 
      planType, 
      startDate, 
      endDate,
      transactionId, 
      event, 
      JSON.stringify(payload), 
      subscriptionCode,
      planId, 
      paymentMethod, 
      price, 
      currency
    ]);

    // Commit da transação
    await client.query('COMMIT');
    console.log(`[HotmartProcessor] Assinatura processada com sucesso para usuário ${userId}`);
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    console.error('[HotmartProcessor] Erro ao processar assinatura:', error);
    throw error; // Propagar o erro para registrar no log de webhooks
  } finally {
    // Sempre libera o cliente de volta para o pool
    client.release();
  }
}

export default {
  processHotmartSubscription
};