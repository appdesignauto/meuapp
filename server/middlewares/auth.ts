import { Request, Response, NextFunction } from 'express';

// Middleware para verificar se o usuário está autenticado
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
};

// Middleware para verificar se o usuário é administrador
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
  }
  
  // Verificar se o usuário tem papel de admin
  if (req.user.role === 'admin' || req.user.nivelacesso === 'admin') {
    return next();
  }
  
  // Verificar se o usuário tem nível de acesso admin designeradm
  if (req.user.role === 'designer_adm' || req.user.nivelacesso === 'designer_adm') {
    return next();
  }
  
  return res.status(403).json({ error: 'Acesso não autorizado. É necessário acesso de administrador.' });
};

// Middleware para verificar se o usuário é designer
export const isDesigner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
  }
  
  // Verificar se o usuário tem papel de designer ou superior
  if (
    req.user.role === 'admin' || 
    req.user.role === 'designer_adm' || 
    req.user.role === 'designer' ||
    req.user.nivelacesso === 'admin' ||
    req.user.nivelacesso === 'designer_adm' ||
    req.user.nivelacesso === 'designer'
  ) {
    return next();
  }
  
  return res.status(403).json({ error: 'Acesso não autorizado. É necessário acesso de designer.' });
};

// Middleware para verificar se o usuário é premium
export const isPremium = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
  }
  
  // Verificar se o usuário tem uma assinatura premium
  // Checar tanto pela propriedade 'role' quanto 'nivelacesso' para compatibilidade
  if (
    req.user.role === 'admin' || 
    req.user.role === 'designer_adm' || 
    req.user.role === 'designer' || 
    req.user.role === 'premium' ||
    req.user.nivelacesso === 'admin' ||
    req.user.nivelacesso === 'designer_adm' ||
    req.user.nivelacesso === 'designer' ||
    req.user.nivelacesso === 'premium' ||
    req.user.tipoplano === 'mensal' ||
    req.user.tipoplano === 'anual' ||
    req.user.tipoplano === 'vitalicio' ||
    req.user.tipoplano === 'personalizado'
  ) {
    return next();
  }
  
  return res.status(403).json({ error: 'Acesso não autorizado. É necessária uma assinatura premium.' });
};