/**
 * Serviço para gerenciamento de assinaturas
 * Centraliza a lógica de criação e gerenciamento de assinaturas
 * vindas de diferentes fontes (Hotmart, Doppus, etc)
 */

import { db } from '../db';
import { subscriptions, users } from '@shared/schema';
import { eq, lt, and, isNull } from 'drizzle-orm';

export class SubscriptionService {
  /**
   * Verifica e atualiza assinaturas expiradas
   * Rebaixa usuários com assinaturas expiradas para o plano free
   * @returns Número de usuários rebaixados
   */
  static async checkExpiredSubscriptions(): Promise<number> {
    try {
      console.log('[SubscriptionService] Verificando assinaturas expiradas...');
      
      const now = new Date();
      
      // Buscar todas as assinaturas expiradas que ainda não foram atualizadas
      const expiredSubscriptions = await db.query.subscriptions.findMany({
        where: and(
          lt(subscriptions.endDate, now),
          eq(subscriptions.status, 'active')
        )
      });
      
      console.log(`[SubscriptionService] Encontradas ${expiredSubscriptions.length} assinaturas expiradas`);
      
      let downgradedCount = 0;
      
      // Processar cada assinatura expirada
      for (const subscription of expiredSubscriptions) {
        try {
          // Atualizar status da assinatura
          await db.update(subscriptions)
            .set({
              status: 'expired',
              updatedAt: now
            })
            .where(eq(subscriptions.id, subscription.id));
          
          // Rebaixar usuário para plano free
          await db.update(users)
            .set({
              tipoplano: 'free',
              dataexpiracao: null,
              atualizadoem: now
            })
            .where(eq(users.id, subscription.userId));
          
          downgradedCount++;
          
          console.log(`[SubscriptionService] Usuário ${subscription.userId} rebaixado para free`);
        } catch (error) {
          console.error(`[SubscriptionService] Erro ao processar assinatura ${subscription.id}:`, error);
        }
      }
      
      console.log(`[SubscriptionService] Total de usuários rebaixados: ${downgradedCount}`);
      return downgradedCount;
    } catch (error) {
      console.error('[SubscriptionService] Erro ao verificar assinaturas expiradas:', error);
      return 0;
    }
  }
  /**
   * Cria ou atualiza assinatura baseada em informações de webhook
   * @param email Email do usuário
   * @param planType Tipo de plano (mensal, anual, etc)
   * @param source Fonte da assinatura (hotmart, doppus, admin)
   * @param transactionId ID da transação
   * @param startDate Data de início (opcional)
   * @param endDate Data de término (opcional)
   * @param userName Nome do usuário (opcional)
   */
  static async createOrUpdateSubscription(
    email: string, 
    planType: string, 
    source: string, 
    transactionId: string,
    startDate?: Date,
    endDate?: Date,
    userName?: string
  ) {
    console.log(`🔄 Criando/atualizando assinatura: ${email}, ${planType}, ${source}, ${transactionId}`);
    
    try {
      // 1. Verificar se usuário existe, se não criar
      let user = await this.getOrCreateUser(email, userName);
      
      // 2. Criar ou atualizar assinatura
      const now = new Date();
      
      // Data padrão de expiração: 30 dias para plano mensal, 365 para anual
      let expirationDate = endDate;
      if (!expirationDate) {
        if (planType === 'anual') {
          expirationDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        } else if (planType === 'semestral') {
          expirationDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        } else {
          // default: mensal
          expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
      }
      
      // Verificar se já existe assinatura para este usuário
      const existingSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id)
      });
      
      if (existingSubscription) {
        // Atualizar assinatura existente
        console.log(`🔄 Atualizando assinatura existente ID: ${existingSubscription.id}`);
        
        await db.update(subscriptions)
          .set({
            planType: planType,
            source: source,
            transactionId: transactionId,
            startDate: startDate || now,
            endDate: expirationDate,
            isActive: true,
            updatedAt: now
          })
          .where(eq(subscriptions.id, existingSubscription.id));
          
        console.log(`✅ Assinatura atualizada para: ${planType}, expira em: ${expirationDate.toISOString()}`);
      } else {
        // Criar nova assinatura
        console.log(`🔄 Criando nova assinatura para usuário ID: ${user.id}`);
        
        await db.insert(subscriptions)
          .values({
            userId: user.id,
            planType: planType,
            source: source,
            transactionId: transactionId,
            startDate: startDate || now,
            endDate: expirationDate,
            isActive: true,
            createdAt: now,
            updatedAt: now
          });
          
        console.log(`✅ Nova assinatura criada: ${planType}, expira em: ${expirationDate.toISOString()}`);
      }
      
      // 3. Atualizar perfil do usuário para nível premium
      await db.update(users)
        .set({
          nivelacesso: 'premium',
          tipoplano: planType,
          dataassinatura: startDate || now,
          dataexpiracao: expirationDate,
          origemassinatura: source,
          isactive: true,
          atualizadoem: now
        })
        .where(eq(users.id, user.id));
      
      console.log(`✅ Usuário ${email} atualizado para nível premium, plano ${planType}`);
      
