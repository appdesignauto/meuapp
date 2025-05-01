const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { artGroups, artVariations, users, categories, formats, fileTypes } = require('../../migrations/schema');
const { eq, desc, and, isNull, sql, count, like, not, asc } = require('drizzle-orm');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadToR2, getR2PublicUrl } = require('../r2');

// Middleware para verificar autenticação
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Não autenticado' });
};

// Middleware para verificar se o usuário é admin ou o designer da arte
const isAdminOrDesigner = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const groupId = parseInt(req.params.groupId);
  const { rows } = await db.raw(`
    SELECT * FROM "artGroups" WHERE "id" = $1 AND "designerId" = $2
  `, [groupId, req.user.id]);

  if (rows.length > 0) {
    return next();
  }

  res.status(403).json({ message: 'Acesso negado' });
};

// Obter todos os grupos de arte (com paginação)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
    const formatId = req.query.formatId ? parseInt(req.query.formatId) : null;
    const designerId = req.query.designerId ? parseInt(req.query.designerId) : null;
    const orderBy = req.query.orderBy || 'createdAt';
    const order = req.query.order || 'desc';
    const onlyPremium = req.query.onlyPremium === 'true';
    
    // Verificar se o usuário é admin para determinar se deve filtrar conteúdo não visível
    const isAdmin = req.isAuthenticated() && req.user.role === 'admin';
    const showInvisible = isAdmin && req.query.showInvisible === 'true';
    
    // Construir a consulta base
    let query = `
      SELECT 
        ag.*, 
        u.name as "designerName", 
        u.username as "designerUsername", 
        u.profileimageurl as "designerProfileImageUrl",
        c.name as "categoryName",
        c.slug as "categorySlug",
        COALESCE(v.primary_variation_id, 0) as "primaryVariationId",
        COALESCE(v.image_url, '') as "primaryImageUrl"
      FROM "artGroups" ag
      LEFT JOIN "users" u ON ag."designerId" = u.id
      LEFT JOIN "categories" c ON ag."categoryId" = c.id
      LEFT JOIN (
        SELECT "groupId", MIN(id) as primary_variation_id, MIN("imageUrl") as image_url
        FROM "artVariations" 
        WHERE "isPrimary" = true
        GROUP BY "groupId"
      ) v ON ag.id = v."groupId"
    `;
    
    // Adicionar condições
    let conditions = [];
    let params = [];
    
    // Filtro de visibilidade, se não for admin ou showInvisible não estiver ativado
    if (!showInvisible) {
      conditions.push(`ag."isVisible" = true`);
    }
    
    // Filtro por categoria
    if (categoryId) {
      conditions.push(`ag."categoryId" = $${params.length + 1}`);
      params.push(categoryId);
    }
    
    // Filtro por designer
    if (designerId) {
      conditions.push(`ag."designerId" = $${params.length + 1}`);
      params.push(designerId);
    }
    
    // Filtro por formato (deve estar disponível em pelo menos uma variação)
    if (formatId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM "artVariations" av 
        WHERE av."groupId" = ag.id AND av."formatId" = $${params.length + 1}
      )`);
      params.push(formatId);
    }
    
    // Filtro para conteúdo premium
    if (onlyPremium) {
      conditions.push(`ag."isPremium" = true`);
    }
    
    // Filtro de busca
    if (search) {
      conditions.push(`(
        ag.title ILIKE $${params.length + 1} 
        OR u.name ILIKE $${params.length + 1}
        OR u.username ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }
    
    // Adicionar condições à consulta
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Ordenação
    let orderColumn = '"createdAt"';
    if (orderBy === 'title') orderColumn = '"title"';
    if (orderBy === 'viewCount') orderColumn = '"viewCount"';
    if (orderBy === 'downloadCount') orderColumn = '"downloadCount"';
    if (orderBy === 'likeCount') orderColumn = '"likeCount"';
    
    query += ` ORDER BY ag.${orderColumn} ${order === 'asc' ? 'ASC' : 'DESC'}`;
    
    // Adicionar paginação
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    // Executar a consulta principal
    const { rows: groups } = await db.raw(query, params);
    
    // Consulta para contar o total
    let countQuery = `
      SELECT COUNT(*) as total FROM "artGroups" ag
      LEFT JOIN "users" u ON ag."designerId" = u.id
    `;
    
    // Adicionar condições à consulta de contagem
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Executar a consulta de contagem
    const { rows: countResult } = await db.raw(countQuery, params.slice(0, params.length - 2));
    const total = parseInt(countResult[0].total);
    
    res.json({
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar grupos de arte:', error);
    res.status(500).json({ message: 'Erro ao buscar grupos de arte', error: error.message });
  }
});

