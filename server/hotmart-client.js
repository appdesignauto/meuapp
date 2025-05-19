/**
 * Cliente especializado para a API Hotmart
 * 
 * Este cliente usa o módulo de API direta para acessar 
 * os endpoints da Hotmart e lidar com os problemas específicos
 * como o retorno de HTML em vez de JSON.
 */

const hotmartDirectApi = require('./hotmart-direct-api');

/**
 * Cria um cliente da API Hotmart
 * @param {string} clientId - Client ID da API Hotmart
 * @param {string} clientSecret - Client Secret da API Hotmart
 * @param {string} environment - Ambiente (production ou sandbox)
 * @returns {Object} - Cliente da API Hotmart
 */
function createHotmartClient(clientId, clientSecret, environment = 'production') {
  // Armazenar credenciais
  const credentials = {
    clientId,
    clientSecret,
    environment,
    accessToken: null,
    tokenExpiration: null
  };
  
  /**
   * Testa a conexão com a API Hotmart
   * @returns {Promise<Object>} - Resultado do teste
   */
  async function testConnection() {
    try {
      console.log(`[HotmartClient] Testando conexão com a API Hotmart (${environment})`);
      
      // Usar API direta para testar credenciais
      const result = await hotmartDirectApi.testHotmartCredentials(
        credentials.clientId,
        credentials.clientSecret,
        credentials.environment
      );
      
      // Se o teste for bem-sucedido, armazenar o token
      if (result.success && result.data && result.data.accessToken) {
        credentials.accessToken = result.data.accessToken;
        
        // Calcular expiração do token (subtraindo 5 minutos para margem de segurança)
        const expiresInMs = (result.data.expiresIn - 300) * 1000;
        credentials.tokenExpiration = Date.now() + expiresInMs;
        
        console.log(`[HotmartClient] Conexão com a API Hotmart bem-sucedida. Token obtido.`);
      } else {
        console.error(`[HotmartClient] Falha ao testar conexão:`, result.message);
      }
      
      return result;
    } catch (error) {
      console.error(`[HotmartClient] Erro ao testar conexão:`, error);
      return {
        success: false,
        message: `Erro ao testar conexão: ${error.message}`,
        error
      };
    }
  }
  
  /**
   * Obtém um token de acesso válido
   * @returns {Promise<string>} - Token de acesso
   */
  async function getAccessToken() {
    // Verificar se já temos um token válido
    if (credentials.accessToken && credentials.tokenExpiration > Date.now()) {
      return credentials.accessToken;
    }
    
    // Caso contrário, obter um novo token
    try {
      const result = await testConnection();
      
      if (result.success && credentials.accessToken) {
        return credentials.accessToken;
      } else {
        throw new Error(`Não foi possível obter token de acesso: ${result.message}`);
      }
    } catch (error) {
      throw new Error(`Erro ao obter token de acesso: ${error.message}`);
    }
  }
  
  /**
   * Lista assinaturas ativas na Hotmart
   * @returns {Promise<Array>} - Lista de assinaturas
   */
  async function listActiveSubscriptions() {
    try {
      // Obter token de acesso
      const accessToken = await getAccessToken();
      
      // Usar API direta para listar assinaturas
      const result = await hotmartDirectApi.listHotmartSubscriptions(
        accessToken,
        credentials.environment
      );
      
      return result;
    } catch (error) {
      console.error(`[HotmartClient] Erro ao listar assinaturas:`, error);
      return {
        success: false,
        message: `Erro ao listar assinaturas: ${error.message}`,
        error
      };
    }
  }
  
  // Retornar interface do cliente
  return {
    testConnection,
    getAccessToken,
    listActiveSubscriptions
  };
}

module.exports = {
  createHotmartClient
};