/**
 * Serviço para integração com a API da Doppus
 * 
 * Este serviço gerencia as operações relacionadas à plataforma Doppus, incluindo:
 * - Autenticação com Client ID e Client Secret
 * - Processamento de webhooks
 * - Verificação de status de assinaturas
 */

import { db } from '../db';
import { users, subscriptions, doppusProductMappings } from '../../shared/schema';
import { eq, and, not, isNull } from 'drizzle-orm';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Interface para o tipo de plano
type PlanType = 'basic' | 'premium' | 'premium_30' | 'premium_180' | 'premium_365' | 'premium_lifetime';

// Interface para o status da assinatura
type SubscriptionStatus = 'active' | 'pending' | 'cancelled' | 'expired';

// Interface para as credenciais da Doppus
interface DoppusCredentials {
  doppusClientId: string;
  doppusClientSecret: string;
  doppusSecretKey: string;
}

/**
 * Serviço para gerenciar integração com Doppus
 */
class DoppusService {
  private baseUrl: string = 'https://api.doppus.app/4.0';
  private credentials: DoppusCredentials | null = null;
  
  /**
   * Permite configurar a URL base da API
   * @param url Nova URL base
   */
  public setBaseUrl(url: string): void {
    console.log(`Alterando URL base da API de ${this.baseUrl} para ${url}`);
    this.baseUrl = url;
  }
  
