/**
 * webhook-hotmart-enhanced-subscription.ts
 * 
 * Versão aprimorada do processador de webhooks da Hotmart que:
 * 1. Responde rapidamente (< 200ms)
 * 2. Processa assinaturas/pagamentos
 * 3. Atualiza usuários e subscriptions
 * 4. Mantém logs detalhados
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Obter conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Criar router específico
const router = Router();

/**
 * Encontra e-mail em qualquer parte do payload recursivamente
 */
function findEmailInPayload(payload: any): string | null {
  if (!payload) return null;
  
  // Busca recursiva
  function searchEmail(obj: any): string | null {
    if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
      return obj;
    }
    
    if (typeof obj === 'object' && obj !== null) {
      // Verificar chaves comuns primeiro
      if (obj.email && typeof obj.email === 'string') return obj.email;
      if (obj.buyer && obj.buyer.email) return obj.buyer.email;
      if (obj.customer && obj.customer.email) return obj.customer.email;
      if (obj.data && obj.data.buyer && obj.data.buyer.email) return obj.data.buyer.email;
      
      // Buscar em todas as propriedades
      for (const key in obj) {
        const result = searchEmail(obj[key]);
        if (result) return result;
      }
    }
    
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const result = searchEmail(obj[i]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchEmail(payload);
}

/**
 * Encontra ID da transação
 */
function findTransactionId(payload: any): string | null {
  if (!payload) return null;
  
  // Verificar locais comuns primeiro
  if (payload.data?.purchase?.transaction) return payload.data.purchase.transaction;
  if (payload.data?.transaction) return payload.data.transaction;
  if (payload.transaction) return payload.transaction;
  
  // Busca recursiva para encontrar qualquer campo que pareça ser um ID de transação
  function searchTransactionId(obj: any): string | null {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const key in obj) {
      if (
        (key.toLowerCase().includes('transaction') || 
         key.toLowerCase().includes('order') || 
         key.toLowerCase().includes('pedido')) && 
        typeof obj[key] === 'string'
      ) {
        return obj[key];
      }
      
      if (typeof obj[key] === 'object') {
        const result = searchTransactionId(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchTransactionId(payload);
}

/**
 * Processa webhook de assinatura/pagamento
 * - Identificado pelo evento PURCHASE_APPROVED
 * - Cria/atualiza usuário
 * - Registra assinatura
 */
async function processSubscription(payload: any): Promise<void> {
  try {
    // Verificar se é um evento de pagamento/assinatura válido
    const isValidPurchase = 
      payload?.event === 'PURCHASE_APPROVED' &&
      payload?.data?.purchase?.status === 'APPROVED';

    if (!isValidPurchase) {
      console.log('[WEBHOOK] Ignorando evento que não é PURCHASE_APPROVED');
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

    console.log(`[WEBHOOK] Processando assinatura para ${email} - Plano: ${planType}`);

    // Verificar usuário existente
    const userQuery = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;

    if (userQuery.rowCount === 0) {
      // Criar novo usuário
      console.log(`[WEBHOOK] Criando novo usuário para ${email}`);
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
        email.split('@')[0], // Usar primeira parte do email como username
        planType, 
        startDate, 
        endDate, 
        subscriptionCode
      ]);

      userId = insertUser.rows[0].id;
    } else {
      // Atualizar usuário existente
      userId = userQuery.rows[0].id;
      console.log(`[WEBHOOK] Atualizando usuário existente ID ${userId}`);

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

    // Verificar se transação já foi processada para evitar duplicidade
    const existingTransaction = await pool.query(
      'SELECT id FROM subscriptions WHERE transactionid = $1', 
      [transactionId]
    );

    if (existingTransaction.rowCount && existingTransaction.rowCount > 0) {
      console.log(`[WEBHOOK] Transação ${transactionId} já registrada, ignorando`);
      return;
    }

    // Registrar nova assinatura
    console.log(`[WEBHOOK] Registrando nova assinatura para usuário ${userId}`);
    await pool.query(`
      INSERT INTO subscriptions (
        userId, planType, status, startDate, endDate, origin,
        transactionid, lastevent, webhookData, subscriptionCode,
        planId, paymentMethod, price, currency, createdAt, updatedAt
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

    console.log(`[WEBHOOK] Assinatura processada com sucesso para usuário ${userId}`);
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar assinatura:', error);
    // Não relançamos o erro para não quebrar o fluxo
  }
}

/**
 * Endpoint principal para receber webhooks da Hotmart
 */
router.post('/hotmart', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[WEBHOOK] Webhook Hotmart recebido: ${new Date().toISOString()}`);
  
  try {
    // Extrair dados básicos do payload para resposta rápida
    const payload = req.body;
    const event = payload?.event || 'UNKNOWN';
    const email = findEmailInPayload(payload);
    const transactionId = findTransactionId(payload);
    
    console.log(`[WEBHOOK] Dados extraídos: evento=${event}, email=${email || 'não encontrado'}, transactionId=${transactionId || 'não encontrado'}`);
    
    // Log no banco de dados
    await pool.query(
      `INSERT INTO webhook_logs 
        (event_type, status, email, source, raw_payload, transaction_id, source_ip, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event,
        'received',
        email || null,
        'hotmart',
        JSON.stringify(payload),
        transactionId || null,
        req.ip || null,
        new Date()
      ]
    );
    
    // Processar assinatura em segundo plano
    if (event === 'PURCHASE_APPROVED') {
      // Não aguardamos o processamento completo para garantir resposta rápida
      processSubscription(payload).catch(err => 
        console.error('[WEBHOOK] Erro ao processar assinatura em segundo plano:', err)
      );
    }
    
    // Calcular tempo de processamento
    const processingTime = Date.now() - startTime;
    console.log(`[WEBHOOK] Tempo de processamento: ${processingTime}ms`);
    
    // Responder rapidamente (evitar timeout)
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar webhook:', error);
    
    // Mesmo com erro, retornar 200 para evitar reenvios pela Hotmart
    return res.status(200).json({
      success: false,
      error: 'Erro interno ao processar webhook',
      message: 'Erro ao processar webhook, mas confirmamos o recebimento',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;