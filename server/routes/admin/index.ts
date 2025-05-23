/**
 * Rotas de administração para gerenciamento do sistema
 * Este arquivo exporta todas as rotas de administração em um único router
 */

import express from 'express';
import webhookLogsRouter from './webhook-logs';

const router = express.Router();

// Adicionar as rotas de administração diretamente no caminho admin
router.use(webhookLogsRouter);

export default router;