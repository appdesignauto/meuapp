import { Application } from 'express';
import cors from 'cors';

export function configureCors(app: Application) {
  // Configurar CORS para ambiente de desenvolvimento e produção
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'https://designauto.com.br',
    /\.replit\.dev$/
  ];

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
        callback(new Error('Origem não permitida pelo CORS'));
      }
    },
    credentials: true
  }));
}