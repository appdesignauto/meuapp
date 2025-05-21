/**
 * Script de processamento direto para webhooks da Hotmart
 * Simplificado para garantir funcionamento na criação de usuários
 */

import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const { Pool } = pg;

dotenv.config();

// Função para processar diretamente o webhook da Hotmart
// Esta função deve ser chamada manualmente para testar o processamento
async function processWebhook(transactionId = 'HP1725562240') {
  console.log('📋 Iniciando processamento direto do webhook Hotmart...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Buscar webhook no banco de dados
    const webhookResult = await pool.query(
      `SELECT * FROM webhook_logs 
       WHERE transaction_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [transactionId]
    );
    
    if (webhookResult.rows.length === 0) {
      console.log(`❌ Webhook com ID ${transactionId} não encontrado`);
      return;
    }
    
    const webhook = webhookResult.rows[0];
    console.log(`✅ Webhook encontrado: ${webhook.id}`);
    
    // Extrair dados do webhook - usando os dados já presentes
    // O raw_payload já está em formato JSON string, não precisamos parsear novamente
    let payload;
    try {
      // Se for um objeto, apenas use
      if (typeof webhook.raw_payload === 'object') {
        payload = webhook.raw_payload;
      } else {
        // Se for string, tente parsear
        payload = JSON.parse(webhook.raw_payload);
      }
    } catch (error) {
      console.log('⚠️ Erro ao fazer parse do JSON, tentando remover aspas escapadas...');
      try {
        // Tenta remover aspas escapadas
        const cleanPayload = webhook.raw_payload.replace(/\\"/g, '"');
        payload = JSON.parse(cleanPayload);
      } catch (innerError) {
        console.log('⚠️ Ainda não conseguiu, usando os campos individuais...');
        // Em último caso, usar diretamente os campos
        payload = {
          event: webhook.event_type,
          data: {
            buyer: {
              email: webhook.email
            },
            purchase: {
              transaction: webhook.transaction_id
            }
          }
        };
      }
    }
    
    const email = webhook.email;
    
    // Verificar os dados mínimos necessários
    if (!email) {
      console.log('❌ Email não encontrado no webhook');
      return;
    }
    
    // Extrair dados do comprador e da compra
    const buyer = payload.data?.buyer || {};
    const purchase = payload.data?.purchase || {};
    const subscription = payload.data?.subscription || {};
    
    const full_name = buyer.name || 'Cliente Hotmart';
    const phone = buyer.document || null;
    const planType = subscription?.plan?.name?.toLowerCase() || 'mensal';
    const startDate = purchase.order_date ? new Date(purchase.order_date) : new Date();
    const endDate = purchase.date_next_charge ? new Date(purchase.date_next_charge) : new Date(Date.now() + 30*24*60*60*1000);
    const subscriptionCode = subscription?.subscriber?.code || transactionId;
    
    // Verificar se o usuário já existe
    console.log(`🔍 Verificando se o usuário ${email} já existe...`);
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    
    if (userResult.rows.length === 0) {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário para ${email}...`);
      
      // Gerar username único
      const username = email.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
      
      // Gerar senha aleatória
      const randomPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      try {
        const insertResult = await pool.query(`
          INSERT INTO users (
            username, password, email, name, phone, 
            role, nivelacesso, origemassinatura, tipoplano, 
            dataassinatura, dataexpiracao, acessovitalicio, 
            isactive, hotmartid, emailconfirmed,
            criadoem, atualizadoem
          ) VALUES (
            $1, $2, $3, $4, $5, 
            'user', 'premium', 'hotmart', $6, 
            $7, $8, false, 
            true, $9, true,
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
          throw new Error('Falha ao inserir novo usuário');
        }
        
        userId = insertResult.rows[0].id;
        console.log(`✅ Usuário criado com ID: ${userId}`);
      } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        console.error('Detalhes do erro:', error.message);
        if (error.stack) console.error(error.stack);
        throw error;
      }
    } else {
      // Atualizar usuário existente
      userId = userResult.rows[0].id;
      console.log(`✏️ Atualizando usuário existente com ID: ${userId}`);
      
      try {
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
        `, [
          planType,
          startDate,
          endDate,
          subscriptionCode,
          userId
        ]);
        
        console.log(`✅ Usuário atualizado com sucesso`);
      } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        throw error;
      }
    }
    
    // Registrar assinatura
    console.log(`📝 Registrando assinatura para usuário ${userId}...`);
    
    try {
      // Verificar se a assinatura já existe
      const existingSubscription = await pool.query(
        'SELECT id FROM subscriptions WHERE transactionid = $1',
        [transactionId]
      );
      
      if (existingSubscription.rows.length > 0) {
        console.log(`⚠️ Assinatura com transactionId ${transactionId} já existe`);
      } else {
        // Criar nova assinatura
        await pool.query(`
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
          payload.event || 'PURCHASE_APPROVED',
          JSON.stringify(payload),
          subscriptionCode,
          subscription?.plan?.id || '0',
          purchase.payment?.type || 'Unknown',
          purchase.price?.value || 0,
          purchase.price?.currency_value || 'BRL'
        ]);
        
        console.log(`✅ Assinatura registrada com sucesso`);
      }
      
      // Atualizar status do webhook
      await pool.query(`
        UPDATE webhook_logs 
        SET status = 'processed'
        WHERE id = $1
      `, [webhook.id]);
      
      console.log(`✅ Status do webhook atualizado para 'processed'`);
      
    } catch (error) {
      console.error('❌ Erro ao registrar assinatura:', error);
      
      // Atualizar status do webhook com erro
      await pool.query(`
        UPDATE webhook_logs 
        SET status = 'error', processed_at = NOW(), error_message = $1
        WHERE id = $2
      `, [error.message, webhook.id]);
      
      throw error;
    }
    
    console.log('✅ Processamento direto concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no processamento direto:', error);
  } finally {
    await pool.end();
  }
}

// Função para pegar o diretamente de linha de comando
const transactionId = process.argv[2] || 'HP1725562240';
processWebhook(transactionId)
  .then(() => console.log('Processamento finalizado'))
  .catch(err => console.error('Erro:', err));

export { processWebhook };