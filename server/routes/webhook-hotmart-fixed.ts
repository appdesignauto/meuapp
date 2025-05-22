/**
 * Rota fixa para webhook da Hotmart com implementação independente
 * que garante sempre uma resposta JSON válida, sem interferência
 * do middleware SPA ou outras configurações
 * 
 * Versão com processamento automático integrado que elimina a
 * necessidade do servidor standalone.
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { processPendingWebhooks } from '../../auto-webhook-processor.js';

// Criar router para a rota fixa
const router = Router();

// Função para encontrar email em qualquer parte do payload da Hotmart
function findEmailInPayload(payload: any): string | null {
  if (!payload) return null;
  
  // Função recursiva para buscar emails em objetos aninhados
  function searchEmail(obj: any): string | null {
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
      if (obj.data?.subscription?.subscriber?.email) return obj.data.subscription.subscriber.email;
      
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

// Função para encontrar ID da transação no payload
function findTransactionId(payload: any): string | null {
  if (!payload) return null;
  
  // Verificar locais comuns primeiro
  if (payload.data?.purchase?.transaction) return payload.data.purchase.transaction;
  if (payload.data?.transaction) return payload.data.transaction;
  if (payload.transaction) return payload.transaction;
  
  // Função recursiva para busca profunda
  function searchTransactionId(obj: any): string | null {
    if (!obj || typeof obj !== 'object') return null;
    
    // Procurar por chaves que possam conter o ID da transação
    for (const key in obj) {
      if (
        (key.toLowerCase().includes('transaction') || 
         key.toLowerCase().includes('order') || 
         key.toLowerCase().includes('pedido')) && 
        typeof obj[key] === 'string'
      ) {
        return obj[key];
      }
      
      // Buscar recursivamente
      if (typeof obj[key] === 'object') {
        const result = searchTransactionId(obj[key]);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return searchTransactionId(payload);
}

// Função para encontrar nome em qualquer parte do payload
function findNameInPayload(payload: any): string | null {
  if (!payload) return null;
  
  // Verificar locais comuns primeiro
  if (payload.data?.buyer?.name) return payload.data.buyer.name;
  if (payload.data?.customer?.name) return payload.data.customer.name;
  if (payload.data?.subscription?.subscriber?.name) return payload.data.subscription.subscriber.name;
  
  // Função recursiva para busca profunda
  function searchName(obj: any): string | null {
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
function findPlanInfo(payload: any): string {
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

/**
 * Validação correta do Webhook usando event + status
 */
function isValidWebhook(payload: any): boolean {
  return payload?.event === 'PURCHASE_APPROVED' && 
         payload?.data?.purchase?.status === 'APPROVED';
}

/**
 * Extração correta dos dados do webhook da Hotmart
 * Mapeia os dados exatamente como a Hotmart envia
 */
