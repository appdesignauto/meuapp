/**
 * Este arquivo configura todas as rotas de webhook ANTES de qualquer
 * fallback para o SPA, garantindo que as notificações de pagamento
 * sejam processadas corretamente.
 */

const express = require('express');
const hotmartWebhookRouter = require('./routes/webhook-hotmart');
const doppusWebhookRouter = require('./routes/webhook-doppus');
const webhookDiagnosticsRouter = require('./routes/webhook-diagnostics');

/**
 * Configura as rotas de webhook para o Express
 * @param {express.Express} app - Aplicação Express
 */
function setupWebhookRoutes(app) {
  console.log('⚠️ Configurando rotas de webhook ANTES do fallback SPA');
  
  // Importante: usar o mesmo middleware de parsing antes de registrar rotas
  // para garantir que o corpo da requisição seja parseado corretamente
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Registrar as rotas de webhook com path específico
  // Nota: estas rotas devem ser registradas ANTES de qualquer fallback para o SPA
  app.use('/webhook/hotmart', hotmartWebhookRouter);
  
  // Se a rota de webhook Doppus existir, registrá-la também
  try {
    app.use('/webhook/doppus', doppusWebhookRouter);
    console.log('✅ Rotas de webhook da Doppus configuradas');
  } catch (error) {
    console.warn('⚠️ Rotas de webhook da Doppus não disponíveis:', error.message);
  }
  
  // Registrar rotas de diagnóstico para administradores
  app.use('/api/webhook-diagnostics', webhookDiagnosticsRouter);
  
  // Rota de diagnóstico para verificação básica de webhooks (sem autenticação)
  app.get('/webhook/status', (req, res) => {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      routes: [
        { path: '/webhook/hotmart', status: 'configured' },
        { path: '/webhook/doppus', status: doppusWebhookRouter ? 'configured' : 'not_available' }
      ],
      message: 'Os webhooks estão configurados e funcionando. Use o painel de Admin para diagnósticos avançados.'
    });
  });
  
  console.log('✅ Rotas de webhook configuradas com sucesso!');
}

module.exports = { setupWebhookRoutes };