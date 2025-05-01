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
    
    // Upload para o serviço de armazenamento central (tenta Supabase, R2 e local)
    console.log("Iniciando upload usando serviço de armazenamento central...");
    const uploadResult = await uploadToStorage({
      buffer: optimizedImageBuffer,
      originalname: filename,
      mimetype: 'image/webp'
    });
    
    if (!uploadResult.success) {
      throw new Error('Falha ao fazer upload da imagem: ' + uploadResult.error);
    }
    
    console.log(`Upload concluído com sucesso via ${uploadResult.storageType}. URL: ${uploadResult.imageUrl}`);
    
    // Calcular aspect ratio
    const aspectRatio = metadata.width && metadata.height 
      ? `${metadata.width}:${metadata.height}` 
      : null;
    
    // Inserir grupo na base de dados
    // Em vez de usar parâmetros com $1, $2, etc. vamos inserir diretamente os valores na query
    // já que estamos usando sql.raw
    const isPremiumValue = isPremium === 'true' ? 'true' : 'false';
    const designerId = req.user.id;
    
    const groupInsertQuery = `
      INSERT INTO "artGroups" (
        "title", 
        "categoryid", 
        "designerid", 
        "ispremium", 
        "isvisible", 
        "status", 
        "downloadcount", 
        "viewcount", 
        "likecount", 
        "createdat", 
        "updatedat"
      )
      VALUES (
        '${title.replace(/'/g, "''")}', 
        ${categoryId}, 
        ${designerId}, 
        ${isPremiumValue}, 
        true, 
        'active', 
        0, 
        0, 
        0, 
        NOW(), 
        NOW()
      )
      RETURNING id
    `;
    
    const groupResult = await db.execute(sql.raw(groupInsertQuery));
    
    const groupId = groupResult.rows[0].id;
    
    // Inserir variação primária com valores diretamente na string SQL
    // Escapar a URL da imagem e do editor para evitar problemas com aspas
    const imageUrlEscaped = uploadResult.imageUrl.replace(/'/g, "''");
    const editUrlEscaped = editUrl ? editUrl.replace(/'/g, "''") : 'NULL';
    const widthValue = metadata.width ? metadata.width : 'NULL';
    const heightValue = metadata.height ? metadata.height : 'NULL';
    const aspectRatioValue = aspectRatio ? `'${aspectRatio}'` : 'NULL';
    
    const variationInsertQuery = `
      INSERT INTO "artVariations" (
        "groupid",
        "formatid",
        "filetypeid",
        "imageurl",
        "editurl",
        "width",
        "height",
        "aspectratio",
        "isprimary",
        "createdat",
        "updatedat"
      )
      VALUES (
        ${groupId}, 
        ${formatId}, 
        ${fileTypeId}, 
        '${imageUrlEscaped}', 
        ${editUrlEscaped === 'NULL' ? 'NULL' : `'${editUrlEscaped}'`}, 
        ${widthValue}, 
        ${heightValue}, 
        ${aspectRatioValue}, 
        true, 
        NOW(), 
        NOW()
      )
      RETURNING id
    `;
    
    await db.execute(sql.raw(variationInsertQuery));
    
    // Incrementar contadores do designer
    try {
      await db.execute(sql.raw(`
        UPDATE "designerStats" 
        SET "viewCount" = "viewCount" + 1,
            "updatedAt" = NOW()
        WHERE "userId" = ${req.user.id}
      `));
    } catch (statsError) {
      console.log("Aviso: Não foi possível atualizar estatísticas de designer:", statsError.message);
    }
    
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
    const { formatId, fileTypeId, editUrl, isPrimary, categoryId } = req.body;
    
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
    const isOwner = req.user.id === group.designerid;
    
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
    
    // Upload para o serviço de armazenamento central (tenta Supabase, R2 e local)
    console.log("Iniciando upload usando serviço de armazenamento central...");
    const uploadResult = await uploadToStorage({
      buffer: optimizedImageBuffer,
      originalname: filename,
      mimetype: 'image/webp'
    });
    
    if (!uploadResult.success) {
      throw new Error('Falha ao fazer upload da imagem: ' + uploadResult.error);
    }
    
    console.log(`Upload concluído com sucesso via ${uploadResult.storageType}. URL: ${uploadResult.imageUrl}`);
    
    // Calcular aspect ratio
    const aspectRatio = metadata.width && metadata.height 
      ? `${metadata.width}:${metadata.height}` 
      : null;
    
    // Se esta for a variação primária, atualizar outras variações para não-primárias
    if (isPrimary === 'true') {
      await db.execute(sql.raw(`
        UPDATE "artVariations" 
        SET "isprimary" = false 
        WHERE "groupid" = ${id}
      `));
    }
    
    // Inserir variação com valores diretamente na string SQL
    // Escapar a URL da imagem e do editor para evitar problemas com aspas
    const imageUrlEscaped = uploadResult.imageUrl.replace(/'/g, "''");
    const editUrlEscaped = editUrl ? editUrl.replace(/'/g, "''") : 'NULL';
    const widthValue = metadata.width ? metadata.width : 'NULL';
    const heightValue = metadata.height ? metadata.height : 'NULL';
    const aspectRatioValue = aspectRatio ? `'${aspectRatio}'` : 'NULL';
    const isPrimaryValue = isPrimary === 'true' ? 'true' : 'false';
    
    // Obter a categoria do grupo para usar na variação, se não estiver explicitamente definida
    const effectiveCategoryId = categoryId || group.categoryid;
    
    console.log(`Usando categoria ${effectiveCategoryId} para a variação`);
    
    const variationInsertQuery = `
      INSERT INTO "artVariations" (
        "groupid",
        "formatid",
        "filetypeid",
        "imageurl",
        "editurl",
        "width",
        "height",
        "aspectratio",
        "isprimary",
        "createdat",
        "updatedat"
      )
      VALUES (
        ${id},
        ${formatId}, 
        ${fileTypeId}, 
        '${imageUrlEscaped}', 
        ${editUrlEscaped === 'NULL' ? 'NULL' : `'${editUrlEscaped}'`}, 
        ${widthValue}, 
        ${heightValue}, 
        ${aspectRatioValue}, 
        ${isPrimaryValue}, 
        NOW(), 
        NOW()
      )
      RETURNING id
    `;
    
    const variationResult = await db.execute(sql.raw(variationInsertQuery));
    
    // Atualizar data de modificação do grupo
    await db.execute(sql.raw(`
      UPDATE "artGroups" 
      SET "updatedat" = NOW() 
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

export default router;