import { Request, Response, NextFunction } from "express";

// Middleware para verificar se o usuário está autenticado
export const checkUserAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  next();
};

// Middleware de compatibilidade com nome antigo
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  next();
};

// Middleware para verificar se o usuário tem um dos papéis especificados
export const checkUserRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userRole = req.user?.nivelacesso;
    
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    next();
  };
};

// Middleware para verificar se o usuário é administrador
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    // Verificar diretamente pelo req.user como fallback
    if (req.user && req.user.nivelacesso === 'admin') {
      return next();
    }
    
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const userRole = req.user?.nivelacesso;
  
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado, apenas administradores podem realizar esta ação' });
  }
  
  next();
};

// Importações necessárias para o middleware isAdminEnhanced
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Middleware seguro para verificar se o usuário é admin
// Versão robusta que tenta várias estratégias para verificar autenticação
export const isAdminEnhanced = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Verificação por meio do req.isAuthenticated()
    if (req.isAuthenticated && req.isAuthenticated()) {
      if (req.user && req.user.nivelacesso === 'admin') {
        return next();
      }
    }
    
    // 2. Verificação direta por meio de req.user
    if (req.user && req.user.nivelacesso === 'admin') {
      return next();
    }
    
    // 3. Verificação por meio da sessão (se existir)
    if (req.session && req.session.passport && req.session.passport.user) {
      const userId = req.session.passport.user;
      
      // Buscar usuário pelo ID da sessão
      const userData = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      // Se o usuário existir e for admin, avançar
      if (userData && userData.nivelacesso === 'admin') {
        // Associar o usuário à requisição para uso subsequente
        req.user = userData;
        return next();
      }
    }
    
    // Se todas as tentativas falharem, retornar erro de autenticação
    return res.status(401).json({ error: 'Usuário não autenticado' });
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};