function extractWebhookData(payload: any) {
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

// Função para processar o webhook automaticamente com validação aprimorada
async function processWebhook(webhookId: number): Promise<boolean> {
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
    
    // Parse do payload - versão mais robusta para lidar com strings escapadas
    let payload;
    try {
      let rawData = webhook.raw_payload;
      
      // Se for string, tentar fazer parse múltiplas vezes se necessário
      if (typeof rawData === 'string') {
        // Primeira tentativa de parse
        rawData = JSON.parse(rawData);
        
        // Se ainda for string após o primeiro parse, tentar novamente
        while (typeof rawData === 'string') {
          rawData = JSON.parse(rawData);
        }
      }
      
      payload = rawData;
      console.log(`✅ Payload parseado com sucesso. Event: ${payload?.event}, Status: ${payload?.data?.purchase?.status}`);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do payload:', parseError);
      console.error('Raw payload problem:', webhook.raw_payload);
      await pool.end();
      return false;
    }

    // Validação melhorada
    if (!isValidWebhook(payload)) {
      console.log(`⚠️ Webhook ${webhookId} não é válido (event: ${payload?.event}, status: ${payload?.data?.purchase?.status})`);
      await pool.query(
        'UPDATE webhook_logs SET status = $1 WHERE id = $2',
        ['invalid', webhookId]
      );
      await pool.end();
      return false;
    }

    // Extrai dados com o mapeamento correto
    const data = extractWebhookData(payload);
    
    if (!data.email) {
      console.error('❌ Email não encontrado no payload');
      await pool.end();
      return false;
    }
    
    console.log(`📋 Dados extraídos: Nome=${data.full_name}, Email=${data.email}, Transação=${data.transactionId}`);
    
    // Verificar se o usuário já existe
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );
    
    let userId;
    
    if (userResult.rows.length > 0) {
      // Atualizar usuário existente
      userId = userResult.rows[0].id;
      console.log(`🔄 Atualizando usuário existente com ID: ${userId}`);
      
      await pool.query(`
        UPDATE users SET
          nivelacesso = 'premium',
          origemassinatura = $1,
          tipoplano = $2,
          dataassinatura = $3,
          dataexpiracao = $4,
          acessovitalicio = false
        WHERE id = $5
      `, [data.origin, data.planType, data.startDate, data.endDate, userId]);
    } else {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário para ${data.email}...`);
      
      // Gerar username único baseado no email
      const username = `${data.email.split('@')[0]}_${Math.random().toString(16).slice(2, 10)}`;
      
      // Gerar senha padrão e hash para o novo usuário
      const password = 'auto@123';
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto.scryptSync(password, salt, 64).toString("hex");
      const hashedPassword = `${hash}.${salt}`;
      
      const insertResult = await pool.query(`
        INSERT INTO users (
          username, email, name, password, phone, nivelacesso, origemassinatura,
          tipoplano, dataassinatura, dataexpiracao, acessovitalicio, isactive, emailconfirmed
        ) VALUES (
          $1, $2, $3, $4, $5, 'premium', $6,
          $7, $8, $9, false, true, true
        ) RETURNING id
      `, [username, data.email, data.full_name, hashedPassword, data.phone, data.origin, data.planType, data.startDate, data.endDate]);
      
      userId = insertResult.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
    }
    
    // Verificar se já existe assinatura para este usuário
    const existingSubscription = await pool.query(
      'SELECT id FROM subscriptions WHERE "userId" = $1',
      [userId]
    );

    if (existingSubscription.rows.length > 0) {
      console.log(`ℹ️ Usuário ${userId} já possui assinatura. Ignorando.`);
    } else {
      // Criar assinatura na tabela subscriptions
      await pool.query(`
        INSERT INTO subscriptions (
          "userId", "planType", status, "startDate", "endDate",
          origin, transactionid, lastevent, "webhookData"
        ) VALUES (
          $1, $2, 'active', $3, $4,
          'hotmart', $5, $6, $7
        )
      `, [
        userId, data.planType, data.startDate, data.endDate,
        data.transactionId, data.event, JSON.stringify(data.payload)
      ]);

      console.log(`✅ Assinatura registrada para usuário ${userId}`);
    }
    
    // Marcar webhook como processado
    await pool.query(
      'UPDATE webhook_logs SET status = $1 WHERE id = $2',
      ['processed', webhookId]
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
        'UPDATE webhook_logs SET status = $1 WHERE id = $2',
        ['error', webhookId]
      );
    } catch (updateError) {
      console.error('Erro ao atualizar status do webhook:', updateError);
    }
    
    await pool.end();
    return false;
  }
}

// Função para gerar username e senha aleatória para novos usuários
function gerarUsuarioESenha(email: string) {
  const username = `${email.split('@')[0]}-${Date.now()}`;
  const senha = crypto.randomBytes(16).toString('hex'); // senha aleatória
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  const hashedPassword = `${hash}.${salt}`;
  
  return { username, password: hashedPassword };
}

// Rota para processamento manual de webhooks pendentes
router.get('/process-pending', async (req: Request, res: Response) => {
  console.log('🔄 Iniciando processamento manual de webhooks pendentes');
  
  try {
    const result = await processPendingWebhooks();
    console.log('✅ Resultado do processamento:', result);
    
    return res.status(200).json({
      success: true,
      result,
      message: 'Processamento de webhooks concluído',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhooks pendentes:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Falha ao processar webhooks pendentes',
      timestamp: new Date().toISOString()
    });
  }
});

// Implementação simplificada do webhook da Hotmart
router.post('/', async (req: Request, res: Response) => {
  // Forçar todos os cabeçalhos anti-cache possíveis
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-No-Cache', Date.now().toString());
  
  console.log('📩 Webhook da Hotmart recebido em', new Date().toISOString());
  
  // Debugging - Log detalhado da requisição
  console.log('📝 [DEBUG WEBHOOK] POST /hotmart - Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📝 [DEBUG WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Extrair dados essenciais
    const payload = req.body;
    
    const event = payload?.event || 'UNKNOWN';
    const buyerEmail = payload?.data?.buyer?.email || findEmailInPayload(payload);
    const buyerName = payload?.data?.buyer?.name || 'Novo Cliente';
    const transactionId = payload?.data?.purchase?.transaction || findTransactionId(payload) || `TX-${Date.now()}`;
    
    // Registrar webhook no banco
    let webhookId = null;
    
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      // 1. Registrar webhook no log
      const insertResult = await pool.query(
        `INSERT INTO webhook_logs 
          (event_type, status, email, source, raw_payload, transaction_id, source_ip, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id`,
        [
          event,
          'received',
          buyerEmail,
          'hotmart',
          JSON.stringify(payload),
          transactionId,
          req.ip,
          new Date()
        ]
      );
      
      webhookId = insertResult.rows[0].id;
      await pool.end();
    } catch (dbError) {
      console.error('❌ Erro ao registrar webhook:', dbError);
    }
    
    // Retornar resposta imediatamente para a Hotmart
    // Importante: Evitar timeout
    const responseObj = {
      success: true,
      message: 'Webhook recebido com sucesso',
      timestamp: new Date().toISOString()
    };
    
    console.log('📝 [DEBUG WEBHOOK] Response:', JSON.stringify(responseObj, null, 2));
    res.status(200).json(responseObj);
    
    // Processar webhook automático em segundo plano sem bloqueio
    if (webhookId) {
      console.log(`🔄 Iniciando processamento automático do webhook ${webhookId}`);
      
      // Executar o processamento diretamente em segundo plano
      setTimeout(async () => {
        try {
          console.log(`⏱️ Processando webhook ${webhookId} após resposta ao cliente`);
          
          // Primeiro: processar o webhook específico
          const success = await processWebhook(webhookId);
          
          if (success) {
            console.log(`✅ Processamento automático do webhook ${webhookId} concluído com sucesso`);
          } else {
            console.error(`❌ Falha no processamento automático do webhook ${webhookId}`);
            
            // Se falhar o processamento específico, tentar o processamento massivo
            console.log(`🔄 Tentando processamento alternativo de todos os webhooks pendentes...`);
            const result = await processPendingWebhooks();
            console.log(`⚙️ Resultado do processamento alternativo:`, result);
          }
        } catch (processError) {
          console.error(`❌ Erro fatal no processamento automático:`, processError);
        }
      }, 500); // Pequeno delay maior para garantir que a resposta foi enviada
    }
    
    return;
  } catch (error) {
    console.error('❌ Erro geral ao processar webhook:', error);
    
    // Mesmo com erro, retornar 200 para evitar reenvios
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas confirmamos o recebimento',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;