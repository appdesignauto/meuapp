/**
 * Serviço para integração com a API da Hotmart
 * 
 * Este serviço gerencia a autenticação, comunicação com a API da Hotmart,
 * e processamento de webhooks da Hotmart.
 */

import axios from 'axios';
import crypto from 'crypto';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do pool de conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class HotmartService {
  constructor() {
    this.baseUrl = 'https://developers.hotmart.com';
    this.authUrl = `${this.baseUrl}/security/oauth/token`;
    this.productsUrl = `${this.baseUrl}/payments/api/v1/products`;
    this.subscriptionsUrl = `${this.baseUrl}/payments/api/v1/subscriptions`;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Inicializa o cliente
    this.initializeClient();
  }
  
  /**
   * Inicializa o cliente obtendo as credenciais do banco de dados
   */
  async initializeClient() {
    try {
      const credentials = await this.getCredentialsFromDB();
      this.clientId = credentials.clientId;
      this.clientSecret = credentials.clientSecret;
      this.basicAuth = credentials.basicAuth;
      
      console.log('Cliente Hotmart inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar cliente Hotmart:', error);
    }
  }
  
  /**
   * Obtém as credenciais da Hotmart do banco de dados
   */
  async getCredentialsFromDB() {
    try {
      const result = await pool.query(`
        SELECT key, value 
        FROM integration_settings
        WHERE provider = 'hotmart'
        AND (key = 'client_id' OR key = 'client_secret' OR key = 'basic_auth')
      `);
      
      const credentials = {
        clientId: null,
        clientSecret: null,
        basicAuth: null
      };
      
      result.rows.forEach(row => {
        if (row.key === 'client_id') {
          credentials.clientId = row.value;
        } else if (row.key === 'client_secret') {
          credentials.clientSecret = row.value;
        } else if (row.key === 'basic_auth') {
          credentials.basicAuth = row.value;
        }
      });
      
      // Se não tiver basicAuth mas tiver clientId e clientSecret, gera o basicAuth
      if (!credentials.basicAuth && credentials.clientId && credentials.clientSecret) {
        credentials.basicAuth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');
        
        // Salva o basicAuth gerado no banco de dados
        await pool.query(`
          INSERT INTO integration_settings (provider, key, value)
          VALUES ('hotmart', 'basic_auth', $1)
          ON CONFLICT (provider, key) 
          DO UPDATE SET value = $1
        `, [credentials.basicAuth]);
      }
      
      return credentials;
    } catch (error) {
      console.error('Erro ao obter credenciais da Hotmart:', error);
      throw error;
    }
  }
  
  /**
   * Obtém um token de acesso da API da Hotmart
   */
  async getAccessToken() {
    // Se já temos um token válido, retorna ele
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }
    
    // Token expirado ou não existe, obter um novo
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      
      const response = await axios({
        method: 'post',
        url: this.authUrl,
        headers: {
          'Authorization': `Basic ${this.basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      
      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // Define validade do token (expiração menos 5 minutos para segurança)
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000;
        
        return this.accessToken;
      } else {
        throw new Error('Resposta de autenticação da Hotmart não contém token de acesso');
      }
    } catch (error) {
      console.error('Erro ao obter token de acesso da Hotmart:', error.message);
      
      // Registra o erro no banco de dados para diagnóstico
      await this.logError('getAccessToken', error);
      
      throw error;
    }
  }
  
  /**
   * Obtém a lista de produtos da conta Hotmart
   */
  async getProducts() {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios({
        method: 'get',
        url: this.productsUrl,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao obter produtos da Hotmart:', error.message);
      await this.logError('getProducts', error);
      throw error;
    }
  }
  
  /**
   * Obtém detalhes de uma assinatura específica
   */
  async getSubscription(subscriptionId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.subscriptionsUrl}/${subscriptionId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter assinatura ${subscriptionId} da Hotmart:`, error.message);
      await this.logError('getSubscription', error);
      throw error;
    }
  }
  
  /**
   * Verifica se um hook da Hotmart é autêntico usando o cabeçalho de assinatura
   */
  async verifyHotmartWebhook(signature, payload) {
    try {
      // Obtém o segredo do webhook do banco de dados
      const result = await pool.query(`
        SELECT value 
        FROM integration_settings
        WHERE provider = 'hotmart'
        AND key = 'webhook_secret'
      `);
      
      if (result.rows.length === 0) {
        console.error('Segredo do webhook Hotmart não encontrado no banco de dados');
        return false;
      }
      
      const secret = result.rows[0].value;
      
      // Calcula a assinatura HMAC-SHA256
      const calculatedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      // Compara a assinatura calculada com a fornecida
      return signature === calculatedSignature;
    } catch (error) {
      console.error('Erro ao verificar assinatura do webhook Hotmart:', error);
      await this.logError('verifyHotmartWebhook', error);
      return false;
    }
  }
  
  /**
   * Processa um webhook recebido da Hotmart
   */
  async processWebhook(payload, headers) {
    try {
      // Registra o webhook recebido
      const logId = await this.logWebhook(payload, headers);
      
      // Extrai o tipo de evento do payload
      const eventType = payload?.event || '';
      
      // Processa o evento de acordo com seu tipo
      switch (eventType.toLowerCase()) {
        case 'purchase':
        case 'approved':
          await this.processPurchase(payload, logId);
          break;
          
        case 'subscription_cancellation':
        case 'canceled':
          await this.processCancellation(payload, logId);
          break;
          
        case 'refund':
        case 'chargeback':
        case 'dispute':
          await this.processRefund(payload, logId);
          break;
          
        case 'renewal':
        case 'recurrence':
          await this.processRenewal(payload, logId);
          break;
          
        default:
          console.log(`Evento não processado: ${eventType}`);
          await this.updateWebhookLog(logId, 'unprocessed', `Tipo de evento não reconhecido: ${eventType}`);
      }
      
      return {
        success: true,
        message: `Webhook processado com sucesso: ${eventType}`
      };
    } catch (error) {
      console.error('Erro ao processar webhook da Hotmart:', error);
      await this.logError('processWebhook', error);
      
      return {
        success: false,
        message: `Erro ao processar webhook: ${error.message}`
      };
    }
  }
  
  /**
   * Processa um evento de compra ou aprovação
   */
  async processPurchase(payload, logId) {
    try {
      // Extrai os dados relevantes do payload
      const email = this.extractEmailFromPayload(payload);
      const productId = payload?.product?.id;
      const transactionId = payload?.purchase?.transaction || payload?.transaction_code || payload?.transaction?.code;
      const status = payload?.purchase?.status || payload?.status || 'approved';
      
      if (!email) {
        await this.updateWebhookLog(logId, 'error', 'Email não encontrado no payload');
        return;
      }
      
      if (!productId) {
        await this.updateWebhookLog(logId, 'error', 'ID do produto não encontrado no payload');
        return;
      }
      
      // Verifica se o produto está mapeado no sistema
      const productMapping = await this.getProductMapping(productId);
      
      if (!productMapping) {
        await this.updateWebhookLog(logId, 'error', `Produto não mapeado no sistema: ${productId}`);
        return;
      }
      
      // Verifica se o usuário já existe
      let user = await this.getUserByEmail(email);
      
      if (!user) {
        // Cria um novo usuário com base no email
        user = await this.createUserFromEmail(email, productMapping.planoAcesso);
      } else {
        // Atualiza o plano do usuário existente
        await this.updateUserPlan(user.id, productMapping.planoAcesso);
      }
      
      // Registra ou atualiza a assinatura
      await this.createOrUpdateSubscription(user.id, productId, transactionId, status, payload);
      
      await this.updateWebhookLog(logId, 'processed', `Assinatura processada para o usuário: ${email}`);
    } catch (error) {
      console.error('Erro ao processar compra Hotmart:', error);
      await this.updateWebhookLog(logId, 'error', `Erro ao processar compra: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Processa um evento de cancelamento de assinatura
   */
  async processCancellation(payload, logId) {
    try {
      // Extrai os dados relevantes do payload
      const email = this.extractEmailFromPayload(payload);
      const transactionId = payload?.purchase?.transaction || payload?.transaction_code || payload?.transaction?.code;
      
      if (!email && !transactionId) {
        await this.updateWebhookLog(logId, 'error', 'Email ou ID de transação não encontrados no payload');
        return;
      }
      
      // Busca usuário pelo email se disponível
      let user = null;
      let subscription = null;
      
      if (email) {
        user = await this.getUserByEmail(email);
      }
      
      if (transactionId) {
        subscription = await this.getSubscriptionByTransactionId(transactionId);
        
        if (subscription && !user) {
          user = await this.getUserById(subscription.userId);
        }
      }
      
      if (!user) {
        await this.updateWebhookLog(logId, 'error', `Usuário não encontrado para email: ${email}`);
        return;
      }
      
      // Atualiza o status da assinatura para cancelada
      if (subscription) {
        await this.updateSubscriptionStatus(subscription.id, 'cancelled');
      } else if (user) {
        // Se não encontrou uma assinatura específica, marca todas as assinaturas ativas do usuário como canceladas
        await this.cancelAllUserSubscriptions(user.id);
      }
      
      // Atualiza o plano do usuário para o plano gratuito
      await this.updateUserPlan(user.id, 'free');
      
      await this.updateWebhookLog(logId, 'processed', `Cancelamento processado para o usuário: ${email || user.email}`);
    } catch (error) {
      console.error('Erro ao processar cancelamento Hotmart:', error);
      await this.updateWebhookLog(logId, 'error', `Erro ao processar cancelamento: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Processa um evento de reembolso ou chargeback
   */
  async processRefund(payload, logId) {
    // A lógica para processamento de reembolso é similar à de cancelamento
    await this.processCancellation(payload, logId);
  }
  
  /**
   * Processa um evento de renovação de assinatura
   */
  async processRenewal(payload, logId) {
    try {
      // Extrai os dados relevantes do payload
      const email = this.extractEmailFromPayload(payload);
      const productId = payload?.product?.id;
      const transactionId = payload?.purchase?.transaction || payload?.transaction_code || payload?.transaction?.code;
      
      if (!email) {
        await this.updateWebhookLog(logId, 'error', 'Email não encontrado no payload');
        return;
      }
      
      // Verifica se o usuário existe
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        await this.updateWebhookLog(logId, 'error', `Usuário não encontrado para email: ${email}`);
        return;
      }
      
      // Verifica se o produto está mapeado no sistema
      if (productId) {
        const productMapping = await this.getProductMapping(productId);
        
        if (!productMapping) {
          await this.updateWebhookLog(logId, 'error', `Produto não mapeado no sistema: ${productId}`);
          return;
        }
        
        // Atualiza o plano do usuário
        await this.updateUserPlan(user.id, productMapping.planoAcesso);
      }
      
      // Atualiza a data de expiração da assinatura
      // Normalmente as renovações adicionam 30 dias à data atual
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Atualiza a assinatura
      await this.updateSubscriptionExpiration(user.id, expirationDate);
      
      // Se há um novo ID de transação, atualiza ou cria uma nova entrada de assinatura
      if (transactionId) {
        await this.createOrUpdateSubscription(user.id, productId, transactionId, 'active', payload);
      }
      
      await this.updateWebhookLog(logId, 'processed', `Renovação processada para o usuário: ${email}`);
    } catch (error) {
      console.error('Erro ao processar renovação Hotmart:', error);
      await this.updateWebhookLog(logId, 'error', `Erro ao processar renovação: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extrai o email do usuário do payload do webhook
   */
  extractEmailFromPayload(payload) {
    // Múltiplas localizações possíveis do email no payload
    return payload?.buyer?.email || 
           payload?.customer?.email || 
           payload?.subscriber?.email || 
           payload?.client?.email || 
           payload?.email;
  }
  
  /**
   * Obtém o mapeamento de produto Hotmart para plano do sistema
   */
  async getProductMapping(productId) {
    try {
      const result = await pool.query(`
        SELECT * FROM hotmartProductMappings 
        WHERE hotmartProductId = $1
      `, [productId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter mapeamento de produto Hotmart:', error);
      throw error;
    }
  }
  
  /**
   * Obtém um usuário pelo email
   */
  async getUserByEmail(email) {
    try {
      const result = await pool.query(`
        SELECT * FROM users 
        WHERE email = $1
      `, [email]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter usuário pelo email:', error);
      throw error;
    }
  }
  
  /**
   * Obtém um usuário pelo ID
   */
  async getUserById(userId) {
    try {
      const result = await pool.query(`
        SELECT * FROM users 
        WHERE id = $1
      `, [userId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter usuário pelo ID:', error);
      throw error;
    }
  }
  
  /**
   * Cria um novo usuário a partir do email
   */
  async createUserFromEmail(email, planType) {
    try {
      // Gera um nome de usuário baseado no email
      const username = email.split('@')[0];
      
      // Gera uma senha aleatória
      const password = crypto.randomBytes(8).toString('hex');
      
      // Data atual
      const now = new Date();
      
      // Data de expiração (30 dias no futuro)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Insere o novo usuário
      const result = await pool.query(`
        INSERT INTO users (
          username, email, password, role, nivelacesso, 
          tipoplano, dataassinatura, dataexpiracao, 
          isactive, criadoem, origemassinatura
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        username, email, password, 'user', planType, 
        planType, now, expirationDate, 
        true, now, 'hotmart'
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar usuário a partir do email:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza o plano de um usuário
   */
  async updateUserPlan(userId, planType) {
    try {
      // Data atual
      const now = new Date();
      
      // Data de expiração (30 dias no futuro)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Atualiza o usuário
      await pool.query(`
        UPDATE users 
        SET 
          nivelacesso = $1,
          tipoplano = $2,
          dataassinatura = $3,
          dataexpiracao = $4,
          atualizadoem = $5
        WHERE id = $6
      `, [
        planType, 
        planType, 
        now, 
        expirationDate, 
        now, 
        userId
      ]);
    } catch (error) {
      console.error('Erro ao atualizar plano do usuário:', error);
      throw error;
    }
  }
  
  /**
   * Cria ou atualiza uma assinatura
   */
  async createOrUpdateSubscription(userId, productId, transactionId, status, webhookData) {
    try {
      // Verifica se a assinatura já existe
      const existingResult = await pool.query(`
        SELECT * FROM subscriptions 
        WHERE transactionId = $1
      `, [transactionId]);
      
      const now = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      const webhookDataString = JSON.stringify(webhookData);
      
      if (existingResult.rows.length > 0) {
        // Atualiza a assinatura existente
        await pool.query(`
          UPDATE subscriptions 
          SET 
            status = $1,
            lastEvent = $2,
            updatedAt = $3,
            webhookData = $4
          WHERE id = $5
        `, [
          status,
          webhookData?.event || 'unknown',
          now,
          webhookDataString,
          existingResult.rows[0].id
        ]);
        
        return existingResult.rows[0];
      } else {
        // Cria uma nova assinatura
        const result = await pool.query(`
          INSERT INTO subscriptions (
            userId, productId, transactionId, status, 
            startDate, expirationDate, lastEvent, 
            createdAt, updatedAt, webhookData
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          userId, productId, transactionId, status,
          now, expirationDate, webhookData?.event || 'unknown',
          now, now, webhookDataString
        ]);
        
        return result.rows[0];
      }
    } catch (error) {
      console.error('Erro ao criar ou atualizar assinatura:', error);
      throw error;
    }
  }
  
  /**
   * Obtém uma assinatura pelo ID de transação
   */
  async getSubscriptionByTransactionId(transactionId) {
    try {
      const result = await pool.query(`
        SELECT * FROM subscriptions 
        WHERE transactionId = $1
      `, [transactionId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter assinatura pelo ID de transação:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza o status de uma assinatura
   */
  async updateSubscriptionStatus(subscriptionId, status) {
    try {
      await pool.query(`
        UPDATE subscriptions 
        SET 
          status = $1,
          updatedAt = $2
        WHERE id = $3
      `, [
        status,
        new Date(),
        subscriptionId
      ]);
    } catch (error) {
      console.error('Erro ao atualizar status da assinatura:', error);
      throw error;
    }
  }
  
  /**
   * Cancela todas as assinaturas ativas de um usuário
   */
  async cancelAllUserSubscriptions(userId) {
    try {
      await pool.query(`
        UPDATE subscriptions 
        SET 
          status = 'cancelled',
          updatedAt = $1
        WHERE userId = $2 AND status = 'active'
      `, [
        new Date(),
        userId
      ]);
    } catch (error) {
      console.error('Erro ao cancelar todas as assinaturas do usuário:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza a data de expiração da assinatura
   */
  async updateSubscriptionExpiration(userId, expirationDate) {
    try {
      // Atualiza a data de expiração do usuário
      await pool.query(`
        UPDATE users 
        SET 
          dataexpiracao = $1,
          atualizadoem = $2
        WHERE id = $3
      `, [
        expirationDate,
        new Date(),
        userId
      ]);
      
      // Atualiza todas as assinaturas ativas do usuário
      await pool.query(`
        UPDATE subscriptions 
        SET 
          expirationDate = $1,
          updatedAt = $2
        WHERE userId = $3 AND status = 'active'
      `, [
        expirationDate,
        new Date(),
        userId
      ]);
    } catch (error) {
      console.error('Erro ao atualizar data de expiração da assinatura:', error);
      throw error;
    }
  }
  
  /**
   * Registra um webhook recebido no banco de dados
   */
  async logWebhook(payload, headers) {
    try {
      const now = new Date();
      const evento = payload?.event || 'unknown';
      const productId = payload?.product?.id || null;
      const email = this.extractEmailFromPayload(payload) || null;
      const transactionId = payload?.purchase?.transaction || payload?.transaction_code || payload?.transaction?.code || null;
      
      // Converte o payload para string
      const payloadString = JSON.stringify(payload);
      
      // Converte os headers para string
      const headersString = JSON.stringify(headers);
      
      // Insere o log no banco de dados
      const result = await pool.query(`
        INSERT INTO webhookLogs (
          source, event, status, email, 
          productId, transactionId, payload, 
          headers, createdAt, processedAt
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        'hotmart', evento, 'received', email,
        productId, transactionId, payloadString,
        headersString, now, null
      ]);
      
      return result.rows[0].id;
    } catch (error) {
      console.error('Erro ao registrar webhook no banco de dados:', error);
      return null;
    }
  }
  
  /**
   * Atualiza o status de um log de webhook
   */
  async updateWebhookLog(logId, status, details) {
    try {
      const now = new Date();
      
      await pool.query(`
        UPDATE webhookLogs 
        SET 
          status = $1,
          processedAt = $2,
          details = $3
        WHERE id = $4
      `, [
        status,
        now,
        details,
        logId
      ]);
    } catch (error) {
      console.error('Erro ao atualizar log de webhook:', error);
    }
  }
  
  /**
   * Registra um erro no banco de dados
   */
  async logError(method, error) {
    try {
      const now = new Date();
      const errorMessage = error.message || 'Erro desconhecido';
      const errorStack = error.stack || '';
      
      await pool.query(`
        INSERT INTO errorLogs (
          source, method, message, 
          stack, createdAt
        ) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'hotmart', method, errorMessage,
        errorStack, now
      ]);
    } catch (logError) {
      console.error('Erro ao registrar erro no banco de dados:', logError);
    }
  }
}

// Exporta uma instância única do serviço
const hotmartService = new HotmartService();
export default hotmartService;