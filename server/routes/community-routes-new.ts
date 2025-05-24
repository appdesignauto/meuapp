import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// Endpoint de teste simples para verificar se a estrutura funciona
router.get('/test', async (req: Request, res: Response) => {
  try {
    res.json({ 
      status: 'success', 
      message: 'Community routes funcionando perfeitamente!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no endpoint de teste:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;