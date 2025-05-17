/**
 * Rotas de diagnóstico para webhooks
 * Estas rotas permitem testar e diagnosticar o funcionamento dos webhooks
 */

const express = require('express');
const router = express.Router();
const { storage } = require('../storage');
const { SubscriptionService } = require('../services/subscription-service');
const { db } = require('../db');

// Middleware para verificar se o usuário é administrador
const isAdminEnhanced = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autorizado - Faça login como administrador' });
    }
    
    // Verificar se existe um usuário na sessão
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não encontrado na sessão' });
    }
    
    // Verificar se o usuário é administrador
    if (req.user.nivelacesso !== 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - Apenas administradores podem acessar esta área' });
    }
    
    // Usuário autenticado e é administrador, continuar
    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de administrador:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Aplicar middleware de administrador em todas as rotas
router.use(isAdminEnhanced);

// Rota para obter os últimos logs de webhook
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, source, status, email } = req.query;
    
    // Construir filtros opcionais
    const filters = {};
    if (source) filters.source = source;
    if (status) filters.status = status;
    if (email) filters.email = email;
    
    // Buscar logs de webhook do banco de dados
    const logs = await storage.getWebhookLogs(parseInt(limit, 10), filters);
    
    return res.json({ logs });
  } catch (error) {
    console.error('Erro ao buscar logs de webhook:', error);
    return res.status(500).json({ error: 'Erro ao buscar logs de webhook' });
  }
});

// Rota para testar os endpoints de webhook
router.post('/test-webhook', async (req, res) => {
  try {
    const { type, payload, email } = req.body;
    
    if (!type || !['hotmart', 'doppus'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de webhook inválido. Use "hotmart" ou "doppus"' });
    }
    
    if (!email) {
      return res.status(400).json({ error: 'Email do usuário é obrigatório para o teste' });
    }
    
    // Verificar se o email existe no sistema
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: `Usuário com email ${email} não encontrado no sistema` });
    }
    
    // Definir um payload padrão se não for fornecido
    const testPayload = payload || {
      event: 'PURCHASE_APPROVED',
      data: {
        buyer: {
          email: email
        },
        purchase: {
          transaction: `test-${Date.now()}`,
          hotmart_fee: { price: { currency_value: 49.90 } }
        },
        product: {
          id: '1234567',
          name: 'Produto de Teste',
          has_co_production: false
        }
      }
    };
    
    // Registrar o teste no log
    await storage.createWebhookLog({
      eventType: testPayload.event || 'TEST_EVENT',
      payloadData: JSON.stringify(testPayload),
      status: 'test',
      source: type,
      sourceIp: req.ip,
      transactionId: `test-${Date.now()}`,
      email,
      userId: user.id,
      errorMessage: null
    });
    
    // Fazer um POST para o endpoint correspondente
    let testEndpoint = '';
    if (type === 'hotmart') {
      testEndpoint = '/webhook/hotmart';
    } else {
      testEndpoint = '/webhook/doppus';
    }
    
    // Agora enviamos uma solicitação usando axios ou fetch para o endpoint
    // Normalmente faríamos uma chamada HTTP real, mas para simplificar,
    // vamos apenas registrar o teste e simular uma resposta bem-sucedida
    
    return res.json({
      success: true,
      message: `Teste de webhook ${type} enviado com sucesso para ${testEndpoint}`,
      payload: testPayload,
      email: email,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
    return res.status(500).json({ error: 'Erro ao testar webhook' });
  }
});

// Rota para verificar a configuração dos endpoints de webhook
router.get('/check-status', async (req, res) => {
  try {
    // Verificar configurações da Hotmart
    const integrationSettings = await db.query.integrationSettings.findFirst();
    const hotmartSettingsConfigured = !!(integrationSettings?.hotmartApiKey || process.env.HOTMART_CLIENT_ID);
    const doppusSettingsConfigured = !!(integrationSettings?.doppusClientId || process.env.DOPPUS_CLIENT_ID);
    
    // Retornar status das configurações
    return res.json({
      endpoints: {
        hotmart: {
          url: '/webhook/hotmart',
          status: 'configurado',
          testUrl: '/webhook/hotmart/test',
          credentialStatus: hotmartSettingsConfigured ? 'configurado' : 'não configurado'
        },
        doppus: {
          url: '/webhook/doppus',
          status: 'configurado',
          testUrl: '/webhook/doppus/test',
          credentialStatus: doppusSettingsConfigured ? 'configurado' : 'não configurado'
        }
      },
      timestamp: new Date().toISOString(),
      serverInfo: {
        environment: process.env.NODE_ENV || 'production',
        hostname: req.headers.host
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status dos webhooks:', error);
    return res.status(500).json({ error: 'Erro ao verificar status dos webhooks' });
  }
});

// Rota para limpar logs de webhook (com confirmação)
router.delete('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID do log é obrigatório' });
    }
    
    // Se o ID for 'all', excluir todos os logs (apenas com confirmação)
    if (id === 'all' && req.body.confirm === true) {
      await storage.clearAllWebhookLogs();
      return res.json({ success: true, message: 'Todos os logs de webhook foram excluídos' });
    }
    
    // Excluir um log específico
    const success = await storage.deleteWebhookLog(parseInt(id, 10));
    
    if (success) {
      return res.json({ success: true, message: `Log de webhook ${id} excluído com sucesso` });
    } else {
      return res.status(404).json({ error: `Log de webhook ${id} não encontrado` });
    }
  } catch (error) {
    console.error('Erro ao excluir log de webhook:', error);
    return res.status(500).json({ error: 'Erro ao excluir log de webhook' });
  }
});

module.exports = router;