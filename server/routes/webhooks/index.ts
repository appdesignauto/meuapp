import { Router } from 'express';
import { isAdmin } from '../../middlewares/auth';
import failedRouter from './failed';

const router = Router();

// Este roteador agrupa todas as rotas relacionadas a webhooks
// e aplica o middleware isAdmin para garantir que apenas administradores
// tenham acesso às funcionalidades de diagnóstico e gerenciamento de webhooks

// Rotas para gerenciamento de webhooks falhos
router.use('/failed', isAdmin, failedRouter);

export default router;