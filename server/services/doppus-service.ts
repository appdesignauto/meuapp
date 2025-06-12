import { db } from "../db";
import { users, subscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export class DoppusService {
  private static instance: DoppusService;
  private webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.DOPPUS_WEBHOOK_SECRET || 'default_secret';
  }

  static getInstance(): DoppusService {
    if (!DoppusService.instance) {
      DoppusService.instance = new DoppusService();
    }
    return DoppusService.instance;
  }

  /**
   * Processa um webhook da Doppus para compra aprovada ou cancelada/estornada
   */
  static async processPurchase(webhookData: any, email: string) {
    console.log('🔄 DoppusService.processPurchase iniciado para:', email);
    
    try {
      // Extrair dados do webhook da Doppus
      const customer = webhookData.customer;
      const items = webhookData.items || [];
      const recurrence = webhookData.recurrence;
      const transaction = webhookData.transaction;
      const status = webhookData.status;

      console.log('📦 Dados extraídos:', {
        customerName: customer?.name,
        customerEmail: customer?.email,
        itemsCount: items.length,
        transactionCode: transaction?.code,
        status: status?.code
      });

      // Processar cancelamento/estorno
      if (status?.code === 'reversed' || status?.code === 'cancelled' || status?.code === 'refunded') {
        console.log('❌ Processando cancelamento/estorno para:', email);
        return await DoppusService.processCancel(webhookData, email);
      }

      // Verificar se a transação foi aprovada
      if (status?.code !== 'approved') {
        console.log('⚠️ Transação não aprovada:', status?.code);
        return { success: false, message: 'Transação não aprovada' };
      }

      // Determinar o tipo de plano baseado nos itens
      let planType = 'premium';
      let expirationDate = null;
      let isLifetime = false;

      // Análise dos itens para determinar o plano
      const mainItem = items.find((item: any) => item.type === 'principal');
      if (mainItem) {
        const itemName = mainItem.name?.toLowerCase() || '';
        const offerName = mainItem.offer_name?.toLowerCase() || '';
        
        if (offerName.includes('anual') || offerName.includes('yearly')) {
          planType = 'premium_anual';
        } else if (offerName.includes('mensal') || offerName.includes('monthly')) {
          planType = 'premium_mensal';
        } else if (offerName.includes('vitalicio') || offerName.includes('lifetime')) {
          planType = 'vitalicio';
          isLifetime = true;
        }
      }

      // Definir data de expiração baseada na recorrência
      if (recurrence && recurrence.expiration_date && !isLifetime) {
        expirationDate = new Date(recurrence.expiration_date);
      } else if (!isLifetime) {
        // Fallback: 1 ano para plano anual, 1 mês para mensal
        const now = new Date();
        if (planType === 'premium_anual') {
          expirationDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        } else {
          expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
      }

      console.log('📋 Plano determinado:', { planType, expirationDate, isLifetime });

      // Buscar ou criar usuário
      const result = await DoppusService.findOrCreateUser(customer, email, planType, expirationDate, isLifetime);
      
      // Registrar log do webhook
      await DoppusService.logWebhook(webhookData, 'success', result.user.id);

      console.log('✅ DoppusService.processPurchase concluído com sucesso');
      return { 
        success: true, 
        message: 'Compra processada com sucesso',
        user: result.user,
        action: result.action
      };

    } catch (error) {
      console.error('❌ Erro no DoppusService.processPurchase:', error);
      await DoppusService.logWebhook(webhookData, 'error', null, error.message);
      throw error;
    }
  }

  /**
   * Processa cancelamento de assinatura da Doppus
   */
  static async processCancellation(webhookData: any, email: string) {
    console.log('🔄 DoppusService.processCancellation iniciado para:', email);
    
    try {
      // Buscar usuário existente
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!existingUser) {
        console.log('⚠️ Usuário não encontrado para cancelamento:', email);
        return { success: false, message: 'Usuário não encontrado' };
      }

      // Rebaixar usuário para free
      const [updatedUser] = await db
        .update(users)
        .set({
          nivelacesso: 'usuario',
          origemassinatura: 'doppus',
          tipoplano: null,
          dataexpiracao: new Date(),
          acessovitalicio: false
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      // Registrar log do webhook
      await DoppusService.logWebhook(webhookData, 'success', existingUser.id);

      console.log('✅ Usuário rebaixado:', email);
      return { 
        success: true, 
        message: 'Cancelamento processado com sucesso',
        user: updatedUser
      };

    } catch (error) {
      console.error('❌ Erro no DoppusService.processCancellation:', error);
      await DoppusService.logWebhook(webhookData, 'error', null, error.message);
      throw error;
    }
  }

  /**
   * Processa cancelamento/estorno de assinatura da Doppus
   */
  static async processCancel(webhookData: any, email: string) {
    console.log('❌ DoppusService.processCancel iniciado para:', email);
    
    try {
      const customer = webhookData.customer;
      const transaction = webhookData.transaction;
      const status = webhookData.status;

      console.log('🔄 Processando cancelamento/estorno:', {
        email: customer?.email,
        transactionCode: transaction?.code,
        status: status?.code,
        statusMessage: status?.message
      });

      // Buscar usuário existente
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!existingUser) {
        console.log('⚠️ Usuário não encontrado para cancelamento:', email);
        await DoppusService.logWebhook(webhookData, 'warning', null, 'Usuário não encontrado para cancelamento');
        return { 
          success: false, 
          message: 'Usuário não encontrado para cancelamento',
          action: 'user_not_found'
        };
      }

      console.log('👤 Usuário encontrado, rebaixando acesso:', existingUser.username);

      // Rebaixar usuário para free (mesmo padrão da Hotmart)
      const [downgradedUser] = await db
        .update(users)
        .set({
          nivelacesso: 'free',
          origemassinatura: null,
          tipoplano: null,
          dataassinatura: null,
          dataexpiracao: null,
          acessovitalicio: false,
          observacaoadmin: `Acesso cancelado via Doppus em ${new Date().toLocaleDateString('pt-BR')} - Status: ${status?.code} - ${status?.message}`
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      console.log('✅ Usuário rebaixado com sucesso:', downgradedUser.username);

      // Log do webhook com sucesso
      await DoppusService.logWebhook(webhookData, 'success', downgradedUser.id, 'Usuário rebaixado para free');

      return {
        success: true,
        message: 'Usuário rebaixado com sucesso',
        action: 'downgraded',
        user: downgradedUser
      };

    } catch (error) {
      console.error('❌ Erro no DoppusService.processCancel:', error);
      await DoppusService.logWebhook(webhookData, 'error', null, error.message);
      throw error;
    }
  }

  /**
   * Busca ou cria um usuário baseado nos dados da Doppus
   */
  static async findOrCreateUser(customer: any, email: string, planType: string, expirationDate: Date | null, isLifetime: boolean) {
    console.log('🔍 Buscando ou criando usuário:', email);

    // Buscar usuário existente
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      console.log('👤 Usuário existente encontrado, atualizando...');
      
      // Atualizar usuário existente para premium
      const [updatedUser] = await db
        .update(users)
        .set({
          nivelacesso: 'premium',
          origemassinatura: 'doppus',
          tipoplano: planType,
          dataassinatura: new Date(),
          dataexpiracao: expirationDate,
          acessovitalicio: isLifetime,
          phone: customer.phone || existingUser.phone,
          name: customer.name || existingUser.name
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      return { user: updatedUser, action: 'updated' };
    } else {
      console.log('🆕 Criando novo usuário...');
      
      // Gerar username único baseado no email
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
      
      // Senha padrão do sistema (mesma da Hotmart)
      const defaultPassword = 'auto@123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Criar novo usuário
      const [newUser] = await db
        .insert(users)
        .values({
          email: email,
          username: username,
          password: hashedPassword,
          name: customer.name || email.split('@')[0],
          phone: customer.phone || null,
          nivelacesso: 'premium',
          origemassinatura: 'doppus',
          tipoplano: planType,
          dataassinatura: new Date(),
          dataexpiracao: expirationDate,
          acessovitalicio: isLifetime,
          isactive: true,
          emailconfirmed: true
        })
        .returning();

      console.log('✅ Novo usuário criado:', newUser.email);
      return { user: newUser, action: 'created' };
    }
  }

  /**
   * Registra log do webhook da Doppus
   */
  static async logWebhook(webhookData: any, status: string, userId: number | null, errorMessage?: string) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      await pool.query(`
        INSERT INTO webhook_logs (
          source, event_type, raw_payload, status, email, error_message, transaction_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        'doppus',
        webhookData.status?.code || 'unknown',
        JSON.stringify(webhookData),
        status,
        webhookData.customer?.email || null,
        errorMessage || null,
        webhookData.transaction?.id || webhookData.id || null,
        new Date()
      ]);

      await pool.end();
      console.log('📝 Log do webhook Doppus registrado');
    } catch (error) {
      console.error('❌ Erro ao registrar log do webhook Doppus:', error);
    }
  }

  /**
   * Processa evento de renovação da Doppus
   */
  static async processRenewal(webhookData: any, email: string) {
    console.log('🔄 DoppusService.processRenewal iniciado para:', email);
    
    try {
      // Buscar usuário existente
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!existingUser) {
        console.log('⚠️ Usuário não encontrado para renovação:', email);
        return { success: false, message: 'Usuário não encontrado' };
      }

      // Calcular nova data de expiração
      const recurrence = webhookData.recurrence;
      let newExpirationDate = null;
      
      if (recurrence && recurrence.expiration_date) {
        newExpirationDate = new Date(recurrence.expiration_date);
      } else {
        // Fallback: estender por 1 ano
        const now = new Date();
        newExpirationDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      }

      // Atualizar data de expiração
      const [updatedUser] = await db
        .update(users)
        .set({
          dataexpiracao: newExpirationDate,
          nivelacesso: 'premium',
          origemassinatura: 'doppus'
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      // Registrar log do webhook
      await DoppusService.logWebhook(webhookData, 'success', existingUser.id);

      console.log('✅ Renovação processada:', email);
      return { 
        success: true, 
        message: 'Renovação processada com sucesso',
        user: updatedUser
      };

    } catch (error) {
      console.error('❌ Erro no DoppusService.processRenewal:', error);
      await DoppusService.logWebhook(webhookData, 'error', null, error.message);
      throw error;
    }
  }

  /**
   * Processa evento de reembolso da Doppus
   */
  static async processRefund(webhookData: any, email: string) {
    console.log('🔄 DoppusService.processRefund iniciado para:', email);
    
    // Processar reembolso da mesma forma que cancelamento
    return await DoppusService.processCancellation(webhookData, email);
  }
}