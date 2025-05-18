/**
 * Rotas para gerenciamento de mapeamentos de produtos Hotmart
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../middleware/auth-middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/hotmart-mappings
 * Lista todos os mapeamentos de produtos Hotmart
 */
router.get('/hotmart-mappings', isAdmin, async (req: Request, res: Response) => {
  try {
    const mappings = await prisma.hotmartProductMapping.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(mappings);
  } catch (error) {
    console.error('Erro ao buscar mapeamentos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar mapeamentos de produtos Hotmart' 
    });
  }
});

/**
 * GET /api/hotmart-mappings/:id
 * Busca um mapeamento específico pelo ID
 */
router.get('/hotmart-mappings/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mapping = await prisma.hotmartProductMapping.findUnique({
      where: { id }
    });

    if (!mapping) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mapeamento não encontrado' 
      });
    }

    res.json(mapping);
  } catch (error) {
    console.error('Erro ao buscar mapeamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar mapeamento de produto Hotmart' 
    });
  }
});

/**
 * POST /api/hotmart-mappings
 * Cria um novo mapeamento de produto Hotmart
 */
router.post('/hotmart-mappings', isAdmin, async (req: Request, res: Response) => {
  try {
    const { productId, offerCode, productName, planType, durationDays } = req.body;

    // Validação de campos obrigatórios
    if (!productId || !productName || !planType || !durationDays) {
      return res.status(400).json({ 
        success: false, 
        message: 'Campos obrigatórios ausentes' 
      });
    }

    // Verifica se já existe um mapeamento igual
    if (offerCode) {
      const existingMapping = await prisma.hotmartProductMapping.findFirst({
        where: {
          productId,
          offerCode
        }
      });

      if (existingMapping) {
        return res.status(400).json({ 
          success: false, 
          message: 'Já existe um mapeamento para este produto com este código de oferta' 
        });
      }
    } else {
      // Verificar mapeamento padrão (sem offerCode)
      const existingMapping = await prisma.hotmartProductMapping.findFirst({
        where: {
          productId,
          offerCode: null
        }
      });

      if (existingMapping) {
        return res.status(400).json({ 
          success: false, 
          message: 'Já existe um mapeamento padrão para este produto' 
        });
      }
    }

    // Criar o novo mapeamento
    const newMapping = await prisma.hotmartProductMapping.create({
      data: {
        productId,
        offerCode: offerCode || null,
        productName,
        planType,
        durationDays: Number(durationDays)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Mapeamento criado com sucesso',
      data: newMapping
    });
  } catch (error) {
    console.error('Erro ao criar mapeamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar mapeamento de produto Hotmart' 
    });
  }
});

/**
 * PUT /api/hotmart-mappings/:id
 * Atualiza um mapeamento existente
 */
router.put('/hotmart-mappings/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productId, offerCode, productName, planType, durationDays } = req.body;

    // Validação de campos obrigatórios
    if (!productId || !productName || !planType || !durationDays) {
      return res.status(400).json({ 
        success: false, 
        message: 'Campos obrigatórios ausentes' 
      });
    }

    // Verificar se o mapeamento existe
    const existingMapping = await prisma.hotmartProductMapping.findUnique({
      where: { id }
    });

    if (!existingMapping) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mapeamento não encontrado' 
      });
    }

    // Atualizar o mapeamento
    const updatedMapping = await prisma.hotmartProductMapping.update({
      where: { id },
      data: {
        productId,
        offerCode: offerCode || null,
        productName,
        planType,
        durationDays: Number(durationDays)
      }
    });

    res.json({
      success: true,
      message: 'Mapeamento atualizado com sucesso',
      data: updatedMapping
    });
  } catch (error) {
    console.error('Erro ao atualizar mapeamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar mapeamento de produto Hotmart' 
    });
  }
});

/**
 * DELETE /api/hotmart-mappings/:id
 * Remove um mapeamento existente
 */
router.delete('/hotmart-mappings/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se o mapeamento existe
    const existingMapping = await prisma.hotmartProductMapping.findUnique({
      where: { id }
    });

    if (!existingMapping) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mapeamento não encontrado' 
      });
    }

    // Remover o mapeamento
    await prisma.hotmartProductMapping.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Mapeamento removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover mapeamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover mapeamento de produto Hotmart' 
    });
  }
});

export default router;