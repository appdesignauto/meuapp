/**
 * Configuração específica para os webhooks da Hotmart e Doppus
 * Este arquivo configura as rotas e middleware necessários para processar
 * corretamente os webhooks de integração de pagamento
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Obtém o segredo (secret) compartilhado da Hotmart a partir das variáveis de ambiente
 * @returns O segredo da Hotmart para verificação de assinaturas
 */
export function getHotmartSecret(): string {
  // Verificar o ambiente (sandbox ou produção)
  const isSandbox = process.env.HOTMART_SANDBOX === 'true';
  
  // Obter o segredo apropriado para o ambiente
  const secret = isSandbox 
    ? process.env.HOTMART_SANDBOX_SECRET_KEY 
    : process.env.HOTMART_SECRET_KEY;
  
  // Se não for encontrado, usar um valor padrão em ambiente de desenvolvimento
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Segredo da Hotmart não configurado. Usando valor padrão em desenvolvimento.');
      return 'development_secret_key';
    } else {
      console.error('❌ Segredo da Hotmart não configurado em ambiente de produção!');
      return '';
    }
  }
  
  return secret;
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
  app.use(WEBHOOK_URLS.HOTMART, hotmartFixedRouter);
  
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