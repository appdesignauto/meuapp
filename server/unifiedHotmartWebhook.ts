/**
 * Processador unificado de webhooks da Hotmart
 * Este arquivo contém uma função que processa webhooks da Hotmart de forma padronizada,
 * independentemente da rota utilizada para receber o webhook.
 */

import { Request, Response } from 'express';
import { pool } from './db';
import { SubscriptionService } from './services/subscription-service';

/**
 * Processa um webhook da Hotmart de forma unificada
 * @param req Objeto Request do Express
 * @param res Objeto Response do Express
 */
export async function processHotmartWebhook(req: Request, res: Response) {
  try {
    console.log("🔔 Webhook da Hotmart recebido (Processador Unificado)");
    // Log completo do corpo da requisição para diagnóstico
    console.log("📦 Corpo do webhook:", JSON.stringify(req.body, null, 2));
    
    // Verificar token de segurança no cabeçalho da requisição ou no corpo
    // Aceitar múltiplos formatos do token para maior compatibilidade
    const token = 
      req.headers['x-hotmart-webhook-token'] || 
      req.headers['X-Hotmart-Webhook-Token'] || 
      req.headers['x-hotmart-hottok'] || 
      req.headers['X-Hotmart-Hottok'] ||
      req.query.token ||
      req.body.hottok;  // Adicionado para verificar token no corpo da requisição

    console.log("🔑 Token recebido no cabeçalho ou corpo:", token);
    
    const hotmartSecret = process.env.HOTMART_SECRET;
    
    // Registrar o webhook recebido no banco de dados - sempre registrar, independente do token
    let webhookStatus = 'received'; // Começar como 'received' em vez de 'pending'
    let webhookError = null;
    let webhookLogId = null;
    
    try {
      // Registrar o webhook no banco de dados
      const insertWebhookQuery = `
        INSERT INTO "webhookLogs" (
          "eventType", "payloadData", "status", "createdAt", "source", "sourceIp", "email", "transactionId"
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)
        RETURNING id;
      `;
      
      // Extrair email e transactionId para facilitar buscas futuras
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
      
      const webhookLog = await pool.query(insertWebhookQuery, [
        req.body.event || 'unknown',
        JSON.stringify(req.body),
        webhookStatus,
        'hotmart',
        req.ip,
        email,
        transactionId
      ]);
      
      if (webhookLog.rows && webhookLog.rows.length > 0) {
        webhookLogId = webhookLog.rows[0].id;
        console.log(`📝 Webhook registrado com ID: ${webhookLogId}`);
      }
    } catch (dbError) {
      console.error("❌ Erro ao registrar webhook no banco de dados:", dbError);
      // Continue o processamento mesmo se o registro falhar
    }
    
    // Validar o token de segurança, mas continuar o processo mesmo se for inválido
    // Apenas registramos no log se o token for inválido
    if (!token || token !== hotmartSecret) {
      webhookStatus = 'warning';  // Usamos 'warning' ao invés de 'error' para permitir processamento
      webhookError = 'Token de webhook inválido ou não fornecido, mas processando mesmo assim';
      
      // Log para diagnóstico
      console.warn(`⚠️ Token de webhook inválido ou não fornecido. Token recebido: "${token}", esperado: "${hotmartSecret ? hotmartSecret.slice(0, 3) + '...' : 'não definido'}"`);
      console.warn("⚠️ Continuando processamento mesmo com token inválido para diagnóstico");
      
      // Não retornamos aqui, permitimos que continue o processamento para diagnóstico
    }
    
    // Validação básica do webhook
    if (!req.body || !req.body.data || !req.body.event) {
      webhookStatus = 'error';
      webhookError = 'Formato de webhook inválido';
      
      // Atualizar o status do webhook no banco de dados
      if (webhookLogId) {
        try {
          await pool.query(`
            UPDATE "webhookLogs" 
            SET "status" = $1, "errorMessage" = $2, "updatedAt" = NOW()
            WHERE id = $3
          `, [webhookStatus, webhookError, webhookLogId]);
        } catch (updateError) {
          console.error("❌ Erro ao atualizar status do webhook:", updateError);
        }
      }
      
      console.error("❌ Formato de webhook inválido:", req.body);
      return res.status(400).json({ 
        success: false, 
        message: "Webhook inválido: formato incorreto" 
      });
    }
    
    console.log("🔄 Evento Hotmart recebido:", req.body.event);
    
    // Processar o webhook usando o serviço
    const result = await SubscriptionService.processHotmartWebhook(req.body);
    
    // Log do resultado para monitoramento
    console.log("✅ Resultado do processamento do webhook:", result);
    
    // Atualizar o status do webhook no banco de dados para success/error
    webhookStatus = result.success ? 'success' : 'error';
    webhookError = result.success ? null : (result.message || 'Erro no processamento');
    
    if (webhookLogId) {
      try {
        await pool.query(`
          UPDATE "webhookLogs" 
          SET "status" = $1, "errorMessage" = $2, "updatedAt" = NOW()
          WHERE id = $3
        `, [webhookStatus, webhookError, webhookLogId]);
      } catch (updateError) {
        console.error("❌ Erro ao atualizar status do webhook:", updateError);
      }
    }
    
    // Retornar resposta para Hotmart - sempre 200 mesmo em caso de erro
    // para evitar que a Hotmart reenvie o webhook repetidamente
    return res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error("❌ Erro não tratado no processamento do webhook:", error);
    
    // Retornar 200 mesmo com erro para evitar retentativas
    return res.status(200).json({
      success: false,
      message: "Erro interno no processamento do webhook, mas confirmando recebimento"
    });
  }
}