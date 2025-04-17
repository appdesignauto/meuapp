import { db } from "../db";
import { eq, and, lte, sql } from "drizzle-orm";
import { users, subscriptions } from "@shared/schema";

/**
 * Serviço responsável por gerenciar assinaturas de usuários
 */
export class SubscriptionService {
  
  /**
   * Cria ou atualiza uma assinatura para um usuário
   * @param userId ID do usuário
   * @param planType Tipo de plano (mensal, anual, vitalicio, personalizado)
   * @param endDate Data de expiração da assinatura
   */
  static async createOrUpdateSubscription(
    userId: number, 
    planType: string, 
    endDate: Date | null
  ) {
    try {
      // Verificar se já existe uma assinatura para este usuário
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
            startDate: new Date(),
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
            startDate: new Date(),
            endDate,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao criar/atualizar assinatura:", error);
      return false;
    }
  }
  
  /**
   * Verifica assinaturas expiradas e rebaixa usuários
   * @returns Número de usuários rebaixados
   */
  static async checkExpiredSubscriptions() {
    const now = new Date();
    let downgradeCount = 0;
    
    try {
      // 1. Encontrar usuários com assinaturas expiradas na tabela users
      const usersWithExpiredSubscriptions = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          dataexpiracao: users.dataexpiracao
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
      
      // 2. Rebaixar usuários
      for (const user of usersWithExpiredSubscriptions) {
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
        
        console.log(`Usuário ${user.username} (${user.email}) rebaixado de premium para free - assinatura expirada em ${user.dataexpiracao}`);
        downgradeCount++;
      }
      
      // 3. Encontrar usuários com assinaturas expiradas na tabela subscriptions
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
      
      // 4. Atualizar status das assinaturas
      for (const subscription of expiredSubscriptions) {
        await db
          .update(subscriptions)
          .set({
            status: "expired",
            updatedAt: new Date()
          })
          .where(eq(subscriptions.userId, subscription.userId));
      }
      
      return downgradeCount;
    } catch (error) {
      console.error("Erro ao verificar assinaturas expiradas:", error);
      return 0;
    }
  }
  
  /**
   * Força o rebaixamento de um usuário específico para o nível free
   * Usado principalmente para testes
   */
  static async downgradeUserToFree(userId: number) {
    try {
      // 1. Atualizar o usuário para nível free
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
      
      // 2. Atualizar status da assinatura
      await db
        .update(subscriptions)
        .set({
          status: "expired",
          updatedAt: new Date()
        })
        .where(eq(subscriptions.userId, userId));
      
      return true;
    } catch (error) {
      console.error("Erro ao rebaixar usuário:", error);
      return false;
    }
  }
}