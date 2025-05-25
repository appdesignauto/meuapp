/**
 * Rota para processamento de webhooks da Doppus
 */

const express = require('express');
const router = express.Router();
const { storage } = require('../storage');
const { db } = require('../db');
const { DoppusService } = require('../services/doppus-service');
const crypto = require('crypto');

// Rota principal para receber webhooks da Doppus
router.post('/', async (req, res) => {
  try {
    console.log('⚡ Webhook da Doppus recebido');
    
    // Extrair informações importantes do webhook
    const email = req.body?.client?.email || req.body?.email || null;
    const transactionId = req.body?.id || req.body?.transaction_id || null;
    const eventType = req.body?.status || req.body?.event || 'UNKNOWN';
    
    // Criar log de recebimento do webhook
    try {
      console.log('📝 Criando log de webhook da Doppus com os dados:', { 
        eventType, 
        email, 
        transactionId,
        body: JSON.stringify(req.body).substring(0, 100) + '...' 
      });
      
      // Registrar o webhook no banco de dados
      const webhookLog = await db.insert(db.webhookLogs)
        .values({
          eventType,
          payloadData: JSON.stringify(req.body),
          status: 'received',
          source: 'doppus',
          sourceIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          transactionId,
          email,
          userId: null,
          errorMessage: null
        })
        .returning();
      
      console.log('✅ Log de webhook da Doppus criado com sucesso:', webhookLog[0].id);
    } catch (logError) {
      // Se houver erro ao criar o log, continuar processando o webhook
      console.error('❌ Erro ao criar log de webhook da Doppus:', logError);
    }

    // Verificar assinatura de autenticação
    const settings = await db.query.integrationSettings.findFirst();
    const doppusSecret = settings?.doppusSecret || process.env.DOPPUS_SECRET;
    const signature = req.headers['x-hub-signature'] || req.headers['x-doppus-signature'];
    
    if (process.env.NODE_ENV !== 'development' && doppusSecret && signature) {
      const calculatedSignature = generateSignature(req.body, doppusSecret);
      if (calculatedSignature !== signature) {
        console.error('❌ Assinatura do webhook da Doppus inválida');
        
        // Atualizar o log para indicar erro
        try {
          await db.update(db.webhookLogs)
            .set({
              status: 'error',
              errorMessage: 'Assinatura de autenticação inválida',
              updatedAt: new Date()
            })
            .where(db.eq(db.webhookLogs.transactionId, transactionId))
            .where(db.eq(db.webhookLogs.email, email));
        } catch (updateError) {
          console.error('❌ Erro ao atualizar log de webhook da Doppus:', updateError);
        }
        
        // Retornar 200 mesmo com erro para evitar retentativas da Doppus
        return res.status(200).json({
          success: false,
          message: 'Assinatura inválida, mas confirmando recebimento'
        });
      }
    }
    
    // Se não encontrou o email, atualizar o log e retornar erro
    if (!email) {
      console.error('❌ Email não encontrado no webhook da Doppus');
      
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
        console.error('❌ Erro ao atualizar log de webhook da Doppus:', updateError);
      }
      
      return res.status(200).json({
        success: false,
        message: 'Email não encontrado no webhook'
      });
    }
    
    // Processar o webhook baseado no tipo de evento
    console.log(`✅ Processando evento Doppus ${eventType} para ${email}`);
    
    switch (eventType) {
      case 'approved':
      case 'active':
        await DoppusService.processPurchase(req.body, email);
        break;
      
      case 'canceled':
      case 'inactive':
        await DoppusService.processCancellation(req.body, email);
        break;
      
      case 'refunded':
        await DoppusService.processRefund(req.body, email);
        break;
      
      case 'renewal':
      case 'renewed':
        await DoppusService.processRenewal(req.body, email);
        break;
      
      default:
        console.log(`ℹ️ Tipo de evento Doppus não processado: ${eventType}`);
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
      
      console.log('✅ Log de webhook da Doppus atualizado para status success');
    } catch (updateError) {
      console.error('❌ Erro ao atualizar log de webhook da Doppus:', updateError);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Webhook da Doppus processado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook da Doppus:', error);
    
    // Importante: Retornar 200 mesmo em caso de erro para evitar retentativas da Doppus
    return res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook da Doppus, mas confirmando recebimento'
    });
  }
});

// Função para gerar assinatura para validação
function generateSignature(body, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const signature = hmac.update(JSON.stringify(body)).digest('hex');
  return signature;
}

// Rota para teste/diagnóstico
router.get('/test', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Endpoint de webhook da Doppus está operacional',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;