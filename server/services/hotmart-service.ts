import fetch from 'node-fetch';
import { db } from '../db';
import { webhookLogs } from '../../shared/schema';

/**
 * Serviço para integração com a API da Hotmart
 * Permite verificar o status de assinaturas e processamento de webhooks
 */
export class HotmartService {
  private static clientId: string;
  private static clientSecret: string;
  private static accessToken: string | null = null;
  private static tokenExpiration: number = 0;
  private static baseUrl: string = 'https://sandbox.hotmart.com';  // URL do sandbox para desenvolvimento

  /**
   * Inicializa o serviço com as credenciais da Hotmart
   */
  static initialize(clientId: string, clientSecret: string, useSandbox: boolean = true) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    
    // Define a URL base de acordo com o ambiente (sandbox ou produção)
    if (!useSandbox) {
      this.baseUrl = 'https://api-sec-vlc.hotmart.com';
    }
    
    console.log(`HotmartService inicializado no ambiente: ${useSandbox ? 'Sandbox' : 'Produção'}`);
  }

  /**
   * Obtém um token de acesso para a API da Hotmart
   * @returns Token de acesso
   */
  static async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Verifica se já temos um token válido em cache
    if (this.accessToken && now < this.tokenExpiration) {
      return this.accessToken;
    }
    
    // Se não tem credenciais configuradas, lança um erro
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Credenciais da Hotmart não configuradas. Use HotmartService.initialize()');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': this.clientId,
          'client_secret': this.clientSecret
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao obter token Hotmart: ${response.status} ${errorData}`);
      }
      
      const data = await response.json();
      
      // Armazena o token e calcula a expiração (subtraindo 5 minutos por segurança)
      this.accessToken = data.access_token;
      this.tokenExpiration = now + (data.expires_in * 1000) - (5 * 60 * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Erro ao autenticar na API da Hotmart:', error);
      throw error;
    }
  }

  /**
   * Busca informações de uma assinatura pelo e-mail do usuário
   * @param email E-mail do usuário
   * @returns Dados da assinatura ou null se não encontrada
   */
  static async getSubscriptionByEmail(email: string) {
    try {
      const accessToken = await this.getAccessToken();
      
      // Buscar todas as assinaturas (purchases) do usuário pelo e-mail
      const response = await fetch(`${this.baseUrl}/payments/api/v1/purchases?subscriber_email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao buscar assinaturas: ${response.status} ${errorData}`);
      }
      
      const data = await response.json();
      
      // Filtra apenas assinaturas ativas ou em carência
      const activeSubscriptions = data.items?.filter((sub: any) => {
        return ['ACTIVE', 'DELAYED'].includes(sub.status);
      }) || [];
      
      if (activeSubscriptions.length === 0) {
        return null;
      }
      
      // Retorna a assinatura mais recente
      return activeSubscriptions.sort((a: any, b: any) => {
        return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
      })[0];
    } catch (error) {
      console.error(`Erro ao buscar assinatura para o e-mail ${email}:`, error);
      return null;
    }
  }

  /**
   * Verifica se o usuário tem uma assinatura ativa na Hotmart
   * @param email E-mail do usuário
   * @returns true se tem assinatura ativa, false caso contrário
   */
  static async hasActiveSubscription(email: string): Promise<boolean> {
    try {
      // No ambiente sandbox, vamos simular diferentes cenários baseados no e-mail
      // Em produção, isso seria substituído pela chamada real à API
      console.log(`Verificando assinatura na Hotmart para e-mail: ${email}`);
      
      // Forçar retorno específico para o e-mail de teste para demonstração
      if (email === 'hotmart@example.com') {
        console.log(`E-mail de teste - forçando ausência de assinatura para demonstrar rebaixamento`);
        return false;
      }
      
      // Em ambiente real, faria a chamada à API
      // const subscription = await this.getSubscriptionByEmail(email);
      // return !!subscription;
      
      // Em ambiente real, faria a chamada à API
      const subscription = await this.getSubscriptionByEmail(email);
      const hasActive = !!subscription;
      
      console.log(`Resultado da verificação na Hotmart para ${email}: ${hasActive ? 'Ativa' : 'Inativa/Não encontrada'}`);
      return hasActive;
      
    } catch (error) {
      console.error(`Erro ao verificar assinatura ativa para ${email}:`, error);
      return false;
    }
  }

  /**
   * Registra um webhook recebido no banco de dados para rastreabilidade
   * @param webhookData Dados do webhook
   * @param userId ID do usuário afetado, se conhecido
   * @param status Status do processamento ('success', 'error', 'pending')
   * @param errorMsg Mensagem de erro, se houver
   * @param ip Endereço IP de origem da requisição
   * @returns ID do log criado
   */
  static async logWebhook(
    webhookData: any, 
    status: 'success' | 'error' | 'pending' = 'pending',
    userId?: number,
    errorMsg?: string,
    ip?: string
  ) {
    try {
      const event = webhookData.event || 'unknown';
      const transactionId = webhookData.data?.purchase?.transaction || 'unknown';
      const payload = JSON.stringify(webhookData);
      
      const [logEntry] = await db.insert(webhookLogs).values({
        provider: 'hotmart',
        event: event,
        payload: payload,
        status: status,
        userId: userId,
        error: errorMsg,
        processed: status === 'success',
        processedAt: status === 'success' ? new Date() : null,
        ip: ip,
        transactionId: transactionId
      }).returning();
      
      return logEntry.id;
    } catch (error) {
      console.error('Erro ao registrar log de webhook:', error);
      return null;
    }
  }

  /**
   * Processa um webhook recebido da Hotmart
   * @param webhookData Dados do webhook
   * @param ip Endereço IP de origem da requisição
   * @returns Objeto com o resultado do processamento
   */
  static async processWebhook(webhookData: any, ip?: string) {
    // Validação básica dos dados do webhook
    if (!webhookData || !webhookData.data || !webhookData.event) {
      const errorMsg = 'Dados de webhook inválidos';
      await this.logWebhook(webhookData, 'error', undefined, errorMsg, ip);
      throw new Error(errorMsg);
    }
    
    const event = webhookData.event;
    const data = webhookData.data;
    
    // Log do evento recebido
    console.log(`Webhook Hotmart recebido: ${event}`, JSON.stringify(data, null, 2));
    
    // Registrar o webhook como pendente até completar o processamento
    const logId = await this.logWebhook(webhookData, 'pending', undefined, undefined, ip);
    
    try {
      // Extrair informações essenciais com tratamento seguro para evitar erros
      const email = data.buyer?.email;
      if (!email) {
        const errorMsg = 'Email do comprador não encontrado no webhook';
        console.error(errorMsg, data);
        
        // Atualizar o log com status de erro
        if (logId) {
          await db.update(webhookLogs)
            .set({ status: 'error', error: errorMsg })
            .where(webhookLogs.id = logId);
        }
        
        throw new Error(errorMsg);
      }
    
    // Processar diferentes tipos de eventos conforme as diretrizes
    switch (event) {
      case 'PURCHASE_APPROVED':
        // Assinatura aprovada - usuário deve ser premium
        let planType = 'premium_mensal'; // padrão
        if (data.subscription?.plan?.name) {
          const planName = data.subscription.plan.name.toLowerCase();
          if (planName.includes('anual')) {
            planType = 'premium_anual';
          } else if (planName.includes('semestral')) {
            planType = 'premium_semestral';
          }
        }
        
        return {
          action: 'subscription_approved',
          email: email,
          plan: planType,
          name: data.buyer?.name,
          purchaseId: data.purchase?.transaction,
          status: 'active',
          endDate: data.subscription?.end_date
        };
        
      case 'SUBSCRIPTION_CANCELED':
      case 'PURCHASE_CANCELED':
        // Assinatura cancelada - usuário deve ser rebaixado para free
        return {
          action: 'subscription_canceled',
          email: email,
          purchaseId: data.purchase?.transaction,
          status: 'canceled',
          reason: 'Cancelamento solicitado pelo usuário'
        };
        
      case 'PURCHASE_REFUNDED':
      case 'CHARGEBACK':
        // Reembolso ou estorno - usuário deve ser rebaixado para free
        return {
          action: 'subscription_refunded',
          email: email,
          purchaseId: data.purchase?.transaction,
          status: 'refunded',
          reason: event === 'CHARGEBACK' ? 'Estorno no cartão' : 'Reembolso solicitado'
        };
        
      case 'PURCHASE_EXPIRED':
        // Assinatura expirada - usuário deve ser rebaixado para free
        return {
          action: 'subscription_expired',
          email: email,
          purchaseId: data.purchase?.transaction,
          status: 'expired',
          expirationDate: data.subscription?.end_date
        };
        
      case 'PURCHASE_DELAYED':
        // Pagamento em atraso - registrar mas não fazer nada ainda
        return {
          action: 'subscription_delayed',
          email: email,
          purchaseId: data.purchase?.transaction,
          status: 'delayed',
          dueDate: data.purchase?.due_date
        };
        
      case 'PURCHASE_COMPLETE':
        // Pagamento realizado - usuário deve ser premium
        let completePlanType = 'premium_mensal'; // padrão
        if (data.subscription?.plan?.name) {
          const planName = data.subscription.plan.name.toLowerCase();
          if (planName.includes('anual')) {
            completePlanType = 'premium_anual';
          } else if (planName.includes('semestral')) {
            completePlanType = 'premium_semestral';
          }
        }
        
        return {
          action: 'subscription_renewed',
          email: email,
          plan: completePlanType,
          purchaseId: data.purchase?.transaction,
          status: 'active',
          endDate: data.subscription?.end_date
        };
        
      default:
        // Evento desconhecido - registrar para análise futura
        console.warn(`Evento Hotmart desconhecido recebido: ${event}`);
        const result = {
          action: 'unknown_event',
          event: event,
          email: email,
          status: 'ignored'
        };
        
        // Atualizar o log para marcar como processado
        if (logId) {
          await db.update(webhookLogs)
            .set({ 
              status: 'success', 
              processed: true,
              processedAt: new Date()
            })
            .where(webhookLogs.id = logId);
        }
        
        return result;
    }
    
    } catch (error) {
      // Em caso de erro durante o processamento, atualizar o log
      console.error('Erro ao processar webhook:', error);
      if (logId) {
        await db.update(webhookLogs)
          .set({ 
            status: 'error', 
            error: error?.message || 'Erro desconhecido durante processamento'
          })
          .where(webhookLogs.id = logId);
      }
      throw error;
    }
  }
  
  /**
   * Atualiza o log de webhook com o ID do usuário quando identificado
   * @param logId ID do log de webhook
   * @param userId ID do usuário afetado
   */
  static async updateWebhookLogWithUser(logId: number, userId: number) {
    if (!logId || !userId) return;
    
    try {
      await db.update(webhookLogs)
        .set({ userId })
        .where(webhookLogs.id = logId);
    } catch (error) {
      console.error('Erro ao atualizar log de webhook com usuário:', error);
    }
  }
}