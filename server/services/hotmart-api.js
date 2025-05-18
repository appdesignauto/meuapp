/**
 * Serviço de API da Hotmart
 * 
 * Este serviço fornece métodos para autenticação e comunicação com a API da Hotmart
 * utilizando o token Basic fornecido diretamente.
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class HotmartAPI {
  constructor() {
    // Configurações base da API Hotmart
    this.baseUrl = 'https://developers.hotmart.com';
    this.authUrl = `${this.baseUrl}/security/oauth/token`;
    this.productsUrl = `${this.baseUrl}/payments/api/v1/products`;
    this.subscriptionsUrl = `${this.baseUrl}/payments/api/v1/subscriptions`;
    this.purchasesUrl = `${this.baseUrl}/payments/api/v1/sales`;
    
    // Token Basic fornecido pelo cliente
    this.basicToken = 'Basic OGMxMjZlNTktN2JkMC00OWFmLWE0MDItZWM3ODQ5YTY4NmQ4OjkwYmY1OTIxLTk1NjUtNGYxZS05NzYzLTE5ZjdmMjQ1N2QwMA==';
    
    // Cache de token de acesso
    this.accessToken = null;
    this.tokenExpiry = null;
  }
  
  /**
   * Obtém um token de acesso usando o token Basic
   * 
   * @returns {Promise<string>} Token de acesso
   */
  async getAccessToken() {
    try {
      // Se já temos um token válido, retorna ele
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
        console.log('Usando token em cache');
        return this.accessToken;
      }
      
      console.log('Obtendo novo token de acesso da Hotmart...');
      
      // Parâmetros para solicitação de token
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      
      // Configuração da requisição
      const config = {
        method: 'post',
        url: this.authUrl,
        headers: {
          'Authorization': this.basicToken,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      };
      
      // Faz a requisição
      const response = await axios(config);
      
      // Verifica se a resposta contém um token de acesso
      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // Define validade do token (expiração menos 5 minutos para segurança)
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000;
        console.log('Token de acesso obtido com sucesso!');
        return this.accessToken;
      } else {
        throw new Error('Resposta não contém token de acesso');
      }
    } catch (error) {
      console.error('Erro ao obter token de acesso:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Dados:', error.response.data);
      }
      throw new Error(`Falha na autenticação Hotmart: ${error.message}`);
    }
  }
  
  /**
   * Faz uma requisição autenticada para a API da Hotmart
   * 
   * @param {string} method Método HTTP
   * @param {string} url URL da requisição
   * @param {Object} data Dados a serem enviados (opcional)
   * @returns {Promise<Object>} Resposta da API
   */
  async request(method, url, data = null) {
    try {
      // Obtém token de acesso
      const token = await this.getAccessToken();
      
      // Configuração da requisição
      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Adiciona dados se fornecidos
      if (data) {
        config.data = data;
      }
      
      // Faz a requisição
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Erro na requisição ${method} ${url}:`, error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Dados:', error.response.data);
      }
      throw new Error(`Falha na requisição Hotmart: ${error.message}`);
    }
  }
  
  /**
   * Obtém a lista de produtos
   * 
   * @returns {Promise<Array>} Lista de produtos
   */
  async getProducts() {
    return this.request('get', this.productsUrl);
  }
  
  /**
   * Obtém informações detalhadas de um produto específico
   * 
   * @param {string} productId ID do produto
   * @returns {Promise<Object>} Informações do produto
   */
  async getProduct(productId) {
    return this.request('get', `${this.productsUrl}/${productId}`);
  }
  
  /**
   * Obtém uma lista de assinaturas
   * 
   * @param {Object} params Parâmetros de filtro (opcional)
   * @returns {Promise<Array>} Lista de assinaturas
   */
  async getSubscriptions(params = {}) {
    // Constrói a URL com os parâmetros de consulta
    let url = this.subscriptionsUrl;
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        queryParams.append(key, value);
      }
      url = `${url}?${queryParams.toString()}`;
    }
    
    return this.request('get', url);
  }
  
  /**
   * Obtém informações detalhadas de uma assinatura específica
   * 
   * @param {string} subscriptionId ID da assinatura
   * @returns {Promise<Object>} Informações da assinatura
   */
  async getSubscription(subscriptionId) {
    return this.request('get', `${this.subscriptionsUrl}/${subscriptionId}`);
  }
  
  /**
   * Obtém uma lista de compras
   * 
   * @param {Object} params Parâmetros de filtro (opcional)
   * @returns {Promise<Array>} Lista de compras
   */
  async getPurchases(params = {}) {
    // Constrói a URL com os parâmetros de consulta
    let url = this.purchasesUrl;
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        queryParams.append(key, value);
      }
      url = `${url}?${queryParams.toString()}`;
    }
    
    return this.request('get', url);
  }
  
  /**
   * Obtém informações detalhadas de uma compra específica
   * 
   * @param {string} purchaseId ID da compra
   * @returns {Promise<Object>} Informações da compra
   */
  async getPurchase(purchaseId) {
    return this.request('get', `${this.purchasesUrl}/${purchaseId}`);
  }
  
  /**
   * Verifica a conectividade com a API da Hotmart
   * 
   * @returns {Promise<Object>} Status da conectividade
   */
  async checkConnectivity() {
    try {
      // Tenta obter um token de acesso
      await this.getAccessToken();
      
      return {
        success: true,
        message: 'Conexão com a API da Hotmart estabelecida com sucesso!'
      };
    } catch (error) {
      return {
        success: false,
        message: `Falha na conexão com a API da Hotmart: ${error.message}`,
        error: error.message
      };
    }
  }
}

// Exporta uma instância única do serviço
const hotmartAPI = new HotmartAPI();
export default hotmartAPI;