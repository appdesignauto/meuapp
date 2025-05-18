import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Tipos para os payloads recebidos da Hotmart
export interface HotmartPurchaseEvent {
  data: {
    purchase: {
      transaction: string;
      status?: string;
      subscription?: {
        subscriber: {
          code: string;
          email: string;
        };
        plan: {
          name: string;
        };
        status?: string;
        recurrenceNumber?: number;
        accession?: {
          date: string;
        };
      };
    };
    product: {
      id: string;
      name: string;
    };
    commissions?: any[];
    affiliates?: any[];
  };
  event: string;
  id: string;
  creationDate: string;
}

export interface HotmartSubscriptionEvent {
  data: {
    subscription: {
      subscriber: {
        code: string;
        email: string;
        name: string;
      };
      plan: {
        name: string;
      };
      status: string;
      expiresDate?: string;
      cancellationDate?: string;
    };
    product: {
      id: string;
      name: string;
    };
  };
  event: string;
  id: string;
  creationDate: string;
}

type PlanMapping = {
  hotmartProductId: string;
  planType: 'mensal' | 'anual' | 'semestral' | 'lifetime';
  internalPlanName: string;
};

export class HotmartService {
  private prisma: PrismaClient;
  private hotmartApiUrl: string;
  private hotmartWebhookSecret: string;
  private planMappings: PlanMapping[];
  private isSandbox: boolean;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.isSandbox = process.env.HOTMART_SANDBOX === 'true';
    this.hotmartApiUrl = this.isSandbox 
      ? 'https://sandbox.hotmart.com' 
      : 'https://api-sec.hotmart.com';
    
    this.hotmartWebhookSecret = process.env.HOTMART_WEBHOOK_SECRET || '';
    this.planMappings = [
      {
        hotmartProductId: process.env.HOTMART_MENSAL_PRODUCT_ID || '',
        planType: 'mensal',
        internalPlanName: 'pro',
      },
      {
        hotmartProductId: process.env.HOTMART_ANUAL_PRODUCT_ID || '',
        planType: 'anual',
        internalPlanName: 'pro',
      },
      {
        hotmartProductId: process.env.HOTMART_SEMESTRAL_PRODUCT_ID || '',
        planType: 'semestral',
        internalPlanName: 'pro',
      },
    ];

