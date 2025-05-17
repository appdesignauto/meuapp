import { Router } from 'express';
import { isAdmin } from '../../middlewares/auth';
import failedRouter from './failed';
import logsRouter from './logs';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Middleware alternativo para verificar se o usuário é admin
// sem depender do req.isAuthenticated() do Passport
const checkAdminManually = async (req, res, next) => {
  try {
    // Verificar se existe uma sessão
    if (!req.session || !req.session.passport || !req.session.passport.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Buscar o usuário pelo ID na sessão
    const userId = req.session.passport.user;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || user.nivelacesso !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado, apenas administradores podem realizar esta ação' });
    }
    
    // Anexar o usuário à requisição para uso posterior
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro ao verificar administrador:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões de administrador' });
  }
};

// Rotas para gerenciamento de webhooks falhos
router.use('/failed', checkAdminManually, failedRouter);

// Rotas para visualização e gerenciamento de logs de webhook
router.use('/logs', checkAdminManually, logsRouter);

export default router;