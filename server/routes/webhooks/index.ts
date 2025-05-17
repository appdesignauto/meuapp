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
    console.log('[AUTH DEBUG - Index] Verificando autenticação em webhooks/index.ts');
    console.log('[AUTH DEBUG - Index] Session ID:', req.sessionID);
    console.log('[AUTH DEBUG - Index] Session:', req.session ? 'existe' : 'não existe');
    console.log('[AUTH DEBUG - Index] User:', req.user ? `ID: ${req.user.id}, Nível: ${req.user.nivelacesso}` : 'não existe');
    console.log('[AUTH DEBUG - Index] isAuthenticated:', req.isAuthenticated ? `${req.isAuthenticated()}` : 'undefined');
    
    // Solução alternativa para acessar cookies diretamente
    console.log('[AUTH DEBUG - Index] Cookies:', req.headers.cookie);
    
    // Verificação manual de sessão
    if (req.session?.passport?.user) {
      const userId = req.session.passport.user;
      console.log('[AUTH DEBUG - Index] userId da sessão:', userId);
      
      // Consulta direta ao banco para obter informações completas do usuário
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      console.log('[AUTH DEBUG - Index] Usuário encontrado:', userRecord ? `ID: ${userRecord.id}, Nível: ${userRecord.nivelacesso}` : 'não encontrado');
      
      if (userRecord && userRecord.nivelacesso === 'admin') {
        // Atribui o usuário à requisição para uso em middlewares subsequentes
        req.user = userRecord;
        console.log('[AUTH DEBUG - Index] Autenticação bem-sucedida via ID da sessão');
        return next();
      }
    }
    
    // Verifica pelo método padrão se o fallback anterior falhou
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log('[AUTH DEBUG - Index] Verificando pelo método isAuthenticated()');
      if (req.user && req.user.nivelacesso === 'admin') {
        console.log('[AUTH DEBUG - Index] Autenticação bem-sucedida via isAuthenticated()');
        return next();
      }
    }
    
    // Se todas as tentativas anteriores falharem, fazer uma última tentativa direta no banco
    console.log('[AUTH DEBUG - Index] Tentando última alternativa - cookie connect.sid');
    
    // Se todas as verificações falharem, retorne erro
    console.log('[AUTH DEBUG - Index] Autenticação falhou em todas as tentativas');
    return res.status(401).json({ error: 'Usuário não autenticado' });
  } catch (error) {
    console.error('[AUTH DEBUG - Index] Erro ao verificar administrador:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões de administrador' });
  }
};

// Rotas para gerenciamento de webhooks falhos
router.use('/failed', checkAdminSafely, failedRouter);

// Rotas para visualização e gerenciamento de logs de webhook
router.use('/logs', checkAdminSafely, logsRouter);

export default router;