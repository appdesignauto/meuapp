/**
 * Cliente HTTP especializado para comunicação com a API da Hotmart
 * 
 * Este cliente lida com os detalhes específicos da autenticação Hotmart
 * e outros requisitos para comunicação com a API deles.
 */

const axios = require('axios');
const https = require('https');
const { URLSearchParams } = require('url');

// Configuração de agente HTTP com opções para lidar com possíveis problemas de SSL
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Para evitar erros de SSL em ambiente de desenvolvimento
  keepAlive: true
});

// Função para criar cliente Axios configurado para a API Hotmart
function createHotmartClient(clientId, clientSecret, environment = 'production') {
  // Definir a URL base baseada no ambiente
  const baseURL = environment === 'production' 
    ? 'https://developers.hotmart.com' 
    : 'https://sandbox.hotmart.com';
  
  // Criar o token de autenticação básica
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  // Criar instância Axios com configurações específicas para Hotmart
  const client = axios.create({
    baseURL,
    timeout: 15000, // 15 segundos
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'DesignAuto/1.0'
    },
    httpsAgent
  });
  
  // Interceptador para adicionar token de autenticação em todas as requisições
  client.interceptors.request.use(
    config => {
      config.headers.Authorization = `Basic ${basicAuth}`;
      return config;
    },
    error => Promise.reject(error)
  );
  
  // Adicionar função de teste de conexão ao cliente
  client.testConnection = async () => {
    try {
      console.log(`[HotmartClient] Testando conexão com ${baseURL}/security/oauth/token`);
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('scope', 'payments sales subscriptions users reports webhook campaigns catalogs');
      
      const response = await client.post('/security/oauth/token', params);
      
      if (response.status === 200 && response.data && response.data.access_token) {
        return {
          success: true,
          message: `Conexão com a API Hotmart (${environment}) realizada com sucesso`,
          data: {
            accessToken: response.data.access_token.substring(0, 10) + '...',
            tokenType: response.data.token_type,
            expiresIn: response.data.expires_in,
            scope: response.data.scope
          }
        };
      } else {
        return {
          success: false,
          message: `Falha na autenticação com a API Hotmart (${environment})`,
          error: {
            status: response.status,
            data: response.data
          }
        };
      }
    } catch (error) {
      // Log detalhado para depuração
      console.error('[HotmartClient] Erro ao testar conexão:', error.message);
      
      // Extrair informações detalhadas do erro
      const errorDetails = {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
      
      // Adicionar informações da resposta se disponíveis
      if (error.response) {
        errorDetails.status = error.response.status;
        errorDetails.statusText = error.response.statusText;
        errorDetails.data = error.response.data;
        
        // Verificar se a resposta inclui conteúdo HTML (indicando um redirecionamento ou página de erro)
        if (typeof error.response.data === 'string' && 
            error.response.data.includes('<!DOCTYPE html>')) {
          errorDetails.data = 'A API retornou uma página HTML em vez de JSON. Isso geralmente indica um problema de autenticação ou redirecionamento.';
        }
      }
      
      return {
        success: false,
        message: `Erro ao conectar com a API Hotmart (${environment})`,
        error: errorDetails
      };
    }
  };
  
  return client;
}

module.exports = {
  createHotmartClient
};