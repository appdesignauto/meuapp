import { db } from "../db";
import { eq, and, lte, sql } from "drizzle-orm";
import { users, subscriptions } from "@shared/schema";
import { HotmartService } from "./hotmart-service";

/**
 * Serviço responsável por gerenciar assinaturas de usuários
 */
export class SubscriptionService {
  
  /**
   * Cria ou atualiza uma assinatura para um usuário
   * @param userId ID do usuário
   * @param planType Tipo de plano (mensal, anual, vitalicio, personalizado)
   * @param startDate Data de início da assinatura
   * @param endDate Data de expiração da assinatura
   * @param origin Origem da assinatura (manual, hotmart_auto, hotmart_webhook)
   */
  static async createOrUpdateSubscription(
    userId: number, 
    planType: string,
    startDate: Date = new Date(),
    endDate: Date | null = null,
    origin: string = 'manual'
  ) {
    try {
      // Registrar os dados recebidos para depuração
      console.log(`[SubscriptionService] Criando/atualizando assinatura para usuário ${userId}:`, {
        planType, 
        startDate,
        endDate,
        origin
      });
      
      // 1. Atualizar os dados do usuário para refletir o status premium
      const isLifetime = planType === 'vitalicio';
      
      // Consultar dados atuais do usuário antes da atualização (para debug)
      const [userBefore] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      console.log(`[SubscriptionService] Dados do usuário ${userId} antes da atualização:`, {
        nivelacesso: userBefore.nivelacesso,
        tipoplano: userBefore.tipoplano,
        acessovitalicio: userBefore.acessovitalicio
      });
      
      // Atualizar dados do usuário
      await db.update(users)
        .set({
          role: 'premium',
          nivelacesso: 'premium',
          tipoplano: planType,
          origemassinatura: origin,
          dataassinatura: startDate,
          dataexpiracao: isLifetime ? null : endDate, // Nulo para assinaturas vitalícias
          acessovitalicio: isLifetime,
          updatedat: new Date()
        })
        .where(eq(users.id, userId));
      
      // 2. Verificar se já existe uma assinatura para este usuário
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));
        
