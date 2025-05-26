/**
 * REDIRECIONAMENTO PARA O NOVO SISTEMA DE REPORTS
 * 
 * Este arquivo agora apenas redireciona para o novo sistema limpo
 */

import { Router } from 'express';

const router = Router();

// Redirecionar todas as rotas para o novo sistema
router.all('*', (req, res) => {
  console.log('⚠️ Rota antiga de reports chamada, redirecionando para novo sistema');
  return res.status(404).json({ 
    message: 'Endpoint movido para novo sistema',
    redirectTo: '/api/reports-new' + req.path 
  });
});

export default router;