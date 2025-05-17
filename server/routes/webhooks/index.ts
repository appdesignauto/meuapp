import { Router } from 'express';
import failedWebhooksRouter from './failed';

const router = Router();

// Rota para webhooks falhos
router.use('/failed', failedWebhooksRouter);

export default router;