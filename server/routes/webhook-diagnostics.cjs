/**
 * Módulo de diagnóstico de webhooks para monitorar e depurar 
 * integrações com Hotmart e Doppus
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Endpoint para verificar integridade do sistema de webhooks
router.get('/status', async (req, res) => {
  try {
    // Verificar se temos entradas no banco de dados
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM "webhookLogs"'
    );

    // Buscar os webhooks mais recentes
    const latestResult = await pool.query(
      'SELECT id, "eventType", status, email, source, "createdAt" FROM "webhookLogs" ORDER BY "createdAt" DESC LIMIT 5'
    );

    // Verificar configurações da Hotmart
    const hotmartConfigResult = await pool.query(
      'SELECT key, value FROM "integrationSettings" WHERE provider = $1',
      ['hotmart']
    );

    // Transformar em objeto para fácil acesso
    const hotmartConfig = {};
    hotmartConfigResult.rows.forEach(row => {
      hotmartConfig[row.key] = row.value ? true : false;
    });

    // Verificar configurações da Doppus
    const doppusConfigResult = await pool.query(
      'SELECT key, value FROM "integrationSettings" WHERE provider = $1',
      ['doppus']
    );

    // Transformar em objeto para fácil acesso
    const doppusConfig = {};
    doppusConfigResult.rows.forEach(row => {
      doppusConfig[row.key] = row.value ? true : false;
    });

    // Verificar mapeamentos de produtos da Hotmart
    const hotmartMappingsResult = await pool.query(
      'SELECT COUNT(*) as total FROM "hotmartProductMappings"'
    );

    // Verificar mapeamentos de produtos da Doppus
    const doppusMappingsResult = await pool.query(
      'SELECT COUNT(*) as total FROM "doppusProductMappings"'
    );

    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      webhooks: {
        total: parseInt(countResult.rows[0].total, 10),
        latest: latestResult.rows
      },
      configuration: {
        hotmart: {
          configured: Object.keys(hotmartConfig).length > 0,
          settings: hotmartConfig,
          productMappings: parseInt(hotmartMappingsResult.rows[0].total, 10)
        },
        doppus: {
          configured: Object.keys(doppusConfig).length > 0,
          settings: doppusConfig,
          productMappings: parseInt(doppusMappingsResult.rows[0].total, 10)
        }
      }
    });
  } catch (error) {
    console.error('[Webhook Diagnostics] Erro ao verificar status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar status do sistema de webhooks',
      error: error.message
    });
  }
});

// Endpoint para listar os webhooks registrados
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const source = req.query.source;
    const status = req.query.status;
    const eventType = req.query.eventType;
    const email = req.query.email;

    // Construir a consulta SQL com filtros opcionais
    let query = 'SELECT * FROM "webhookLogs"';
    const queryParams = [];
    const whereConditions = [];

    if (source) {
      whereConditions.push(`source = $${queryParams.length + 1}`);
      queryParams.push(source);
    }

    if (status) {
      whereConditions.push(`status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (eventType) {
      whereConditions.push(`"eventType" = $${queryParams.length + 1}`);
      queryParams.push(eventType);
    }

    if (email) {
      whereConditions.push(`email ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${email}%`);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Adicionar ordenação e paginação
    query += ' ORDER BY "createdAt" DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);

    // Executar a consulta
    const result = await pool.query(query, queryParams);

    // Contar o total de registros para paginação
    let countQuery = 'SELECT COUNT(*) FROM "webhookLogs"';
    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    const countResult = await pool.query(countQuery, queryParams.slice(0, whereConditions.length));

    res.json({
      webhooks: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count, 10),
        page,
        limit,
        pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit)
      }
    });
  } catch (error) {
    console.error('[Webhook Diagnostics] Erro ao listar logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao listar logs de webhook',
      error: error.message
    });
  }
});

// Endpoint para buscar detalhes de um webhook específico
router.get('/logs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'ID inválido'
      });
    }

    const result = await pool.query(
      'SELECT * FROM "webhookLogs" WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Webhook não encontrado'
      });
    }

    // Verificar se o usuário associado existe
    let user = null;
    if (result.rows[0].userId) {
      const userResult = await pool.query(
        'SELECT id, username, email, name, "profileimageurl", "tipoplano", "dataassinatura", "dataexpiracao", "origemassinatura", "acessovitalicio" FROM users WHERE id = $1',
        [result.rows[0].userId]
      );
      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
      }
    }

    // Verificar se há uma assinatura associada
    let subscription = null;
    if (result.rows[0].userId) {
      const subscriptionResult = await pool.query(
        'SELECT * FROM subscriptions WHERE "userId" = $1',
        [result.rows[0].userId]
      );
      if (subscriptionResult.rows.length > 0) {
        subscription = subscriptionResult.rows[0];
      }
    }

    res.json({
      webhook: result.rows[0],
      user,
      subscription
    });
  } catch (error) {
    console.error('[Webhook Diagnostics] Erro ao buscar detalhes do webhook:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar detalhes do webhook',
      error: error.message
    });
  }
});

// Endpoint para buscar estatísticas dos webhooks
router.get('/stats', async (req, res) => {
  try {
    // Estatísticas gerais
    const generalStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as success,
        COUNT(*) FILTER (WHERE status = 'error') as error,
        COUNT(*) FILTER (WHERE status = 'received') as received,
        COUNT(*) FILTER (WHERE source = 'hotmart') as hotmart,
        COUNT(*) FILTER (WHERE source = 'doppus') as doppus,
        MAX("createdAt") as last_received
      FROM "webhookLogs"
    `);

    // Estatísticas por tipo de evento
    const eventTypeStats = await pool.query(`
      SELECT "eventType", COUNT(*) as count
      FROM "webhookLogs"
      GROUP BY "eventType"
      ORDER BY count DESC
    `);

    // Estatísticas por dia (últimos 30 dias)
    const dailyStats = await pool.query(`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as success,
        COUNT(*) FILTER (WHERE status = 'error') as error
      FROM "webhookLogs"
      WHERE "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date DESC
    `);

    res.json({
      general: generalStats.rows[0],
      eventTypes: eventTypeStats.rows,
      daily: dailyStats.rows
    });
  } catch (error) {
    console.error('[Webhook Diagnostics] Erro ao buscar estatísticas:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar estatísticas de webhook',
      error: error.message
    });
  }
});

// Endpoint para testar a configuração da Hotmart
router.get('/test/hotmart', async (req, res) => {
  try {
    // Verificar configurações da Hotmart
    const hotmartConfigResult = await pool.query(
      'SELECT key, value FROM "integrationSettings" WHERE provider = $1',
      ['hotmart']
    );

    // Transformar em objeto para fácil acesso
    const hotmartConfig = {};
    hotmartConfigResult.rows.forEach(row => {
      hotmartConfig[row.key] = row.value;
    });

    // Verificar se há credenciais configuradas
    if (!hotmartConfig.clientId || !hotmartConfig.clientSecret) {
      return res.json({
        status: 'error',
        message: 'Credenciais da Hotmart não configuradas'
      });
    }

    // Verificar se há secret configurado para webhooks
    if (!hotmartConfig.secret) {
      return res.json({
        status: 'warning',
        message: 'Secret para webhooks da Hotmart não configurado'
      });
    }

    // Verificar mapeamentos de produtos
    const mappingsResult = await pool.query(
      'SELECT * FROM "hotmartProductMappings"'
    );

    res.json({
      status: 'success',
      config: {
        clientId: Boolean(hotmartConfig.clientId),
        clientSecret: Boolean(hotmartConfig.clientSecret),
        secret: Boolean(hotmartConfig.secret),
        webhookUrl: Boolean(hotmartConfig.webhookUrl)
      },
      mappings: mappingsResult.rows.map(row => ({
        id: row.id,
        hotmartProductId: row.hotmartProductId,
        planType: row.planType
      }))
    });
  } catch (error) {
    console.error('[Webhook Diagnostics] Erro ao testar configuração da Hotmart:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao testar configuração da Hotmart',
      error: error.message
    });
  }
});

// Endpoint para testar configuração da Doppus
router.get('/test/doppus', async (req, res) => {
  try {
    // Verificar configurações da Doppus
    const doppusConfigResult = await pool.query(
      'SELECT key, value FROM "integrationSettings" WHERE provider = $1',
      ['doppus']
    );

    // Transformar em objeto para fácil acesso
    const doppusConfig = {};
    doppusConfigResult.rows.forEach(row => {
      doppusConfig[row.key] = row.value;
    });

    // Verificar se há credenciais configuradas
    if (!doppusConfig.clientId || !doppusConfig.clientSecret) {
      return res.json({
        status: 'error',
        message: 'Credenciais da Doppus não configuradas'
      });
    }

    // Verificar se há secret configurado para webhooks
    if (!doppusConfig.secret) {
      return res.json({
        status: 'warning',
        message: 'Secret para webhooks da Doppus não configurado'
      });
    }

    // Verificar mapeamentos de produtos
    const mappingsResult = await pool.query(
      'SELECT * FROM "doppusProductMappings"'
    );

    res.json({
      status: 'success',
      config: {
        clientId: Boolean(doppusConfig.clientId),
        clientSecret: Boolean(doppusConfig.clientSecret),
        secret: Boolean(doppusConfig.secret),
        webhookUrl: Boolean(doppusConfig.webhookUrl)
      },
      mappings: mappingsResult.rows.map(row => ({
        id: row.id,
        doppusProductId: row.doppusProductId,
        planType: row.planType
      }))
    });
  } catch (error) {
    console.error('[Webhook Diagnostics] Erro ao testar configuração da Doppus:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao testar configuração da Doppus',
      error: error.message
    });
  }
});

module.exports = router;