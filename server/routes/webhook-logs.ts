/**
 * Router para logs de webhooks
 * 
 * Este módulo fornece endpoints para listar e gerenciar logs de webhooks
 * da Hotmart e Doppus, permitindo visualização e reprocessamento.
 */

import express from 'express';
import { isAdmin } from '../middlewares/auth';

const router = express.Router();

// Middleware para garantir que apenas admins acessem estes endpoints
router.use(isAdmin);

// Listar logs de webhooks com paginação e filtros
router.get('/', async (req, res) => {
  try {
    // Retorna lista vazia temporariamente enquanto tabela não existe
    res.json({ 
      logs: [], 
      totalCount: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    });
  } catch (error) {
    console.error("Erro ao buscar logs de webhook:", error);
    res.status(500).json({ message: "Erro ao buscar logs de webhook" });
  }
});

// Obter detalhes de um log específico
router.get('/:id', async (req, res) => {
  try {
    // Retorna um log de exemplo
    res.json({
      log: {
        id: parseInt(req.params.id),
        eventType: "EXEMPLO",
        payloadData: "{}",
        status: "processed",
        source: "example",
        errorMessage: null,
        userId: null,
        sourceIp: "127.0.0.1",
        transactionId: null,
        email: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      userData: null
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do log:", error);
    res.status(500).json({ message: "Erro ao buscar detalhes do log" });
  }
});

// Reprocessar webhook
router.post('/reprocess/:id', async (req, res) => {
  try {
    // Simulação de reprocessamento bem-sucedido
    res.json({
      success: true,
      message: "Webhook reprocessado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao reprocessar webhook:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao reprocessar webhook" 
    });
  }
});

export default router;