/**
 * Este arquivo configura todas as rotas de webhook ANTES de qualquer
 * fallback para o SPA, garantindo que as notificações de pagamento
 * sejam processadas corretamente.
 */

import express from 'express';
import type { Express } from 'express';

// Importar rotas de webhook usando a sintaxe ESM
import hotmartWebhookRouter from './routes/webhook-hotmart.js';
import doppusWebhookRouter from './routes/webhook-doppus.js';
// @ts-ignore - Importação de módulo CommonJS em contexto ESM
import webhookDiagnosticsRouter from './routes/webhook-diagnostics.cjs';

/**
 * Configura as rotas de webhook para o Express
 * @param app - Aplicação Express
 */
export function setupWebhookRoutes(app: Express): void {
  console.log('⚠️ Configurando rotas de webhook ANTES do fallback SPA');
  
  // Importante: usar o mesmo middleware de parsing antes de registrar rotas
  // para garantir que o corpo da requisição seja parseado corretamente
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Configurar middleware de logging para Debug
  app.use('/webhook', (req, res, next) => {
    console.log(`📝 [DEBUG WEBHOOK] ${req.method} ${req.url} - Headers:`, req.headers);
    if (req.method === 'POST') {
      console.log(`📝 [DEBUG WEBHOOK] Body:`, JSON.stringify(req.body, null, 2));
    }
    
    // Armazenar o método original de resposta.json
    const originalJson = res.json;
    
    // Sobrescrever o método json para fazer o log antes de retornar
    res.json = function(body) {
      console.log(`📝 [DEBUG WEBHOOK] Response:`, JSON.stringify(body, null, 2));
      return originalJson.call(this, body);
    };
    
    next();
  });
  
  // Registrar as rotas de webhook com path específico
  // Nota: estas rotas devem ser registradas ANTES de qualquer fallback para o SPA
  app.use('/api/webhook/hotmart', hotmartWebhookRouter);
  
  // Se a rota de webhook Doppus existir, registrá-la também
  try {
    app.use('/webhook/doppus', doppusWebhookRouter);
    console.log('✅ Rotas de webhook da Doppus configuradas');
  } catch (error) {
    console.warn('⚠️ Rotas de webhook da Doppus não disponíveis:', error);
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
        { path: '/webhook/doppus', status: Boolean(doppusWebhookRouter) ? 'configured' : 'not_available' }
      ],
      message: 'Os webhooks estão configurados e funcionando. Use o painel de Admin para diagnósticos avançados.'
    });
  });
  
  console.log('✅ Rotas de webhook configuradas com sucesso!');
}