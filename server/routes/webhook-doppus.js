const express = require("express");
const router = express.Router();
const { storage } = require("../storage");
const { db } = require("../db");
const { DoppusService } = require("../services/doppus-service");
const { SubscriptionService } = require("../services/subscription-service");
const crypto = require("crypto");

// Rota principal para receber webhooks da Doppus
router.post("/", async (req, res) => {
  try {
    console.log("❇️ Webhook da Doppus recebido:", JSON.stringify({
      headers: req.headers,
      body: req.body,
      query: req.query,
      path: req.path
    }, null, 2));
    
    // Buscar as configurações da Doppus no banco de dados
    const settings = await db.query.integrationSettings.findFirst();
    const doppusSecret = settings?.doppusWebhookSecret || process.env.DOPPUS_SECRET;
    
    // Extrair o email do payload do webhook
    let email = null;
    if (req.body?.email) {
      email = req.body.email;
    } else if (req.body?.cliente?.email) {
      email = req.body.cliente.email;
    } else if (req.body?.data?.email) {
      email = req.body.data.email;
    } else if (req.body?.data?.cliente?.email) {
      email = req.body.data.cliente.email;
    }
    
    // Obter ID da transação
    let transactionId = null;
    if (req.body?.transacao_id) {
      transactionId = req.body.transacao_id;
    } else if (req.body?.id) {
      transactionId = req.body.id;
    } else if (req.body?.data?.transacao_id) {
      transactionId = req.body.data.transacao_id;
    } else if (req.body?.data?.id) {
      transactionId = req.body.data.id;
    }
    
    // Determinar o tipo de evento
    const eventType = req.body?.evento || req.body?.data?.evento || req.body?.tipo || req.body?.status || 'UNKNOWN';

    // Sempre registrar o webhook recebido para diagnóstico
    await storage.createWebhookLog({
      eventType,
      payloadData: JSON.stringify(req.body),
      status: 'received',
      source: 'doppus',
      sourceIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      transactionId,
      email,
      userId: null,
      errorMessage: null
    });

    // Verificar assinatura se estiver disponível
    if (doppusSecret && req.headers['x-doppus-signature']) {
      const signature = req.headers['x-doppus-signature'];
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', doppusSecret)
        .update(payload)
        .digest('hex');
      
      // Em ambiente de desenvolvimento, aceitar qualquer assinatura
      if (process.env.NODE_ENV !== 'development' && signature !== expectedSignature) {
        console.error("❌ Assinatura do webhook da Doppus inválida");
        await storage.updateWebhookLogStatus({
          eventType,
          transactionId,
          email,
          status: 'error',
          errorMessage: "Assinatura inválida"
        });
        
        // Retornar 200 mesmo com erro para evitar retentativas
        return res.status(200).json({
          success: false,
          message: "Assinatura inválida, mas confirmando recebimento"
        });
      }
    }

    // Se não encontrou o email, atualizar o log e retornar erro
    if (!email) {
      console.error("❌ Email não encontrado no webhook da Doppus");
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
    
    // Com base no tipo de evento, processar a solicitação
    switch (eventType) {
      case 'APPROVED':
      case 'COMPRA_APROVADA':
      case 'PAGAMENTO_APROVADO':
        await DoppusService.processApprovedPurchase(req.body, email);
        break;
      
      case 'CANCELED':
      case 'COMPRA_CANCELADA':
      case 'ASSINATURA_CANCELADA':
        await DoppusService.processCancellation(req.body, email);
        break;
      
      case 'REFUNDED':
      case 'COMPRA_REEMBOLSADA':
      case 'REEMBOLSO':
        await DoppusService.processRefund(req.body, email);
        break;
      
      case 'RECURRENCE':
      case 'RENOVACAO':
      case 'ASSINATURA_RENOVADA':
        await DoppusService.processRenewal(req.body, email);
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
    console.error("❌ Erro ao processar webhook da Doppus:", error);
    
    // Tentar extrair informações para o log mesmo em caso de erro
    try {
      let email = null;
      if (req.body?.email) {
        email = req.body.email;
      } else if (req.body?.cliente?.email) {
        email = req.body.cliente.email;
      } else if (req.body?.data?.email) {
        email = req.body.data.email;
      } else if (req.body?.data?.cliente?.email) {
        email = req.body.data.cliente.email;
      }
      
      let transactionId = null;
      if (req.body?.transacao_id) {
        transactionId = req.body.transacao_id;
      } else if (req.body?.id) {
        transactionId = req.body.id;
      } else if (req.body?.data?.transacao_id) {
        transactionId = req.body.data.transacao_id;
      } else if (req.body?.data?.id) {
        transactionId = req.body.data.id;
      }
      
      const eventType = req.body?.evento || req.body?.data?.evento || req.body?.tipo || req.body?.status || 'UNKNOWN';
      
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
    
    // Importante: Retornar 200 mesmo em caso de erro para evitar retentativas
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
    message: "Endpoint de webhook da Doppus está operacional",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;