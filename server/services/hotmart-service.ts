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
   * @returns Objeto detalhado indicando se a conexão foi bem-sucedida e informações adicionais
   */
  static async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    console.log('Testando conexão com a API da Hotmart...');
    console.log(`Ambiente: ${this.baseUrl.includes('sandbox') ? 'Sandbox' : 'Produção'}`);
    console.log(`Client ID: ${this.clientId.substring(0, 10)}...`);
    console.log(`Client Secret: ${this.clientSecret.substring(0, 10)}...`);
    
    try {
      // Teste 1: Obter token de acesso
      console.log('Passo 1: Tentando obter token de acesso...');
      const token = await this.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          message: "Não foi possível obter o token de acesso. Verifique suas credenciais."
        };
      }
      
      console.log(`Token obtido com sucesso! (primeiros 10 caracteres): ${token.substring(0, 10)}...`);
      
      // Teste 2: Fazer uma chamada simples para verificar o token
      console.log('Passo 2: Testando chamada simples à API...');
      try {
        const testUrl = `${this.baseUrl}/payments/api/v1/sales?max_results=1`;
        console.log(`URL de teste: ${testUrl}`);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        const responseStatus = response.status;
        console.log(`Status da resposta: ${responseStatus}`);
        
        // Captura o texto da resposta para análise
        const responseText = await response.text();
        console.log(`Corpo da resposta (primeiros 200 caracteres): ${responseText.substring(0, 200)}`);
        
        let responseData;
        try {
          // Tenta parsear a resposta como JSON
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { rawResponse: responseText };
        }
        
        if (response.ok) {
          return {
            success: true,
            message: "✅ Conexão com a API da Hotmart estabelecida com sucesso!",
            details: {
              token: token.substring(0, 15) + "...",
              endpoint: testUrl,
              status: responseStatus,
              data: responseData
            }
          };
        } else {
          // Se conseguimos token mas a API retornou erro
          return {
            success: false,
            message: `Token obtido com sucesso, mas a API retornou erro: ${responseStatus}. Isso pode indicar problemas com permissões ou escopo do token.`,
            details: {
              token: token.substring(0, 15) + "...",
              endpoint: testUrl,
              status: responseStatus,
              error: responseData
            }
          };
        }
      } catch (apiError) {
        // Erro ao chamar a API
        console.error("Erro ao chamar API da Hotmart:", apiError);
        return {
          success: false,
          message: `Token obtido com sucesso, mas ocorreu um erro ao testar a API: ${apiError instanceof Error ? apiError.message : 'Erro desconhecido'}`,
          details: { 
            token: token.substring(0, 15) + "...",
            error: apiError instanceof Error ? apiError.message : 'Erro desconhecido'
          }
        };
      }
    } catch (error) {
      // Erro ao obter token
      console.error("Erro ao testar conexão com a Hotmart:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      return { 
        success: false, 
        message: `❌ Falha na conexão com a API da Hotmart: ${errorMessage}`,
        details: { error: errorMessage }
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
      console.log(`[getAccessToken] Tentando obter token da Hotmart no URL: ${this.baseUrl}, ambiente: ${this.baseUrl.includes('sandbox') ? 'Sandbox' : 'Produção'}`);
      
      let tokenUrl = '';
      let headers = {};
      let requestBody = '';
      
      // Cria o Basic Auth token
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      // Configuração unificada para ambos ambientes
      if (this.baseUrl.includes('sandbox')) {
        tokenUrl = `${this.baseUrl}/oauth/token`;
      } else {
        tokenUrl = `${this.baseUrl}/security/oauth/token`;
      }
      
      // TENTATIVA ALTERNATIVA: Enviando Basic Auth no header
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      };
      
      // Corpo contém apenas grant_type=client_credentials
      requestBody = 'grant_type=client_credentials';
      
      console.log(`[getAccessToken] TENTATIVA #1: Basic Auth no header + grant_type no body`);
      console.log(`[getAccessToken] Token URL: ${tokenUrl}`);
      console.log(`[getAccessToken] Credenciais - ClientId: ${this.clientId.substring(0, 4)}..., ClientSecret: ${this.clientSecret.substring(0, 4)}...`);
      console.log(`[getAccessToken] Basic Auth token (primeiros 10 caracteres): ${basicAuth.substring(0, 10)}...`);
      console.log(`[getAccessToken] Corpo da requisição: ${requestBody}`);
      
      try {
        // Log detalhado das informações da requisição para diagnóstico
        console.log(`[getAccessToken] Iniciando requisição para ${tokenUrl}`);
        console.log(`[getAccessToken] Headers: ${JSON.stringify(headers)}`);
        console.log(`[getAccessToken] Body: ${requestBody}`);
        
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: headers,
          body: requestBody
        });
        
        // Obter dados da resposta
        const responseStatus = response.status;
        const responseHeaders = Object.fromEntries(response.headers.entries());
        const responseText = await response.text();
        
        console.log(`[getAccessToken] Resposta recebida - Status: ${responseStatus}`);
        console.log(`[getAccessToken] Headers da resposta: ${JSON.stringify(responseHeaders)}`);
        console.log(`[getAccessToken] Corpo da resposta (até 300 chars): ${responseText.substring(0, 300)}`);
        
        if (!response.ok) {
          // Tenta extrair mensagens úteis do texto de resposta
          let errorMessage = responseText;
          
          // Tenta processar resposta JSON para erro
          try {
            if (responseHeaders['content-type']?.includes('application/json')) {
              const jsonError = JSON.parse(responseText);
              if (jsonError.error_description) {
                errorMessage = jsonError.error_description;
              } else if (jsonError.message) {
                errorMessage = jsonError.message;
              }
            }
          } catch (jsonParseError) {
            console.error('[getAccessToken] Erro ao analisar JSON de erro:', jsonParseError);
          }
          
          console.error(`[getAccessToken] Erro na resposta Hotmart: Status ${responseStatus} - ${errorMessage}`);
          throw new Error(`Erro ao obter token Hotmart: ${responseStatus} ${errorMessage}`);
        }
        
        // Processa resposta bem-sucedida
        try {
          const data = JSON.parse(responseText);
          console.log('[getAccessToken] Resposta da API processada com sucesso:', 
            JSON.stringify({
              token_type: data.token_type,
              expires_in: data.expires_in,
              access_token: data.access_token ? `${data.access_token.substring(0, 15)}...` : 'indefinido'
            }));
          
          // Armazena o token e calcula a expiração (subtraindo 5 minutos por segurança)
          this.accessToken = data.access_token;
          this.tokenExpiration = now + (data.expires_in * 1000) - (5 * 60 * 1000);
          
          console.log('[getAccessToken] Token da Hotmart obtido com sucesso!');
          return this.accessToken;
        } catch (parseError) {
          console.error('[getAccessToken] Erro ao processar resposta JSON:', parseError);
          throw new Error(`Resposta inválida da API Hotmart: ${responseText}`);
        }
      } catch (fetchError) {
        console.error('[getAccessToken] Erro na requisição para a API Hotmart:', fetchError);
        // Verificações específicas para erros de rede
        const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
        if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
          throw new Error(`Erro de conexão: Não foi possível conectar ao servidor ${this.baseUrl}. Verifique a URL e sua conexão com a internet.`);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('[getAccessToken] Erro ao autenticar na API da Hotmart:', error);
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