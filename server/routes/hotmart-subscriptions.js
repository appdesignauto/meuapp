/**
 * Rotas para gerenciar assinaturas da Hotmart
 * 
 * Este arquivo contém as rotas para listar e gerenciar assinaturas
 * ativas da Hotmart.
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

// Credenciais da Hotmart (usar valores do banco de dados em produção)
const clientId = '8c126e59-7bd0-49af-a402-ec7849a686d8';
const clientSecret = '90bf5921-9565-4f1e-9763-19f7f2457d00';
const environment = 'production'; // 'production' ou 'sandbox'

// Criar o cliente da Hotmart
const hotmartClient = createHotmartClient(clientId, clientSecret, environment);

/**
 * Rota para listar assinaturas ativas da Hotmart
 */
router.get('/list', async (req, res) => {
  try {
    console.log('Recebida requisição para listar assinaturas da Hotmart');
    
    // Listar assinaturas ativas
    const result = await hotmartClient.listActiveSubscriptions();
    
    console.log(`Resultado da listagem: ${result.success ? 'Sucesso' : 'Falha'}`);
    
    // Retorna o resultado
    return res.json(result);
  } catch (error) {
    console.error('Erro ao processar requisição de listagem:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar assinaturas',
      error: error.message
    });
  }
});

module.exports = router;