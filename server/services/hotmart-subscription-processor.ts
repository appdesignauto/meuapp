/**
 * hotmart-subscription-processor.ts
 * 
 * Processador de assinaturas a partir dos webhooks da Hotmart
 * Responsável por atualizar usuários e registrar assinaturas no sistema
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Processa um webhook de pagamento/assinatura da Hotmart
 * 
 * @param payload Dados do webhook completo
 * @returns Promise que resolve quando o processamento for concluído
 */
export async function processHotmartSubscription(payload: any): Promise<void> {
  try {
    // Verifica se é um evento de pagamento válido
    const isValidPurchase = 
      payload?.event === 'PURCHASE_APPROVED' &&
      payload?.data?.purchase?.status === 'APPROVED';

    if (!isValidPurchase) {
      console.log('[HotmartProcessor] Ignorando evento que não é PURCHASE_APPROVED com status APPROVED');
      return;
    }

    const buyer = payload.data.buyer;
    const purchase = payload.data.purchase;
    const subscription = payload.data.subscription;

    const full_name = buyer?.name;
    const email = buyer?.email;
    const phone = buyer?.document || null;

    const planType = subscription?.plan?.name?.toLowerCase() || 'mensal';
    const startDate = new Date(purchase.order_date);
    const endDate = new Date(purchase.date_next_charge);
    const transactionId = purchase.transaction;
    const paymentMethod = purchase.payment?.type;
    const price = purchase.price?.value;
    const currency = purchase.price?.currency_value;
    const subscriptionCode = subscription?.subscriber?.code;
    const planId = subscription?.plan?.id;
    const event = payload.event;

    console.log(`[HotmartProcessor] Processando assinatura para ${email} - Plano: ${planType}`);

    // Verifica se a transação já existe para evitar duplicidade
    const existingTransaction = await pool.query(
      'SELECT id FROM subscriptions WHERE transactionid = $1', 
      [transactionId]
    );

    if (existingTransaction && existingTransaction.rowCount && existingTransaction.rowCount > 0) {
      console.log(`[HotmartProcessor] Transação ${transactionId} já registrada, ignorando`);
      return;
    }

    // Verifica se o usuário já existe
    const userQuery = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;

    if (userQuery.rowCount === 0) {
      // Criar novo usuário
      console.log(`[HotmartProcessor] Criando novo usuário para ${email}`);
      
      // Gerar username único a partir do email
      const username = email.split('@')[0];
      
      const insertUser = await pool.query(`
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

      userId = insertUser.rows[0].id;
      console.log(`[HotmartProcessor] Usuário criado com ID: ${userId}`);
    } else {
      // Atualizar usuário existente
      userId = userQuery.rows[0].id;
      console.log(`[HotmartProcessor] Atualizando usuário existente ID ${userId}`);

      await pool.query(`
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
    await pool.query(`
      INSERT INTO subscriptions (
        "userId", "planType", status, "startDate", "endDate", origin,
        transactionid, lastevent, "webhookData", "subscriptionCode",
        "planId", "paymentMethod", price, currency, "createdAt", "updatedAt"
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

    console.log(`[HotmartProcessor] Assinatura processada com sucesso para usuário ${userId}`);
  } catch (error) {
    console.error('[HotmartProcessor] Erro ao processar assinatura:', error);
    // Não relançamos o erro para não quebrar o fluxo
  }
}

export default {
  processHotmartSubscription
};