import { Request, Response, NextFunction } from "express";

// Middleware para verificar se o usuário está autenticado
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  next();
};

// Middleware para verificar se o usuário é admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  
  // @ts-ignore - Ignora erro de tipagem temporário para fazer o servidor funcionar
  const user = req.user;
  if (!user || (user.nivelacesso !== 'admin' && user.role !== 'admin')) {
    return res.status(403).json({ message: "Acesso negado" });
  }
  
  next();
};

// Middleware para verificar se o usuário é designer ou admin
export const isDesigner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  
  // @ts-ignore - Ignora erro de tipagem temporário para fazer o servidor funcionar
  const user = req.user;
  if (!user || !(
    user.nivelacesso === 'designer' || 
    user.nivelacesso === 'designer_adm' || 
    user.nivelacesso === 'admin' ||
    user.role === 'designer' ||
    user.role === 'admin'
  )) {
    return res.status(403).json({ message: "Acesso negado" });
  }
  
  next();
};

// Middleware para verificar se o usuário é premium ou admin
export const isPremium = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  
  // @ts-ignore - Ignora erro de tipagem temporário para fazer o servidor funcionar
  const user = req.user;
  if (!user || !(
    user.nivelacesso === 'premium' || 
    user.nivelacesso === 'designer' ||
    user.nivelacesso === 'designer_adm' ||
    user.nivelacesso === 'admin' ||
    user.role === 'admin'
  )) {
    return res.status(403).json({ message: "Acesso negado. Este recurso é exclusivo para usuários premium." });
  }
  
  next();
};

// Middleware flexível para verificar se o usuário tem uma role específica
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    // @ts-ignore - Ignora erro de tipagem temporário para fazer o servidor funcionar
    const user = req.user;
    if (!user) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    const userRoles = [user.nivelacesso];
    if (user.role) userRoles.push(user.role);
    
    const hasAccess = roles.some(role => userRoles.includes(role));
    
    if (!hasAccess) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    next();
  };
};