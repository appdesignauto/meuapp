/**
 * Configuração específica para os webhooks da Hotmart e Doppus
 * Este arquivo configura as rotas e middleware necessários para processar
 * corretamente os webhooks de integração de pagamento
 */

import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Carregar variáveis de ambiente
dotenv.config();

// Rate limiting para proteção contra ataques
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // limite de 100 requests por minuto
  message: 'Muitas requisições recebidas'
});

/**
 * Obtém o segredo (secret) compartilhado da Hotmart a partir das variáveis de ambiente
 * @returns O segredo da Hotmart para verificação de assinaturas
 */
export function getHotmartSecret(): string {
  const secret = process.env.HOTMART_SECRET_KEY;

  if (!secret) {
    console.error('❌ HOTMART_SECRET_KEY não configurada!');
    return '';
  }

  return secret;
}

// Validação de segurança aprimorada
export function validateWebhookSignature(payload: any, signature: string): boolean {
  if (!signature) return false;

  try {
    const crypto = require('crypto');
    const secret = getHotmartSecret();
    const calculatedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return calculatedSignature === signature;
  } catch (error) {
    console.error('Erro ao validar assinatura:', error);
    return false;
  }
}

import express from 'express';
import { Express } from 'express';
import hotmartFixedRouter from './routes/webhook-hotmart-fixed';

// URLs configuradas para os endpoints de webhook
export const WEBHOOK_URLS = {
  // URL para webhook da Hotmart (versão nova usando a implementação fixa)
  HOTMART: '/webhook/hotmart',

  // URL para webhook de diagnóstico - usado para acessar o status
  DIAGNOSTICS: '/webhook/status',

  // Rota alternativa da API principal (mantida para compatibilidade)
  API_HOTMART: '/api/webhooks/hotmart'
};

/**
 * Configura todas as rotas de webhook necessárias
 * @param app Aplicação Express
 */
export function setupWebhookRoutes(app: Express): void {
  console.log('Configurando rotas de webhook dedicadas...');

  // Configurar middleware para processar o corpo da requisição 
  // antes das rotas de webhook
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Registrar rota específica para Hotmart usando a implementação fixa
  // Desativado, pois agora carregamos no server/index.ts
  // app.use(WEBHOOK_URLS.HOTMART, hotmartFixedRouter);

  // Configurar rota de diagnóstico para verificar status
  app.get(WEBHOOK_URLS.DIAGNOSTICS, (req, res) => {
    res.status(200).json({
      status: 'online',
      timestamp: new Date().toISOString(),
      endpoints: [
        {
          name: 'Hotmart Webhook',
          url: WEBHOOK_URLS.HOTMART,
          status: 'active'
        }
      ],
      message: 'Endpoints de webhook configurados e ativos'
    });
  });

  console.log('Rotas de webhook configuradas com sucesso');
}