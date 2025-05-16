/**
 * Serviço para integração com a API da Doppus
 * 
 * Este serviço gerencia as operações relacionadas à plataforma Doppus, incluindo:
 * - Autenticação com Client ID e Client Secret
 * - Processamento de webhooks
 * - Verificação de status de assinaturas
 */

import { db } from '../db';
import { users, subscriptions } from '../../shared/schema';
import { eq, and, not, isNull } from 'drizzle-orm';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Interface para o tipo de plano
type PlanType = 'basic' | 'premium' | 'premium_30' | 'premium_180' | 'premium_365' | 'premium_lifetime';

// Interface para o status da assinatura
type SubscriptionStatus = 'active' | 'pending' | 'cancelled' | 'expired';

// Interface para as credenciais da Doppus
interface DoppusCredentials {
  clientId: string;
  clientSecret: string;
  secretKey: string;
}

/**
 * Serviço para gerenciar integração com Doppus
 */
class DoppusService {
  private baseUrl: string = 'https://api.doppus.app/4.0';
  private credentials: DoppusCredentials | null = null;
  
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
        clientId: row.doppusClientId,
        clientSecret: row.doppusClientSecret,
        secretKey: row.doppusSecretKey || ''
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
      console.log('Solicitando token de acesso da Doppus...');
      const credentials = await this.getCredentials();
      
      console.log(`Enviando requisição de autenticação para ${this.baseUrl}/token`);
      console.log('Client ID utilizado:', credentials.clientId.substring(0, 4) + '...');
      
      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials',
          'client_id': credentials.clientId,
          'client_secret': credentials.clientSecret
        })
      });
      
      console.log('Resposta recebida. Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro completo da API:', errorText);
        
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
        
        throw new Error(errorMsg + ` (${errorText})`);
      }
      
      const data = await response.json();
      
      if (!data.access_token) {
        console.error('Resposta sem token de acesso:', JSON.stringify(data));
        throw new Error('Token de acesso não retornado pela API da Doppus');
      }
      
      console.log('Token de acesso obtido com sucesso!');
      return data.access_token;
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
      
      if (!credentials.secretKey) {
        console.warn('Secret Key da Doppus não configurada, pulando validação de assinatura');
        return true; // Em ambiente de desenvolvimento, podemos pular a validação
      }
      
      // Calcular HMAC usando SHA-256 e o Secret Key
      const hmac = crypto.createHmac('sha256', credentials.secretKey);
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
      
      if (productCode) {
        // Aqui podemos implementar a lógica para mapear códigos de produto da Doppus para tipos de plano
        // Exemplo:
        switch (productCode) {
          case 'PREMIUM_MENSAL':
            planType = 'premium_30';
            durationDays = 30;
            break;
          case 'PREMIUM_SEMESTRAL':
            planType = 'premium_180';
            durationDays = 180;
            break;
          case 'PREMIUM_ANUAL':
            planType = 'premium_365';
            durationDays = 365;
            break;
          case 'PREMIUM_VITALICIO':
            planType = 'premium_lifetime';
            isLifetime = true;
            durationDays = 99999; // Valor muito alto para representar vitalício
            break;
          default:
            planType = 'premium';
            durationDays = 30;
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
   * Verifica o status de uma assinatura na Doppus
   * @param email Email do cliente
   */
  public async checkSubscriptionStatus(email: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/subscriptions?customer.email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao verificar status da assinatura: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
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
  public async testConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Iniciando teste de conexão com a API da Doppus...');
      
      // Primeiro passo: Obter um token de acesso
      const token = await this.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          message: 'Não foi possível obter token de acesso da API da Doppus'
        };
      }
      
      console.log('Token de acesso obtido com sucesso. Testando endpoint de produtos...');
      
      // Segundo passo: Testar algum endpoint básico para confirmar que o token funciona
      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Falha ao acessar endpoint de produtos: ${response.status} ${errorText}`
        };
      }
      
      console.log('Teste de conexão com a API da Doppus concluído com sucesso');
      
      return {
        success: true,
        message: 'Conexão com a API da Doppus estabelecida com sucesso'
      };
    } catch (error) {
      console.error('Erro no teste de conexão com a Doppus:', error);
      
      return {
        success: false,
        message: 'Erro na conexão: ' + (error instanceof Error ? error.message : String(error))
      };
    }
  }
}

// Exportar uma instância única do serviço
export default new DoppusService();