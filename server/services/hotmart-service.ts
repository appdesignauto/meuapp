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
      // Se estamos em ambiente de desenvolvimento ou sandbox, aceitar qualquer assinatura
      if (this.isSandbox || process.env.NODE_ENV === 'development') {
        console.log('🔄 Ambiente de desenvolvimento/sandbox detectado. Aceitando webhook sem validação de assinatura.');
        return true;
      }

      const hmac = crypto.createHmac('sha256', this.hotmartWebhookSecret);
      const expectedSignature = hmac.update(payload).digest('hex');
      
      // Método seguro usando comparação simples (para evitar erros de comprimento)
      if (expectedSignature === signature) {
        return true;
      }
      
      // Verificar com método inseguro (para debug) se houver erro na comparação acima
      console.warn('⚠️ Comparação de assinatura falhou. Assinaturas:', { 
        esperada: expectedSignature, 
        recebida: signature 
      });
      
      return false;
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
      // Extrair informações básicas do payload
      let subscriberCode: string;
      let email: string;
      let productId: string;
      let offerCode: string | null = null;
      let planName: string | null = null;

      // Extrair informações com maior flexibilidade para acomodar diferentes estruturas de webhook

      // Primeiro, tentamos encontrar o ID do produto
      productId = data.data.product?.id || '';
      
      console.log('Analisando estrutura do webhook para extrair dados do assinante...');
      
      // Tentativa 1: Formato padrão de evento de compra
      if ('purchase' in data.data && data.data.purchase.subscription?.subscriber) {
        console.log('Tentativa 1: Verificando estrutura padrão de PURCHASE com subscription');
        subscriberCode = data.data.purchase.subscription?.subscriber.code || '';
        email = data.data.purchase.subscription?.subscriber.email || '';
        planName = data.data.purchase.subscription?.plan?.name || null;
      } 
      // Tentativa 2: Formato padrão de evento de assinatura
      else if ('subscription' in data.data && data.data.subscription.subscriber) {
        console.log('Tentativa 2: Verificando estrutura padrão de SUBSCRIPTION');
        subscriberCode = data.data.subscription.subscriber.code || '';
        email = data.data.subscription.subscriber.email || '';
        planName = data.data.subscription.plan?.name || null;
      }
      
      // Tentativa 3: Formato com buyer diretamente na raiz
      if ((!email || !subscriberCode) && 'buyer' in data.data) {
        console.log('Tentativa 3: Verificando estrutura com buyer na raiz');
        email = email || data.data.buyer.email || '';
        subscriberCode = subscriberCode || data.data.buyer.email || '';
      }
      
      // Tentativa 4: Formato com buyer dentro de purchase
      if ((!email || !subscriberCode) && 'purchase' in data.data && 'buyer' in data.data.purchase) {
        console.log('Tentativa 4: Verificando estrutura com buyer dentro de purchase');
        email = email || data.data.purchase.buyer.email || '';
        subscriberCode = subscriberCode || data.data.purchase.buyer.email || '';
      }
      
      console.log(`Dados extraídos: productId=${productId}, email=${email}, subscriberCode=${subscriberCode}`);
      
      if (!subscriberCode || !email) {
        console.log('Falha na extração de dados: Estrutura do webhook não contém dados de assinante no formato esperado.');
        console.log('Payload completo:', JSON.stringify(data, null, 2));
        return { success: false, message: 'Dados de assinante incompletos' };
      }

      // Extrair offerCode do payload com mais logs de diagnóstico
      console.log(`Payload detalhado para diagnóstico:`, JSON.stringify(data, null, 2));
      
      if ('purchase' in data.data) {
        console.log(`Estrutura de purchase encontrada:`, JSON.stringify(data.data.purchase, null, 2));
        
        // Verificar várias possibilidades de onde o código da oferta pode estar
        if (data.data.purchase.offer?.code) {
          offerCode = data.data.purchase.offer.code;
          console.log(`✅ Extraído offerCode "${offerCode}" de data.purchase.offer.code`);
        } else if (data.data.purchase.offer_code) {
          offerCode = data.data.purchase.offer_code;
          console.log(`✅ Extraído offerCode "${offerCode}" de data.purchase.offer_code`);
        } else if (data.data.purchase.offer_key) {
          offerCode = data.data.purchase.offer_key;
          console.log(`✅ Extraído offerCode "${offerCode}" de data.purchase.offer_key`);
        } else {
          console.log(`⚠️ Nenhum código de oferta encontrado em purchase`);
        }
      } else {
        console.log(`⚠️ Estrutura de purchase não encontrada no payload`);
      }
      
      // Fallback: extrair do nome do plano se não vier no payload
      if (!offerCode && planName && planName.includes('-')) {
        const parts = planName.split('-');
        offerCode = parts[parts.length - 1].trim();
        console.log(`✅ Extraído offerCode "${offerCode}" do nome do plano: ${planName}`);
      }
      
      console.log(`Buscando mapeamento para produto ${productId}${offerCode ? ` com offerCode/offerId ${offerCode}` : ''}`);
      
      // Buscar mapeamento usando a lógica recomendada em OR
      let productMapping = null;
      
      productMapping = await this.prisma.hotmartProductMapping.findFirst({
        where: {
          OR: [
            // Opção 1: Procurar por offerId específico (prioridade)
            {
              productId,
              offerId: offerCode,
              isActive: true
            },
            // Opção 2: Procurar por offerCode específico (alternativa)
            {
              productId, 
              offerCode: offerCode,
              isActive: true
            },
            // Opção 3: Procurar apenas por productId (fallback)
            {
              productId,
              isActive: true,
              OR: [
                { offerId: null },
                { offerId: '' }
              ]
            }
          ]
        }
      });
      
      console.log("Resultado da busca de mapeamento:", productMapping);
      
      // Último recurso: buscar qualquer mapeamento para este produto, mesmo que inativo
      if (!productMapping) {
        console.log('Último recurso: buscando qualquer mapeamento para este produto...');
        productMapping = await this.prisma.hotmartProductMapping.findFirst({
          where: {
            productId
          }
        });
        
        if (productMapping && !productMapping.isActive) {
          console.warn(`⚠️ Encontrado mapeamento inativo para o produto ${productId}. O ideal é ativá-lo no painel.`);
        }
      }
      
      // Se ainda não encontrou, não há mapeamento para este produto
      if (!productMapping) {
        console.warn(`⚠️ Produto ${productId} não mapeado no sistema`);
        return { 
          success: false, 
          message: `Produto ${productId} não mapeado no sistema` 
        };
      }
      
      console.log(`✅ Mapeamento encontrado:`, productMapping);
      
      // Calcular data de expiração baseado na duração configurada
      const currentPeriodEnd = this.calculateExpirationDateFromDays(productMapping.durationDays);
      
      // Verificar se a assinatura já existe
      const existingSubscription = await this.prisma.hotmartSubscription.findFirst({
        where: { 
          subscriberCode
        }
      });

      if (existingSubscription) {
        console.log(`Atualizando assinatura existente para ${email}`);
        
        // Atualizar assinatura existente
        await this.prisma.hotmartSubscription.update({
          where: { 
            id: existingSubscription.id 
          },
          data: {
            status: 'active',
            productId,
            planType: productMapping.planType,
            startDate: new Date(),
            endDate: currentPeriodEnd,
            updatedAt: new Date()
          },
        });

        // Atualizar usuário na plataforma
        await this.updateUserSubscription(email, productMapping.planType, currentPeriodEnd);

        return { 
          success: true, 
          message: `Assinatura atualizada para ${email}` 
        };
      } else {
        console.log(`Criando nova assinatura para ${email}`);
        
        // Criar nova assinatura
        await this.prisma.hotmartSubscription.create({
          data: {
            subscriberCode,
            email,
            productId,
            planType: productMapping.planType,
            status: 'active',
            startDate: new Date(),
            endDate: currentPeriodEnd
          },
        });

        // Atualizar ou criar usuário na plataforma
        await this.updateUserSubscription(email, productMapping.planType, currentPeriodEnd);

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
  // (mantido para compatibilidade)
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
  
  // Calcular a data de expiração com base no número de dias
  private calculateExpirationDateFromDays(days: number): Date {
    const now = new Date();
    
    // Verificar se é plano vitalício (dias > 100 anos)
    if (days > 36500) { // mais de 100 anos = vitalício
      return new Date(now.setFullYear(now.getFullYear() + 100));
    }
    
    // Calcular data de expiração adicionando os dias
    const expirationDate = new Date(now);
    expirationDate.setDate(expirationDate.getDate() + days);
    
    console.log(`Calculada data de expiração: ${expirationDate.toISOString()} (${days} dias a partir de hoje)`);
    
    return expirationDate;
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
    rawPayload,
  }: {
    event: string;
    transactionId?: string;
    email?: string;
    status: 'success' | 'error';
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