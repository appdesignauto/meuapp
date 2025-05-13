/**
 * Middleware para verificar se o usuário tem nível de acesso 'admin'
 * Este middleware é usado para proteger rotas que só devem ser acessadas por administradores
 */

import { Request, Response, NextFunction } from 'express';

export function checkAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      error: 'Não autenticado' 
    });
  }
  
  if (req.user?.nivelacesso !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Você não tem permissão para acessar este recurso' 
    });
  }
  
  next();
}