/**
 * Rotas para teste da API da Hotmart
 * 
 * Este arquivo contém rotas para testar a conexão com a API da Hotmart
 * utilizando diferentes credenciais e ambientes.
 */

const express = require('express');
const router = express.Router();
const { createHotmartClient } = require('../hotmart-client');

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
 * Rota para testar credenciais da API Hotmart
 */
router.post('/test-credentials', async (req, res) => {
  try {
    const { clientId, clientSecret, environment } = req.body;
    
    console.log(`Recebida requisição de teste para API Hotmart:
      - Ambiente: ${environment}
      - Client ID: ${clientId ? clientId.substring(0, 5) + '...' : 'não fornecido'}
      - Client Secret: ${clientSecret ? '***********' : 'não fornecido'}`);
    
    // Validação dos parâmetros
    if (!clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Client ID e Client Secret são obrigatórios'
      });
    }
    
    // Define o ambiente padrão como production se não for especificado
    const env = environment || 'production';
    
    // Cria um cliente da API Hotmart com as credenciais fornecidas
    const hotmartClient = createHotmartClient(clientId, clientSecret, env);
    
    // Testa a conexão usando o cliente
    const result = await hotmartClient.testConnection();
    
    console.log('Resultado do teste:', JSON.stringify(result, null, 2));
    
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