// Obter um grupo de arte pelo ID com todas as suas variações
router.get('/:groupId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    
    // Obter o grupo
    const { rows: [group] } = await db.raw(`
      SELECT 
        ag.*, 
        u.name as "designerName", 
        u.username as "designerUsername", 
        u.profileimageurl as "designerProfileImageUrl",
        u.bio as "designerBio",
        c.name as "categoryName",
        c.slug as "categorySlug"
      FROM "artGroups" ag
      LEFT JOIN "users" u ON ag."designerId" = u.id
      LEFT JOIN "categories" c ON ag."categoryId" = c.id
      WHERE ag.id = $1
    `, [groupId]);
    
    if (!group) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    // Verificar visibilidade (se não for admin)
    const isAdmin = req.isAuthenticated() && req.user.role === 'admin';
    if (!group.isVisible && !isAdmin) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    // Obter todas as variações do grupo
    const { rows: variations } = await db.raw(`
      SELECT 
        av.*, 
        f.name as "formatName", 
        f.slug as "formatSlug",
        ft.name as "fileTypeName",
        ft.slug as "fileTypeSlug"
      FROM "artVariations" av
      LEFT JOIN "formats" f ON av."formatId" = f.id
      LEFT JOIN "fileTypes" ft ON av."fileTypeId" = ft.id
      WHERE av."groupId" = $1
      ORDER BY av."isPrimary" DESC, av."createdAt" DESC
    `, [groupId]);
    
    // Incrementar contador de visualizações
    await db.raw(`
      UPDATE "artGroups" SET "viewCount" = "viewCount" + 1 WHERE id = $1
    `, [groupId]);
    
    // Retornar o resultado
    res.json({
      ...group,
      variations
    });
  } catch (error) {
    console.error('Erro ao buscar grupo de arte:', error);
    res.status(500).json({ message: 'Erro ao buscar grupo de arte', error: error.message });
  }
});

