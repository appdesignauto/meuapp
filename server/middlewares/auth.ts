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
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const userRole = req.user?.nivelacesso;
  
  if (userRole !== 'admin' && userRole !== 'designer_adm') {
    return res.status(403).json({ error: 'Acesso negado, apenas administradores podem realizar esta ação' });
  }
  
  next();
};