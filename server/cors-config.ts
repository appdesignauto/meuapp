import cors from 'cors';
import { Express } from 'express';
import type { CorsOptions, CorsRequest } from 'cors';

// Lista de origens permitidas
const ALLOWED_ORIGINS = [
  'http://localhost:5000',
  'http://127.0.0.1:5000', // Adicionado para permitir requisições locais
  'https://designauto.com.br',
  'https://www.designauto.com.br',
  'https://app.designauto.com.br',
  'http://designauto.com.br',
  'http://www.designauto.com.br',
  'http://app.designauto.com.br',
  'https://designauto-app.replit.app',
  'https://designauto-app.repl.co',
  'https://designauto.com.br',
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

// Lista de domínios confiáveis para cookies
export const TRUSTED_DOMAINS = [
  'localhost',
  '127.0.0.1', // Adicionado para permitir requisições locais
  'designauto.com.br',
  'www.designauto.com.br',
  'app.designauto.com.br',
  '.designauto.com.br', // Inclui todos os subdomínios
  'designauto-app.replit.app',
  'designauto-app.repl.co',
  'designauto.com.br',
  '.replit.dev',
  '.repl.co',
  '.replit.app'
];

/**
 * Configura CORS e as políticas de domínio cruzado para o servidor
 * @param app Instância do Express
 */
export function configureCors(app: Express): void {
  // Configurar CORS para permitir requisições dos domínios designauto.com.br
  const corsOptions: CorsOptions = {
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
      // Permitir requisições sem origem (como mobile apps, postman ou curl)
      if (!origin) return callback(null, true);
      
      // Verificar se a origem está na lista de origens permitidas
      if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
        callback(null, true);
      } 
      // Verificar se é um domínio do Replit
      else if (REPLIT_DOMAINS.some(domain => origin.endsWith(domain))) {
        console.log(`Domínio Replit permitido: ${origin}`);
        callback(null, true);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          // Em desenvolvimento, permitir todas as origens silenciosamente
          callback(null, true);
        } else {
          // Em produção, mostrar aviso e negar origens não permitidas
          console.warn(`Origem não permitida: ${origin}`);
          callback(new Error('CORS não permitido para esta origem'), false);
        }
      }
    },
    credentials: true, // Importante para permitir cookies
    maxAge: 86400, // Cachear o resultado do pre-flight por 24 horas
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Origin',
      'X-Hotmart-Webhook-Signature',
      'X-Hotmart-Webhook-Token',
      'X-Forwarded-For',
      'User-Agent'
    ]
  };
  
  app.use(cors(corsOptions));
  
  // Configurar confiança no proxy reverso
  app.set('trust proxy', 1);
  
  // Adicionar headers de segurança
  app.use((req, res, next) => {
    // Definir política de referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Removendo CSP temporariamente para evitar bloqueio de imagens
    // Sem CSP, todas as imagens funcionarão normalmente
    // Em vez disso, mantemos apenas a política de referrer
    
    next();
  });
}