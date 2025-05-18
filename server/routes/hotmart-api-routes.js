/**
 * Rotas para integração direta com a API da Hotmart
 * 
 * Estas rotas permitem o gerenciamento da integração, consulta de assinaturas
 * e sincronização de usuários sem depender de webhooks.
 */

import express from 'express';
import { 
  getAccessToken, 
  getPurchasesByEmail,
  getSubscriptionsByEmail, 
  updateUserSubscriptionStatus,
  syncAllUsers
} from '../services/hotmart-api-client.js';
import { Pool } from 'pg';

const router = express.Router();

// Middleware para verificar se o usuário é administrador
const isAdmin = async (req, res, next) => {
  if (!req.user || req.user.nivelacesso !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' 
    });
  }
  next();
};

// Rota para testar conexão com a API da Hotmart
router.get('/test-connection', isAdmin, async (req, res) => {
  try {
    // Tentar obter token de acesso para testar conexão
    const token = await getAccessToken();
    
    return res.json({
      success: true,
      message: 'Conexão com a API da Hotmart estabelecida com sucesso',
      token_received: !!token
    });
  } catch (error) {
    console.error('Erro ao testar conexão com a Hotmart:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao conectar com a API da Hotmart',
      error: error.message
    });
  }
});

// Rota para salvar configurações da API da Hotmart
router.post('/save-credentials', isAdmin, async (req, res) => {
  const { clientId, clientSecret } = req.body;
  
  if (!clientId || !clientSecret) {
    return res.status(400).json({
      success: false,
      message: 'Client ID e Client Secret são obrigatórios'
    });
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Salvar Client ID
    const clientIdCheck = await pool.query(
      `SELECT id FROM integration_settings WHERE provider = 'hotmart' AND key = 'client_id'`
    );
    
    if (clientIdCheck.rows.length > 0) {
      await pool.query(
        `UPDATE integration_settings SET value = $1, updated_at = NOW() 
         WHERE provider = 'hotmart' AND key = 'client_id'`,
        [clientId]
      );
    } else {
      await pool.query(
        `INSERT INTO integration_settings (provider, key, value, created_at, updated_at)
         VALUES ('hotmart', 'client_id', $1, NOW(), NOW())`,
        [clientId]
      );
    }
    
    // Salvar Client Secret
    const clientSecretCheck = await pool.query(
      `SELECT id FROM integration_settings WHERE provider = 'hotmart' AND key = 'client_secret'`
    );
    
    if (clientSecretCheck.rows.length > 0) {
      await pool.query(
        `UPDATE integration_settings SET value = $1, updated_at = NOW() 
         WHERE provider = 'hotmart' AND key = 'client_secret'`,
        [clientSecret]
      );
    } else {
      await pool.query(
        `INSERT INTO integration_settings (provider, key, value, created_at, updated_at)
         VALUES ('hotmart', 'client_secret', $1, NOW(), NOW())`,
        [clientSecret]
      );
    }
    
    // Testar conexão com as novas credenciais
    try {
      const token = await getAccessToken();
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Credenciais salvas, mas teste de conexão falhou. Verifique as credenciais.'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais salvas, mas teste de conexão falhou',
        error: error.message
      });
    }
    
    return res.json({
      success: true,
      message: 'Credenciais da Hotmart salvas e verificadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar credenciais da Hotmart:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao salvar credenciais',
      error: error.message
    });
  } finally {
    await pool.end();
  }
});

// Rota para buscar credenciais da API da Hotmart (apenas para administradores)
router.get('/credentials', isAdmin, async (req, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    const result = await pool.query(
      `SELECT key, value FROM integration_settings 
       WHERE provider = 'hotmart' 
       AND (key = 'client_id' OR key = 'client_secret')`
    );
    
    const credentials = {
      clientId: '',
      clientSecret: '',
      isConfigured: false
    };
    
    result.rows.forEach(row => {
      if (row.key === 'client_id') {
        credentials.clientId = row.value;
      } else if (row.key === 'client_secret') {
        // Mascarar o client secret por segurança
        credentials.clientSecret = row.value ? '••••••••••••••••' : '';
      }
    });
    
    credentials.isConfigured = !!(credentials.clientId && credentials.clientSecret);
    
    return res.json({
      success: true,
      credentials
    });
  } catch (error) {
    console.error('Erro ao buscar credenciais da Hotmart:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar credenciais',
      error: error.message
    });
  } finally {
    await pool.end();
  }
});

// Rota para consultar assinaturas de um usuário específico
router.get('/check-user/:email', isAdmin, async (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'É necessário fornecer um e-mail para consulta'
    });
  }
  
  try {
    // Verificar status do usuário na Hotmart
    const result = await updateUserSubscriptionStatus(email);
    
    return res.json({
      success: true,
      message: 'Consulta realizada com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao consultar assinaturas do usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao consultar assinaturas',
      error: error.message
    });
  }
});

// Rota para obter detalhes das assinaturas de um usuário (sem atualizar o status)
router.get('/subscriptions/:email', isAdmin, async (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'É necessário fornecer um e-mail para consulta'
    });
  }
  
  try {
    // Buscar assinaturas na Hotmart
    const subscriptions = await getSubscriptionsByEmail(email);
    
    return res.json({
      success: true,
      message: 'Assinaturas consultadas com sucesso',
      subscriptions
    });
  } catch (error) {
    console.error('Erro ao consultar assinaturas do usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao consultar assinaturas',
      error: error.message
    });
  }
});

// Rota para obter detalhes das compras de um usuário
router.get('/purchases/:email', isAdmin, async (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'É necessário fornecer um e-mail para consulta'
    });
  }
  
  try {
    // Buscar compras na Hotmart
    const purchases = await getPurchasesByEmail(email);
    
    return res.json({
      success: true,
      message: 'Compras consultadas com sucesso',
      purchases
    });
  } catch (error) {
    console.error('Erro ao consultar compras do usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao consultar compras',
      error: error.message
    });
  }
});

// Rota para sincronizar todos os usuários
router.post('/sync-all-users', isAdmin, async (req, res) => {
  try {
    // Iniciar sincronização em segundo plano
    const syncPromise = syncAllUsers();
    
    // Responder imediatamente ao cliente
    res.json({
      success: true,
      message: 'Sincronização de usuários iniciada em segundo plano',
      estimated_time: `${Math.ceil(60 / 60)} minutos`
    });
    
    // Continuar o processamento sem bloquear a resposta
    syncPromise
      .then(result => {
        console.log('Sincronização concluída:', result);
      })
      .catch(error => {
        console.error('Erro durante sincronização:', error);
      });
    
  } catch (error) {
    console.error('Erro ao iniciar sincronização de usuários:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao iniciar sincronização',
      error: error.message
    });
  }
});

export default router;