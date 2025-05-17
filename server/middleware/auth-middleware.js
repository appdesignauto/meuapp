/**
 * Middleware de autenticação para rotas administrativas
 * Este arquivo contém middleware para proteger rotas que exigem
 * privilégios de administrador
 */

/**
 * Middleware que verifica se o usuário está autenticado e é administrador
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export function isAdmin(req, res, next) {
  // Verificar se o usuário está autenticado
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Não autorizado: autenticação necessária' 
    });
  }
  
  // Verificar se o usuário é administrador (nível 3)
  if (req.user.level !== 3) {
    return res.status(403).json({ 
      error: 'Acesso negado: privilégios administrativos necessários' 
    });
  }
  
  // Usuário autenticado e é administrador, permitir acesso
  next();
}

/**
 * Middleware que verifica se o usuário está autenticado
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Não autorizado: autenticação necessária' 
    });
  }
  
  next();
}