// Criar um novo grupo de arte com uma variação inicial
router.post('/', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { title, categoryId, formatId, fileTypeId, editUrl, isPremium } = req.body;
    
    if (!title || !categoryId || !formatId || !fileTypeId) {
      return res.status(400).json({ message: 'Dados incompletos para criar arte' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'É necessário enviar uma imagem' });
    }
    
    // Verificar se o formato e tipo de arquivo existem
    const { rows: formatCheck } = await db.raw(
      `SELECT id FROM "formats" WHERE id = $1`, [formatId]
    );
    
    const { rows: fileTypeCheck } = await db.raw(
      `SELECT id FROM "fileTypes" WHERE id = $1`, [fileTypeId]
    );
    
    if (formatCheck.length === 0) {
      return res.status(400).json({ message: 'Formato inválido' });
    }
    
    if (fileTypeCheck.length === 0) {
      return res.status(400).json({ message: 'Tipo de arquivo inválido' });
    }
    
    // Processar a imagem
    const filePath = req.file.path;
    const fileExt = 'webp'; // Sempre convertemos para webp
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
    
    // Obter dimensões da imagem
    const metadata = await sharp(filePath).metadata();
    const { width, height } = metadata;
    const aspectRatio = `${width}/${height}`;
    
    // Converter para WebP e otimizar
    const optimizedImageBuffer = await sharp(filePath)
      .webp({ quality: 85 })
      .toBuffer();
    
    // Fazer upload para o R2/Supabase
    const userId = req.user.id;
    const uploadPath = `designer/${userId}/${fileName}`;
    const uploadResult = await uploadToR2(optimizedImageBuffer, uploadPath, 'image/webp');
    
    // Construir URL pública
    const imageUrl = getR2PublicUrl(uploadPath);
    
    // Remover arquivo temporário
    fs.unlink(filePath, (err) => {
      if (err) console.error('Erro ao remover arquivo temporário:', err);
    });
    
    // Iniciar transação
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Criar o grupo
      const groupResult = await client.query(
        `INSERT INTO "artGroups" (
          "title", "categoryId", "designerId", "isPremium", "isVisible"
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, categoryId, userId, isPremium === 'true', true]
      );
      
      const newGroup = groupResult.rows[0];
      
      // Criar a variação
      const variationResult = await client.query(
        `INSERT INTO "artVariations" (
          "groupId", "formatId", "imageUrl", "editUrl", "fileTypeId", 
          "width", "height", "aspectRatio", "isPrimary"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [newGroup.id, formatId, imageUrl, editUrl || '', fileTypeId, width, height, aspectRatio, true]
      );
      
      const newVariation = variationResult.rows[0];
      
      await client.query('COMMIT');
      
      res.status(201).json({
        ...newGroup,
        variations: [newVariation]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao criar grupo de arte:', error);
    res.status(500).json({ message: 'Erro ao criar grupo de arte', error: error.message });
  }
});

// Adicionar uma nova variação a um grupo existente
router.post('/:groupId/variations', isAdminOrDesigner, upload.single('image'), async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { formatId, fileTypeId, editUrl, isPrimary } = req.body;
    
    if (!formatId || !fileTypeId) {
      return res.status(400).json({ message: 'Dados incompletos para criar variação' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'É necessário enviar uma imagem' });
    }
    
    // Verificar se o grupo existe
    const { rows: groupCheck } = await db.raw(
      `SELECT id FROM "artGroups" WHERE id = $1`, [groupId]
    );
    
    if (groupCheck.length === 0) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    // Verificar se já existe uma variação com o mesmo formato
    const { rows: existingVariation } = await db.raw(
      `SELECT id FROM "artVariations" WHERE "groupId" = $1 AND "formatId" = $2`,
      [groupId, formatId]
    );
    
    if (existingVariation.length > 0) {
      return res.status(400).json({ 
        message: 'Já existe uma variação com este formato para este grupo' 
      });
    }
    
    // Processar a imagem
    const filePath = req.file.path;
    const fileExt = 'webp'; // Sempre convertemos para webp
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
    
    // Obter dimensões da imagem
    const metadata = await sharp(filePath).metadata();
    const { width, height } = metadata;
    const aspectRatio = `${width}/${height}`;
    
    // Converter para WebP e otimizar
    const optimizedImageBuffer = await sharp(filePath)
      .webp({ quality: 85 })
      .toBuffer();
    
    // Fazer upload para o R2/Supabase
    const userId = req.user.id;
    const uploadPath = `designer/${userId}/${fileName}`;
    const uploadResult = await uploadToR2(optimizedImageBuffer, uploadPath, 'image/webp');
    
    // Construir URL pública
    const imageUrl = getR2PublicUrl(uploadPath);
    
    // Remover arquivo temporário
    fs.unlink(filePath, (err) => {
      if (err) console.error('Erro ao remover arquivo temporário:', err);
    });
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Se esta variação será a primária, remover a marca das outras
      if (isPrimary === 'true') {
        await client.query(
          `UPDATE "artVariations" SET "isPrimary" = false WHERE "groupId" = $1`,
          [groupId]
        );
      }
      
      // Criar a variação
      const variationResult = await client.query(
        `INSERT INTO "artVariations" (
          "groupId", "formatId", "imageUrl", "editUrl", "fileTypeId", 
          "width", "height", "aspectRatio", "isPrimary"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [groupId, formatId, imageUrl, editUrl || '', fileTypeId, width, height, aspectRatio, isPrimary === 'true']
      );
      
      const newVariation = variationResult.rows[0];
      
      await client.query('COMMIT');
      
      res.status(201).json(newVariation);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao adicionar variação:', error);
    res.status(500).json({ message: 'Erro ao adicionar variação', error: error.message });
  }
});

// Atualizar um grupo de arte
router.put('/:groupId', isAdminOrDesigner, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const { title, categoryId, isPremium, isVisible } = req.body;
    
    // Verificar se o grupo existe
    const { rows: groupCheck } = await db.raw(
      `SELECT id FROM "artGroups" WHERE id = $1`, [groupId]
    );
    
    if (groupCheck.length === 0) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    // Construir o objeto de atualização
    let updateFields = [];
    let params = [groupId];
    let paramIndex = 2;
    
    if (title !== undefined) {
      updateFields.push(`"title" = $${paramIndex++}`);
      params.push(title);
    }
    
    if (categoryId !== undefined) {
      updateFields.push(`"categoryId" = $${paramIndex++}`);
      params.push(categoryId);
    }
    
    if (isPremium !== undefined) {
      updateFields.push(`"isPremium" = $${paramIndex++}`);
      params.push(isPremium === true || isPremium === 'true');
    }
    
    if (isVisible !== undefined) {
      updateFields.push(`"isVisible" = $${paramIndex++}`);
      params.push(isVisible === true || isVisible === 'true');
    }
    
    updateFields.push(`"updatedAt" = NOW()`);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }
    
    // Atualizar o grupo
    const { rows: [updatedGroup] } = await db.raw(
      `UPDATE "artGroups" SET ${updateFields.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    
    res.json(updatedGroup);
  } catch (error) {
    console.error('Erro ao atualizar grupo de arte:', error);
    res.status(500).json({ message: 'Erro ao atualizar grupo de arte', error: error.message });
  }
});

// Definir uma variação como primária
router.put('/:groupId/variations/:variationId/primary', isAdminOrDesigner, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const variationId = parseInt(req.params.variationId);
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar se a variação pertence ao grupo
      const { rows: variationCheck } = await client.query(
        `SELECT id FROM "artVariations" WHERE id = $1 AND "groupId" = $2`,
        [variationId, groupId]
      );
      
      if (variationCheck.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Variação não encontrada neste grupo' });
      }
      
      // Remover a marca primária de todas as variações deste grupo
      await client.query(
        `UPDATE "artVariations" SET "isPrimary" = false WHERE "groupId" = $1`,
        [groupId]
      );
      
      // Definir esta variação como primária
      await client.query(
        `UPDATE "artVariations" SET "isPrimary" = true WHERE id = $1`,
        [variationId]
      );
      
      await client.query('COMMIT');
      
      res.json({ message: 'Variação definida como primária com sucesso' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao definir variação como primária:', error);
    res.status(500).json({ 
      message: 'Erro ao definir variação como primária', 
      error: error.message 
    });
  }
});

// Excluir uma variação
router.delete('/:groupId/variations/:variationId', isAdminOrDesigner, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const variationId = parseInt(req.params.variationId);
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar se a variação pertence ao grupo
      const { rows: variationCheck } = await client.query(
        `SELECT id, "isPrimary", "imageUrl" FROM "artVariations" WHERE id = $1 AND "groupId" = $2`,
        [variationId, groupId]
      );
      
      if (variationCheck.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Variação não encontrada neste grupo' });
      }
      
      // Contar quantas variações existem neste grupo
      const { rows: [countResult] } = await client.query(
        `SELECT COUNT(*) as count FROM "artVariations" WHERE "groupId" = $1`,
        [groupId]
      );
      
      const variationCount = parseInt(countResult.count);
      
      // Se esta é a única variação, não permitir a exclusão
      if (variationCount <= 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: 'Não é possível excluir a única variação de um grupo. Exclua o grupo inteiro se necessário.' 
        });
      }
      
      // Se esta é a variação primária, definir outra como primária
      if (variationCheck[0].isPrimary) {
        await client.query(
          `UPDATE "artVariations" SET "isPrimary" = true 
           WHERE "groupId" = $1 AND id != $2
           ORDER BY "createdAt" DESC LIMIT 1`,
          [groupId, variationId]
        );
      }
      
      // Excluir a variação
      await client.query(
        `DELETE FROM "artVariations" WHERE id = $1`,
        [variationId]
      );
      
      // Tentar excluir a imagem do storage (não crítico)
      try {
        const imageUrl = variationCheck[0].imageUrl;
        // Aqui você poderia adicionar código para excluir a imagem do R2/Supabase
        // Por enquanto, apenas logamos o que seria excluído
        console.log(`Imagem que seria excluída: ${imageUrl}`);
      } catch (imgError) {
        console.error('Erro ao tentar excluir imagem:', imgError);
      }
      
      await client.query('COMMIT');
      
      res.json({ message: 'Variação excluída com sucesso' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao excluir variação:', error);
    res.status(500).json({ message: 'Erro ao excluir variação', error: error.message });
  }
});

