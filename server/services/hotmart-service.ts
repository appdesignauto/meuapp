import fetch from 'node-fetch';

/**
 * Serviço para integração com a API da Hotmart
 * Permite verificar o status de assinaturas e processamento de webhooks
 * 
 * Implementa funções para teste de conexão, verificação de assinaturas
 * e processamento de webhooks da Hotmart.
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
    if (useSandbox) {
      this.baseUrl = 'https://sandbox.hotmart.com';
    } else {
      // Atualizado conforme documentação da Hotmart para ambiente de produção
      this.baseUrl = 'https://api-hot-connect.hotmart.com';
    }
    
    console.log(`HotmartService inicializado no ambiente: ${useSandbox ? 'Sandbox' : 'Produção'} (URL: ${this.baseUrl})`);
  }

  /**
   * Testa a conexão com a API da Hotmart usando as credenciais configuradas
   * @returns Objeto indicando se a conexão foi bem-sucedida
   */
  static async testConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      // Tenta obter um token de acesso para verificar se as credenciais estão funcionando
      const token = await this.getAccessToken();
      return { 
        success: true, 
        message: "Conexão com a API da Hotmart estabelecida com sucesso" 
      };
    } catch (error) {
      console.error("Erro ao testar conexão com a Hotmart:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      return { 
        success: false, 
        message: `Falha na conexão com a API da Hotmart: ${errorMessage}` 
      };
    }
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
      // Log para debug
      console.log(`Tentando obter token da Hotmart no URL: ${this.baseUrl}, ambiente: ${this.baseUrl.includes('sandbox') ? 'Sandbox' : 'Produção'}`);
      
      let tokenUrl = '';
      let headers = {};
      let requestBody = '';
      
      // Cria o Basic Auth token
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      if (this.baseUrl.includes('sandbox')) {
        // Configuração para ambiente sandbox
        tokenUrl = `${this.baseUrl}/oauth/token`;
        headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        };
        
        requestBody = new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': this.clientId,
          'client_secret': this.clientSecret
        }).toString();
      } else {
        // Configuração para ambiente de produção
        // A Hotmart tem diferentes endpoints e headers para ambiente de produção
        tokenUrl = `${this.baseUrl}/security/oauth/token`;
        
        // Usar credenciais com abordagem mais segura seguindo a documentação da API
        headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        };
        
        // Adicionando as credenciais diretamente ao corpo da requisição
        requestBody = new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': this.clientId,
          'client_secret': this.clientSecret
        }).toString();
        
        console.log('Usando método alternativo com credentials no body para ambiente de produção');

        // Vamos logar informações mais detalhadas para diagnóstico (parciais para segurança)
        console.log(`Credenciais usadas - ClientId: ${this.clientId.substring(0, 4)}..., ClientSecret: ${this.clientSecret.substring(0, 4)}...`);
      }
      
      console.log(`Usando URL de autenticação: ${tokenUrl}`);
      console.log(`Headers incluem Authorization Basic: ${headers['Authorization'] ? 'Sim' : 'Não'}`);
      
      try {
        console.log(`Fazendo requisição para ${tokenUrl} com body: ${requestBody}`);
        
        // Adicionar log completo dos headers para diagnóstico
        console.log("Headers completos da requisição:", JSON.stringify(headers));
        
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: headers,
          body: requestBody
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          
          // Log detalhado para depuração do erro
          console.error(`Erro na resposta da Hotmart: Status ${response.status}`);
          console.error(`Headers da resposta:`, [...response.headers.entries()].map(h => `${h[0]}: ${h[1]}`).join(', '));
          console.error(`Corpo da resposta (primeiros 500 caracteres):`, errorData.substring(0, 500));
          
          // Tenta extrair mensagens úteis do HTML quando a resposta não é JSON
          let errorMessage = errorData;
          if (errorData.includes('<!DOCTYPE html>')) {
            console.log('Resposta em formato HTML detectada, tentando extrair mensagem de erro...');
            
            // Simplificando a mensagem de erro para HTML
            errorMessage = 'A API retornou uma página HTML em vez de JSON. Isso geralmente indica um erro no endpoint ou autenticação.';
            
            // Verifica se há mensagens de erro específicas no HTML
            if (errorData.includes('404 Not Found')) {
              errorMessage += ' Endpoint não encontrado (404).';
            } else if (errorData.includes('403 Forbidden')) {
              errorMessage += ' Acesso negado (403). Verifique as credenciais.';
            } else if (errorData.includes('401 Unauthorized')) {
              errorMessage += ' Não autorizado (401). Credenciais inválidas.';
            }
          }
          
          // Se a resposta contém JSON mesmo com código de erro, tenta extrair a mensagem
          try {
            if (response.headers.get('content-type')?.includes('application/json')) {
              const jsonError = JSON.parse(errorData);
              if (jsonError.error_description) {
                errorMessage = jsonError.error_description;
              } else if (jsonError.message) {
                errorMessage = jsonError.message;
              }
            }
          } catch (jsonParseError) {
            console.error('Erro ao analisar JSON de erro:', jsonParseError);
          }
          
          throw new Error(`Erro ao obter token Hotmart: ${response.status} ${errorMessage}`);
        }
        
        const data = await response.json();
        console.log('Resposta da API Hotmart recebida com sucesso:', JSON.stringify(data).substring(0, 100) + '...');
        
        // Armazena o token e calcula a expiração (subtraindo 5 minutos por segurança)
        this.accessToken = data.access_token;
        this.tokenExpiration = now + (data.expires_in * 1000) - (5 * 60 * 1000);
        
        console.log('Token da Hotmart obtido com sucesso!');
        
        return this.accessToken;
      } catch (fetchError) {
        console.error('Erro na requisição para a API Hotmart:', fetchError);
        // Verifica se é um erro de rede ou DNS
        const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
        if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
          throw new Error(`Erro de conexão: Não foi possível conectar ao servidor ${this.baseUrl}. Verifique a URL e sua conexão com a internet.`);
        }
        // Repassa o erro original
        throw fetchError;
      }
      
      const data = await response.json();
      
      // Armazena o token e calcula a expiração (subtraindo 5 minutos por segurança)
      this.accessToken = data.access_token;
      this.tokenExpiration = now + (data.expires_in * 1000) - (5 * 60 * 1000);
      
      console.log('Token da Hotmart obtido com sucesso!');
      
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
    console.log(`Webhook Hotmart recebido: ${event}`, JSON.stringify(data, null, 2));
    
    // Extrair informações essenciais com tratamento seguro para evitar erros
    const email = data.buyer?.email;
    if (!email) {
      console.error('Email do comprador não encontrado no webhook:', data);
      throw new Error('Email do comprador não encontrado no webhook');
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
        return {
          action: 'unknown_event',
          event: event,
          email: email,
          status: 'ignored'
        };
    }
  }
}