      return {
        success: true,
        message: `Assinatura ${planType} ativada com sucesso para ${email}`,
        expirationDate
      };
    } catch (error) {
      console.error(`❌ Erro ao criar/atualizar assinatura:`, error);
      throw error;
    }
  }
  
  /**
   * Cancela uma assinatura de usuário
   * @param email Email do usuário
   * @param options Opções do cancelamento (motivo, data, etc.)
   */
  static async cancelSubscription(email: string, options?: {
    reason?: string;
    source?: string;
    subscriptionId?: string;
    cancellationDate?: Date;
    webhookData?: string;
  }) {
    console.log(`🔄 Cancelando assinatura para usuário: ${email}`);
    
    try {
      // 1. Encontrar usuário
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (!user) {
        console.log(`❌ Usuário não encontrado para cancelamento: ${email}`);
        throw new Error(`Usuário não encontrado: ${email}`);
      }
      
      // 2. Encontrar e cancelar assinatura
      let subscription;
      
      // Se tiver o ID da assinatura externa, tenta verificar por ele
      if (options?.subscriptionId) {
        console.log(`🔍 Procurando assinatura por ID externo: ${options.subscriptionId}`);
        subscription = await db.query.subscriptions.findFirst({
          where: and(
            eq(subscriptions.userId, user.id),
            eq(subscriptions.transactionid, options.subscriptionId)
          )
        });
      }
      
      // Se não achou por ID externo, busca por usuário
      if (!subscription) {
        subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.userId, user.id)
        });
      }
      
      if (!subscription) {
        console.log(`❌ Assinatura não encontrada para usuário: ${email}`);
        throw new Error(`Assinatura não encontrada para: ${email}`);
      }
      
      const now = options?.cancellationDate || new Date();
      
      // 3. Marcar assinatura como cancelada
      await db.update(subscriptions)
        .set({
          status: 'cancelled',
          lastevent: 'subscription_cancellation',
          webhookData: options?.webhookData || null,
          updatedAt: now
        })
        .where(eq(subscriptions.id, subscription.id));
      
      // 4. Atualizar perfil de usuário
      // Manteremos o nível de acesso premium até a data de expiração
      await db.update(users)
        .set({
          atualizadoem: now
        })
        .where(eq(users.id, user.id));
      
      console.log(`✅ Assinatura cancelada para usuário: ${email}`);
      
      return {
        success: true,
        message: `Assinatura cancelada com sucesso para ${email}`
      };
    } catch (error) {
      console.error(`❌ Erro ao cancelar assinatura:`, error);
      throw error;
    }
  }
  
  /**
   * Encontra um usuário por email ou cria um novo
   * @param email Email do usuário
   * @param name Nome do usuário (opcional)
   */
  static async getOrCreateUser(email: string, name?: string) {
    try {
      // Verificar se o usuário já existe
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (existingUser) {
        console.log(`✅ Usuário encontrado: ${existingUser.id} (${email})`);
        return existingUser;
      }
      
      console.log(`🔄 Criando novo usuário: ${email}`);
      
      // Criar um nome de usuário único baseado no email
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      
      // Criar um novo usuário
      const now = new Date();
      const [newUser] = await db.insert(users)
        .values({
          email,
          username: username,
          name: name || username,
          profileimageurl: '/images/avatar-placeholder.png',
          nivelacesso: 'free',
          role: 'user',
          isactive: true,
          criadoem: now,
          atualizadoem: now
        })
        .returning();
      
      console.log(`✅ Novo usuário criado: ${newUser.id} (${email})`);
      return newUser;
    } catch (error) {
      console.error(`❌ Erro ao buscar/criar usuário:`, error);
      throw error;
    }
  }

  /**
   * Processa um webhook da Hotmart
   * Esta função serve como ponte entre a requisição webhook e o HotmartService
   * @param webhookData Dados do webhook recebido da Hotmart
   */
  static async processHotmartWebhook(webhookData: any) {
    console.log('🔄 SubscriptionService.processHotmartWebhook iniciado');
    try {
      // Importar o HotmartService dinamicamente
      // Esta abordagem resolve problemas de circular dependency entre os módulos
      const { HotmartService } = await import('./hotmart-service');
      
      // Extrair email e eventType
      let email = null;
      if (webhookData?.data?.buyer?.email) {
        email = webhookData.data.buyer.email;
      } else if (webhookData?.buyer?.email) {
        email = webhookData.buyer.email;
      } else if (webhookData?.data?.subscriber?.email) {
        email = webhookData.data.subscriber.email;
      } else if (webhookData?.subscriber?.email) {
        email = webhookData.subscriber.email;
      }
      
      const eventType = webhookData?.event || 'UNKNOWN';
      
      if (!email) {
        throw new Error('Email não encontrado no webhook');
      }
      
      console.log(`📧 Email extraído: ${email}, Evento: ${eventType}`);
      
      // Processar com base no tipo de evento
      let result;
      switch (eventType) {
        case 'PURCHASE_APPROVED':
        case 'SUBSCRIPTION_CREATED':
        case 'PURCHASE_COMPLETE':
          result = await HotmartService.processPurchase(webhookData, email);
          break;
        
        case 'SUBSCRIPTION_CANCELLED':
        case 'SUBSCRIPTION_CANCELLATION':  // Adicionando o formato correto usado pela Hotmart
          result = await HotmartService.processCancellation(webhookData, email);
          break;
        
        case 'PURCHASE_REFUNDED':
        case 'PURCHASE_CHARGEBACK':
        case 'SUBSCRIPTION_REFUNDED':
          result = await HotmartService.processRefund(webhookData, email);
          break;
        
        case 'SUBSCRIPTION_RENEWED':
          result = await HotmartService.processRenewal(webhookData, email);
          break;
        
        default:
          console.log(`⚠️ Evento não processado: ${eventType}`);
          return { success: false, message: `Evento não suportado: ${eventType}` };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro no processamento do webhook Hotmart:', error);
      throw error;
    }
  }
}