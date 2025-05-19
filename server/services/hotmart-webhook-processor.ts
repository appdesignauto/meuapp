import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users } from '../../shared/schema';
import { HotmartService } from './hotmart-service';

/**
 * Processador de webhooks da Hotmart
 * 
 * Esta classe contém métodos para processar diferentes tipos de eventos
 * enviados pelos webhooks da Hotmart.
 */
export class HotmartWebhookProcessor {

  private hotmartService: HotmartService;

  constructor() {
    this.hotmartService = new HotmartService();
  }

  /**
   * Processa um webhook da Hotmart
   * 
   * @param payload Payload completo do webhook
   * @returns Objeto com resultado do processamento
   */
  async processWebhook(payload: any): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const eventType = payload.event;
      const transactionCode = payload.data?.purchase?.transaction || 'unknown';
      
      console.log(`[HotmartWebhookProcessor] Processando evento: ${eventType}, Transação: ${transactionCode}`);
      
      switch (eventType) {
        case 'PURCHASE_APPROVED':
          return await this.processPurchaseApproved(payload);
          
        case 'PURCHASE_CANCELED':
        case 'PURCHASE_REFUNDED':
        case 'SUBSCRIPTION_CANCELLATION':
          return await this.processCancellationOrRefund(payload);
        
        case 'PURCHASE_DELAYED':
        case 'PURCHASE_CHARGEBACK':
          return await this.processPaymentIssue(payload);
        
        case 'PURCHASE_COMPLETE':
          return await this.processPurchaseComplete(payload);
          
        case 'SUBSCRIPTION_REACTIVATION':
          return await this.processSubscriptionReactivation(payload);
          
        default:
          return {
            success: true,
            message: `Evento ${eventType} reconhecido mas sem processamento específico implementado`,
          };
      }
    } catch (error) {
      console.error('[HotmartWebhookProcessor] Erro ao processar webhook:', error);
      return {
        success: false,
        message: 'Erro ao processar webhook',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Processa um evento de compra aprovada
   */
  private async processPurchaseApproved(payload: any): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const buyerEmail = payload.data.buyer.email;
      const transactionCode = payload.data.purchase.transaction;
      const productName = payload.data.product.name;
      const subscriberCode = payload.data?.subscription?.subscriber?.code || null;
      
      // Verificar se o usuário existe
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, buyerEmail)
      });
      
      if (!existingUser) {
        return {
          success: false,
          message: `Usuário com email ${buyerEmail} não encontrado no sistema`,
        };
      }
      
      // Determinar data de expiração (1 ano a partir de hoje)
      const dataAssinatura = new Date();
      const dataExpiracao = new Date();
      dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
      
      // Atualizar assinatura do usuário
      await db.update(users)
        .set({
          origemassinatura: 'hotmart',
          tipoplano: 'premium', // Valor padrão, pode ser customizado conforme produto
          dataassinatura: dataAssinatura,
          dataexpiracao: dataExpiracao,
          codigoassinante: subscriberCode || transactionCode,
          transaction_code: transactionCode,
          acessovitalicio: false,
          isactive: true
        })
        .where(eq(users.id, existingUser.id));
      
      return {
        success: true,
        message: `Assinatura atualizada para o usuário ${existingUser.username} (ID: ${existingUser.id})`,
        details: {
          userId: existingUser.id,
          userName: existingUser.username,
          transactionCode,
          planType: 'premium',
          subscriberCode,
          validUntil: dataExpiracao
        }
      };
    } catch (error) {
      console.error('[HotmartWebhookProcessor] Erro ao processar compra aprovada:', error);
      return {
        success: false,
        message: 'Erro ao processar compra aprovada',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Processa eventos de cancelamento ou reembolso
   */
  private async processCancellationOrRefund(payload: any): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const buyerEmail = payload.data.buyer.email;
      const transactionCode = payload.data.purchase.transaction;
      
      // Verificar se o usuário existe
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, buyerEmail)
      });
      
      if (!existingUser) {
        return {
          success: false,
          message: `Usuário com email ${buyerEmail} não encontrado no sistema`,
        };
      }
      
      // Verificar se a transação corresponde à assinatura atual do usuário
      if (existingUser.transaction_code !== transactionCode) {
        return {
          success: false,
          message: `Transação ${transactionCode} não corresponde à assinatura atual do usuário (${existingUser.transaction_code})`,
        };
      }
      
      // Downgrade da assinatura do usuário para "free"
      await db.update(users)
        .set({
          tipoplano: 'free',
          dataexpiracao: new Date(), // Expira agora
          isactive: true
        })
        .where(eq(users.id, existingUser.id));
      
      return {
        success: true,
        message: `Assinatura cancelada para o usuário ${existingUser.username} (ID: ${existingUser.id})`,
        details: {
          userId: existingUser.id,
          userName: existingUser.username,
          transactionCode
        }
      };
    } catch (error) {
      console.error('[HotmartWebhookProcessor] Erro ao processar cancelamento/reembolso:', error);
      return {
        success: false,
        message: 'Erro ao processar cancelamento/reembolso',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Processa eventos relacionados a problemas de pagamento
   */
  private async processPaymentIssue(payload: any): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    // Aqui poderíamos implementar alguma lógica para marcar assinaturas com problemas
    // Por exemplo, enviar um aviso ao administrador ou ao usuário
    return {
      success: true,
      message: `Problema de pagamento registrado para análise`,
      details: {
        event: payload.event,
        transaction: payload.data.purchase.transaction,
        buyerEmail: payload.data.buyer.email
      }
    };
  }
  
  /**
   * Processa evento de compra completada
   */
  private async processPurchaseComplete(payload: any): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    // Similar ao PURCHASE_APPROVED, mas pode ter lógica específica
    return await this.processPurchaseApproved(payload);
  }
  
  /**
   * Processa evento de reativação de assinatura
   */
  private async processSubscriptionReactivation(payload: any): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const buyerEmail = payload.data.buyer.email;
      const subscriberCode = payload.data?.subscription?.subscriber?.code || null;
      
      // Verificar se o usuário existe
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, buyerEmail)
      });
      
      if (!existingUser) {
        return {
          success: false,
          message: `Usuário com email ${buyerEmail} não encontrado no sistema`,
        };
      }
      
      // Determinar nova data de expiração (1 ano a partir de hoje)
      const dataAssinatura = new Date();
      const dataExpiracao = new Date();
      dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
      
      // Reativar assinatura do usuário
      await db.update(users)
        .set({
          tipoplano: 'premium',
          dataassinatura: dataAssinatura,
          dataexpiracao: dataExpiracao,
          isactive: true
        })
        .where(eq(users.id, existingUser.id));
      
      return {
        success: true,
        message: `Assinatura reativada para o usuário ${existingUser.username} (ID: ${existingUser.id})`,
        details: {
          userId: existingUser.id,
          userName: existingUser.username,
          subscriberCode,
          validUntil: dataExpiracao
        }
      };
    } catch (error) {
      console.error('[HotmartWebhookProcessor] Erro ao processar reativação de assinatura:', error);
      return {
        success: false,
        message: 'Erro ao processar reativação de assinatura',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

// Exportar a classe como singleton
export const hotmartWebhookProcessor = new HotmartWebhookProcessor();