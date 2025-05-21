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

// Função para processar o webhook automaticamente
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
    
    // Analisar o payload para extrair informações
    const payload = webhook.raw_payload;
    const email = webhook.email;
    
    if (!email) {
      console.error('❌ Email não encontrado no payload');
      await pool.end();
      return false;
    }
    
    const name = findNameInPayload(payload) || email.split('@')[0];
    const planType = findPlanInfo(payload);
    
    console.log(`📋 Dados extraídos: ${name}, ${email}, Plano: ${planType}`);
    
    // Verificar se o usuário já existe
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    
    if (userResult.rows.length > 0) {
      // Atualizar usuário existente
      userId = userResult.rows[0].id;
      console.log(`🔄 Atualizando usuário existente com ID: ${userId}`);
      
      await pool.query(
        `UPDATE users SET 
         nivelacesso = 'premium', 
         tipoplano = $1, 
         origemassinatura = 'hotmart', 
         dataassinatura = NOW(), 
         dataexpiracao = NOW() + INTERVAL '1 year',
         atualizadoem = NOW()
         WHERE id = $2`,
        [planType, userId]
      );
    } else {
      // Criar novo usuário
      console.log(`➕ Criando novo usuário para ${email}...`);
      
      // Gerar username único baseado no email
      const username = `${email.split('@')[0]}_${Math.random().toString(16).slice(2, 10)}`;
      
      const insertResult = await pool.query(
        `INSERT INTO users 
         (username, email, name, nivelacesso, tipoplano, origemassinatura, dataassinatura, dataexpiracao, dataCriacao, atualizadoem)
         VALUES ($1, $2, $3, 'premium', $4, 'hotmart', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW())
         RETURNING id`,
        [username, email, name, planType]
      );
      
      userId = insertResult.rows[0].id;
      console.log(`✅ Usuário criado com ID: ${userId}`);
    }
    
    // Registrar a assinatura
    console.log(`📝 Registrando assinatura para usuário ${userId}...`);
    
    await pool.query(
      `INSERT INTO subscriptions 
       (userid, planid, subscriptioncode, paymentmethod, price, currency, status, datacriacao, dataatualizacao)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())`,
      [
        userId,
        1, // ID padrão para plano premium
        webhook.transaction_id || `MANUAL-${Date.now()}`,
        'hotmart',
        0, // Preço padrão (será atualizado posteriormente)
        'BRL'
      ]
    );
    
    // Marcar webhook como processado
    await pool.query(
      `UPDATE webhook_logs SET status = 'processed', updated_at = NOW() WHERE id = $1`,
      [webhookId]
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
        `UPDATE webhook_logs SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
        [errorMessage, webhookId]
      );
    } catch (updateError) {
      console.error('Erro ao atualizar status do webhook:', updateError);
    }
    
    await pool.end();
    return false;
  }
}

// Implementação dedicada do webhook da Hotmart para garantir resposta JSON
router.post('/', async (req: Request, res: Response) => {
  // Forçar todos os cabeçalhos anti-cache possíveis
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-No-Cache', Date.now().toString());
  
  console.log('📩 Webhook FIXO da Hotmart recebido em', new Date().toISOString());
  
  try {
    // Imprimir o corpo da requisição
    console.log('📦 Corpo do webhook:', JSON.stringify(req.body, null, 2));
    
    // Capturar dados básicos do webhook
    const payload = req.body;
    const event = payload?.event || 'UNKNOWN';
    const email = findEmailInPayload(payload);
    const transactionId = findTransactionId(payload);
    
    console.log(`📊 Dados extraídos: evento=${event}, email=${email}, transactionId=${transactionId}`);
    
    // Registrar no banco de dados
    let webhookId: number | null = null;
    
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      const insertResult = await pool.query(
        `INSERT INTO webhook_logs 
          (event_type, status, email, source, raw_payload, transaction_id, source_ip, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id`,
        [
          event,
          'received',
          email,
          'hotmart',
          JSON.stringify(payload),
          transactionId,
          req.ip,
          new Date()
        ]
      );
      
      webhookId = insertResult.rows[0].id;
      console.log(`✅ Webhook registrado no banco de dados com ID: ${webhookId}`);
      await pool.end();
    } catch (dbError) {
      console.error('❌ Erro ao registrar webhook:', dbError);
      // Continuar mesmo com erro de log
    }
    
    // Responder imediatamente para a Hotmart
    // Importante: Respondemos antes de processar para evitar timeouts
    res.status(200).json({
      success: true,
      message: 'Webhook recebido com sucesso pelo endpoint FIXO',
      timestamp: new Date().toISOString()
    });
    
    // Processar o webhook assincronamente
    if (webhookId && event === 'PURCHASE_APPROVED') {
      // Processar em um timeout para garantir que a resposta já foi enviada
      setTimeout(async () => {
        try {
          console.log(`⏳ Iniciando processamento assíncrono do webhook ID: ${webhookId}`);
          const success = await processWebhook(webhookId as number);
          console.log(`🏁 Processamento assíncrono concluído: ${success ? 'sucesso' : 'falha'}`);
        } catch (processError) {
          console.error('❌ Erro no processamento assíncrono:', processError);
        }
      }, 100);
    }
    
    return; // Importante: não enviar uma segunda resposta
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Mesmo com erro, retornar 200 para evitar reenvios
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas confirmamos o recebimento',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;