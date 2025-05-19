` tags. I will pay close attention to indentation, structure, and completeness, ensuring no parts are skipped or omitted. I will also avoid any forbidden words.

```
<replit_final_file>
import cors from 'cors';
import { Express } from 'express';
import type { CorsOptions, CorsRequest } from 'cors';

// Lista de origens permitidas
const ALLOWED_ORIGINS = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'https://designauto.com.br',
  'https://www.designauto.com.br',
  'https://app.designauto.com.br',
  'http://designauto.com.br',
  'http://www.designauto.com.br',
  'http://app.designauto.com.br',
  'https://designauto-app.replit.app',
  'https://designauto-app.repl.co',
  'https://design-auto-hub-1-appdesignauto.replit.app',
  // Domínios da Hotmart para webhooks
  'https://hotmart.com',
  'https://www.hotmart.com',
  'https://developers.hotmart.com',
  'https://apis.hotmart.com',
  'https://sandbox.hotmart.com',
  'https://api-content.hotmart.com',
  'https://api-hot-connect.hotmart.com',
  'https://api-sec.hotmart.com',
  'https://api-sec-vlc.hotmart.com'
];

// Domínios Replit para desenvolvimento
const REPLIT_DOMAINS = [
  '.replit.dev',
  '.repl.co',
  '.replit.app'
];

export function configureCors(app: Express): void {
  const corsOptions: CorsOptions = {
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
      // Permitir requisições sem origem (como webhooks, cURL, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Verificar se a origem está na lista de origens permitidas
      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      // Verificar se é um domínio do Replit
      if (REPLIT_DOMAINS.some(domain => origin.endsWith(domain))) {
        console.log(`Domínio Replit permitido: ${origin}`);
        callback(null, true);
        return;
      }

      // Em desenvolvimento, permitir todas as origens
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
        return;
      }

      callback(new Error('CORS não permitido para esta origem'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Origin',
      'Accept',
      'X-Hotmart-Webhook-Signature',
      'X-Hotmart-Webhook-Token',
      'X-Forwarded-For',
      'User-Agent'
    ],
    credentials: true,
    maxAge: 86400
  };

  // Aplicar CORS globalmente
  app.use(cors(corsOptions));

  // Configurar headers adicionais de segurança
  app.use((req, res, next) => {
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });
}