// Excluir um grupo de arte e todas as suas variações
router.delete('/:groupId', isAdminOrDesigner, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Obter todas as imagens para potencial exclusão do storage
      const { rows: variations } = await client.query(
        `SELECT "imageUrl" FROM "artVariations" WHERE "groupId" = $1`,
        [groupId]
      );
      
      // Excluir todas as variações
      await client.query(
        `DELETE FROM "artVariations" WHERE "groupId" = $1`,
        [groupId]
      );
      
      // Excluir o grupo
      const { rowCount } = await client.query(
        `DELETE FROM "artGroups" WHERE id = $1`,
        [groupId]
      );
      
      if (rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Grupo de arte não encontrado' });
      }
      
      // Tentar excluir as imagens do storage (não crítico)
      try {
        for (const variation of variations) {
          const imageUrl = variation.imageUrl;
          // Aqui você poderia adicionar código para excluir a imagem do R2/Supabase
          // Por enquanto, apenas logamos o que seria excluído
          console.log(`Imagem que seria excluída: ${imageUrl}`);
        }
      } catch (imgError) {
        console.error('Erro ao tentar excluir imagens:', imgError);
      }
      
      await client.query('COMMIT');
      
      res.json({ message: 'Grupo de arte e suas variações excluídos com sucesso' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao excluir grupo de arte:', error);
    res.status(500).json({ message: 'Erro ao excluir grupo de arte', error: error.message });
  }
});