    console.log(`HotmartService inicializado no ambiente: ${this.isSandbox ? 'Sandbox' : 'Produção'} (URL: ${this.hotmartApiUrl})`);
  }

  // Valida a assinatura do webhook da Hotmart
  public verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.hotmartWebhookSecret) {
      console.warn('AVISO: HOTMART_WEBHOOK_SECRET não está configurado. Validação de assinatura desativada.');
      return true;
    }

    try {
      const hmac = crypto.createHmac('sha256', this.hotmartWebhookSecret);
      const expectedSignature = hmac.update(payload).digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Erro ao validar assinatura do webhook:', error);
      return false;
    }
  }

  // Processa os eventos de webhook
  public async processWebhook(
    event: string,
    payload: any,
    signature: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const stringPayload = typeof payload === 'string' 
        ? payload 
        : JSON.stringify(payload);

      // Verificar a assinatura
      const isValidSignature = this.verifyWebhookSignature(stringPayload, signature);
      if (!isValidSignature) {
        await this.logWebhookEvent({
          event,
          status: 'error',
          errorMessage: 'Assinatura inválida',
          rawPayload: payload,
        });
        return { 
          success: false, 
          message: 'Assinatura inválida' 
        };
      }

      // Log do webhook recebido
      await this.logWebhookEvent({
        event,
        status: 'success',
        rawPayload: payload,
      });

      // Processar o evento com base no tipo
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      
      switch (event) {
        case 'PURCHASE_APPROVED':
        case 'PURCHASE_COMPLETE':
        case 'SUBSCRIPTION_REACTIVATED':
          return await this.handleSubscriptionCreatedOrUpdated(data);
        
        case 'SUBSCRIPTION_CANCELLATION':
        case 'SUBSCRIPTION_EXPIRED':
          return await this.handleSubscriptionCanceled(data);
        
        default:
          return { success: true, message: `Evento ${event} recebido, mas não processado` };
      }
    } catch (error) {
      console.error(`Erro ao processar webhook ${event}:`, error);
      await this.logWebhookEvent({
        event,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        rawPayload: payload,
      });
      return { 
        success: false, 
        message: 'Erro ao processar webhook' 
      };
    }
  }

  // Tratar eventos de criação/reativação de assinatura
  private async handleSubscriptionCreatedOrUpdated(data: HotmartPurchaseEvent | HotmartSubscriptionEvent): Promise<{ success: boolean; message: string }> {
    try {
      let subscriberCode: string;
      let email: string;
      let productId: string;

      if ('purchase' in data.data) {
        // É um evento de compra (PURCHASE_*)
        subscriberCode = data.data.purchase.subscription?.subscriber.code || '';
        email = data.data.purchase.subscription?.subscriber.email || '';
        productId = data.data.product.id;
      } else {
        // É um evento de assinatura (SUBSCRIPTION_*)
        subscriberCode = data.data.subscription.subscriber.code;
        email = data.data.subscription.subscriber.email;
        productId = data.data.product.id;
      }

      if (!subscriberCode || !email) {
        return { success: false, message: 'Dados de assinante incompletos' };
      }

      // Mapear o produto Hotmart para o plano interno
      const planMapping = this.planMappings.find(
        mapping => mapping.hotmartProductId === productId
      );

      if (!planMapping) {
        return { success: false, message: `Produto não mapeado: ${productId}` };
      }

      // Calcular data de expiração com base no tipo de plano
      const currentPeriodEnd = this.calculateExpirationDate(planMapping.planType);

      // Verificar se a assinatura já existe
      const existingSubscription = await this.prisma.hotmartSubscription.findUnique({
        where: { subscriberCode },
      });

      if (existingSubscription) {
        // Atualizar assinatura existente
        await this.prisma.hotmartSubscription.update({
          where: { subscriberCode },
          data: {
            status: 'active',
            currentPeriodEnd,
          },
        });

        // Atualizar usuário na plataforma
        await this.updateUserSubscription(email, planMapping.internalPlanName, currentPeriodEnd);

        return { 
          success: true, 
          message: `Assinatura atualizada para ${email}` 
        };
      } else {
        // Criar nova assinatura
        await this.prisma.hotmartSubscription.create({
          data: {
            subscriberCode,
            email,
            planType: planMapping.planType,
            status: 'active',
            currentPeriodEnd,
          },
        });

        // Atualizar ou criar usuário na plataforma
        await this.updateUserSubscription(email, planMapping.internalPlanName, currentPeriodEnd);

        return { 
          success: true, 
          message: `Nova assinatura criada para ${email}` 
        };
      }
    } catch (error) {
      console.error('Erro ao processar criação/atualização de assinatura:', error);
      return { 
        success: false, 
        message: 'Erro ao processar criação/atualização de assinatura' 
      };
    }
  }

  // Tratar eventos de cancelamento de assinatura
  private async handleSubscriptionCanceled(data: HotmartSubscriptionEvent): Promise<{ success: boolean; message: string }> {
    try {
      const subscriberCode = data.data.subscription.subscriber.code;
      const email = data.data.subscription.subscriber.email;

      // Atualizar status da assinatura
      await this.prisma.hotmartSubscription.update({
        where: { subscriberCode },
        data: {
          status: 'canceled',
        },
      });

      // Atualizar usuário na plataforma
      await this.downgradeUserToFree(email);

      return { 
        success: true, 
        message: `Assinatura cancelada para ${email}` 
      };
    } catch (error) {
      console.error('Erro ao processar cancelamento de assinatura:', error);
      return { 
        success: false, 
        message: 'Erro ao processar cancelamento de assinatura' 
      };
    }
  }

  // Calcular a data de expiração com base no tipo de plano
  private calculateExpirationDate(planType: string): Date {
    const now = new Date();
    
    switch (planType) {
      case 'mensal':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'semestral':
        return new Date(now.setMonth(now.getMonth() + 6));
      case 'anual':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      case 'lifetime':
        // Data muito distante no futuro para planos vitalícios
        return new Date(now.setFullYear(now.getFullYear() + 100));
      default:
        return new Date(now.setMonth(now.getMonth() + 1)); // Padrão: mensal
    }
  }

  // Atualizar usuário na plataforma com a nova assinatura
  private async updateUserSubscription(email: string, planType: string, expirationDate: Date): Promise<void> {
    try {
      // Verificar se o usuário existe
      const user = await this.prisma.users.findFirst({
        where: { email },
      });

      if (!user) {
        console.log(`Usuário com email ${email} não encontrado. Criando novo usuário.`);
        // Criar novo usuário se não existir
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);
        
        await this.prisma.users.create({
          data: {
            email,
            username,
            name: email.split('@')[0],
            nivelacesso: 'usuario',
            tipoplano: planType,
            dataassinatura: new Date(),
            dataexpiracao: expirationDate,
            origemassinatura: 'hotmart',
            isactive: true,
            criadoem: new Date(),
            atualizadoem: new Date(),
            emailconfirmed: true
          },
        });
      } else {
        // Atualizar usuário existente
        await this.prisma.users.update({
          where: { id: user.id },
          data: {
            tipoplano: planType,
            dataassinatura: new Date(),
            dataexpiracao: expirationDate,
            origemassinatura: 'hotmart',
            isactive: true,
            atualizadoem: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`Erro ao atualizar usuário ${email}:`, error);
      throw new Error(`Erro ao atualizar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Rebaixar usuário para plano gratuito
  private async downgradeUserToFree(email: string): Promise<void> {
    try {
      // Verificar se o usuário existe
      const user = await this.prisma.users.findFirst({
        where: { email },
      });

      if (user) {
        // Atualizar usuário para plano free
        await this.prisma.users.update({
          where: { id: user.id },
          data: {
            tipoplano: 'free',
            dataexpiracao: new Date(), // Expira imediatamente
            atualizadoem: new Date(),
          },
        });
        console.log(`Usuário ${email} rebaixado para plano free`);
      } else {
        console.log(`Usuário com email ${email} não encontrado para rebaixar`);
      }
    } catch (error) {
      console.error(`Erro ao rebaixar usuário ${email}:`, error);
      throw new Error(`Erro ao rebaixar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Registrar eventos de webhook
  private async logWebhookEvent({
    event,
    transactionId,
    email,
    status,
    errorMessage,
    rawPayload,
  }: {
    event: string;
    transactionId?: string;
    email?: string;
    status: 'success' | 'error';
    errorMessage?: string;
    rawPayload: any;
  }): Promise<void> {
    try {
      // Extrair informações relevantes do payload
      if (!transactionId && typeof rawPayload === 'object') {
        if ('data' in rawPayload && 'purchase' in rawPayload.data && 'transaction' in rawPayload.data.purchase) {
          transactionId = rawPayload.data.purchase.transaction;
        }
      }

      if (!email && typeof rawPayload === 'object') {
        if ('data' in rawPayload) {
          if ('purchase' in rawPayload.data && 
              'subscription' in rawPayload.data.purchase && 
              'subscriber' in rawPayload.data.purchase.subscription &&
              'email' in rawPayload.data.purchase.subscription.subscriber) {
            email = rawPayload.data.purchase.subscription.subscriber.email;
          } else if ('subscription' in rawPayload.data && 
                    'subscriber' in rawPayload.data.subscription &&
                    'email' in rawPayload.data.subscription.subscriber) {
            email = rawPayload.data.subscription.subscriber.email;
          }
        }
      }

      // Registrar log no banco de dados
      await this.prisma.hotmartWebhookLog.create({
        data: {
          event,
          transactionId,
          email,
          status,
          errorMessage,
          rawPayload: typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload,
        },
      });
    } catch (error) {
      console.error('Erro ao registrar log de webhook:', error);
    }
  }

  // Obter logs recentes de webhook
  public async getRecentWebhookLogs(limit = 100) {
    return await this.prisma.hotmartWebhookLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Obter assinaturas ativas
  public async getActiveSubscriptions() {
    return await this.prisma.hotmartSubscription.findMany({
      where: {
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}