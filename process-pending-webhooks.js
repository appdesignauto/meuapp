/**
 * Script para processar webhooks pendentes da Hotmart
 * Este script processa todos os webhooks da Hotmart com status 'received'
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

// Função para encontrar email em qualquer parte do payload da Hotmart
function findEmailInPayload(payload) {
  if (!payload) return null;
  
  // Função recursiva para buscar emails em objetos aninhados
  function searchEmail(obj) {
    // Caso base: é uma string e parece um email
    if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
      return obj;
    }
    
    // Caso recursivo: objeto
    if (typeof obj === 'object' && obj !== null) {
      // Verificar chaves que provavelmente contêm email
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
    
    // Caso recursivo: array
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

// Função para processar um webhook
async function processWebhook(webhook) {
  console.log(`🔄 Processando webhook ID ${webhook.id}, Transação: ${webhook.transaction_id}`);
  
  const client = await pool.connect();
  
  try {
    // Início da transação para garantir integridade dos dados
    await client.query('BEGIN');
    
    // Parse do payload (tratando para diferentes formatos)
    let payload;
    if (typeof webhook.raw_payload === 'object') {
      // Se já é um objeto, usá-lo diretamente
      payload = webhook.raw_payload;
    } else {
      try {
        // Tentar fazer o parse do JSON
        payload = JSON.parse(webhook.raw_payload);
      } catch (e) {
        // Se falhar, pode ser que o payload seja uma string com aspas escapadas
        console.log('⚠️ Erro ao fazer parse do JSON, tentando remover aspas escapadas...');
        const cleanPayload = webhook.raw_payload.replace(/\\"/g, '"');
        payload = JSON.parse(cleanPayload);
      }
    }
    
    // Verifica se é um evento de pagamento válido
    const isValidPurchase = 
      payload?.event === 'PURCHASE_APPROVED' &&
      payload?.data?.purchase?.status === 'APPROVED';
    
    if (!isValidPurchase) {
      console.log('⚠️ Ignorando evento que não é PURCHASE_APPROVED com status APPROVED');
      await client.query('COMMIT');
      return;
    }
    
    const buyer = payload.data.buyer;
    const purchase = payload.data.purchase;
    const subscription = payload.data.subscription;
    
    // Validação e tratamento de campos obrigatórios
    if (!buyer?.email) {
      console.error('❌ Email do comprador não encontrado no payload');
      await client.query('COMMIT');
      return;
    }
    
    if (!purchase?.transaction) {
      console.error('❌ ID da transação não encontrado no payload');
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
    
    console.log(`📋 Processando assinatura para ${email} - Plano: ${planType}`);
    
    // Verifica se a transação já existe para evitar duplicidade
    const existingTransactionResult = await client.query(
      'SELECT id FROM subscriptions WHERE transactionid = $1', 
      [transactionId]
    );
    
    if (existingTransactionResult.rowCount > 0) {
      console.log(`⚠️ Transação ${transactionId} já registrada, ignorando`);
      await client.query('COMMIT');
      return;
    }
    
    // Verifica se o usuário já existe
    const userQueryResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;
    
    if (userQueryResult.rowCount === 0) {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário para ${email}`);
      
      // Gerar username único a partir do email
      const username = email.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
      
      // Gerar senha aleatória
      const randomPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const insertUserResult = await client.query(`
        INSERT INTO users (
          name, email, phone, username, password, nivelacesso, origemassinatura, 
          tipoplano, dataassinatura, dataexpiracao, acessovitalicio, 
          isactive, hotmartid, criadoem, atualizadoem, emailconfirmed, role
        )
        VALUES (
          $1, $2, $3, $4, $5, 'premium', 'hotmart',
          $6, $7, $8, false,
          true, $9, NOW(), NOW(), true, 'user'
        )
        RETURNING id
      `, [
        full_name, 
        email, 
        phone, 
        username,
        hashedPassword,
        planType, 
        startDate, 
        endDate, 
        subscriptionCode
      ]);
      
      if (insertUserResult.rows.length === 0) {
        throw new Error(`Falha ao criar usuário para ${email}`);
      }
      
      userId = insertUserResult.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
    } else {
      // Atualizar usuário existente
      userId = userQueryResult.rows[0].id;
      console.log(`✏️ Atualizando usuário existente ID ${userId}`);
      
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
    console.log(`📝 Registrando nova assinatura para usuário ${userId}`);
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
    
    // Atualizar status do webhook
    await client.query(`
      UPDATE webhook_logs 
      SET status = 'processed', error_message = NULL
      WHERE id = $1
    `, [webhook.id]);
    
    // Commit da transação
    await client.query('COMMIT');
    console.log(`✅ Assinatura processada com sucesso para usuário ${userId}`);
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    console.error('❌ Erro ao processar webhook:', error);
    
    // Atualizar status do webhook com erro
    try {
      await client.query(`
        UPDATE webhook_logs 
        SET status = 'error', error_message = $1
        WHERE id = $2
      `, [error.message, webhook.id]);
    } catch (updateError) {
      console.error('❌ Erro ao atualizar status do webhook:', updateError);
    }
  } finally {
    client.release();
  }
}

// Função principal
async function processPendingWebhooks() {
  console.log('🔍 Buscando webhooks pendentes para processar...');
  
  try {
    // Buscar webhooks com status 'received'
    const result = await pool.query(`
      SELECT * FROM webhook_logs 
      WHERE status = 'received' AND source = 'hotmart' AND event_type = 'PURCHASE_APPROVED'
      ORDER BY created_at DESC
    `);
    
    console.log(`🔢 Encontrados ${result.rows.length} webhooks pendentes.`);
    
    // Processar cada webhook
    for (const webhook of result.rows) {
      await processWebhook(webhook);
    }
    
    console.log('✅ Processamento de webhooks pendentes concluído.');
  } catch (error) {
    console.error('❌ Erro durante o processamento de webhooks:', error);
  } finally {
    // Fechar a pool de conexões
    await pool.end();
  }
}

// Executar o script
processPendingWebhooks();