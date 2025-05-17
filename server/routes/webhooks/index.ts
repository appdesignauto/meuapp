import { Router } from 'express';
import { isAdmin } from '../../middlewares/auth';
import failedRouter from './failed';
import logsRouter from './logs';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Request, Response, NextFunction } from "express";
import { Session, SessionData } from 'express-session';

// Extensão do tipo de Session para incluir o campo passport
declare module 'express-session' {
  interface Session {
    passport?: {
      user?: number;
    };
  }
}

const router = Router();

/**
 * Middleware aprimorado para verificar se o usuário é admin
 * com alternativas de fallback para quando req.isAuthenticated() não estiver disponível
 * 
 * Estratégia de verificação:
 * 1. Tenta acessar req.user diretamente (se já estiver disponível via passport)
 * 2. Verifica a sessão manualmente se req.user não estiver disponível
 * 3. Retorna erro 401 se nenhuma das tentativas de autenticação funcionar
 */
const checkAdminSafely = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let user = null;
    
    // Tentativa 1: Verificar se req.user já existe (via passport.initialize/session)
    if (req.user) {
      user = req.user;
    } 
    // Tentativa 2: Verificar pela sessão (fallback)
    else if (req.session?.passport?.user) {
      const userId = req.session.passport.user;
      const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
      user = dbUser;
      
      // Anexar o usuário à requisição para uso posterior
      req.user = dbUser;
    }
    
    // Verificação final: usuário existe e é admin
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (user.nivelacesso !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado, apenas administradores podem realizar esta ação' });
    }
    
    // Usuário é admin, prosseguir
    next();
  } catch (error) {
    console.error('Erro ao verificar administrador:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões de administrador' });
  }
};

// Rotas para gerenciamento de webhooks falhos
router.use('/failed', checkAdminSafely, failedRouter);

// Rotas para visualização e gerenciamento de logs de webhook
router.use('/logs', checkAdminSafely, logsRouter);

export default router;