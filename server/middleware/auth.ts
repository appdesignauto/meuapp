import { Request, Response, NextFunction } from "express";

// Middleware para verificar se o usuário está autenticado
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Não autenticado" });
};

// Middleware para verificar se o usuário é admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user.nivelacesso === 'admin' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: "Permissão negada" });
};

// Middleware para verificar se o usuário é designer ou admin
export const isDesignerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (
    req.user.nivelacesso === 'designer' || 
    req.user.nivelacesso === 'designer_adm' || 
    req.user.nivelacesso === 'admin' || 
    req.user.role === 'admin'
  )) {
    return next();
  }
  return res.status(403).json({ message: "Permissão negada" });
};

// Middleware para verificar se o usuário tem acesso premium
export const isPremium = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (
    req.user.nivelacesso === 'premium' || 
    req.user.nivelacesso === 'admin' || 
    req.user.acessovitalicio === true ||
    req.user.role === 'admin'
  )) {
    return next();
  }
  return res.status(403).json({ message: "Acesso premium necessário" });
};