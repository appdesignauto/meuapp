/**
 * Middleware de autenticação para verificar permissões de usuário
 * Este middleware protege rotas que requerem autenticação ou nível de acesso específico
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Interface para o payload do token JWT
interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  nivelacesso: string;
}

// Função auxiliar para obter conexão com o banco de dados
async function getPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL
  });
}

// Middleware para verificar se o usuário está autenticado
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'seu_jwt_secret_padrao';
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
    
    // Adicionar informações do usuário ao objeto de requisição
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      nivelacesso: decoded.nivelacesso
    };
    
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

// Middleware para verificar se o usuário é administrador
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Primeiro verificar se o usuário está autenticado
  isAuthenticated(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Verificar se o usuário tem nível de acesso 'admin'
    if (req.user?.nivelacesso === 'admin' || req.user?.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Acesso não autorizado. Apenas administradores podem acessar este recurso.' 
    });
  });
}

// Extender a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        nivelacesso: string;
      };
    }
  }
}