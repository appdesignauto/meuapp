import { Request, Response, NextFunction } from 'express';

// Middleware para verificar se o usuário está autenticado
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Não autenticado" });
};

// Middleware para verificar se o usuário é admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user?.role === 'admin' || req.user?.nivelacesso === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: "Acesso negado" });
};

// Middleware para verificar se o usuário é designer ou admin
export const isDesigner = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (
    req.user?.role === 'designer' || 
    req.user?.role === 'designer_adm' || 
    req.user?.role === 'admin' ||
    req.user?.nivelacesso === 'admin'
  )) {
    return next();
  }
  return res.status(403).json({ message: "Acesso negado" });
};

// Middleware para verificar se o usuário é premium ou admin
export const isPremium = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (
    req.user?.nivelacesso === 'premium' || 
    req.user?.nivelacesso === 'admin' ||
    req.user?.role === 'admin'
  )) {
    return next();
  }
  return res.status(403).json({ message: "Acesso negado" });
};

// Middleware para verificar se o usuário tem um dos papéis especificados
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    const userRole = req.user?.role || '';
    const userNivelAcesso = req.user?.nivelacesso || '';
    
    if (roles.includes(userRole) || roles.includes(userNivelAcesso)) {
      return next();
    }
    
    return res.status(403).json({ message: "Acesso negado" });
  };
};