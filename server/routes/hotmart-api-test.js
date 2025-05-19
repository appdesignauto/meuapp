/**
 * Rotas para teste da API da Hotmart
 * 
 * Este arquivo contém rotas para testar a conexão com a API da Hotmart
 * utilizando diferentes credenciais e ambientes.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Middleware CORS específico para permitir requisições de qualquer origem
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Interceptar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

/**
 * Testa as credenciais da API Hotmart
 * 
 * @param {string} clientId - O Client ID da API Hotmart
 * @param {string} clientSecret - O Client Secret da API Hotmart
 * @param {string} environment - O ambiente (sandbox ou production)
 * @returns {Promise<Object>} - Resultado do teste
 */
async function testHotmartCredentials(clientId, clientSecret, environment) {
  try {
    const baseUrl = environment === 'production' 
      ? 'https://developers.hotmart.com' 
      : 'https://sandbox.hotmart.com';
    
    // Cria o token básico de autenticação
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Tenta obter um token de acesso
    const tokenResponse = await axios({
      method: 'post',
      url: `${baseUrl}/security/oauth/token`,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials&scope=payments+sales+subscriptions+users+reports+webhook+campaigns+catalogs',
      validateStatus: function (status) {
        // Permite qualquer código de status para podermos capturar erros específicos
        return true;
      }
    });

    // Verifica a resposta da API
    if (tokenResponse.status === 200 && tokenResponse.data.access_token) {
      return {
        success: true,
        message: `Conexão com a API Hotmart (${environment}) realizada com sucesso`,
        data: {
          accessToken: tokenResponse.data.access_token.substring(0, 10) + '...',
          tokenType: tokenResponse.data.token_type,
          expiresIn: tokenResponse.data.expires_in,
          scope: tokenResponse.data.scope
        }
      };
    } else {
      return {
        success: false,
        message: `Falha na autenticação com a API Hotmart (${environment})`,
        error: {
          status: tokenResponse.status,
          data: tokenResponse.data
        }
      };
    }
  } catch (error) {
    console.error('Erro ao testar credenciais Hotmart:', error.message);
    
    return {
      success: false,
      message: `Erro ao conectar com a API Hotmart (${environment})`,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      }
    };
  }
}

/**
 * Rota para testar credenciais da API Hotmart
 */
router.post('/test-credentials', async (req, res) => {
  try {
    const { clientId, clientSecret, environment } = req.body;
    
    // Validação dos parâmetros
    if (!clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Client ID e Client Secret são obrigatórios'
      });
    }
    
    // Define o ambiente padrão como sandbox se não for especificado
    const env = environment || 'sandbox';
    
    // Testa as credenciais
    const result = await testHotmartCredentials(clientId, clientSecret, env);
    
    // Retorna o resultado
    return res.json(result);
  } catch (error) {
    console.error('Erro ao processar requisição de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar o teste',
      error: error.message
    });
  }
});

module.exports = router;