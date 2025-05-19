import { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

export function configureCors(app: Application) {
  // Configurar CORS para ambiente de desenvolvimento e produção
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'https://designauto.com.br',
    'https://sandbox.hotmart.com',
    'https://developers.hotmart.com',
    /\.replit\.dev$/,
    /\.hotmart\.com$/
  ];

  // Configuração padrão de CORS
  app.use(cors({
    origin: function(origin, callback) {
      // Permitir requisições sem origin (ex: mobile apps, curl)
      if (!origin) return callback(null, true);

      // Verificar se a origem está na lista permitida
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log(`CORS bloqueou origem: ${origin}`);
        callback(new Error('Origem não permitida pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
}

// Middleware CORS específico para rotas Hotmart que permite qualquer origem
export function hotmartCorsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Interceptar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}