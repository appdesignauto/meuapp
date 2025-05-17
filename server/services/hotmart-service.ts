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
      this.baseUrl = 'https://api.hotmart.com';
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
    
    try {
      // Passo 1: Tentar obter token de acesso
      console.log('Passo 1: Obtendo token de acesso...');
      const token = await this.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          message: "Não foi possível obter o token de acesso. Verifique suas credenciais."
        };
      }
      
      console.log(`Token obtido com sucesso! ${token.substring(0, 10)}...`);
      
      // Passo 2: Fazer uma chamada simples para verificar o token
      console.log('Passo 2: Testando acesso à API...');
      
      // URL para listar 1 venda (endpoint no formato da API Hotmart)
      // Ajustamos o caminho para corresponder à API oficial Hotmart
      const testUrl = `${this.baseUrl}/club/api/v1/sales?max_results=1`;
      console.log(`Usando URL de teste: ${testUrl}`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        return {
          success: true,
          message: "✅ Conexão com a API da Hotmart estabelecida com sucesso!",
          details: {
            token_preview: token.substring(0, 10) + "...",
            environment: this.baseUrl.includes('sandbox') ? 'Sandbox' : 'Produção'
          }
        };
      } else {
        const responseText = await response.text();
        return {
          success: false,
          message: `Token obtido com sucesso, mas a API retornou erro ${response.status}. Verifique as permissões da aplicação.`,
          details: {
            status: response.status,
            error: responseText.substring(0, 100)
          }
        };
      }
    } catch (error) {
      // Qualquer erro durante o processo
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
      console.log(`[getAccessToken] Tentando obter token da Hotmart no ambiente: ${this.baseUrl.includes('sandbox') ? 'Sandbox' : 'Produção'}`);
      
      // Cria o Basic Auth token (ClientID:ClientSecret em base64)
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      // Define a URL do token exatamente conforme a documentação oficial da Hotmart
      // A URL deve respeitar o ambiente selecionado (sandbox ou produção)
      let tokenUrl;
      if (this.baseUrl.includes('sandbox')) {
        tokenUrl = 'https://sandbox-api-sec-vlc.hotmart.com/security/oauth/token';
        console.log("[DIAGNÓSTICO] Ambiente detectado: SANDBOX");
      } else {
        tokenUrl = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
        console.log("[DIAGNÓSTICO] Ambiente detectado: PRODUÇÃO");
      }
      
      // Log extra para diagnóstico
      console.log(`[DIAGNÓSTICO DETALHADO] ClientID: ${this.clientId}`);
      console.log(`[DIAGNÓSTICO DETALHADO] ClientSecret (primeiros 5 caracteres): ${this.clientSecret.substring(0, 5)}`);
      console.log(`[DIAGNÓSTICO DETALHADO] BaseURL: ${this.baseUrl}`);
      
      console.log(`[getAccessToken] Usando URL para token: ${tokenUrl}`);
      
      // Define os headers com Basic Auth para OAuth
      const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      };
      
      console.log(`[getAccessToken] Headers configurados com Basic Auth`);
      console.log(`[getAccessToken] Client ID: ${this.clientId.substring(0, 10)}...`);
      console.log(`[getAccessToken] Client Secret: ${this.clientSecret.substring(0, 5)}...`);
      
      // Corpo da requisição com APENAS grant_type=client_credentials
      const requestBody = 'grant_type=client_credentials';
      
      console.log(`[getAccessToken] URL: ${tokenUrl}`);
      console.log(`[getAccessToken] BasicAuth: ${basicAuth.substring(0, 10)}...`);
      
      try {
        // Fazendo requisição para obter o token
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: headers,
          body: requestBody
        });
        
        const responseStatus = response.status;
        const responseText = await response.text();
        
        // Log detalhado da resposta para diagnóstico
        console.log(`[getAccessToken] Resposta - Status: ${responseStatus}`);
        console.log(`[getAccessToken] Resposta completa: ${responseText}`);
        
        if (!response.ok) {
          console.error(`[getAccessToken] ERRO NA AUTENTICAÇÃO HOTMART`);
          console.error(`[getAccessToken] Status: ${responseStatus}`);
          console.error(`[getAccessToken] Resposta completa: ${responseText}`);
          console.error(`[getAccessToken] Headers enviados: ${JSON.stringify(headers)}`);
          console.error(`[getAccessToken] Body enviado: ${requestBody}`);
          throw new Error(`Falha na autenticação com a Hotmart: ${responseStatus} - ${responseText}`);
        }
        
        // Processa resposta bem-sucedida
        try {
          const data = JSON.parse(responseText);
          
          // Armazena o token e calcula a expiração (subtraindo 5 minutos por segurança)
          this.accessToken = data.access_token;
          this.tokenExpiration = now + (data.expires_in * 1000) - (5 * 60 * 1000);
          
          console.log(`[getAccessToken] Token obtido com sucesso! Token: ${this.accessToken.substring(0, 15)}...`);
          return this.accessToken;
        } catch (parseError) {
          console.error('[getAccessToken] Erro ao processar resposta JSON');
          throw new Error(`Resposta inválida da API Hotmart`);
        }
      } catch (fetchError) {
        console.error('[getAccessToken] Erro na requisição:', fetchError);
        throw new Error(`Erro de conexão com API da Hotmart`);
      }
    } catch (error) {
      console.error('[getAccessToken] Falha na autenticação:', error);
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
      const response = await fetch(`${this.baseUrl}/club/api/v1/purchases?subscriber_email=${encodeURIComponent(email)}`, {
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
        let planType = 'mensal'; // padrão
        
        try {
          // Método 1 (PRIORITÁRIO): Verificar pelo ID do produto e oferta
          // Este é o método mais seguro e preciso
          const productId = data.product?.id || data.purchase?.product?.id;
          const offerId = data.purchase?.offer?.code;
          
          if (productId) {
            console.log(`Verificando mapeamento para productId: ${productId}, offerId: ${offerId || 'não informado'}`);
            
            try {
              // Consultar mapeamento no banco de dados
              const { pool } = await import('../db');
              
              // Construir consulta SQL com parâmetros
              let query = `SELECT * FROM "hotmartProductMappings" WHERE "productId" = $1`;
              const queryParams = [productId.toString()];
              
              // Adicionar offerId à consulta se disponível
              if (offerId) {
                query += ` AND "offerId" = $2`;
                queryParams.push(offerId.toString());
              }
              
              // Executar consulta
              const result = await pool.query(query, queryParams);
              
              if (result.rows && result.rows.length > 0) {
                const mapping = result.rows[0];
                console.log(`Mapeamento encontrado no banco: ${JSON.stringify(mapping)}`);
                if (mapping.planType) {
                  console.log(`✅ Plano identificado pelo mapeamento de produto: ${mapping.planType}`);
                  planType = mapping.planType;
                  // Encontrou um mapeamento, pode retornar aqui
                  console.log(`Tipo de plano final (via mapeamento): ${planType}`);
                  return {
                    action: 'subscription_approved',
                    email: email,
                    plan: planType,
                    name: data.buyer?.name,
                    purchaseId: data.purchase?.transaction,
                    status: 'active',
                    endDate: data.subscription?.end_date
                  };
                }
              } else {
                console.log('Nenhum mapeamento encontrado no banco de dados para este produto/oferta');
              }
            } catch (dbError) {
              console.error('Erro ao consultar mapeamento de produto no banco:', dbError);
              // Continua para outros métodos em caso de erro
            }
          }
          
          // Método 2: Verificar pelo nome do plano (se disponível)
          if (data.subscription?.plan?.name) {
            const planName = data.subscription.plan.name.toLowerCase();
            if (planName.includes('anual')) {
              console.log('Plano ANUAL detectado pelo nome do plano');
              planType = 'anual';
            } else if (planName.includes('semestral')) {
              console.log('Plano SEMESTRAL detectado pelo nome do plano');
              planType = 'semestral';
            }
          }
          
          // Método 3: Verificar pelo nome do produto (menos confiável, mas útil como fallback)
          if (data.product?.name) {
            const productName = data.product.name.toLowerCase();
            console.log(`Nome do produto detectado: ${data.product.name}`);
            
            if (productName.includes('anual')) {
              console.log('Plano ANUAL detectado pelo nome do produto');
              planType = 'anual';
            } else if (productName.includes('semestral')) {
              console.log('Plano SEMESTRAL detectado pelo nome do produto');
              planType = 'semestral';
            } else if (productName.includes('mensal')) {
              console.log('Plano MENSAL detectado pelo nome do produto');
              planType = 'mensal';
            }
          }
        } catch (error) {
          console.error('Erro ao determinar o tipo de plano:', error);
          // Continua com o padrão em caso de erro
        }
        
        console.log(`Tipo de plano final: ${planType}`);
        
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