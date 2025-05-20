/**
 * Adaptador para o mapeamento de produtos Doppus
 * Este arquivo garante que o módulo seja exportado corretamente durante o processo de build
 */

import { Router } from 'express';
import { db } from '../db';
import { eq, sql } from 'drizzle-orm';
import { isAdmin } from '../middlewares/auth';

const router = Router();

// Middleware para garantir que apenas admins possam acessar estas rotas
router.use(isAdmin);

// Obter todos os mapeamentos
router.get('/', async (req, res) => {
  try {
    const mappings = await db.execute(sql`
      SELECT * FROM "doppusProductMappings"
      ORDER BY "createdAt" DESC
    `);
    
    res.json(mappings.rows);
  } catch (error) {
    console.error('Erro ao buscar mapeamentos de produtos Doppus:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar mapeamentos de produtos Doppus',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Criar novo mapeamento
router.post('/', async (req, res) => {
  try {
    const result = await db.execute(sql`
      INSERT INTO "doppusProductMappings" (
        "productId", "productName", "planType", "durationDays", "isLifetime"
      ) VALUES (
        ${req.body.productId || ''},
        ${req.body.productName || 'Produto Padrão'},
        ${req.body.planType || 'premium'},
        ${req.body.durationDays || 30},
        ${!!req.body.isLifetime}
      )
      RETURNING *
    `);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar mapeamento de produto Doppus:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar mapeamento de produto Doppus',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Obter mapeamento específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.execute(sql`
      SELECT * FROM "doppusProductMappings"
      WHERE id = ${parseInt(id)}
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mapeamento não encontrado'
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar mapeamento de produto Doppus:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar mapeamento de produto Doppus',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Atualizar mapeamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.execute(sql`
      UPDATE "doppusProductMappings"
      SET 
        "productId" = ${req.body.productId || ''},
        "productName" = ${req.body.productName || 'Produto Padrão'},
        "planType" = ${req.body.planType || 'premium'},
        "durationDays" = ${req.body.durationDays || 30},
        "isLifetime" = ${!!req.body.isLifetime},
        "updatedAt" = now()
      WHERE id = ${parseInt(id)}
      RETURNING *
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mapeamento não encontrado'
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar mapeamento de produto Doppus:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar mapeamento de produto Doppus',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Excluir mapeamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute(sql`
      DELETE FROM "doppusProductMappings"
      WHERE id = ${parseInt(id)}
    `);
    
    res.json({ success: true, message: 'Mapeamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mapeamento de produto Doppus:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir mapeamento de produto Doppus',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;