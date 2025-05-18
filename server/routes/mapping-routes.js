/**
 * Rotas para mapeamento de produtos Hotmart
 * 
 * Este arquivo contém as rotas para gerenciar o mapeamento de produtos da Hotmart
 * para planos do sistema, permitindo cadastrar, editar, listar e excluir mapeamentos.
 */

import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth';
import { Pool } from 'pg';
import hotmartAPI from '../services/hotmart-api.js';

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Rota para listar todos os mapeamentos de produtos da Hotmart
 * GET /api/mapping/hotmart
 */
router.get('/hotmart', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM hotmartProductMappings
      ORDER BY id DESC
    `);
    
    res.json({
      success: true,
      mappings: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar mapeamentos de produtos Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao listar mapeamentos de produtos Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para obter um mapeamento específico
 * GET /api/mapping/hotmart/:id
 */
router.get('/hotmart/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM hotmartProductMappings
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mapeamento não encontrado'
      });
    }
    
    res.json({
      success: true,
      mapping: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao obter mapeamento #${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Falha ao obter mapeamento de produto Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para criar um novo mapeamento
 * POST /api/mapping/hotmart
 */
router.post('/hotmart', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { 
      hotmartProductId, 
      hotmartProductName, 
      planoAcesso, 
      duracaoEmDias, 
      observacoes
    } = req.body;
    
    // Validação básica
    if (!hotmartProductId || !planoAcesso) {
      return res.status(400).json({
        success: false,
        message: 'ID do produto Hotmart e Plano de Acesso são obrigatórios'
      });
    }
    
    // Verifica se já existe um mapeamento para este produto
    const checkResult = await pool.query(`
      SELECT * FROM hotmartProductMappings
      WHERE hotmartProductId = $1
    `, [hotmartProductId]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um mapeamento para este produto'
      });
    }
    
    // Inserir novo mapeamento
    const result = await pool.query(`
      INSERT INTO hotmartProductMappings
      (hotmartProductId, hotmartProductName, planoAcesso, duracaoEmDias, observacoes, createdAt)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [hotmartProductId, hotmartProductName, planoAcesso, duracaoEmDias || 30, observacoes || '']);
    
    res.status(201).json({
      success: true,
      message: 'Mapeamento criado com sucesso',
      mapping: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar mapeamento de produto Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao criar mapeamento de produto Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para atualizar um mapeamento existente
 * PUT /api/mapping/hotmart/:id
 */
router.put('/hotmart/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      hotmartProductId, 
      hotmartProductName, 
      planoAcesso, 
      duracaoEmDias, 
      observacoes
    } = req.body;
    
    // Validação básica
    if (!hotmartProductId || !planoAcesso) {
      return res.status(400).json({
        success: false,
        message: 'ID do produto Hotmart e Plano de Acesso são obrigatórios'
      });
    }
    
    // Verificar se o mapeamento existe
    const checkResult = await pool.query(`
      SELECT * FROM hotmartProductMappings
      WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mapeamento não encontrado'
      });
    }
    
    // Atualizar o mapeamento
    const result = await pool.query(`
      UPDATE hotmartProductMappings
      SET hotmartProductId = $1,
          hotmartProductName = $2,
          planoAcesso = $3,
          duracaoEmDias = $4,
          observacoes = $5,
          updatedAt = NOW()
      WHERE id = $6
      RETURNING *
    `, [hotmartProductId, hotmartProductName, planoAcesso, duracaoEmDias || 30, observacoes || '', id]);
    
    res.json({
      success: true,
      message: 'Mapeamento atualizado com sucesso',
      mapping: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao atualizar mapeamento #${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Falha ao atualizar mapeamento de produto Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para excluir um mapeamento
 * DELETE /api/mapping/hotmart/:id
 */
router.delete('/hotmart/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o mapeamento existe
    const checkResult = await pool.query(`
      SELECT * FROM hotmartProductMappings
      WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mapeamento não encontrado'
      });
    }
    
    // Excluir o mapeamento
    await pool.query(`
      DELETE FROM hotmartProductMappings
      WHERE id = $1
    `, [id]);
    
    res.json({
      success: true,
      message: 'Mapeamento excluído com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao excluir mapeamento #${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Falha ao excluir mapeamento de produto Hotmart',
      error: error.message
    });
  }
});

/**
 * Rota para obter produtos disponíveis da Hotmart
 * GET /api/mapping/hotmart-products
 */
router.get('/hotmart-products', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Tenta obter produtos da API da Hotmart
    const productsData = await hotmartAPI.getProducts();
    
    // Formata os produtos para uma estrutura simplificada
    const products = Array.isArray(productsData.items) 
      ? productsData.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          approvalPage: item.approvalPage || '',
          status: item.status || 'ACTIVE'
        }))
      : [];
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Erro ao obter produtos da Hotmart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao obter produtos da API da Hotmart',
      error: error.message
    });
  }
});

export default router;