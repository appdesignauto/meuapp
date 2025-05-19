import { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

export function configureCors(app: Application) {
  // Versão mais permissiva do CORS para ambiente de desenvolvimento
  app.use(cors({
    origin: '*', // Permitir qualquer origem
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  }));
  
  // Middleware adicional para garantir headers CORS em todas as respostas
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Interceptar requisições OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
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