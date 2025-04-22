import cors from 'cors';
import { Express } from 'express';
import type { CorsOptions, CorsRequest } from 'cors';

// Lista de origens permitidas
const ALLOWED_ORIGINS = [
  'http://localhost:5000',
  'https://designauto.com.br',
  'https://www.designauto.com.br',
  'https://designauto-app.replit.app',
  'https://designauto-app.repl.co'
];

// Lista de domínios confiáveis para cookies
export const TRUSTED_DOMAINS = [
  'localhost',
  'designauto.com.br',
  'www.designauto.com.br',
  'designauto-app.replit.app',
  'designauto-app.repl.co'
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
      } else {
        console.warn(`Origem não permitida: ${origin}`);
        if (process.env.NODE_ENV === 'development') {
          // Em desenvolvimento, permitir todas as origens
          callback(null, true);
        } else {
          // Em produção, negar origens não permitidas
          callback(new Error('CORS não permitido para esta origem'), false);
        }
      }
    },
    credentials: true, // Importante para permitir cookies
    maxAge: 86400, // Cachear o resultado do pre-flight por 24 horas
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin']
  };
  
  app.use(cors(corsOptions));
  
  // Configurar confiança no proxy reverso
  app.set('trust proxy', 1);
  
  // Adicionar headers de segurança
  app.use((req, res, next) => {
    // Definir política de referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Definir CSP (Content Security Policy) para ambientes de produção
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' https://designauto.com.br https://*.designauto.com.br https://*.supabase.co https://*.r2.dev https://*.r2.cloudflarestorage.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.supabase.co https://*.r2.dev https://*.r2.cloudflarestorage.com data: blob:; font-src 'self' data:; connect-src 'self' https://*.designauto.com.br https://*.supabase.co https://*.r2.dev https://*.r2.cloudflarestorage.com;"
      );
    }
    
    next();
  });
}