import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth';
import multer from 'multer';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import path from 'path';
import sharp from 'sharp';
import { uploadToStorage } from '../services/storage-service';
import { generateRandomFilename } from '../utils/file-utils';

const router = express.Router();

// Configuração do multer para upload em memória (para otimização antes de salvar)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middleware para verificar acesso à criação de artes (admin ou designer)
const canCreateArt = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'designer' || req.user.role === 'designer_adm') {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Apenas administradores e designers podem criar artes.' });
};

// Obter todos os grupos de arte (com filtros)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      categoryId, 
      formatId,
      designerId,
      onlyPremium,
      showInvisible = 'false'
    } = req.query;
    
    // Determinar se deve mostrar artes invisíveis (apenas para admin)
    const isAdmin = req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'designer_adm');
    const shouldShowInvisible = (showInvisible === 'true' && isAdmin);
    
    // Calcular offset para paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Construir a query SQL base
    let baseQuery = `
      SELECT 
        ag.*,
        u.name as "designerName",
        u.username as "designerUsername",
        u.profileimageurl as "designerProfileImageUrl",
        c.name as "categoryName",
        c.slug as "categorySlug",
        (
          SELECT av.id 
          FROM "artVariations" av 
          WHERE av."groupId" = ag.id AND av."isPrimary" = true
          LIMIT 1
        ) as "primaryVariationId",
        (
          SELECT av."imageUrl" 
          FROM "artVariations" av 
          WHERE av."groupId" = ag.id AND av."isPrimary" = true
          LIMIT 1
        ) as "primaryImageUrl"
      FROM "artGroups" ag
      LEFT JOIN users u ON ag."designerId" = u.id
      LEFT JOIN categories c ON ag."categoryId" = c.id
      WHERE 1=1
    `;
    
    // Adicionar condições à query
    const conditions = [];
    
    // Condição de pesquisa
    if (search) {
      conditions.push(`ag.title ILIKE '%${search}%'`);
    }
    
    // Condição de categoria
    if (categoryId) {
      conditions.push(`ag."categoryId" = ${categoryId}`);
    }
    
    // Condição de designer
    if (designerId) {
      conditions.push(`ag."designerId" = ${designerId}`);
    }
    
    // Condição de premium
    if (onlyPremium === 'true') {
      conditions.push(`ag."isPremium" = true`);
    }
    
    // Condição de visibilidade
    if (!shouldShowInvisible) {
      conditions.push(`ag."isVisible" = true`);
    }
    
    // Adicionar filtro de formato (via JOIN com variações)
    if (formatId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM "artVariations" av 
        WHERE av."groupId" = ag.id AND av."formatId" = ${formatId}
      )`);
    }
    
    // Adicionar condições à query base
    if (conditions.length > 0) {
      baseQuery += ` AND ${conditions.join(' AND ')}`;
    }
    
    // Query completa com ORDER BY e LIMIT
    const query = `
      ${baseQuery}
      ORDER BY ag."createdAt" DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as value
      FROM "artGroups" ag
      WHERE ${conditions.length > 0 ? conditions.join(' AND ') : '1=1'}
    `;
    
    // Executar as queries
    const [groupsResult, countResult] = await Promise.all([
      db.execute(sql.raw(query)),
      db.execute(sql.raw(countQuery))
    ]);
    
    const groups = groupsResult.rows;
    const totalCount = parseInt(countResult.rows[0].value.toString());
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json({
      groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages,
        hasMore: parseInt(page) < totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar grupos de arte:', error);
    res.status(500).json({ message: 'Erro ao buscar grupos de arte' });
  }
});

// Obter um grupo de arte específico com suas variações
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o grupo
    const groupQuery = `
      SELECT 
        ag.*,
        u.name as "designerName",
        u.username as "designerUsername",
        u.profileimageurl as "designerProfileImageUrl",
        u.bio as "designerBio",
        c.name as "categoryName",
        c.slug as "categorySlug"
      FROM "artGroups" ag
      LEFT JOIN users u ON ag."designerId" = u.id
      LEFT JOIN categories c ON ag."categoryId" = c.id
      WHERE ag.id = ${id}
    `;
    
    // Buscar as variações
    const variationsQuery = `
      SELECT 
        av.*,
        f.name as "formatName",
        f.slug as "formatSlug",
        ft.name as "fileTypeName",
        ft.slug as "fileTypeSlug"
      FROM "artVariations" av
      LEFT JOIN formats f ON av."formatId" = f.id
      LEFT JOIN "fileTypes" ft ON av."fileTypeId" = ft.id
      WHERE av."groupId" = ${id}
      ORDER BY av."isPrimary" DESC, av."createdAt" DESC
    `;
    
    // Executar as queries
    const [groupResult, variationsResult] = await Promise.all([
      db.execute(sql.raw(groupQuery)),
      db.execute(sql.raw(variationsQuery))
    ]);
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    const group = groupResult.rows[0];
    const variations = variationsResult.rows;
    
    // Verificar visibilidade
    const isAdmin = req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'designer_adm');
    const isOwner = req.isAuthenticated() && req.user.id === group.designerId;
    
    if (!group.isVisible && !isAdmin && !isOwner) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    // Incrementar contador de visualizações
    await db.execute(sql.raw(`
      UPDATE "artGroups" 
      SET "viewCount" = "viewCount" + 1 
      WHERE id = ${id}
    `));
    
    res.json({
      ...group,
      variations
    });
  } catch (error) {
    console.error('Erro ao buscar grupo de arte:', error);
    res.status(500).json({ message: 'Erro ao buscar grupo de arte' });
  }
});

// Criar um novo grupo de arte
router.post('/', isAuthenticated, canCreateArt, upload.single('image'), async (req, res) => {
  try {
    const { title, categoryId, isPremium, formatId, fileTypeId, editUrl } = req.body;
    
    // Validar campos obrigatórios
    if (!title || !categoryId || !formatId || !fileTypeId || !req.file) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' });
    }
    
    // Processar imagem
    const optimizedImageBuffer = await sharp(req.file.buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    
    // Informações da imagem processada
    const metadata = await sharp(optimizedImageBuffer).metadata();
    
    // Gerar nome de arquivo aleatório com extensão .webp
    const filename = generateRandomFilename('webp');
    
    // Upload para o storage (R2 ou Supabase)
    const uploadResult = await uploadToStorage({
      buffer: optimizedImageBuffer,
      originalname: filename,
      mimetype: 'image/webp'
    });
    
    if (!uploadResult.success) {
      throw new Error('Falha ao fazer upload da imagem: ' + uploadResult.error);
    }
    
    // Calcular aspect ratio
    const aspectRatio = metadata.width && metadata.height 
      ? `${metadata.width}:${metadata.height}` 
      : null;
    
    // Inserir grupo na base de dados
    const groupInsertQuery = `
      INSERT INTO "artGroups" (
        "title", 
        "categoryId", 
        "designerId", 
        "isPremium", 
        "isVisible", 
        "status", 
        "downloadCount", 
        "viewCount", 
        "likeCount", 
        "createdAt", 
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, true, 'active', 0, 0, 0, NOW(), NOW()
      )
      RETURNING id
    `;
    
    const groupResult = await db.execute(sql.raw(groupInsertQuery, [
      title,
      categoryId,
      req.user.id, // designerId
      isPremium === 'true'
    ]));
    
    const groupId = groupResult.rows[0].id;
    
    // Inserir variação primária
    const variationInsertQuery = `
      INSERT INTO "artVariations" (
        "groupId",
        "formatId",
        "fileTypeId",
        "imageUrl",
        "editUrl",
        "width",
        "height",
        "aspectRatio",
        "isPrimary",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW()
      )
      RETURNING id
    `;
    
    await db.execute(sql.raw(variationInsertQuery, [
      groupId,
      formatId,
      fileTypeId,
      uploadResult.imageUrl,
      editUrl || null,
      metadata.width || null,
      metadata.height || null,
      aspectRatio,
    ]));
    
    // Incrementar contadores do designer
    await db.execute(sql.raw(`
      INSERT INTO "designerStats" ("designerId", "artCount", "downloadCount", "viewCount", "followersCount", "createdAt", "updatedAt")
      VALUES (${req.user.id}, 1, 0, 0, 0, NOW(), NOW())
      ON CONFLICT ("designerId") 
      DO UPDATE SET 
        "artCount" = "designerStats"."artCount" + 1,
        "updatedAt" = NOW()
    `));
    
    res.status(201).json({ 
      id: groupId,
      message: 'Grupo de arte criado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao criar grupo de arte:', error);
    res.status(500).json({ message: 'Erro ao criar grupo de arte: ' + error.message });
  }
});

// Adicionar uma variação a um grupo existente
router.post('/:id/variations', isAuthenticated, canCreateArt, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { formatId, fileTypeId, editUrl, isPrimary } = req.body;
    
    // Validar campos obrigatórios
    if (!formatId || !fileTypeId || !req.file) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' });
    }
    
    // Verificar se o grupo existe e se o usuário tem permissão
    const groupQuery = `
      SELECT * FROM "artGroups" WHERE id = ${id}
    `;
    
    const groupResult = await db.execute(sql.raw(groupQuery));
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    const group = groupResult.rows[0];
    
    // Verificar permissão (apenas admin ou o próprio designer)
    const isAdmin = req.user.role === 'admin' || req.user.role === 'designer_adm';
    const isOwner = req.user.id === group.designerId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para adicionar variações a este grupo' });
    }
    
    // Processar imagem
    const optimizedImageBuffer = await sharp(req.file.buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    
    // Informações da imagem processada
    const metadata = await sharp(optimizedImageBuffer).metadata();
    
    // Gerar nome de arquivo aleatório com extensão .webp
    const filename = generateRandomFilename('webp');
    
    // Upload para o storage (R2 ou Supabase)
    const uploadResult = await uploadToStorage({
      buffer: optimizedImageBuffer,
      originalname: filename,
      mimetype: 'image/webp'
    });
    
    if (!uploadResult.success) {
      throw new Error('Falha ao fazer upload da imagem: ' + uploadResult.error);
    }
    
    // Calcular aspect ratio
    const aspectRatio = metadata.width && metadata.height 
      ? `${metadata.width}:${metadata.height}` 
      : null;
    
    // Se esta for a variação primária, atualizar outras variações para não-primárias
    if (isPrimary === 'true') {
      await db.execute(sql.raw(`
        UPDATE "artVariations" 
        SET "isPrimary" = false 
        WHERE "groupId" = ${id}
      `));
    }
    
    // Inserir variação
    const variationInsertQuery = `
      INSERT INTO "artVariations" (
        "groupId",
        "formatId",
        "fileTypeId",
        "imageUrl",
        "editUrl",
        "width",
        "height",
        "aspectRatio",
        "isPrimary",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      )
      RETURNING id
    `;
    
    const variationResult = await db.execute(sql.raw(variationInsertQuery, [
      id,
      formatId,
      fileTypeId,
      uploadResult.imageUrl,
      editUrl || null,
      metadata.width || null,
      metadata.height || null,
      aspectRatio,
      isPrimary === 'true'
    ]));
    
    // Atualizar data de modificação do grupo
    await db.execute(sql.raw(`
      UPDATE "artGroups" 
      SET "updatedAt" = NOW() 
      WHERE id = ${id}
    `));
    
    res.status(201).json({ 
      id: variationResult.rows[0].id,
      message: 'Variação adicionada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao adicionar variação:', error);
    res.status(500).json({ message: 'Erro ao adicionar variação: ' + error.message });
  }
});

// Atualizar um grupo de arte
router.patch('/:id', isAuthenticated, canCreateArt, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, categoryId, isPremium, isVisible } = req.body;
    
    // Verificar se o grupo existe e se o usuário tem permissão
    const groupQuery = `
      SELECT * FROM "artGroups" WHERE id = ${id}
    `;
    
    const groupResult = await db.execute(sql.raw(groupQuery));
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    const group = groupResult.rows[0];
    
    // Verificar permissão (apenas admin ou o próprio designer)
    const isAdmin = req.user.role === 'admin' || req.user.role === 'designer_adm';
    const isOwner = req.user.id === group.designerId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para editar este grupo' });
    }
    
    // Construir query de atualização
    const updateFields = [];
    const params = [];
    let paramIndex = 1;
    
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
      params.push(isPremium);
    }
    
    // Apenas admin pode alterar visibilidade
    if (isVisible !== undefined && isAdmin) {
      updateFields.push(`"isVisible" = $${paramIndex++}`);
      params.push(isVisible);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }
    
    // Adicionar sempre o timestamp de atualização
    updateFields.push(`"updatedAt" = NOW()`);
    
    // Executar a atualização
    const updateQuery = `
      UPDATE "artGroups" 
      SET ${updateFields.join(', ')} 
      WHERE id = ${id}
      RETURNING *
    `;
    
    const updateResult = await db.execute(sql.raw(updateQuery, params));
    
    res.json({ 
      ...updateResult.rows[0],
      message: 'Grupo de arte atualizado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao atualizar grupo de arte:', error);
    res.status(500).json({ message: 'Erro ao atualizar grupo de arte: ' + error.message });
  }
});

// Atualizar uma variação
router.patch('/:groupId/variations/:variationId', isAuthenticated, canCreateArt, async (req, res) => {
  try {
    const { groupId, variationId } = req.params;
    const { editUrl, isPrimary } = req.body;
    
    // Verificar se o grupo e a variação existem
    const checkQuery = `
      SELECT ag.*, av.id as "variationId"
      FROM "artGroups" ag
      JOIN "artVariations" av ON av."groupId" = ag.id
      WHERE ag.id = ${groupId} AND av.id = ${variationId}
    `;
    
    const checkResult = await db.execute(sql.raw(checkQuery));
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Grupo ou variação não encontrados' });
    }
    
    const group = checkResult.rows[0];
    
    // Verificar permissão (apenas admin ou o próprio designer)
    const isAdmin = req.user.role === 'admin' || req.user.role === 'designer_adm';
    const isOwner = req.user.id === group.designerId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para editar esta variação' });
    }
    
    // Construir query de atualização
    const updateFields = [];
    const params = [];
    let paramIndex = 1;
    
    if (editUrl !== undefined) {
      updateFields.push(`"editUrl" = $${paramIndex++}`);
      params.push(editUrl);
    }
    
    // Se esta for a variação primária, atualizar outras variações para não-primárias
    if (isPrimary === true) {
      await db.execute(sql.raw(`
        UPDATE "artVariations" 
        SET "isPrimary" = false 
        WHERE "groupId" = ${groupId}
      `));
      
      updateFields.push(`"isPrimary" = true`);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }
    
    // Adicionar sempre o timestamp de atualização
    updateFields.push(`"updatedAt" = NOW()`);
    
    // Executar a atualização
    const updateQuery = `
      UPDATE "artVariations" 
      SET ${updateFields.join(', ')} 
      WHERE id = ${variationId}
      RETURNING *
    `;
    
    const updateResult = await db.execute(sql.raw(updateQuery, params));
    
    // Atualizar data de modificação do grupo
    await db.execute(sql.raw(`
      UPDATE "artGroups" 
      SET "updatedAt" = NOW() 
      WHERE id = ${groupId}
    `));
    
    res.json({ 
      ...updateResult.rows[0],
      message: 'Variação atualizada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao atualizar variação:', error);
    res.status(500).json({ message: 'Erro ao atualizar variação: ' + error.message });
  }
});

// Excluir um grupo de arte
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o grupo existe
    const groupQuery = `
      SELECT * FROM "artGroups" WHERE id = ${id}
    `;
    
    const groupResult = await db.execute(sql.raw(groupQuery));
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Grupo de arte não encontrado' });
    }
    
    // Obter IDs das variações para decremento de contador
    const variationsQuery = `
      SELECT * FROM "artVariations" WHERE "groupId" = ${id}
    `;
    
    const variationsResult = await db.execute(sql.raw(variationsQuery));
    const group = groupResult.rows[0];
    
    // Excluir variações
    await db.execute(sql.raw(`
      DELETE FROM "artVariations" WHERE "groupId" = ${id}
    `));
    
    // Excluir grupo
    await db.execute(sql.raw(`
      DELETE FROM "artGroups" WHERE id = ${id}
    `));
    
    // Atualizar contador de artes do designer
    await db.execute(sql.raw(`
      UPDATE "designerStats"
      SET "artCount" = GREATEST("artCount" - 1, 0),
          "updatedAt" = NOW()
      WHERE "designerId" = ${group.designerId}
    `));
    
    res.json({ message: 'Grupo de arte excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir grupo de arte:', error);
    res.status(500).json({ message: 'Erro ao excluir grupo de arte: ' + error.message });
  }
});

// Excluir uma variação
router.delete('/:groupId/variations/:variationId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { groupId, variationId } = req.params;
    
    // Verificar se o grupo e a variação existem
    const checkQuery = `
      SELECT ag.*, av.id as "variationId", av."isPrimary"
      FROM "artGroups" ag
      JOIN "artVariations" av ON av."groupId" = ag.id
      WHERE ag.id = ${groupId} AND av.id = ${variationId}
    `;
    
    const checkResult = await db.execute(sql.raw(checkQuery));
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Grupo ou variação não encontrados' });
    }
    
    const variation = checkResult.rows[0];
    
    // Verificar quantas variações existem no grupo
    const countQuery = `
      SELECT COUNT(*) as count FROM "artVariations" WHERE "groupId" = ${groupId}
    `;
    
    const countResult = await db.execute(sql.raw(countQuery));
    const variationCount = parseInt(countResult.rows[0].count);
    
    // Não permitir excluir a última variação
    if (variationCount <= 1) {
      return res.status(400).json({ 
        message: 'Não é possível excluir a última variação. Para remover completamente, exclua o grupo de arte inteiro.' 
      });
    }
    
    // Se a variação for primária, definir outra como primária
    if (variation.isPrimary) {
      // Encontrar outra variação para tornar primária
      const otherVariationQuery = `
        SELECT id FROM "artVariations" 
        WHERE "groupId" = ${groupId} AND id != ${variationId}
        LIMIT 1
      `;
      
      const otherVariationResult = await db.execute(sql.raw(otherVariationQuery));
      
      if (otherVariationResult.rows.length > 0) {
        const newPrimaryId = otherVariationResult.rows[0].id;
        
        await db.execute(sql.raw(`
          UPDATE "artVariations" 
          SET "isPrimary" = true, "updatedAt" = NOW()
          WHERE id = ${newPrimaryId}
        `));
      }
    }
    
    // Excluir a variação
    await db.execute(sql.raw(`
      DELETE FROM "artVariations" WHERE id = ${variationId}
    `));
    
    // Atualizar data de modificação do grupo
    await db.execute(sql.raw(`
      UPDATE "artGroups" 
      SET "updatedAt" = NOW() 
      WHERE id = ${groupId}
    `));
    
    res.json({ message: 'Variação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir variação:', error);
    res.status(500).json({ message: 'Erro ao excluir variação: ' + error.message });
  }
});

export default router;