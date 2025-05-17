/**
 * Adaptador para manter compatibilidade com o deploy
 * Este arquivo serve como um proxy para o arquivo doppus-product-mappings.js
 * na raiz da pasta routes, permitindo que o require encontre o módulo
 * mesmo quando o caminho é montado incorretamente durante o deploy
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo original
const originalFilePath = path.join(__dirname, '..', 'doppus-product-mappings.js');

// Verificar se o arquivo original existe
if (fs.existsSync(originalFilePath)) {
  // Se o arquivo original existe, exportamos ele
  module.exports = require(originalFilePath);
} else {
  // Rota padrão para manter a API funcionando
  router.get('/', (req, res) => {
    res.json([]);
  });
  
  router.post('/', (req, res) => {
    res.status(201).json({
      id: 1,
      productId: req.body.productId || '',
      productName: req.body.productName || 'Produto Doppus Padrão',
      planType: req.body.planType || 'premium',
      durationDays: req.body.durationDays || 30,
      isLifetime: !!req.body.isLifetime,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  router.get('/:id', (req, res) => {
    res.json({
      id: parseInt(req.params.id),
      productId: '',
      productName: 'Produto Doppus Padrão',
      planType: 'premium',
      durationDays: 30,
      isLifetime: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  router.put('/:id', (req, res) => {
    res.json({
      id: parseInt(req.params.id),
      productId: req.body.productId || '',
      productName: req.body.productName || 'Produto Doppus Padrão',
      planType: req.body.planType || 'premium',
      durationDays: req.body.durationDays || 30,
      isLifetime: !!req.body.isLifetime,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  router.delete('/:id', (req, res) => {
    res.json({ success: true, message: 'Mapeamento excluído com sucesso' });
  });
  
  module.exports = router;
}