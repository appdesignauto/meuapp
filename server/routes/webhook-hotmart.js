/**
 * Rota para processamento de webhooks da Hotmart
 */

const express = require('express');
const router = express.Router();
const { storage } = require('../storage');
const { db } = require('../db');
const { HotmartService } = require('../services/hotmart-service');

// Rota principal para receber webhooks da Hotmart
router.post('/', async (req, res) => {
  try {
    console.log('⚡ Webhook da Hotmart recebido');

// Função para busca profunda de email em objetos
function extractEmailDeep(obj) {
  if (!obj) return null;
  
  // Se for string, verificar se é email
  if (typeof obj === 'string' && obj.includes('@')) {
    return obj;
  }
  
  // Se for objeto, buscar recursivamente
  if (typeof obj === 'object') {
    for (let key in obj) {
      if (key.toLowerCase().includes('email')) {
        const value = obj[key];
        if (typeof value === 'string' && value.includes('@')) {
          return value;
        }
      }
      
      const deepResult = extractEmailDeep(obj[key]);
      if (deepResult) return deepResult;
    }
  }
  
  return null;
}

    console.log("🔥 Webhook recebido:", JSON.stringify(req.body, null, 2));
    console.log("📌 Headers:", JSON.stringify(req.headers, null, 2));
    
    // Extrair informações importantes do webhook
    let email = null;
    
    // Registrar o webhook bruto para diagnóstico
    try {
      const webhookStr = JSON.stringify(req.body);
      console.log("Webhook da Hotmart recebido");
      console.log("Corpo do webhook:", webhookStr);
      
      console.log("Token recebido no cabeçalho ou corpo:", req.headers['x-hotmart-webhook-token'] || 
                 req.headers['x-hotmart-hottok'] || req.body?.hottok || req.query?.token);
      
      console.log("Cabeçalhos recebidos:", Object.keys(req.headers).join(", "));
      console.log("Corpo recebido tem hottok?", req.body?.hottok ? "Sim" : "Não");
    } catch (e) {
      console.error("Erro ao registrar webhook:", e);
    }
    // Log detalhado do payload para diagnóstico
    console.log('Payload completo recebido:', JSON.stringify(req.body, null, 2));
    
    const eventType = req.body?.event || 'UNKNOWN';
    console.log('Tipo de evento:', eventType);
    
    // Extração de email com lógica específica por tipo de evento
    if (eventType === 'SUBSCRIPTION_CANCELLATION') {
      // Verificar na estrutura data.subscriber (formato v2.0.0)
      email = req.body?.data?.subscriber?.email;
      
      // Verificar no caminho alternativo para versão 2.0.0
      if (!email && req.body?.data?.data?.subscriber?.email) {
        email = req.body.data.data.subscriber.email;
      }
      
      console.log('Email do subscriber em SUBSCRIPTION_CANCELLATION:', email);
      
      // Caso ainda não tenha encontrado, fazer busca mais profunda
      if (!email) {
        email = extractEmailDeep(req.body);
        console.log('Email encontrado via busca profunda:', email);
      }
    } else {
      // Fallback para outros tipos de evento
      email = req.body?.data?.subscriber?.email || 
              req.body?.data?.buyer?.email || 
              req.body?.subscriber?.email || 
              req.body?.buyer?.email;
    }
    
    // Log do email encontrado
    console.log('Email extraído:', email);
    
    let transactionId = null;
    if (req.body?.data?.purchase?.transaction) {
      transactionId = req.body.data.purchase.transaction;
    } else if (req.body?.data?.subscription?.id || req.body?.data?.subscription?.code) {
      transactionId = req.body.data.subscription.id || req.body.data.subscription.code;
    } else if (req.body?.purchase?.transaction) {
      transactionId = req.body.purchase.transaction;
    } else if (req.body?.data?.data?.subscription?.id) {
      // Formato alternativo em alguns eventos
      transactionId = req.body.data.data.subscription.id;
    }
    
    // O eventType já foi declarado acima, não precisamos repetir
    
    // Usar o eventType já definido anteriormente
    try {
      console.log('📝 Criando log de webhook com os dados:', { 
        eventType, 
        email, 
        transactionId,
        body: JSON.stringify(req.body).substring(0, 100) + '...' 
      });
      
      // Verificar se este webhook já foi processado antes (em caso de reprocessamento)
      let existingLog = null;
      if (transactionId && email) {
        const existingLogs = await db.query.webhookLogs.findMany({
          where: db.and(
            db.eq(db.webhookLogs.transactionId, transactionId),
            db.eq(db.webhookLogs.email, email),
            db.eq(db.webhookLogs.source, 'hotmart')
          ),
          orderBy: db.desc(db.webhookLogs.createdAt),
          limit: 1
        });
        
        if (existingLogs.length > 0) {
          existingLog = existingLogs[0];
          console.log(`🔄 Webhook reprocessado detectado: ID ${existingLog.id}, status anterior: ${existingLog.status}`);
        }
      }

      // Se for um reprocessamento, criar um novo registro de log
      const webhookLog = await db.insert(db.webhookLogs)
        .values({
          eventType,
          payloadData: JSON.stringify(req.body),
          status: 'received',
          source: 'hotmart',
          sourceIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          transactionId,
          email,
          userId: null,
          errorMessage: existingLog ? `Reprocessamento do webhook ID ${existingLog.id}` : null,
          retryCount: existingLog ? (existingLog.retryCount || 0) + 1 : 0
        })
        .returning();
      
      console.log('✅ Log de webhook criado com sucesso:', webhookLog[0].id);
    } catch (logError) {
      // Se houver erro ao criar o log, continuar processando o webhook
      console.error('❌ Erro ao criar log de webhook:', logError);
    }

    // Verificar token (authenticação)
    const settings = await db.query.subscriptionSettings.findFirst();
    const hotmartSecret = settings?.hotmartSecret || process.env.HOTMART_SECRET;
    const token = req.headers['x-hotmart-webhook-token'] || req.body?.hottok || req.query?.token;
    
    // Em ambiente de desenvolvimento, aceitar qualquer token para testes
    if (process.env.NODE_ENV !== 'development' && hotmartSecret && token !== hotmartSecret) {
      console.error('❌ Token do webhook inválido');
      
      // Atualizar o log para indicar erro
      try {
        await db.update(db.webhookLogs)
          .set({
            status: 'error',
            errorMessage: 'Token de autenticação inválido',
            updatedAt: new Date()
          })
          .where(db.eq(db.webhookLogs.transactionId, transactionId))
          .where(db.eq(db.webhookLogs.email, email));
      } catch (updateError) {
        console.error('❌ Erro ao atualizar log de webhook:', updateError);
      }
      
      // Retornar 200 mesmo com erro para evitar retentativas da Hotmart
      return res.status(200).json({
        success: false,
        message: 'Token inválido, mas confirmando recebimento'
      });
    }
    
    // Se não encontrou o email, tentar extrair de outras formas antes de falhar
    if (!email) {
      console.log('⚠️ Email não encontrado nas localizações padrão, tentando métodos alternativos...');
      
      // Tentar extrair email de forma mais agressiva
      if (req.body.data) {
        email = extractEmailDeep(req.body.data);
      }
      
      if (!email && req.body.subscriber) {
        email = extractEmailDeep(req.body.subscriber);
      }
      
      if (!email) {
        console.error('❌ Email não encontrado mesmo após tentativas adicionais');
        
        // Atualizar o log para retry posterior
        try {
          await db.update(db.webhookLogs)
            .set({
              status: 'pending_retry',
              errorMessage: 'Email não encontrado - Agendado para retry',
              retryCount: (webhookLog?.retryCount || 0) + 1,
              nextRetryAt: new Date(Date.now() + 300000), // 5 minutos
              updatedAt: new Date()
            })
            .where(db.eq(db.webhookLogs.transactionId, transactionId));
            
          console.log('📅 Webhook agendado para retry em 5 minutos');
        } catch (updateError) {
          console.error('❌ Erro ao agendar retry:', updateError);
        }
      
      // Agendar retry em 5 minutos
      const retryAfter = 5 * 60 * 1000; // 5 minutos
      const retryAt = new Date(Date.now() + retryAfter);
      
      await db.update(db.webhookLogs)
        .set({
          status: 'pending_retry',
          nextRetryAt: retryAt,
          retryCount: (webhookLog?.retryCount || 0) + 1,
          errorMessage: 'Email não encontrado - Agendado para retry automático'
        })
        .where(db.eq(db.webhookLogs.id, webhookLog.id));
      
      return res.status(200).json({
        success: false,
        message: 'Email não encontrado no webhook - Agendado retry',
        nextRetryAt: retryAt
      });
    }
    
    // Processar o webhook baseado no tipo de evento
    console.log(`✅ Processando evento ${eventType} para ${email}`);
    
    try {
      // Logar payload completo para diagnóstico
      console.log('Payload completo do webhook:', JSON.stringify(req.body, null, 2));
      
      // Verificar estrutura do payload
      if (!req.body.data) {
        throw new Error('Payload inválido: data não encontrado');
      }
      
      switch (eventType) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
        await HotmartService.processPurchase(req.body, email);
        break;
      
      case 'SUBSCRIPTION_CANCELLATION':
        await HotmartService.processCancellation(req.body, email);
        break;
      
      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
        await HotmartService.processRefund(req.body, email);
        break;
      
      case 'RECURRENCE_BILLED':
        await HotmartService.processRenewal(req.body, email);
        break;
      
      default:
        console.log(`ℹ️ Tipo de evento não processado: ${eventType}`);
    }
    
    // Atualizar o registro do webhook para sucesso
    try {
      await db.update(db.webhookLogs)
        .set({
          status: 'success',
          errorMessage: null,
          updatedAt: new Date()
        })
        .where(db.eq(db.webhookLogs.transactionId, transactionId))
        .where(db.eq(db.webhookLogs.email, email));
      
      console.log('✅ Log de webhook atualizado para status success');
    } catch (updateError) {
      console.error('❌ Erro ao atualizar log de webhook:', updateError);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook da Hotmart:', error);
    
    // Importante: Retornar 200 mesmo em caso de erro para evitar retentativas da Hotmart
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas confirmando recebimento'
    });
  }
});

// Rota para teste/diagnóstico
router.get('/test', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Endpoint de webhook da Hotmart está operacional',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;