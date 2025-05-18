/**
 * Rotas para a API da Hotmart
 * 
 * Este arquivo contém as rotas para interagir com a API da Hotmart.
 * Fornece endpoints para verificar a conectividade, listar produtos, gerenciar assinaturas, etc.
 */

import express from 'express';
import hotmartAPI from '../services/hotmart-api.js';
import { isAuthenticated, isAdmin } from '../middleware/auth';
import { Pool } from 'pg';

const router = express.Router();

/**
 * Rota para verificar a conectividade com a API da Hotmart
 * GET /api/hotmart/check-connectivity
 */
router.get('/check-connectivity', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await hotmartAPI.checkConnectivity();
    res.json(result);
  } catch (error) {
    console.error('Erro ao verificar conectividade com a Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao verificar conectividade com a API da Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para listar todos os produtos da Hotmart
 * GET /api/hotmart/products
 */
router.get('/products', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const products = await hotmartAPI.getProducts();
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Erro ao obter produtos da Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao obter produtos da API da Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para obter informações detalhadas de um produto específico
 * GET /api/hotmart/products/:productId
 */
router.get('/products/:productId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await hotmartAPI.getProduct(productId);
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error(`Erro ao obter produto ${req.params.productId} da Hotmart:`, error);
    res.status(500).json({
      success: false,
      message: `Falha ao obter produto ${req.params.productId} da API da Hotmart`,
      error: error.message
    });
  }
});

/**
 * Rota para listar assinaturas da Hotmart
 * GET /api/hotmart/subscriptions
 */
router.get('/subscriptions', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { email, status, productId } = req.query;
    
    // Constrói parâmetros de consulta baseados nos query params
    const params = {};
    if (email) params.subscriber = email;
    if (status) params.status = status;
    if (productId) params.productId = productId;
    
    const subscriptions = await hotmartAPI.getSubscriptions(params);
    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Erro ao obter assinaturas da Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao obter assinaturas da API da Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para obter informações detalhadas de uma assinatura específica
 * GET /api/hotmart/subscriptions/:subscriptionId
 */
router.get('/subscriptions/:subscriptionId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await hotmartAPI.getSubscription(subscriptionId);
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error(`Erro ao obter assinatura ${req.params.subscriptionId} da Hotmart:`, error);
    res.status(500).json({
      success: false,
      message: `Falha ao obter assinatura ${req.params.subscriptionId} da API da Hotmart`,
      error: error.message
    });
  }
});

/**
 * Rota para listar compras da Hotmart
 * GET /api/hotmart/purchases
 */
router.get('/purchases', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { email, status, productId, startDate, endDate } = req.query;
    
    // Constrói parâmetros de consulta baseados nos query params
    const params = {};
    if (email) params.buyer = email;
    if (status) params.status = status;
    if (productId) params.productId = productId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const purchases = await hotmartAPI.getPurchases(params);
    res.json({
      success: true,
      purchases
    });
  } catch (error) {
    console.error('Erro ao obter compras da Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao obter compras da API da Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para obter informações detalhadas de uma compra específica
 * GET /api/hotmart/purchases/:purchaseId
 */
router.get('/purchases/:purchaseId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const purchase = await hotmartAPI.getPurchase(purchaseId);
    res.json({
      success: true,
      purchase
    });
  } catch (error) {
    console.error(`Erro ao obter compra ${req.params.purchaseId} da Hotmart:`, error);
    res.status(500).json({
      success: false,
      message: `Falha ao obter compra ${req.params.purchaseId} da API da Hotmart`,
      error: error.message
    });
  }
});

/**
 * Rota para testar o token de autenticação
 * GET /api/hotmart/test-token
 */
router.get('/test-token', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Tenta obter um token de acesso
    const token = await hotmartAPI.getAccessToken();
    
    res.json({
      success: true,
      message: 'Token de acesso obtido com sucesso!',
      tokenInfo: {
        // Retorna apenas parte do token por segurança
        tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : null,
        isValid: !!token
      }
    });
  } catch (error) {
    console.error('Erro ao testar token de acesso da Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao testar token de acesso da API da Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para atualizar o token Basic da Hotmart
 * POST /api/hotmart/update-token
 */
router.post('/update-token', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { basicToken } = req.body;
    
    if (!basicToken) {
      return res.status(400).json({
        success: false,
        message: 'Token Basic não fornecido'
      });
    }
    
    // Armazena o novo token no serviço
    hotmartAPI.basicToken = basicToken;
    
    // Limpa o cache de token para forçar uma nova autenticação
    hotmartAPI.accessToken = null;
    hotmartAPI.tokenExpiry = null;
    
    // Testa o novo token
    const result = await hotmartAPI.checkConnectivity();
    
    if (result.success) {
      // Se o teste for bem-sucedido, atualiza o token no banco de dados
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      await pool.query(`
        INSERT INTO integration_settings (provider, key, value)
        VALUES ('hotmart', 'basic_auth', $1)
        ON CONFLICT (provider, key) 
        DO UPDATE SET value = $1
      `, [basicToken]);
      
      await pool.end();
    }
    
    res.json({
      success: result.success,
      message: result.success ? 'Token Basic atualizado com sucesso!' : 'Falha ao validar novo token Basic',
      result
    });
  } catch (error) {
    console.error('Erro ao atualizar token Basic da Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao atualizar token Basic da API da Hotmart',
      error: error.message
    });
  }
});

export default router;