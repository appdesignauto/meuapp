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
    
    // Extrair informações importantes do webhook
    let email = null;
    if (req.body?.data?.buyer?.email) {
      email = req.body.data.buyer.email;
    } else if (req.body?.buyer?.email) {
      email = req.body.buyer.email;
    } else if (req.body?.data?.subscriber?.email) {
      email = req.body.data.subscriber.email;
    } else if (req.body?.subscriber?.email) {
      email = req.body.subscriber.email;
    }
    
    let transactionId = null;
    if (req.body?.data?.purchase?.transaction) {
      transactionId = req.body.data.purchase.transaction;
    } else if (req.body?.data?.subscription?.code) {
      transactionId = req.body.data.subscription.code;
    } else if (req.body?.purchase?.transaction) {
      transactionId = req.body.purchase.transaction;
    }
    
    const eventType = req.body?.event || 'UNKNOWN';
    
    // Criar log de recebimento do webhook
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
    
    // Se não encontrou o email, atualizar o log e retornar erro
    if (!email) {
      console.error('❌ Email não encontrado no webhook');
      
      // Atualizar o log para indicar erro
      try {
        await db.update(db.webhookLogs)
          .set({
            status: 'error',
            errorMessage: 'Email não encontrado no webhook',
            updatedAt: new Date()
          })
          .where(db.eq(db.webhookLogs.transactionId, transactionId));
      } catch (updateError) {
        console.error('❌ Erro ao atualizar log de webhook:', updateError);
      }
      
      return res.status(200).json({
        success: false,
        message: 'Email não encontrado no webhook'
      });
    }
    
    // Processar o webhook baseado no tipo de evento
    console.log(`✅ Processando evento ${eventType} para ${email}`);
    
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