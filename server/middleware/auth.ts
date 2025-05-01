import { Request, Response, NextFunction } from 'express';

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user?.role === 'admin' || req.user?.role === 'designer_adm')) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso apenas para administradores' });
}

export function isDesigner(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (
    req.user?.role === 'designer' || 
    req.user?.role === 'designer_adm' || 
    req.user?.role === 'admin'
  )) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso apenas para designers' });
}