  /**
   * Retorna a URL base atual
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }
  
  /**
   * Obtém as credenciais da Doppus do banco de dados
   */
  private async getCredentials(): Promise<DoppusCredentials> {
    if (this.credentials) {
      return this.credentials;
    }
    
    try {
      console.log('Buscando credenciais da Doppus na tabela subscriptionSettings...');
      
      // Buscar as configurações da tabela subscriptionSettings usando pool direto
      // para evitar problemas com Drizzle
      const { pool } = await import('../db');
      
      const settingsResult = await pool.query(
        `SELECT "doppusClientId", "doppusClientSecret", "doppusSecretKey" FROM "subscriptionSettings" LIMIT 1`
      );
      
      if (!settingsResult.rows || settingsResult.rows.length === 0) {
        console.error('Nenhuma configuração da Doppus encontrada na tabela subscriptionSettings');
        throw new Error('Configurações da Doppus não encontradas');
      }
      
      const row = settingsResult.rows[0];
      
      console.log('Credenciais encontradas:', {
        clientId: row.doppusClientId ? `${row.doppusClientId.substring(0, 4)}...` : 'não definido',
        clientSecret: row.doppusClientSecret ? 'definido' : 'não definido',
        secretKey: row.doppusSecretKey ? 'definido' : 'não definido'
      });
      
      if (!row.doppusClientId || !row.doppusClientSecret) {
        throw new Error('Credenciais da Doppus (Client ID ou Client Secret) não configuradas');
      }
      
      this.credentials = {
        doppusClientId: row.doppusClientId,
        doppusClientSecret: row.doppusClientSecret,
        doppusSecretKey: row.doppusSecretKey || ''
      };
      
      return this.credentials;
    } catch (error) {
      console.error('Erro ao obter credenciais da Doppus:', error);
      throw new Error('Falha ao obter credenciais: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Obtém token de acesso para a API da Doppus usando Client ID e Client Secret
   */
  private async getAccessToken(): Promise<string> {
    try {
      console.log('===== SOLICITANDO TOKEN DE ACESSO DA DOPPUS =====');
      console.log('Data e hora:', new Date().toISOString());
      
      const credentials = await this.getCredentials();
      
      if (!credentials.doppusClientId || !credentials.doppusClientSecret) {
        console.error('ERRO CRÍTICO: Credenciais incompletas ou mal formatadas');
        console.error('doppusClientId disponível:', !!credentials.doppusClientId);
        console.error('doppusClientSecret disponível:', !!credentials.doppusClientSecret);
        throw new Error('Credenciais da Doppus (Client ID ou Client Secret) incompletas');
      }
      
      console.log(`Enviando requisição de autenticação para ${this.baseUrl}/Auth`);
      console.log('Client ID utilizado:', credentials.doppusClientId.substring(0, 4) + '...' + credentials.doppusClientId.slice(-4));
      
      // Parâmetros conforme documentação da Doppus
      const params = new URLSearchParams({
        'grant_type': 'client_credentials'
      });
      
      console.log('Parâmetros da requisição:', params.toString());
      
      // A documentação da Doppus indica que o Client ID e Client Secret devem ser enviados via Basic Auth
      const authString = Buffer.from(`${credentials.doppusClientId}:${credentials.doppusClientSecret}`).toString('base64');
      console.log('Autenticação: Basic', authString.substring(0, 8) + '...');
      
      const response = await fetch(`${this.baseUrl}/Auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`
        },
        body: params
      });
      
      console.log('Resposta recebida. Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro completo da API:', errorText);
        
        // Log detalhado para diagnóstico
        console.error('Detalhes da requisição para diagnóstico:');
        console.error('- URL:', `${this.baseUrl}/Auth`);
        console.error('- Content-Type:', 'application/x-www-form-urlencoded');
        console.error('- Authorization: Basic [CENSURADO]');
        console.error('- Body:', params.toString());
        
        // Construir uma mensagem de erro mais informativa
        let errorMsg = `Erro ao obter token de acesso (HTTP ${response.status})`;
        
        if (response.status === 401) {
          errorMsg = 'Credenciais inválidas. Verifique o Client ID e Client Secret.';
        } else if (response.status === 400) {
          errorMsg = 'Requisição inválida. Verifique se as credenciais estão no formato correto.';
        } else if (response.status === 404) {
          errorMsg = 'Endpoint de autenticação não encontrado. Verifique a URL da API.';
        } else if (response.status === 500) {
          errorMsg = 'Erro interno no servidor da Doppus. Tente novamente mais tarde.';
        }
        
        // Erros específicos da API Doppus
        if (errorText.includes("Unidentified or invalid customer account")) {
          errorMsg = 'Conta de cliente não identificada ou inválida. Verifique as credenciais Client ID e Client Secret.';
        }
        
        throw new Error(errorMsg + ` (${errorText})`);
      }
      
      // Formato de resposta esperado conforme a documentação
      // {
      //   "success": true,
      //   "error": [],
      //   "return_type": "OK",
      //   "message": "Access token successfully generated.",
      //   "data": {
      //     "token": "=Q=M.a7267ef8b2423afff9.vHJcjHVZvGld=g=b.p3JduGld=w=Z.wTcM5jgN2DYM=A=M",
      //     "token_type": "Bearer",
      //     "expire_in": "2024:02:02 13:17:40"
      //   }
      // }
      const data = await response.json() as { 
        success: boolean; 
        error: string[];
        return_type: string;
        message: string;
        data?: { 
          token: string;
          token_type: string;
          expire_in: string;
        } 
      };
      
      console.log('Estrutura da resposta:', Object.keys(data).join(', '));
      
      if (!data.success || !data.data?.token) {
        console.error('Resposta inesperada da API Doppus:', JSON.stringify(data, null, 2));
        throw new Error('Token de acesso não encontrado na resposta da API Doppus');
      }
      
      console.log('Token obtido com sucesso!');
      console.log('Tipo de token:', data.data.token_type);
      console.log('Validade até:', data.data.expire_in);
      
      return data.data.token;
    } catch (error) {
      console.error('Erro ao obter token de acesso da Doppus:', error);
      throw new Error('Falha na autenticação com a Doppus: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Verifica a validade da assinatura em um webhook da Doppus
   * @param signature Assinatura do webhook
   * @param payload Corpo da requisição
   * @returns true se a assinatura for válida
   */
  public async validateWebhookSignature(signature: string, payload: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      
      if (!credentials.doppusSecretKey) {
        console.warn('Secret Key da Doppus não configurada, pulando validação de assinatura');
        return true; // Em ambiente de desenvolvimento, podemos pular a validação
      }
      
      // Calcular HMAC usando SHA-256 e o Secret Key
      const hmac = crypto.createHmac('sha256', credentials.doppusSecretKey);
      hmac.update(payload);
      const calculatedSignature = hmac.digest('hex');
      
      // Comparar com a assinatura recebida
      return calculatedSignature === signature;
    } catch (error) {
      console.error('Erro ao validar assinatura do webhook:', error);
      return false;
    }
  }
  
  /**
   * Processa um webhook da Doppus
   * @param payload Dados do webhook
   * @returns Resultado do processamento
   */
  public async processWebhook(payload: any): Promise<any> {
    try {
      const event = payload.event;
      const data = payload.data;
      
      if (!event || !data) {
        throw new Error('Payload do webhook inválido');
      }
      
      // Log para debug
      console.log(`Processando webhook da Doppus: ${event}`);
      console.log('Dados do webhook:', JSON.stringify(data, null, 2));
      
      // Registrar detalhes do produto para diagnóstico
      if (data.product) {
        console.log(`Produto recebido: ${data.product.name || 'sem nome'} (${data.product.code || 'sem código'})`);
        
        if (data.product.plan) {
          console.log(`Plano recebido: ${data.product.plan.name || 'sem nome'} (${data.product.plan.code || 'sem código'})`);
        }
      }
      
      switch (event) {
        case 'PAYMENT_APPROVED':
          return await this.handlePaymentApproved(data);
          
        case 'SUBSCRIPTION_CANCELLED':
          return await this.handleSubscriptionCancelled(data);
          
        case 'SUBSCRIPTION_EXPIRED':
          return await this.handleSubscriptionExpired(data);
          
        case 'PAYMENT_REFUNDED':
          return await this.handlePaymentRefunded(data);
          
        default:
          console.log(`Evento não processado: ${event}`);
          return { success: true, status: 'ignored', event };
      }
    } catch (error) {
      console.error('Erro ao processar webhook da Doppus:', error);
      throw error;
    }
  }
  
  /**
   * Busca o mapeamento de produto no banco de dados
   * @param productCode Código do produto na Doppus
   * @param planCode Código do plano na Doppus (opcional)
   * @returns Mapeamento encontrado ou null
   */
  private async getProductMapping(productCode: string, planCode?: string): Promise<any> {
    try {
      console.log(`Buscando mapeamento para produto ${productCode}${planCode ? ` e plano ${planCode}` : ''}`);
      
      // Se temos tanto o código do produto quanto do plano, buscamos pela combinação exata
      if (planCode) {
        const [mapping] = await db
          .select()
          .from(doppusProductMappings)
          .where(
            and(
              eq(doppusProductMappings.productId, productCode),
              eq(doppusProductMappings.planId, planCode),
              eq(doppusProductMappings.isActive, true)
            )
          );
          
        if (mapping) {
          console.log(`Mapeamento encontrado pelo produto ${productCode} e plano ${planCode}`);
          return mapping;
        }
      }
      
      // Se não encontrou pelo plano ou se o plano não foi fornecido, busca apenas pelo código do produto
      const [mapping] = await db
        .select()
        .from(doppusProductMappings)
        .where(
          and(
            eq(doppusProductMappings.productId, productCode),
            eq(doppusProductMappings.isActive, true)
          )
        );
        
      if (mapping) {
        console.log(`Mapeamento encontrado pelo produto ${productCode}`);
        return mapping;
      }
      
      console.log(`Nenhum mapeamento encontrado para produto ${productCode}`);
      return null;
    } catch (error) {
      console.error('Erro ao buscar mapeamento de produto:', error);
      return null;
    }
  }

  /**
   * Processa um evento de pagamento aprovado da Doppus
   */
  private async handlePaymentApproved(data: any): Promise<any> {
    try {
      const email = data.customer?.email;
      if (!email) {
        throw new Error('Email do cliente não encontrado no webhook');
      }
      
      // Buscar usuário pelo email
      const [userResult] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (!userResult) {
        throw new Error(`Usuário com email ${email} não encontrado`);
      }
      
      // Definir plano a partir do produto recebido no webhook
      let planType: PlanType = 'premium';
      let durationDays = 30; // Duração padrão: 30 dias
      let isLifetime = false;
      
      // Extrair código do produto e verificar o tipo de plano
      const productCode = data.product?.code;
      const planCode = data.product?.plan?.code;
      
      if (productCode) {
        // Buscar mapeamento no banco de dados
        const mapping = await this.getProductMapping(productCode, planCode);
        
        if (mapping) {
          // Usar valores do mapeamento
          planType = mapping.planType;
          durationDays = mapping.durationDays || 30;
          isLifetime = mapping.isLifetime;
          
          console.log(`Usando mapeamento do banco: ${planType}, ${durationDays} dias, vitalício: ${isLifetime}`);
        } else {
          // Fallback para mapeamento padrão se não encontrar no banco
          console.log('Nenhum mapeamento encontrado, usando valores padrão');
          
          // Tentar identificar o tipo de plano com base no nome do produto
          const productName = (data.product?.name || '').toLowerCase();
          
          if (productName.includes('mensal') || productName.includes('30 dias')) {
            planType = 'premium_30';
            durationDays = 30;
          } else if (productName.includes('semestral') || productName.includes('180 dias') || productName.includes('6 meses')) {
            planType = 'premium_180';
            durationDays = 180;
          } else if (productName.includes('anual') || productName.includes('365 dias') || productName.includes('1 ano')) {
            planType = 'premium_365';
            durationDays = 365;
          } else if (productName.includes('vitalicio') || productName.includes('lifetime') || productName.includes('para sempre')) {
            planType = 'premium_lifetime';
            isLifetime = true;
            durationDays = 36500; // Aproximadamente 100 anos
          } else {
            // Valores padrão
            planType = 'premium_30';
            durationDays = 30;
          }
        }
      }
      
      // Calcular data de expiração
      const startDate = new Date();
      const endDate = isLifetime ? null : new Date(startDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
      
      // Atualizar usuário
      await db.update(users)
        .set({
          nivelacesso: 'premium',
          origemassinatura: 'doppus',
          tipoplano: planType,
          dataassinatura: startDate,
          dataexpiracao: endDate,
          acessovitalicio: isLifetime,
          atualizadoem: new Date()
        })
        .where(eq(users.id, userResult.id));
      
      // Verificar se já existe uma assinatura para este usuário
      const [existingSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userResult.id));
      
      if (existingSubscription) {
        // Atualizar assinatura existente
        await db
          .update(subscriptions)
          .set({
            planType,
            status: 'active',
            startDate,
            endDate,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.userId, userResult.id));
      } else {
        // Criar nova assinatura
        await db
          .insert(subscriptions)
          .values({
            userId: userResult.id,
            planType,
            status: 'active',
            startDate,
            endDate,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
      
      // Retornar resultado
      return {
        success: true,
        status: 'processed',
        userId: userResult.id,
        planType,
        durationDays,
        isLifetime,
        startDate,
        endDate
      };
    } catch (error) {
      console.error('Erro ao processar pagamento aprovado da Doppus:', error);
      throw error;
    }
  }
  
  /**
   * Processa um evento de assinatura cancelada da Doppus
   */
  private async handleSubscriptionCancelled(data: any): Promise<any> {
    try {
      const email = data.customer?.email;
      if (!email) {
        throw new Error('Email do cliente não encontrado no webhook');
      }
      
      // Buscar usuário pelo email
      const [userResult] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (!userResult) {
        throw new Error(`Usuário com email ${email} não encontrado`);
      }
      
      // Atualizar usuário para nível free
      await db.update(users)
        .set({
          nivelacesso: 'free',
          atualizadoem: new Date()
        })
        .where(eq(users.id, userResult.id));
      
      // Atualizar assinatura
      await db
        .update(subscriptions)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(subscriptions.userId, userResult.id));
      
      return {
        success: true,
        status: 'processed',
        userId: userResult.id
      };
    } catch (error) {
      console.error('Erro ao processar cancelamento de assinatura da Doppus:', error);
      throw error;
    }
  }
  
  /**
   * Processa um evento de assinatura expirada da Doppus
   */
  private async handleSubscriptionExpired(data: any): Promise<any> {
    try {
      const email = data.customer?.email;
      if (!email) {
        throw new Error('Email do cliente não encontrado no webhook');
      }
      
      // Buscar usuário pelo email
      const [userResult] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (!userResult) {
        throw new Error(`Usuário com email ${email} não encontrado`);
      }
      
      // Atualizar usuário para nível free
      await db.update(users)
        .set({
          nivelacesso: 'free',
          atualizadoem: new Date()
        })
        .where(eq(users.id, userResult.id));
      
      // Atualizar assinatura
      await db
        .update(subscriptions)
        .set({
          status: 'expired',
          updatedAt: new Date()
        })
        .where(eq(subscriptions.userId, userResult.id));
      
      return {
        success: true,
        status: 'processed',
        userId: userResult.id
      };
    } catch (error) {
      console.error('Erro ao processar expiração de assinatura da Doppus:', error);
      throw error;
    }
  }
  
  /**
   * Processa um evento de pagamento reembolsado da Doppus
   */
  private async handlePaymentRefunded(data: any): Promise<any> {
    try {
      const email = data.customer?.email;
      if (!email) {
        throw new Error('Email do cliente não encontrado no webhook');
      }
      
      // Buscar usuário pelo email
      const [userResult] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (!userResult) {
        throw new Error(`Usuário com email ${email} não encontrado`);
      }
      
      // Atualizar usuário para nível free
      await db.update(users)
        .set({
          nivelacesso: 'free',
          atualizadoem: new Date()
        })
        .where(eq(users.id, userResult.id));
      
      // Atualizar assinatura
      await db
        .update(subscriptions)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(subscriptions.userId, userResult.id));
      
      return {
        success: true,
        status: 'processed',
        userId: userResult.id
      };
    } catch (error) {
      console.error('Erro ao processar reembolso de pagamento da Doppus:', error);
      throw error;
    }
  }
  
  /**
   * Método auxiliar para fazer requisições autenticadas à API da Doppus
   * @param method Método HTTP (GET, POST, PUT, DELETE)
   * @param endpoint Endpoint da API (sem o baseUrl)
   * @param data Dados a serem enviados no corpo da requisição (para POST/PUT)
   */
  private async makeAuthenticatedRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      // Obter token de acesso
      const token = await this.getAccessToken();
      
      // Montar URL completa
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`Fazendo requisição ${method} para ${url}`);
      
      // Opções da requisição
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // Formato conforme documentação Doppus
        }
      };
      
