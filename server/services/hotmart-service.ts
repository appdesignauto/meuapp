import fetch from 'node-fetch';

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
      const subscription = await this.getSubscriptionByEmail(email);
      return !!subscription;
    } catch (error) {
      console.error(`Erro ao verificar assinatura ativa para ${email}:`, error);
      return false;
    }
  }

  /**
   * Processa um webhook recebido da Hotmart
   * @param webhookData Dados do webhook
   * @returns Objeto com o resultado do processamento
   */
  static async processWebhook(webhookData: any) {
    // Validação básica dos dados do webhook
    if (!webhookData || !webhookData.data || !webhookData.event) {
      throw new Error('Dados de webhook inválidos');
    }
    
    const event = webhookData.event;
    const data = webhookData.data;
    
    // Log do evento recebido
    console.log(`Webhook Hotmart recebido: ${event}`);
    
    // Processar diferentes tipos de eventos
    switch (event) {
      case 'PURCHASE_APPROVED':
        // Assinatura aprovada
        return {
          action: 'subscription_approved',
          email: data.buyer.email,
          plan: data.subscription.plan.name,
          purchaseId: data.purchase.transaction,
          status: 'active',
          endDate: data.subscription.end_date
        };
        
      case 'PURCHASE_CANCELED':
      case 'SUBSCRIPTION_CANCELED':
        // Assinatura cancelada
        return {
          action: 'subscription_canceled',
          email: data.buyer.email,
          purchaseId: data.purchase.transaction,
          status: 'canceled'
        };
        
      case 'PURCHASE_REFUNDED':
        // Assinatura reembolsada
        return {
          action: 'subscription_refunded',
          email: data.buyer.email,
          purchaseId: data.purchase.transaction,
          status: 'refunded'
        };
        
      case 'PURCHASE_DELAYED':
        // Pagamento em atraso
        return {
          action: 'subscription_delayed',
          email: data.buyer.email,
          purchaseId: data.purchase.transaction,
          status: 'delayed'
        };
        
      case 'PURCHASE_COMPLETE':
        // Pagamento realizado
        return {
          action: 'subscription_renewed',
          email: data.buyer.email,
          purchaseId: data.purchase.transaction,
          plan: data.subscription.plan.name,
          status: 'active',
          endDate: data.subscription.end_date
        };
        
      default:
        return {
          action: 'unknown_event',
          event: event,
          status: 'ignored'
        };
    }
  }
}