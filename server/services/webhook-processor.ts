/**
 * Serviço para processamento assíncrono de webhooks da Hotmart
 */
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { SubscriptionService } from './subscription-service';

interface WebhookRecord {
  id: number;
  received_at: Date;
  processed_at: Date | null;
  status: string;
  event_type: string;
  purchase_transaction: string;
  payload: any;
  processing_attempts: number;
  processing_error: string | null;
  processing_result: any;
}

export class WebhookProcessor {
  /**
   * Salva um webhook recebido no banco de dados para processamento posterior
   */
  static async saveWebhook(payload: any): Promise<number> {
    try {
      // Extrair informações importantes do payload
      const eventType = payload?.data?.purchase?.status || payload?.event || 'unknown';
      const purchaseTransaction = payload?.data?.purchase?.transaction || payload?.data?.purchase?.transaction_code || null;
      
      // Inserir o webhook na tabela de fila
      const result = await db.execute(sql`
        INSERT INTO hotmart_webhooks (
          event_type, 
          purchase_transaction, 
          payload, 
          status
        ) 
        VALUES (
          ${eventType}, 
          ${purchaseTransaction}, 
          ${JSON.stringify(payload)}, 
          'pending'
        )
        RETURNING id;
      `);
      
      return result.rows[0]?.id;
    } catch (error) {
      console.error('Erro ao salvar webhook da Hotmart:', error);
      throw error;
    }
  }

  /**
   * Processa webhooks pendentes
   * Esta função pode ser chamada por um job agendado
   */
  static async processWebhookQueue(limit: number = 10): Promise<number> {
    try {
      // Buscar webhooks pendentes para processamento
      const pendingWebhooks = await db.execute(sql`
        SELECT * FROM hotmart_webhooks 
        WHERE status = 'pending' 
        AND (processing_attempts < 3)
        ORDER BY received_at ASC
        LIMIT ${limit};
      `);
      
      let processedCount = 0;
      
      // Processar cada webhook pendente
      for (const webhook of pendingWebhooks.rows as WebhookRecord[]) {
        try {
          await this.processWebhook(webhook);
          processedCount++;
        } catch (error) {
          console.error(`Erro ao processar webhook ID ${webhook.id}:`, error);
          
          // Atualizar contagem de tentativas e erro
          await db.execute(sql`
            UPDATE hotmart_webhooks 
            SET processing_attempts = processing_attempts + 1,
                processing_error = ${String(error)},
                status = CASE WHEN processing_attempts + 1 >= 3 THEN 'failed' ELSE 'pending' END
            WHERE id = ${webhook.id};
          `);
        }
      }
      
      return processedCount;
    } catch (error) {
      console.error('Erro ao processar fila de webhooks:', error);
      throw error;
    }
  }

  /**
   * Processa um webhook individual
   */
  private static async processWebhook(webhook: WebhookRecord): Promise<void> {
    try {
      console.log(`Processando webhook ID ${webhook.id}, tipo: ${webhook.event_type}`);
      
      // Extrair dados importantes
      const payload = webhook.payload;
      const eventType = webhook.event_type;
      
      let processingResult = { success: false, message: '', userId: null, action: '' };
      
      // Processar com base no tipo de evento
      switch (eventType) {
        case 'PURCHASE_APPROVED':
        case 'SUBSCRIPTION_ACTIVATED':
        case 'SUBSCRIPTION_RENEWED':
          processingResult = await this.handleSubscriptionActivation(payload);
          break;
          
        case 'SUBSCRIPTION_CANCELLED':
        case 'PURCHASE_CANCELED':
        case 'PURCHASE_REFUNDED':
        case 'SUBSCRIPTION_EXPIRED':
          processingResult = await this.handleSubscriptionDeactivation(payload);
          break;
          
        default:
          processingResult = { 
            success: true, 
            message: 'Evento não requer processamento', 
            userId: null, 
            action: 'no_action' 
          };
      }
      
      // Atualizar o registro do webhook com o resultado
      await db.execute(sql`
        UPDATE hotmart_webhooks 
        SET processed_at = NOW(),
            status = ${processingResult.success ? 'completed' : 'error'},
            processing_result = ${JSON.stringify(processingResult)}
        WHERE id = ${webhook.id};
      `);
      
      console.log(`Webhook ID ${webhook.id} processado com sucesso`);
    } catch (error) {
      console.error(`Erro durante processamento do webhook ID ${webhook.id}:`, error);
      throw error;
    }
  }

  /**
   * Processa ativação de assinatura
   */
  private static async handleSubscriptionActivation(payload: any): Promise<any> {
    try {
      // Extrair dados do cliente e da compra
      const product = payload?.data?.product || {};
      const purchase = payload?.data?.purchase || {};
      const customer = payload?.data?.subscriber || purchase?.customer || {};
      
      // Verificar se o email do cliente existe
      if (!customer?.email) {
        return { 
          success: false, 
          message: 'Email do cliente não encontrado no payload', 
          userId: null, 
          action: 'no_action' 
        };
      }
      
      // Verificar se o cliente já existe ou criar um novo
      const email = customer.email;
      const nome = customer.name || '';
      const productId = product.id;
      const transactionCode = purchase.transaction || purchase.transaction_code;
      
      // Ativar ou criar assinatura
      const result = await SubscriptionService.activateSubscriptionFromHotmart({
        email: email,
        nome: nome,
        productId: productId,
        transactionCode: transactionCode,
        payload: payload
      });
      
      return {
        success: true,
        message: 'Assinatura ativada com sucesso',
        userId: result.userId,
        subscriptionId: result.subscriptionId,
        action: result.action
      };
    } catch (error) {
      console.error('Erro ao processar ativação de assinatura:', error);
      return {
        success: false,
        message: `Erro ao processar ativação: ${error.message || 'Erro desconhecido'}`,
        userId: null,
        action: 'error'
      };
    }
  }

  /**
   * Processa cancelamento ou expiração de assinatura
   */
  private static async handleSubscriptionDeactivation(payload: any): Promise<any> {
    try {
      // Extrair dados do cliente e da compra
      const purchase = payload?.data?.purchase || {};
      const customer = payload?.data?.subscriber || purchase?.customer || {};
      const transactionCode = purchase.transaction || purchase.transaction_code;
      
      // Verificar se o email do cliente existe
      if (!customer?.email && !transactionCode) {
        return { 
          success: false, 
          message: 'Dados insuficientes para identificar a assinatura', 
          userId: null, 
          action: 'no_action' 
        };
      }
      
      // Desativar assinatura
      const result = await SubscriptionService.deactivateSubscriptionFromHotmart({
        email: customer?.email,
        transactionCode: transactionCode,
        payload: payload
      });
      
      return {
        success: true,
        message: 'Assinatura desativada com sucesso',
        userId: result.userId,
        action: 'deactivated'
      };
    } catch (error) {
      console.error('Erro ao processar desativação de assinatura:', error);
      return {
        success: false,
        message: `Erro ao processar desativação: ${error.message || 'Erro desconhecido'}`,
        userId: null,
        action: 'error'
      };
    }
  }
}