      // Adicionar corpo da requisição para métodos que o permitem
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }
      
      // Executar requisição
      const response = await fetch(url, options);
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na requisição ${method} ${endpoint}: ${response.status}`);
        console.error('Conteúdo da resposta de erro:', errorText);
        throw new Error(`Erro na requisição à API Doppus: ${response.status} ${errorText}`);
      }
      
      // Converter resposta para JSON
      const responseData = await response.json() as { 
        success?: boolean; 
        message?: string;
        data?: any;
      };
      
      // Verificar se a resposta possui a estrutura esperada
      if (responseData.success === false) {
        console.error('Resposta da API Doppus com sucesso=false:', responseData);
        throw new Error(`Erro retornado pela API Doppus: ${responseData.message || 'Erro desconhecido'}`);
      }
      
      // Retornar a resposta completa
      return responseData;
    } catch (error) {
      console.error(`Erro ao fazer requisição autenticada à API Doppus:`, error);
      throw error;
    }
  }

  /**
   * Verifica o status de uma assinatura na Doppus
   * @param email Email do cliente
   */
  public async checkSubscriptionStatus(email: string): Promise<any> {
    try {
      console.log(`Verificando status de assinatura para o email: ${email}`);
      
      // Conforme documentação da Doppus, endpoint para consultar vendas do cliente
      const data = await this.makeAuthenticatedRequest(
        'GET', 
        `/Sale/checkout/customer/${encodeURIComponent(email)}`
      );
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Erro ao verificar status da assinatura na Doppus:', error);
      throw new Error('Falha ao verificar status: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Testa a conexão com a API da Doppus
   * @returns Resultado do teste com status de sucesso
   */
  public async testConnection(): Promise<{ success: boolean; message?: string; details?: any }> {
    try {
      console.log('===== INICIANDO TESTE DE CONEXÃO COM A DOPPUS =====');
      console.log('Data e hora:', new Date().toISOString());
      console.log('URL da API:', this.baseUrl);
      console.log('Endpoints a serem testados:');
      console.log('- Autenticação:', `${this.baseUrl}/oauth/token`);
      console.log('- API:', `${this.baseUrl}/rest/v2`);
      
      try {
        // Consultar diretamente o banco de dados para obter as credenciais da Doppus
        console.log('PASSO 1: Consultando credenciais diretamente no banco de dados...');
        const { pool } = await import('../db');
        
        // Verificar se a tabela subscriptionSettings existe
        const tableCheckResult = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'subscriptionSettings'
          );
        `);
        
        const tableExists = tableCheckResult.rows[0].exists;
        if (!tableExists) {
          console.error('✗ Tabela subscriptionSettings não existe no banco de dados');
          return {
            success: false,
            message: 'Tabela de configurações de assinaturas não encontrada. Contate o suporte técnico.',
            details: { error: 'Tabela subscriptionSettings não existe' }
          };
        }
        
        // Consultar coluna por coluna para identificar exatamente onde está o problema
        const columnsResult = await pool.query(`
          SELECT 
            column_name 
          FROM 
            information_schema.columns 
          WHERE 
            table_schema = 'public' 
            AND table_name = 'subscriptionSettings';
        `);
        
        const columns = columnsResult.rows.map(row => row.column_name);
        console.log('Colunas encontradas na tabela subscriptionSettings:', columns);
        
        const hasDoppusClientId = columns.includes('doppusClientId');
        const hasDoppusClientSecret = columns.includes('doppusClientSecret');
        const hasDoppusSecretKey = columns.includes('doppusSecretKey');
        
        if (!hasDoppusClientId || !hasDoppusClientSecret) {
          console.error('✗ Colunas necessárias não existem na tabela subscriptionSettings');
          return {
            success: false,
            message: 'Estrutura da tabela de configurações incompleta. Contate o suporte técnico.',
            details: { 
              error: 'Colunas necessárias não encontradas',
              missing: {
                doppusClientId: !hasDoppusClientId,
                doppusClientSecret: !hasDoppusClientSecret,
                doppusSecretKey: !hasDoppusSecretKey
              }
            }
          };
        }
        
        // Consultar as credenciais da Doppus diretamente
        console.log('Consultando credenciais da Doppus...');
        const credentialsResult = await pool.query(`
          SELECT 
            "doppusClientId", 
            "doppusClientSecret", 
            "doppusSecretKey"
          FROM 
            "subscriptionSettings" 
          LIMIT 1;
        `);
        
        if (credentialsResult.rows.length === 0) {
          console.error('✗ Nenhuma configuração encontrada na tabela subscriptionSettings');
          return {
            success: false,
            message: 'Configurações de assinatura não encontradas. Configure as credenciais da Doppus primeiro.',
            details: { error: 'Nenhum registro na tabela subscriptionSettings' }
          };
        }
        
        const credentials = credentialsResult.rows[0];
        console.log('Credenciais encontradas:', {
          clientId: credentials.doppusClientId ? `${credentials.doppusClientId.substring(0, 4)}...${credentials.doppusClientId.slice(-4)}` : null,
          clientSecret: credentials.doppusClientSecret ? 'definido' : null,
          secretKey: credentials.doppusSecretKey ? 'definido' : null
        });
        
        if (!credentials.doppusClientId || !credentials.doppusClientSecret) {
          console.error('✗ Credenciais da Doppus incompletas');
          return {
            success: false,
            message: 'Credenciais da Doppus incompletas. Configure Client ID e Client Secret.',
            details: { 
              error: 'Credenciais incompletas',
              missing: {
                clientId: !credentials.doppusClientId,
                clientSecret: !credentials.doppusClientSecret
              }
            }
          };
        }
        
        // Tentar obter token de acesso
        console.log('PASSO 2: Solicitando token de acesso da Doppus...');
        console.log(`Enviando requisição para ${this.baseUrl}/Auth`);
        console.log('Credenciais utilizadas:');
        console.log('- Client ID: ', credentials.doppusClientId ? `${credentials.doppusClientId.substring(0, 4)}...${credentials.doppusClientId.slice(-4)}` : 'não definido');
        console.log('- Client Secret: ', credentials.doppusClientSecret ? 'definido (valor mascarado)' : 'não definido');
        
        const params = new URLSearchParams({
          'grant_type': 'client_credentials'
        });
        
        // A documentação da Doppus indica que o Client ID e Client Secret devem ser enviados via Basic Auth
        const authString = Buffer.from(`${credentials.doppusClientId}:${credentials.doppusClientSecret}`).toString('base64');
        console.log('Autenticação: Basic', authString.substring(0, 8) + '...');
        
        console.log('Body da requisição:', params.toString());
        
        const tokenResponse = await fetch(`${this.baseUrl}/Auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authString}`
          },
          body: params
        });
        
        console.log('Resposta recebida. Status:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('✗ Erro na resposta da API. Status:', tokenResponse.status);
          console.error('✗ Corpo da resposta:', errorText);
          
          // Log de alguns headers importantes
          const headers = {
            'content-type': tokenResponse.headers.get('content-type'),
            'www-authenticate': tokenResponse.headers.get('www-authenticate')
          };
          console.error('✗ Headers da resposta:', JSON.stringify(headers));
          
          let errorMsg = `Erro ao obter token de acesso (HTTP ${tokenResponse.status})`;
          if (tokenResponse.status === 401) {
            errorMsg = 'Credenciais inválidas. Verifique se o Client ID e Client Secret estão corretos.';
          } else if (tokenResponse.status === 400) {
            errorMsg = 'Requisição inválida. Verifique se as credenciais estão no formato correto.';
          } else if (tokenResponse.status === 404) {
            errorMsg = 'Endpoint de autenticação não encontrado. Verifique a URL da API.';
          } else if (tokenResponse.status === 0 || tokenResponse.status >= 500) {
            errorMsg = 'Erro de conexão ou erro no servidor Doppus. Verifique a URL e tente novamente mais tarde.';
          }
          
          try {
            // Tentar analisar o erro como JSON
            const errorJson = JSON.parse(errorText);
            console.error('✗ Erro em formato JSON:', JSON.stringify(errorJson, null, 2));
            
            if (errorJson.error_description) {
              errorMsg = `Erro da API Doppus: ${errorJson.error_description}`;
            } else if (errorJson.message) {
              errorMsg = `Erro da API Doppus: ${errorJson.message}`;
            }
          } catch (e) {
            // Não é um JSON válido, continuar com o errorText
            console.log('O erro não está em formato JSON válido');
          }
          
          return {
            success: false,
            message: errorMsg,
            details: { 
              stage: 'token', 
              status: tokenResponse.status, 
              error: errorText,
              clientIdUsed: credentials.doppusClientId.substring(0, 4) + '...' + credentials.doppusClientId.slice(-4),
              baseUrl: this.baseUrl
            }
          };
        }
        
        let tokenData;
        try {
          tokenData = await tokenResponse.json() as { access_token?: string };
          console.log('Resposta JSON completa:', JSON.stringify(tokenData, null, 2));
        } catch (parseError) {
          console.error('✗ Erro ao analisar resposta como JSON:', parseError);
          return {
            success: false,
            message: 'Erro ao processar resposta da API',
            details: { 
              stage: 'parse_json', 
              error: String(parseError),
              baseUrl: this.baseUrl
            }
          };
        }
        
        if (!tokenData || !tokenData.access_token) {
          console.error('✗ Token não encontrado na resposta:', tokenData);
          return {
            success: false,
            message: 'Token de acesso não retornado pela API da Doppus',
            details: { stage: 'token', response: tokenData, baseUrl: this.baseUrl }
          };
        }
        
        const token = tokenData.access_token;
        console.log('✓ Token de acesso obtido com sucesso:', token.substring(0, 10) + '...');
        
        // Testar se o token funciona fazendo uma requisição para um endpoint básico
        console.log('PASSO 3: Testando token com endpoint de produtos...');
        const apiResponse = await fetch(`${this.baseUrl}/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Resposta recebida. Status:', apiResponse.status);
        
        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error('✗ Erro ao acessar endpoint de produtos:', errorText);
          return {
            success: false,
            message: `Erro ao acessar endpoint de produtos: Status ${apiResponse.status}`,
            details: { stage: 'endpoint', status: apiResponse.status, error: errorText }
          };
        }
        
        console.log('✓ Teste de conexão com a API da Doppus concluído com sucesso');
        
        return {
          success: true,
          message: 'Conexão com a API da Doppus estabelecida com sucesso!',
          details: { 
            timestamp: new Date().toISOString(),
            credentials: {
              clientId: credentials.doppusClientId.substring(0, 4) + '...' + credentials.doppusClientId.slice(-4),
              hasClientSecret: !!credentials.doppusClientSecret,
              hasSecretKey: !!credentials.doppusSecretKey
            }
          }
        };
      } catch (innerError) {
        console.error('✗ Erro no teste de conexão:', innerError);
        throw innerError; // rethrow para ser capturado pelo catch externo
      }
    } catch (error) {
      console.error('ERRO FINAL no teste de conexão com a Doppus:', error);
      
      // Extrair uma mensagem amigável do erro
      let friendlyMessage = 'Falha na conexão com a Doppus';
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Falha na autenticação')) {
        friendlyMessage = 'Falha na autenticação. Verifique se o Client ID e Client Secret estão corretos.';
      } else if (errorMessage.includes('fetch')) {
        friendlyMessage = 'Não foi possível conectar ao servidor da Doppus. Verifique sua conexão com a internet.';
      }
      
      return {
        success: false,
        message: friendlyMessage,
        details: { 
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Exportar uma instância única do serviço
export default new DoppusService();