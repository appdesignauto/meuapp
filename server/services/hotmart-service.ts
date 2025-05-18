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
  private async handleSubscriptionCreatedOrUpdated(data: any): Promise<{ success: boolean; message: string }> {
    try {
      // Extrair informações básicas do payload
      let subscriberCode: string = '';
      let email: string = '';
      let productId: string = '';
      let offerCode: string | null = null;
      let planName: string | null = null;
      let transactionId: string | null = null;
      
      console.log('Analisando estrutura do webhook para extrair dados do assinante...');
      console.log('Payload para diagnóstico:', JSON.stringify(data, null, 2));
      
      // Verificamos se estamos processando o formato correto da Hotmart v2.0.0
      if (data.version === '2.0.0') {
        console.log('✅ Processando webhook da Hotmart v2.0.0');
        
        // Extrair ID do produto
        if (data.data.product?.id) {
          productId = String(data.data.product.id); // Convertemos para string para consistência
          console.log(`✅ Product ID extraído: ${productId}`);
        }
        
        // Extrair código do assinante
        if (data.data.subscription?.subscriber?.code) {
          subscriberCode = data.data.subscription.subscriber.code;
          console.log(`✅ Subscriber Code extraído: ${subscriberCode}`);
        }
        
        // Extrair e-mail do comprador
        if (data.data.buyer?.email) {
          email = data.data.buyer.email;
          console.log(`✅ Email extraído: ${email}`);
        }
        
        // Extrair código da oferta (offerCode)
        if (data.data.purchase?.offer?.code) {
          offerCode = data.data.purchase.offer.code;
          console.log(`✅ Offer Code extraído: ${offerCode}`);
        }
        
        // Extrair nome do plano
        if (data.data.subscription?.plan?.name) {
          planName = data.data.subscription.plan.name;
          console.log(`✅ Nome do plano extraído: ${planName}`);
        }
        
        // Extrair ID da transação
        if (data.data.purchase?.transaction) {
          transactionId = data.data.purchase.transaction;
          console.log(`✅ Transaction ID extraído: ${transactionId}`);
        }
      } 
      // Formato anterior/legado - Tentamos extrair dos campos conhecidos
      else {
        console.log('⚠️ Formato de webhook não é v2.0.0, tentando formatos alternativos...');
        
        // Extrair ID do produto
        if (typeof data.data.product?.id !== 'undefined') {
          productId = String(data.data.product.id);
          console.log(`✅ Product ID extraído: ${productId}`);
        }
        
        // Extrair código do assinante - várias possibilidades
        if (data.data.subscription?.subscriber?.code) {
          subscriberCode = data.data.subscription.subscriber.code;
          console.log(`✅ Subscriber Code extraído de data.subscription: ${subscriberCode}`);
        } else if (data.data.purchase?.subscription?.subscriber?.code) {
          subscriberCode = data.data.purchase.subscription.subscriber.code;
          console.log(`✅ Subscriber Code extraído de data.purchase.subscription: ${subscriberCode}`);
        }
        
        // Extrair email - várias possibilidades
        if (data.data.buyer?.email) {
          email = data.data.buyer.email;
          console.log(`✅ Email extraído de data.buyer: ${email}`);
        } else if (data.data.subscription?.subscriber?.email) {
          email = data.data.subscription.subscriber.email;
          console.log(`✅ Email extraído de data.subscription.subscriber: ${email}`);
        } else if (data.data.purchase?.buyer?.email) {
          email = data.data.purchase.buyer.email;
          console.log(`✅ Email extraído de data.purchase.buyer: ${email}`);
        } else if (data.data.purchase?.subscription?.subscriber?.email) {
          email = data.data.purchase.subscription.subscriber.email;
          console.log(`✅ Email extraído de data.purchase.subscription.subscriber: ${email}`);
        }
        
        // Se ainda não temos o código do assinante mas temos o email, podemos usar o email como código
        if (!subscriberCode && email) {
          subscriberCode = email;
          console.log(`⚠️ Usando email como subscriber code: ${subscriberCode}`);
        }
        
        // Extrair código da oferta (offerCode)
        if (data.data.purchase?.offer?.code) {
          offerCode = data.data.purchase.offer.code;
          console.log(`✅ Offer Code extraído de data.purchase.offer.code: ${offerCode}`);
        } else if (data.data.purchase?.offer_code) {
          offerCode = data.data.purchase.offer_code;
          console.log(`✅ Offer Code extraído de data.purchase.offer_code: ${offerCode}`);
        }
        
        // Extrair ID da transação
        if (data.data.purchase?.transaction) {
          transactionId = data.data.purchase.transaction;
          console.log(`✅ Transaction ID extraído: ${transactionId}`);
        }
      }
      
      console.log(`Resumo dos dados extraídos:
        - productId: ${productId}
        - email: ${email}
        - subscriberCode: ${subscriberCode}
        - offerCode: ${offerCode}
        - planName: ${planName}
        - transactionId: ${transactionId}
      `);
      
      if (!subscriberCode || !email) {
        console.log('❌ Falha na extração de dados: Estrutura do webhook não contém dados de assinante no formato esperado.');
        return { success: false, message: 'Dados de assinante incompletos' };
      }
      
      if (!productId) {
        console.log('❌ Falha na extração de dados: ID do produto não encontrado.');
        return { success: false, message: 'ID do produto não encontrado' };
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
      
      // Converter productId para string para garantir compatibilidade com o banco
      const productIdStr = String(productId);
      console.log(`Convertendo productId para string: ${productIdStr}`);
      
      // Buscar mapeamento usando a lógica recomendada em OR
      let productMapping = null;
      
      productMapping = await this.prisma.hotmartProductMapping.findFirst({
        where: {
          OR: [
            // Opção 1: Procurar por offerId específico (prioridade)
            {
              productId: productIdStr,
              offerId: offerCode,
              isActive: true
            },
            // Opção 2: Procurar por offerCode específico (alternativa)
            {
              productId: productIdStr, 
              offerCode: offerCode,
              isActive: true
            },
            // Opção 3: Procurar apenas por productId (fallback)
            {
              productId: productIdStr,
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
      
      // Verificar se a assinatura já existe - usando o nome correto da tabela no banco de dados
      const existingSubscription = await this.prisma.$queryRaw`
        SELECT * FROM "hotmart_subscription" 
        WHERE "subscriber_code" = ${subscriberCode} 
        LIMIT 1
      `;

      // existingSubscription será um array, mesmo com apenas um resultado
      if (existingSubscription && Array.isArray(existingSubscription) && existingSubscription.length > 0) {
        console.log(`Atualizando assinatura existente para ${email}`);
        
        try {
          // Atualizar assinatura existente usando SQL direto com nomes de colunas em snake_case
          await this.prisma.$executeRaw`
            UPDATE "hotmart_subscription"
            SET 
              "status" = 'active',
              "plan_type" = ${productMapping.planType},
              "current_period_end" = ${currentPeriodEnd},
              "updated_at" = ${new Date()}
            WHERE "id" = ${existingSubscription[0].id}
          `;
          
          console.log(`✅ Assinatura atualizada com sucesso no banco de dados.`);
        } catch (error) {
          console.error('Erro ao atualizar assinatura:', error);
          return { 
            success: false, 
            message: `Erro ao atualizar assinatura: ${error.message}` 
          };
        }

        // Atualizar usuário na plataforma
        await this.updateUserSubscription(email, productMapping.planType, currentPeriodEnd);

        return { 
          success: true, 
          message: `Assinatura atualizada para ${email}` 
        };
      } else {
        console.log(`Criando nova assinatura para ${email}`);
        
        try {
          // Usar uma abordagem mais simples deixando o PostgreSQL usar os valores padrão
          const query = `
            INSERT INTO hotmart_subscription 
            (subscriber_code, email, plan_type, status, current_period_end)
            VALUES 
            ($1, $2, $3, $4, $5)
          `;
          
          const values = [
            subscriberCode,
            email,
            productMapping.planType,
            'active',
            currentPeriodEnd
          ];
          
          // Executar a query diretamente
          await this.prisma.$executeRawUnsafe(query, ...values);
          
          console.log(`✅ Nova assinatura criada com sucesso no banco de dados.`);
        } catch (error) {
          console.error('Erro ao criar assinatura:', error);
          return { 
            success: false, 
            message: `Erro ao criar assinatura: ${error.message}` 
          };
        }

        // Registrar apenas o sucesso da criação da assinatura sem tentar atualizar o usuário por enquanto
        console.log(`✅ Assinatura foi criada com sucesso para ${email}, pulando atualização de usuário.`);

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
      // Verificar se o usuário existe usando SQL direto
      const users = await this.prisma.$queryRaw`
        SELECT id, email, username, name FROM users 
        WHERE email = ${email} 
        LIMIT 1
      `;
      
      const user = Array.isArray(users) && users.length > 0 ? users[0] : null;

      if (!user) {
        console.log(`Usuário com email ${email} não encontrado. Criando novo usuário.`);
        // Criar novo usuário se não existir
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);
        
        // Criar usando SQL direto
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO users (
            username, email, name, nivelacesso, tipoplano, 
            dataassinatura, dataexpiracao, origemassinatura, 
            isactive, criadoem, atualizadoem, emailconfirmed, role
          ) VALUES (
            $1, $2, $3, $4, $5, 
            $6, $7, $8, 
            $9, $10, $11, $12, $13
          )
        `, 
        username, 
        email, 
        email.split('@')[0], 
        'usuario', 
        planType,
        new Date(), 
        expirationDate, 
        'hotmart',
        true, 
        new Date(), 
        new Date(), 
        true,
        'user' // role padrão para novos usuários
        );
        console.log(`✅ Novo usuário ${username} criado com sucesso!`);
      } else {
        // Atualizar usuário existente usando SQL direto
        await this.prisma.$executeRawUnsafe(`
          UPDATE users 
          SET 
            tipoplano = $1,
            dataassinatura = $2,
            dataexpiracao = $3,
            origemassinatura = $4,
            isactive = $5,
            atualizadoem = $6
          WHERE id = $7
        `, 
        planType, 
        new Date(), 
        expirationDate, 
        'hotmart', 
        true, 
        new Date(), 
        user.id
        );
        console.log(`✅ Usuário ${user.username || user.email} atualizado com sucesso!`);
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