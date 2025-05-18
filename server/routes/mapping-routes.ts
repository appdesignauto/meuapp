import express from "express";
import { MappingService } from "../services/mapping-service";
import { authMiddleware } from "../middleware/auth-middleware";

// Criar roteador Express
const router = express.Router();

/**
 * Rota para listar todos os mapeamentos de produtos Hotmart
 * GET /api/mappings
 */
router.get("/api/mappings", authMiddleware, async (req, res) => {
  try {
    // Verificar se o usuário é administrador
    if (req.user?.nivelacesso !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso não autorizado. Apenas administradores podem acessar esta rota."
      });
    }
    
    const mappings = await MappingService.list();
    res.json({
      success: true,
      mappings
    });
  } catch (error) {
    console.error("Erro ao listar mapeamentos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar mapeamentos de produtos. Tente novamente mais tarde."
    });
  }
});

/**
 * Rota para criar um novo mapeamento de produto Hotmart
 * POST /api/mappings
 */
router.post("/api/mappings", authMiddleware, async (req, res) => {
  try {
    // Verificar se o usuário é administrador
    if (req.user?.nivelacesso !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso não autorizado. Apenas administradores podem criar mapeamentos."
      });
    }
    
    const { productId, offerCode, productName, planType, durationDays } = req.body;
    
    // Validar campos obrigatórios
    if (!productId || !productName || !planType || !durationDays) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios ausentes. Forneça productId, productName, planType e durationDays."
      });
    }
    
    // Validar duração em dias
    if (typeof durationDays !== 'number' || durationDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "durationDays deve ser um número positivo."
      });
    }
    
    const newMapping = await MappingService.create({
      productId, 
      offerCode, 
      productName, 
      planType, 
      durationDays
    });
    
    res.status(201).json({
      success: true,
      mapping: newMapping,
      message: "Mapeamento de produto criado com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao criar mapeamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar mapeamento de produto. Tente novamente mais tarde."
    });
  }
});

/**
 * Rota para excluir um mapeamento de produto pelo ID
 * DELETE /api/mappings/:id
 */
router.delete("/api/mappings/:id", authMiddleware, async (req, res) => {
  try {
    // Verificar se o usuário é administrador
    if (req.user?.nivelacesso !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso não autorizado. Apenas administradores podem excluir mapeamentos."
      });
    }
    
    const { id } = req.params;
    
    // Tentar excluir o mapeamento
    await MappingService.delete(id);
    
    res.json({
      success: true,
      message: "Mapeamento de produto excluído com sucesso!"
    });
  } catch (error) {
    console.error(`Erro ao excluir mapeamento ${req.params.id}:`, error);
    
    // Verificar se é erro de registro não encontrado
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: "Mapeamento não encontrado."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Erro ao excluir mapeamento de produto. Tente novamente mais tarde."
    });
  }
});

export default router;