      if (existingSubscription.length > 0) {
        // Atualizar assinatura existente
        await db
          .update(subscriptions)
          .set({
            planType,
            status: "active",
            startDate: startDate,
            endDate: endDate,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.userId, userId));
      } else {
        // Criar nova assinatura
        await db
          .insert(subscriptions)
          .values({
            userId,
            planType,
            status: "active",
            startDate: startDate,
            endDate,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
      
      return {
        userId,
        planType,
        status: 'active',
        message: existingSubscription.length > 0 ? 'Assinatura atualizada com sucesso' : 'Nova assinatura criada com sucesso'
      };
    } catch (error) {
      console.error("Erro ao criar/atualizar assinatura:", error);
      throw error;
    }
  }
  
  /**
   * Verifica assinaturas expiradas e rebaixa usuários
   * Verifica na Hotmart antes de rebaixar
   * @returns Número de usuários rebaixados
   */
  static async checkExpiredSubscriptions() {
    const now = new Date();
    let downgradeCount = 0;
    let renewedCount = 0;
    let errorCount = 0;
    
    try {
      // 1. Encontrar usuários com assinaturas expiradas na tabela users
      const usersWithExpiredSubscriptions = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          dataexpiracao: users.dataexpiracao,
          tipoplano: users.tipoplano
        })
        .from(users)
        .where(
          and(
            eq(users.nivelacesso, "premium"),
            eq(users.acessovitalicio, false),
            sql`${users.dataexpiracao} IS NOT NULL`,
            sql`${users.dataexpiracao} <= now()` // Data de expiração no passado
          )
        );
      
      console.log(`Encontrados ${usersWithExpiredSubscriptions.length} usuários com assinaturas expiradas`);
      
      // 2. Para cada usuário, verificar se tem assinatura ativa na Hotmart
      for (const user of usersWithExpiredSubscriptions) {
        try {
          // Se tem email, verificar na Hotmart
          if (user.email) {
            const hasActiveHotmartSubscription = await this.checkHotmartSubscription(user.email);
            
            if (hasActiveHotmartSubscription) {
              // Se tem assinatura ativa na Hotmart, renovar no sistema
              console.log(`Usuário ${user.username} (${user.email}) tem assinatura ativa na Hotmart. Renovando...`);
              
              // Calcular nova data de expiração baseada no tipo de plano
              let newEndDate: Date | null = null;
              
              switch (user.tipoplano) {
                case 'mensal':
                  newEndDate = new Date();
                  newEndDate.setMonth(newEndDate.getMonth() + 1);
                  break;
                case 'anual':
                  newEndDate = new Date();
                  newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                  break;
                case 'vitalicio':
                  newEndDate = null; // Vitalício não tem data de expiração
                  break;
                case 'personalizado':
                default:
                  // Para personalizado ou indefinido, estender por 30 dias
                  newEndDate = new Date();
                  newEndDate.setDate(newEndDate.getDate() + 30);
              }
              
              // Renovar assinatura
              await this.createOrUpdateSubscription(
                user.id,
                user.tipoplano || 'mensal',
                new Date(),
                newEndDate,
                'hotmart_auto'
              );
              
              renewedCount++;
              continue; // Pular para o próximo usuário
            }
          }
          
          // Se não tem email ou não tem assinatura ativa na Hotmart, rebaixar
          await db
            .update(users)
            .set({
              nivelacesso: "usuario",
              role: "free",
              tipoplano: null,
              origemassinatura: null,
              dataassinatura: null,
              dataexpiracao: null,
              acessovitalicio: false,
              updatedat: new Date()
            })
            .where(eq(users.id, user.id));
          
          // Atualizar status da assinatura
          await db
            .update(subscriptions)
            .set({
              status: "expired",
              updatedAt: new Date()
            })
            .where(eq(subscriptions.userId, user.id));
          
          console.log(`Usuário ${user.username} (${user.email || 'sem email'}) rebaixado para free - assinatura expirada`);
          downgradeCount++;
        } catch (error) {
          console.error(`Erro ao processar usuário ${user.username}:`, error);
          errorCount++;
        }
      }
      
      // 3. Atualizar status de assinaturas expiradas na tabela subscriptions
      const expiredSubscriptions = await db
        .select({
          userId: subscriptions.userId
        })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, "active"),
            sql`${subscriptions.endDate} IS NOT NULL`,
            sql`${subscriptions.endDate} <= now()` // Data de expiração no passado
          )
        );
      
      for (const subscription of expiredSubscriptions) {
        await db
          .update(subscriptions)
          .set({
            status: "expired",
            updatedAt: new Date()
          })
          .where(eq(subscriptions.userId, subscription.userId));
      }
      
      console.log(`Resultado da verificação de assinaturas:`);
      console.log(`- Usuários rebaixados: ${downgradeCount}`);
      console.log(`- Usuários renovados via Hotmart: ${renewedCount}`);
      console.log(`- Erros de processamento: ${errorCount}`);
      
      return downgradeCount;
    } catch (error) {
      console.error("Erro ao verificar assinaturas expiradas:", error);
      throw error;
    }
  }
  
  /**
   * Verifica se um usuário tem assinatura ativa na Hotmart
   * @param email Email do usuário
   * @returns true se tiver assinatura ativa na Hotmart
   */
  static async checkHotmartSubscription(email: string): Promise<boolean> {
    try {
      // Verificar se o serviço da Hotmart está inicializado
      if (!process.env.HOTMART_CLIENT_ID || !process.env.HOTMART_CLIENT_SECRET) {
        console.log('Credenciais da Hotmart não configuradas, ignorando verificação');
        return false;
      }
      
      console.log(`Verificando assinatura na Hotmart para e-mail: ${email}`);
      
      // Verificar se há assinatura ativa na Hotmart
      const hasActiveSubscription = await HotmartService.hasActiveSubscription(email);
      
      console.log(`Resultado da verificação na Hotmart para ${email}: ${hasActiveSubscription ? 'Ativa' : 'Inativa/Não encontrada'}`);
      
      return hasActiveSubscription;
    } catch (error) {
      console.error(`Erro ao verificar assinatura na Hotmart para ${email}:`, error);
      // Em caso de erro, retornamos false para ser seguro
      return false;
    }
  }
  
  /**
   * Força o rebaixamento de um usuário específico para o nível free
   * Verifica primeiro na Hotmart se não deve ser forçado
   * @param userId ID do usuário
   * @param forceDowngrade Se true, ignora verificação na Hotmart
   */
  static async downgradeUserToFree(userId: number, forceDowngrade: boolean = false) {
    try {
      // 1. Verificar se o usuário existe e é premium
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        throw new Error(`Usuário com ID ${userId} não encontrado`);
      }
      
      if (user.nivelacesso !== 'premium') {
        throw new Error(`Usuário ${user.username} (ID: ${userId}) não é premium (nível atual: ${user.nivelacesso})`);
      }
      
      // 2. Se não é forçado, verificar se tem assinatura ativa na Hotmart
      if (!forceDowngrade && user.email) {
        const hasHotmartSubscription = await this.checkHotmartSubscription(user.email);
        
        if (hasHotmartSubscription) {
          console.log(`Rebaixamento cancelado: Usuário ${user.username} (ID: ${userId}) tem assinatura ativa na Hotmart`);
          return {
            userId,
            status: 'canceled',
            message: 'Rebaixamento cancelado: assinatura ativa na Hotmart'
          };
        }
      }
      
      // 3. Rebaixar o usuário
      await db
        .update(users)
        .set({
          nivelacesso: "usuario",
          role: "free",
          tipoplano: null,
          origemassinatura: null,
          dataassinatura: null,
          dataexpiracao: null,
          acessovitalicio: false,
          updatedat: new Date()
        })
        .where(eq(users.id, userId));
      
      // 4. Atualizar status da assinatura
      await db
        .update(subscriptions)
        .set({
          status: "expired",
          updatedAt: new Date()
        })
        .where(eq(subscriptions.userId, userId));
      
      console.log(`Usuário ${user.username} (ID: ${userId}) rebaixado para free com sucesso`);
      
      return {
        userId,
        status: 'downgraded',
        message: 'Usuário rebaixado para free com sucesso'
      };
    } catch (error) {
      console.error(`Erro ao rebaixar usuário ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Processa um webhook recebido da Hotmart
   * @param webhookData Dados do webhook
   * @returns Resultado do processamento
   */
  static async processHotmartWebhook(webhookData: any) {
    try {
      // Processar o webhook usando o serviço da Hotmart
      const result = await HotmartService.processWebhook(webhookData);
      
      if (!result || !result.action) {
        return { success: false, message: 'Webhook inválido ou não reconhecido' };
      }
      
      // Verificar o tipo de ação
      switch (result.action) {
        case 'subscription_approved':
        case 'subscription_renewed':
          // Assinatura aprovada ou renovada
          if (!result.email) {
            return { success: false, message: 'E-mail não fornecido no webhook' };
          }
          
          // Buscar usuário pelo e-mail
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, result.email));
            
          if (!user) {
            return { 
              success: false, 
              message: `Usuário com e-mail ${result.email} não encontrado` 
            };
          }
          
          // Determinar tipo de plano com base no nome do plano recebido
          let planType = 'mensal'; // padrão
          if (result.plan) {
            const planLower = result.plan.toLowerCase();
            if (planLower.includes('anual')) {
              planType = 'anual';
            } else if (planLower.includes('vitalic') || planLower.includes('lifetime')) {
              planType = 'vitalicio';
            }
          }
          
          // Calcular data de expiração
          let endDate: Date | null = null;
          if (planType === 'mensal') {
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
          } else if (planType === 'anual') {
            endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
          }
          
          // Se o webhook tiver data de expiração, usar essa
          if (result.endDate) {
            endDate = new Date(result.endDate);
          }
          
          // Atualizar assinatura
          await this.createOrUpdateSubscription(
            user.id,
            planType,
            new Date(),
            endDate,
            'hotmart_webhook'
          );
          
          return { 
            success: true, 
            message: 'Assinatura criada/renovada com sucesso', 
            userId: user.id,
            planType
          };
          
        case 'subscription_canceled':
        case 'subscription_refunded':
          // Assinatura cancelada ou reembolsada
          if (!result.email) {
            return { success: false, message: 'E-mail não fornecido no webhook' };
          }
          
          // Buscar usuário pelo e-mail
          const [userToCancel] = await db
            .select()
            .from(users)
            .where(eq(users.email, result.email));
            
          if (!userToCancel) {
            return { 
              success: false, 
              message: `Usuário com e-mail ${result.email} não encontrado` 
            };
          }
          
          // Rebaixar usuário - forçado porque foi explicitamente cancelado
          await this.downgradeUserToFree(userToCancel.id, true);
          
          return { 
            success: true, 
            message: 'Assinatura cancelada com sucesso', 
            userId: userToCancel.id
          };
          
        case 'subscription_delayed':
          // Pagamento em atraso - não faz nada por enquanto, só registra
          return { 
            success: true, 
            message: 'Pagamento em atraso registrado', 
            status: 'delayed' 
          };
          
        default:
          return { 
            success: true, 
            message: 'Evento não processável', 
            action: result.action 
          };
      }
      
    } catch (error) {
      console.error('Erro ao processar webhook da Hotmart:', error);
      return { 
        success: false, 
        message: `Erro ao processar webhook: ${error.message}` 
      };
    }
  }
}