// Rota para buscar grupos de arte relacionados
router.get('/:groupId/related', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const limit = parseInt(req.query.limit) || 8;
    
    // Obter informações do grupo atual
    const { rows: [group] } = await db.raw(`
      SELECT "categoryId", "designerId" FROM "artGroups" WHERE id = $1
    `, [groupId]);
    
    if (!group) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    // Buscar grupos relacionados com base na mesma categoria ou mesmo designer
    const { rows: relatedGroups } = await db.raw(`
      SELECT 
        ag.*, 
        u.name as "designerName", 
        u.username as "designerUsername", 
        u.profileimageurl as "designerProfileImageUrl",
        c.name as "categoryName",
        c.slug as "categorySlug",
        av."imageUrl" as "primaryImageUrl",
        av."aspectRatio" as "aspectRatio"
      FROM "artGroups" ag
      LEFT JOIN "users" u ON ag."designerId" = u.id
      LEFT JOIN "categories" c ON ag."categoryId" = c.id
      LEFT JOIN "artVariations" av ON av."groupId" = ag.id AND av."isPrimary" = true
      WHERE ag.id != $1 
        AND (ag."categoryId" = $2 OR ag."designerId" = $3)
        AND ag."isVisible" = true
      ORDER BY 
        CASE WHEN ag."categoryId" = $2 AND ag."designerId" = $3 THEN 1
             WHEN ag."categoryId" = $2 THEN 2
             ELSE 3
        END,
        ag."createdAt" DESC
      LIMIT $4
    `, [groupId, group.categoryId, group.designerId, limit]);
    
    res.json(relatedGroups);
  } catch (error) {
    console.error('Erro ao buscar grupos relacionados:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar grupos relacionados', 
      error: error.message 
    });
  }
});

module.exports = router;