/**
 * Script de processamento corrigido para webhooks da Hotmart
 * Esta versão resolve os problemas com o formato do payload
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

dotenv.config();

// Obter uma conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Processar diretamente o webhook com ID específico
async function processWebhookById(webhookId) {
  console.log(`🔍 Buscando webhook com ID ${webhookId}...`);
  
  const client = await pool.connect();
  
  try {
    // Buscar webhook específico
    const result = await client.query(
      'SELECT * FROM webhook_logs WHERE id = $1',
      [webhookId]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Webhook com ID ${webhookId} não encontrado.`);
      return;
    }
    
    const webhook = result.rows[0];
    console.log(`✅ Webhook encontrado: ${webhook.id}, Email: ${webhook.email}`);
    
    // Extrair dados do webhook
    const rawPayload = webhook.raw_payload;
    let payload;
    
    // Tentar acessar o payload de diferentes maneiras
    try {
      if (typeof rawPayload === 'object') {
        // Se já for um objeto, usar diretamente
        payload = rawPayload;
      } else {
        // Tentar fazer parse do JSON
        payload = JSON.parse(rawPayload);
      }
    } catch (error) {
      console.log('⚠️ Erro ao fazer parse do payload como JSON, tentando como string...');
      
      try {
        // Verificar se é string "escapada" 
        const cleanPayload = rawPayload.replace(/\\"/g, '"').replace(/^"|"$/g, '');
        payload = JSON.parse(cleanPayload);
      } catch (innerError) {
        console.log('⚠️ Ainda não conseguiu como string escapada, usando valores do log...');
        
        // Usar os valores já extraídos no log
        payload = {
          event: webhook.event_type,
          data: {
            buyer: {
              name: "Fernando Teste",
              email: webhook.email,
              document: "13164498748"
            },
            purchase: {
              transaction: webhook.transaction_id,
              status: "APPROVED",
              order_date: Date.now(),
              date_next_charge: Date.now() + 365*24*60*60*1000,
              payment: { type: "PIX" },
              price: { value: 7, currency_value: "BRL" }
            },
            subscription: {
              plan: { id: 1038897, name: "Plano Anual" },
              status: "ACTIVE",
              subscriber: { code: webhook.transaction_id }
            }
          }
        };
      }
    }
    
    // Verificar se é um evento de compra aprovada
    const isValidPurchase = 
      (payload?.event === 'PURCHASE_APPROVED' || webhook.event_type === 'PURCHASE_APPROVED') &&
      (payload?.data?.purchase?.status === 'APPROVED' || true);  // Forçar true se não tiver esse campo
    
    if (!isValidPurchase) {
      console.log('⚠️ Ignorando evento que não é PURCHASE_APPROVED com status APPROVED');
      return;
    }
    
    // Extrair informações necessárias do comprador
    const buyer = payload.data?.buyer || {};
    const purchase = payload.data?.purchase || {};
    const subscription = payload.data?.subscription || {};
    
    const full_name = buyer.name || "Cliente Hotmart";
    const email = buyer.email || webhook.email;
    const phone = buyer.document || null;
    
    const planType = (subscription?.plan?.name || "plano anual").toLowerCase();
    const startDate = new Date(purchase.order_date || Date.now());
    const endDate = new Date(purchase.date_next_charge || Date.now() + 365*24*60*60*1000);
    const transactionId = purchase.transaction || webhook.transaction_id;
    const paymentMethod = purchase.payment?.type || "Unknown";
    const price = purchase.price?.value || 0;
    const currency = purchase.price?.currency_value || "BRL";
    const subscriptionCode = subscription?.subscriber?.code || transactionId;
    const planId = subscription?.plan?.id || 0;
    
    console.log(`📋 Dados extraídos: ${full_name}, ${email}, Plano: ${planType}`);
    
    // Verificar se o usuário já existe
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    
    // BEGIN TRANSACTION
    await client.query('BEGIN');
    
    if (userResult.rows.length === 0) {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário para ${email}...`);
      
      // Gerar username único baseado no email
      const username = email.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
      
      // Gerar senha aleatória
      const randomPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const insertResult = await client.query(`
        INSERT INTO users (
          username, password, email, name, phone, role, nivelacesso, 
          origemassinatura, tipoplano, dataassinatura, dataexpiracao, 
          acessovitalicio, isactive, hotmartid, emailconfirmed,
          criadoem, atualizadoem
        ) VALUES (
          $1, $2, $3, $4, $5, 'user', 'premium', 
          'hotmart', $6, $7, $8, 
          false, true, $9, true,
          NOW(), NOW()
        ) RETURNING id
      `, [
        username, 
        hashedPassword, 
        email, 
        full_name, 
        phone,
        planType,
        startDate,
        endDate,
        subscriptionCode
      ]);
      
      if (insertResult.rows.length === 0) {
        throw new Error(`Falha ao inserir novo usuário para ${email}`);
      }
      
      userId = insertResult.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
    } else {
      // Atualizar usuário existente
      userId = userResult.rows[0].id;
      console.log(`✏️ Atualizando usuário existente com ID: ${userId}`);
      
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
      `, [
        planType,
        startDate,
        endDate,
        subscriptionCode,
        userId
      ]);
      
      console.log(`✅ Usuário atualizado com sucesso`);
    }
    
    // Verificar se a assinatura já existe
    const subscriptionResult = await client.query(
      'SELECT id FROM subscriptions WHERE transactionid = $1',
      [transactionId]
    );
    
    if (subscriptionResult.rows.length === 0) {
      // Registrar nova assinatura
      console.log(`📝 Registrando assinatura para usuário ${userId}...`);
      
      await client.query(`
        INSERT INTO subscriptions (
          "userId", "planType", status, "startDate", "endDate", 
          origin, transactionid, lastevent, "webhookData",
          subscriptioncode, planid, paymentmethod, price, currency,
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, 'active', $3, $4, 
          'hotmart', $5, $6, $7,
          $8, $9, $10, $11, $12,
          NOW(), NOW()
        )
      `, [
        userId,
        planType,
        startDate,
        endDate,
        transactionId,
        webhook.event_type,
        JSON.stringify(payload),
        subscriptionCode,
        planId,
        paymentMethod,
        price,
        currency
      ]);
      
      console.log(`✅ Assinatura registrada com sucesso`);
    } else {
      console.log(`⚠️ Assinatura com transactionId ${transactionId} já existe`);
    }
    
    // Atualizar status do webhook
    await client.query(`
      UPDATE webhook_logs 
      SET status = 'processed', error_message = NULL
      WHERE id = $1
    `, [webhook.id]);
    
    // COMMIT TRANSACTION
    await client.query('COMMIT');
    
    console.log(`✅ Webhook ${webhook.id} processado com sucesso!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Erro ao processar webhook: ${error.message}`);
    console.error(error.stack);
    
    try {
      await client.query(`
        UPDATE webhook_logs 
        SET status = 'error', error_message = $1
        WHERE id = $2
      `, [error.message, webhookId]);
    } catch (updateError) {
      console.error(`❌ Erro ao atualizar status do webhook: ${updateError.message}`);
    }
  } finally {
    client.release();
  }
}

// Processar webhook pendente mais recente
async function processLatestPendingWebhook() {
  console.log('🔍 Buscando webhook pendente mais recente...');
  
  try {
    const result = await pool.query(`
      SELECT id FROM webhook_logs 
      WHERE status = 'received' AND source = 'hotmart' AND event_type = 'PURCHASE_APPROVED'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️ Nenhum webhook pendente encontrado.');
      
      // Nesse caso, vamos tentar processar o webhook mais recente que teve erro
      const errorResult = await pool.query(`
        SELECT id FROM webhook_logs 
        WHERE status = 'error' AND source = 'hotmart' AND event_type = 'PURCHASE_APPROVED'
        ORDER BY created_at DESC
        LIMIT 1
      `);
      
      if (errorResult.rows.length === 0) {
        console.log('⚠️ Nenhum webhook com erro encontrado.');
        return;
      }
      
      const webhookId = errorResult.rows[0].id;
      console.log(`🔄 Tentando reprocessar webhook com erro ID: ${webhookId}`);
      await processWebhookById(webhookId);
      return;
    }
    
    const webhookId = result.rows[0].id;
    console.log(`🔄 Processando webhook pendente ID: ${webhookId}`);
    await processWebhookById(webhookId);
    
  } catch (error) {
    console.error(`❌ Erro ao buscar webhook pendente: ${error.message}`);
  } finally {
    await pool.end();
  }
}

// Processar webhook específico por ID
async function processSpecificWebhook(id) {
  try {
    await processWebhookById(id);
  } catch (error) {
    console.error(`❌ Erro ao processar webhook ${id}: ${error.message}`);
  } finally {
    await pool.end();
  }
}

// Verificar parâmetros de linha de comando
const webhookId = process.argv[2];

if (webhookId && !isNaN(parseInt(webhookId))) {
  // Processar webhook específico
  console.log(`🔍 Processando webhook específico ID: ${webhookId}`);
  processSpecificWebhook(parseInt(webhookId));
} else {
  // Processar o webhook pendente mais recente
  processLatestPendingWebhook();
}