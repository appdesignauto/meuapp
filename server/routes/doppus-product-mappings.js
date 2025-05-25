const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { doppusProductMappings } = require('../../shared/schema');
const { eq } = require('drizzle-orm');

// Obter todos os mapeamentos de produtos
router.get('/', async (req, res) => {
  try {
    const mappings = await db.select().from(doppusProductMappings).orderBy(doppusProductMappings.productName);
    res.json(mappings);
  } catch (error) {
    console.error('Erro ao buscar mapeamentos de produtos Doppus:', error);
    res.status(500).json({ error: 'Erro ao buscar mapeamentos de produtos' });
  }
});

// Obter um mapeamento específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [mapping] = await db.select().from(doppusProductMappings).where(eq(doppusProductMappings.id, parseInt(id)));
    
    if (!mapping) {
      return res.status(404).json({ error: 'Mapeamento não encontrado' });
    }
    
    res.json(mapping);
  } catch (error) {
    console.error('Erro ao buscar mapeamento de produto Doppus:', error);
    res.status(500).json({ error: 'Erro ao buscar mapeamento de produto' });
  }
});

// Criar um novo mapeamento
router.post('/', async (req, res) => {
  try {
    const { productId, planId, productName, planType, durationDays, isLifetime } = req.body;
    
    // Validação básica
    if (!productName || !planType) {
      return res.status(400).json({ error: 'Nome do produto e tipo de plano são obrigatórios' });
    }
    
    // Validar que planId não esteja vazio ao cadastrar planos
    if (productId && !planId) {
      return res.status(400).json({ error: 'ID do Plano é obrigatório para diferenciar planos do mesmo produto' });
    }
    
    // Verificar se já existe um mapeamento com esta combinação de produto e plano
    const [existing] = await db.select().from(doppusProductMappings)
      .where(eq(doppusProductMappings.productId, productId))
      .where(eq(doppusProductMappings.planId, planId));
      
    if (existing) {
      return res.status(409).json({ error: 'Já existe um mapeamento para esta combinação de produto e plano' });
    }
    
    // Inserir o novo mapeamento
    const [newMapping] = await db.insert(doppusProductMappings)
      .values({
        productId: productId || '',
        planId: planId || '',
        productName,
        planType,
        durationDays: isLifetime ? null : durationDays,
        isLifetime: !!isLifetime,
      })
      .returning();
    
    res.status(201).json(newMapping);
  } catch (error) {
    console.error('Erro ao criar mapeamento de produto Doppus:', error);
    res.status(500).json({ error: 'Erro ao criar mapeamento de produto' });
  }
});

// Atualizar um mapeamento existente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, planId, productName, planType, durationDays, isLifetime } = req.body;
    
    // Validação simples
    if (!productName || !planType) {
      return res.status(400).json({ error: 'Nome do produto e tipo de plano são obrigatórios' });
    }
    
    // Verificar se o mapeamento existe
    const [existing] = await db.select().from(doppusProductMappings)
      .where(eq(doppusProductMappings.id, parseInt(id)));
      
    if (!existing) {
      return res.status(404).json({ error: 'Mapeamento não encontrado' });
    }
    
    // Verificar se outro mapeamento já usa esta combinação de produto e plano
    const [duplicate] = await db.select().from(doppusProductMappings)
      .where(eq(doppusProductMappings.productId, productId))
      .where(eq(doppusProductMappings.planId, planId))
      .where(e => e.ne(doppusProductMappings.id, parseInt(id)));
      
    if (duplicate) {
      return res.status(409).json({ error: 'Já existe outro mapeamento para esta combinação de produto e plano' });
    }
    
    // Atualizar o mapeamento
    const [updatedMapping] = await db.update(doppusProductMappings)
      .set({
        productId: productId || existing.productId || '',
        planId: planId || existing.planId || '',
        productName,
        planType,
        durationDays: isLifetime ? null : durationDays,
        isLifetime: !!isLifetime,
        updatedAt: new Date()
      })
      .where(eq(doppusProductMappings.id, parseInt(id)))
      .returning();
    
    res.json(updatedMapping);
  } catch (error) {
    console.error('Erro ao atualizar mapeamento de produto Doppus:', error);
    res.status(500).json({ error: 'Erro ao atualizar mapeamento de produto' });
  }
});

// Excluir um mapeamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o mapeamento existe
    const [existing] = await db.select().from(doppusProductMappings)
      .where(eq(doppusProductMappings.id, parseInt(id)));
      
    if (!existing) {
      return res.status(404).json({ error: 'Mapeamento não encontrado' });
    }
    
    // Excluir o mapeamento
    await db.delete(doppusProductMappings)
      .where(eq(doppusProductMappings.id, parseInt(id)));
    
    res.status(200).json({ success: true, message: 'Mapeamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mapeamento de produto Doppus:', error);
    res.status(500).json({ error: 'Erro ao excluir mapeamento de produto' });
  }
});

module.exports = router;