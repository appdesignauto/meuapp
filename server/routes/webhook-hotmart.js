const express = require("express");
const router = express.Router();
const { storage } = require("../storage");
const { db } = require("../db");
const { HotmartService } = require("../services/hotmart-service");
const { SubscriptionService } = require("../services/subscription-service");

// Rota principal para receber webhooks da Hotmart
router.post("/", async (req, res) => {
  try {
    console.log("❇️ Webhook da Hotmart recebido:", JSON.stringify({
      headers: req.headers,
      body: req.body,
      query: req.query,
      path: req.path
    }, null, 2));
    
    // Buscar a chave secreta da Hotmart do banco de dados
    const settings = await db.query.subscriptionSettings.findFirst();
    const hotmartSecret = settings?.hotmartSecret || process.env.HOTMART_SECRET;

    // Extrair o email do payload do webhook (verificar múltiplas localizações possíveis)
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
    
    // Obter ID da transação
    let transactionId = null;
    if (req.body?.data?.purchase?.transaction) {
      transactionId = req.body.data.purchase.transaction;
    } else if (req.body?.data?.subscription?.code) {
      transactionId = req.body.data.subscription.code;
    } else if (req.body?.purchase?.transaction) {
      transactionId = req.body.purchase.transaction;
    }
    
    // Determinar o tipo de evento
    const eventType = req.body?.event || 'UNKNOWN';

    // Sempre registrar o webhook recebido para diagnóstico
    await storage.createWebhookLog({
      eventType,
      payloadData: JSON.stringify(req.body),
      status: 'received',
      source: 'hotmart',
      sourceIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      transactionId,
      email,
      userId: null,
      errorMessage: null
    });

    // Verificar token nos cabeçalhos, body ou query parameters
    const headerToken = req.headers['x-hotmart-webhook-token'];
    const bodyToken = req.body?.hottok;
    const queryToken = req.query?.token;
    const token = headerToken || bodyToken || queryToken;
    
    if (!token) {
      console.error("❌ Webhook da Hotmart sem token de autenticação");
      await storage.updateWebhookLogStatus({
        eventType,
        transactionId,
        email,
        status: 'error',
        errorMessage: "Token de autenticação ausente"
      });
      
      // Retornar 200 mesmo com erro para evitar que a Hotmart reentre o webhook
      return res.status(200).json({
        success: false,
        message: "Token de autenticação ausente, mas confirmando recebimento"
      });
    }
    
    // Em ambiente de desenvolvimento, aceitar qualquer token para testes
    if (process.env.NODE_ENV !== 'development' && hotmartSecret && token !== hotmartSecret) {
      console.error("❌ Token do webhook da Hotmart inválido");
      await storage.updateWebhookLogStatus({
        eventType,
        transactionId,
        email,
        status: 'error',
        errorMessage: "Token de autenticação inválido"
      });
      
      // Retornar 200 mesmo com erro para evitar que a Hotmart reentre o webhook
      return res.status(200).json({
        success: false,
        message: "Token de autenticação inválido, mas confirmando recebimento"
      });
    }

    // Se não encontrou o email, atualizar o log e retornar erro
    if (!email) {
      console.error("❌ Email não encontrado no webhook da Hotmart");
      await storage.updateWebhookLogStatus({
        eventType,
        transactionId,
        email: null,
        status: 'error',
        errorMessage: "Email não encontrado no webhook"
      });
      
      return res.status(200).json({
        success: false,
        message: "Email não encontrado no webhook"
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
    
    // Atualizar o registro do webhook no banco de dados
    const logId = await storage.updateWebhookLogStatus({
      eventType,
      transactionId,
      email,
      status: 'success',
      errorMessage: null
    });
    
    console.log(`✅ Webhook processado com sucesso e atualizado no log ID: ${logId}`);
    
    return res.status(200).json({
      success: true,
      message: "Webhook processado com sucesso"
    });
    
  } catch (error) {
    console.error("❌ Erro ao processar webhook da Hotmart:", error);
    
    // Tentar extrair informações para o log mesmo em caso de erro
    try {
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
      
      await storage.updateWebhookLogStatus({
        eventType,
        transactionId,
        email,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    } catch (logError) {
      console.error("❌ Erro ao registrar falha de webhook no log:", logError);
    }
    
    // Importante: Retornar 200 mesmo em caso de erro para evitar que a Hotmart reentre o webhook
    return res.status(200).json({
      success: false,
      message: "Erro ao processar webhook, mas confirmando recebimento"
    });
  }
});

// Rota para teste/diagnóstico
router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Endpoint de webhook da Hotmart está operacional",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;