import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { ArtGroupSchema } from '@shared/interfaces/art-groups';
import { db } from '../db';
import { arts } from '@shared/schema';
import { isAdmin, isAuthenticated } from '../middlewares/auth';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();

// Rota para criação de artes em múltiplos formatos
router.post('/api/admin/arts/multi', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é admin ou designer_adm
    const userRole = req.user?.nivelacesso;
    if (userRole !== 'admin' && userRole !== 'designer_adm') {
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para criar artes.'
      });
    }

    // Validar os dados recebidos usando o esquema ArtGroupSchema
    const artGroupData = ArtGroupSchema.parse(req.body);
    
    // Gerar um ID de grupo único para vincular as artes
    const artGroupId = uuidv4();
    
    // Registrar o início do processo com log detalhado
    console.log(`Criando grupo de arte ${artGroupId} com ${artGroupData.formats.length} formatos`);
    console.log(`Categoria: ${artGroupData.categoryId}, Usuário: ${req.user?.id}`);

    // Array para armazenar os IDs das artes criadas
    const createdArts = [];

    // ID da coleção padrão (se necessário)
    const defaultCollectionId = 1; // Altere conforme necessário

    // Processar cada formato como uma arte individual, mas vinculada ao grupo
    for (const format of artGroupData.formats) {
      // Preparar dados para criação da arte
      const artData = {
        title: format.title,
        description: format.description || '',
        imageUrl: format.imageUrl,
        previewUrl: format.previewUrl || null,
        editUrl: format.editUrl || null,
        categoryId: artGroupData.categoryId,
        isPremium: artGroupData.isPremium,
        format: format.format,
        fileType: format.fileType,
        isVisible: true, // Por padrão, visível
        designerid: req.user?.id || 1, // Usar ID do usuário logado ou padrão
        collectionId: defaultCollectionId,
        groupId: artGroupId // ID do grupo para vincular as artes relacionadas
      };

      console.log(`Criando arte formato: ${format.format}, groupId: ${artGroupId}`);

      // Criar a arte no banco de dados
      const newArt = await storage.createArt(artData);
      
      // Verificar se o groupId foi salvo corretamente
      if (!newArt.groupId) {
        console.warn(`ALERTA: Arte ID ${newArt.id} foi criada sem groupId. Tentando atualizar...`);
        try {
          // Tentar atualizar o groupId usando SQL direto para evitar problemas com o nome da coluna
          // Importante: no PostgreSQL, a sintaxe correta tem um WHERE separado por espaço
          const result = await db.execute(sql`
            UPDATE arts 
            SET "groupId" = ${artGroupId}
            WHERE id = ${newArt.id}
          `);
          
          // Log de confirmação
          console.log(`SQL executado para atualizar groupId da arte ${newArt.id}`);
          
          if (result.rowCount > 0) {
            console.log(`Arte ID ${newArt.id} atualizada com groupId ${artGroupId}`);
          } else {
            console.error(`Nenhuma linha atualizada para arte ${newArt.id}`);
          }
        } catch (updateError) {
          console.error(`Erro ao atualizar groupId para arte ${newArt.id}:`, updateError);
        }
      }
      
      // Adicionar ao array de artes criadas
      createdArts.push({
        id: newArt.id,
        format: format.format,
        title: format.title,
        groupId: newArt.groupId || artGroupId // Garantir que o groupId seja retornado
      });
    }

    // Retornar sucesso com informações das artes criadas
    return res.status(201).json({
      message: 'Grupo de artes criado com sucesso',
      groupId: artGroupId,
      totalArts: createdArts.length,
      arts: createdArts
    });
  } catch (error) {
    console.error('Erro ao criar grupo de artes:', error);
    
    // Tratar erros de validação do Zod
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: fromZodError(error).message
      });
    }
    
    // Erro genérico
    return res.status(500).json({
      message: 'Erro ao processar o grupo de artes'
    });
  }
});

// Rota para verificar o groupId de uma arte específica
router.get('/api/admin/arts/:id/check-group', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`Verificando groupId para arte ${id}`);
    
    // Usar SQL direto para evitar problemas com o método entries()
    const result = await db.execute(sql`
      SELECT "groupId" FROM arts WHERE id = ${id}
    `);
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({
        message: 'Arte não encontrada'
      });
    }
    
    // Extrair o groupId do resultado
    const groupId = result.rows[0]?.groupId;
    
    console.log(`Arte ${id} groupId: ${groupId}`);
    return res.json({ 
      id: id,
      groupId: groupId
    });
  } catch (error) {
    console.error(`Erro ao verificar grupo da arte ${req.params.id}:`, error);
    return res.status(500).json({
      message: 'Erro ao verificar grupo da arte'
    });
  }
});

// Rota para buscar todas as artes de um grupo específico
router.get('/api/admin/arts/group/:groupId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId;
    
    if (!groupId) {
      return res.status(400).json({
        message: 'ID do grupo não fornecido'
      });
    }
    
    console.log(`Buscando artes do grupo ID: ${groupId}`);
    
    // Buscar todas as artes do grupo ordenadas por formato
    const result = await db.execute(sql`
      SELECT id, title, description, format, "imageUrl", "editUrl", "fileType", "categoryId", "isPremium", "isVisible", "previewUrl"
      FROM arts 
      WHERE "groupId" = ${groupId}
      ORDER BY format
    `);
    
    // Se não encontrou nenhuma arte, retornar array vazio
    if (!result.rows || result.rows.length === 0) {
      console.log(`Nenhuma arte encontrada para o grupo ${groupId}`);
      return res.json({ arts: [] });
    }
    
    console.log(`Encontradas ${result.rows.length} artes no grupo ${groupId}`);
    
    // Retornar as artes encontradas
    return res.json({
      groupId: groupId,
      totalArts: result.rows.length,
      arts: result.rows
    });
  } catch (error) {
    console.error(`Erro ao buscar artes do grupo ${req.params.groupId}:`, error);
    return res.status(500).json({
      message: 'Erro ao buscar artes do grupo'
    });
  }
});

// Rota simplificada para editar uma arte multi-formato
router.put('/api/admin/arts/multi/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é admin ou designer autorizado
    const userRole = req.user?.nivelacesso;
    if (userRole !== 'admin' && userRole !== 'designer_adm') {
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para atualizar artes.'
      });
    }
    
    const id = parseInt(req.params.id);
    
    // Debug: Log dos dados recebidos para identificar o problema
    console.log('Dados recebidos para atualização de arte multi-formato:');
    console.log(JSON.stringify(req.body, null, 2));
    
    // Validar os dados recebidos
    const artGroupData = ArtGroupSchema.parse(req.body);
    
    // Buscar a arte existente para verificar se existe
    const art = await storage.getArtById(id);
    
    if (!art) {
      return res.status(404).json({
        message: 'Arte não encontrada'
      });
    }
    
    console.log(`Atualizando arte ID ${id} com formato(s)`);
    
    if (artGroupData.formats.length === 0) {
      return res.status(400).json({
        message: 'Nenhum formato fornecido para atualização'
      });
    }
    
    const primaryFormat = artGroupData.formats[0];
    
    // Atualizar a arte principal diretamente com SQL - incluindo a coluna description
    await db.execute(sql`
      UPDATE arts 
      SET 
        title = ${primaryFormat.title},
        description = ${primaryFormat.description || ''},
        "imageUrl" = ${primaryFormat.imageUrl},
        "editUrl" = ${primaryFormat.editUrl || ''},
        "categoryId" = ${artGroupData.categoryId},
        "isPremium" = ${artGroupData.isPremium},
        "fileType" = ${primaryFormat.fileType}
      WHERE id = ${id}
    `);
    
    // Se for uma edição de grupo existente, buscar o groupId da arte
    const artResult = await db.execute(sql`
      SELECT "groupId" FROM arts WHERE id = ${id}
    `);
    
    const groupId = artResult.rows[0]?.groupId || uuidv4();
    
    // Array para armazenar os IDs das artes atualizadas
    const updatedArts = [{
      id: id,
      format: primaryFormat.format,
      title: primaryFormat.title
    }];
    
    // Processar os formatos adicionais (se houver mais de um)
    if (artGroupData.formats.length > 1) {
      // Aplicar as atualizações para cada formato adicional
      for (let i = 1; i < artGroupData.formats.length; i++) {
        const format = artGroupData.formats[i];
        
        // Verificar se já existe uma arte neste formato para este grupo
        const existingFormatArt = await db.execute(sql`
          SELECT id FROM arts 
          WHERE "groupId" = ${groupId} AND format = ${format.format} AND id != ${id}
        `);
        
        if (existingFormatArt.rows.length > 0) {
          // Se existir, atualizar
          const formatArtId = existingFormatArt.rows[0].id;
          
          await db.execute(sql`
            UPDATE arts 
            SET 
              title = ${format.title},
              description = ${format.description || ''},
              "imageUrl" = ${format.imageUrl},
              "editUrl" = ${format.editUrl || ''},
              "categoryId" = ${artGroupData.categoryId},
              "isPremium" = ${artGroupData.isPremium},
              "fileType" = ${format.fileType}
            WHERE id = ${formatArtId}
          `);
          
          updatedArts.push({
            id: formatArtId,
            format: format.format,
            title: format.title
          });
        } else {
          // Se não existir, criar novo
          const result = await db.execute(sql`
            INSERT INTO arts (
              title, 
              description,
              "imageUrl", 
              format, 
              "fileType", 
              "editUrl", 
              "categoryId",
              "isPremium",
              "isVisible",
              "groupId",
              designerid
            ) 
            VALUES (
              ${format.title},
              ${format.description || ''},
              ${format.imageUrl},
              ${format.format},
              ${format.fileType},
              ${format.editUrl || ''},
              ${artGroupData.categoryId},
              ${artGroupData.isPremium},
              TRUE,
              ${groupId},
              ${art.designerid || 1}
            )
            RETURNING id
          `);
          
          if (result.rows.length > 0) {
            const newArtId = result.rows[0].id;
            updatedArts.push({
              id: newArtId,
              format: format.format,
              title: format.title
            });
          }
        }
      }
    }
    
    // Atualizar o groupId da arte principal, se necessário
    if (!art.groupId) {
      await db.execute(sql`
        UPDATE arts SET "groupId" = ${groupId} WHERE id = ${id}
      `);
    }
    
    // Responder com sucesso
    return res.json({
      message: 'Arte atualizada com sucesso',
      id: id,
      updated: updatedArts
    });
  } catch (error) {
    console.error('Erro ao atualizar arte multi-formato:', error);
    
    // Tratar erros de validação do Zod
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: fromZodError(error).message
      });
    }
    
    // Erro genérico
    return res.status(500).json({
      message: 'Erro ao atualizar arte multi-formato'
    });
  }
});

// Rota para excluir arte
router.delete('/api/admin/arts/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é admin ou designer autorizado
    const userRole = req.user?.nivelacesso;
    if (userRole !== 'admin' && userRole !== 'designer_adm') {
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para excluir artes.'
      });
    }
    
    const artId = parseInt(req.params.id);
    console.log(`[DELETE] Iniciando exclusão da arte ID: ${artId}`);
    
    // Verificar se a arte existe usando SQL direto
    const checkResult = await db.execute(sql`
      SELECT id, "groupId" FROM arts WHERE id = ${artId}
    `);
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      console.log(`[DELETE] Arte ID ${artId} não encontrada no banco de dados`);
      return res.status(404).json({
        message: 'Arte não encontrada'
      });
    }
    
    // Obter o groupId da arte (se existir)
    const groupId = checkResult.rows[0]?.groupId;
    console.log(`[DELETE] Arte ${artId} groupId: ${groupId || 'sem grupo'}`);
    
    // IMPORTANTE: Resolver a restrição de chave estrangeira
    // Primeiro excluir registros de views que referenciam essa arte
    console.log(`[DELETE] Removendo registros de visualizações para a arte ID: ${artId}`);
    await db.execute(sql`
      DELETE FROM views WHERE "artId" = ${artId}
    `);
    
    // Excluir registros de favoritos que referenciam essa arte
    console.log(`[DELETE] Removendo registros de favoritos para a arte ID: ${artId}`);
    await db.execute(sql`
      DELETE FROM favorites WHERE "artId" = ${artId}
    `);
    
    // Excluir registros de downloads que referenciam essa arte
    console.log(`[DELETE] Removendo registros de downloads para a arte ID: ${artId}`);
    await db.execute(sql`
      DELETE FROM downloads WHERE "artId" = ${artId}
    `);
    
    // Excluir registros de designerStats que referenciam essa arte
    console.log(`[DELETE] Removendo registros de estatísticas de designer para a arte ID: ${artId}`);
    await db.execute(sql`
      DELETE FROM "designerStats" WHERE "artId" = ${artId}
    `);
    
    // Excluir registros de shares que referenciam essa arte
    console.log(`[DELETE] Removendo registros de compartilhamentos para a arte ID: ${artId}`);
    await db.execute(sql`
      DELETE FROM shares WHERE "artId" = ${artId}
    `);
    
    // Excluir registros de artVariations que referenciam essa arte
    console.log(`[DELETE] Removendo registros de variações para a arte ID: ${artId}`);
    await db.execute(sql`
      DELETE FROM "artVariations" WHERE artid = ${artId}
    `);
    
    // Excluir registros de reports que referenciam essa arte
    console.log(`[DELETE] Removendo registros de denúncias para a arte ID: ${artId}`);
    await db.execute(sql`
      DELETE FROM reports WHERE "artId" = ${artId}
    `);
    
    // Agora podemos excluir a arte com segurança
    console.log(`[DELETE] Excluindo a arte ID: ${artId}`);
    const deleteResult = await db.execute(sql`
      DELETE FROM arts WHERE id = ${artId} RETURNING id
    `);
    
    // Verificar se a exclusão foi bem-sucedida
    if (!deleteResult.rows || deleteResult.rows.length === 0) {
      console.log(`[DELETE] Falha ao excluir arte ID ${artId}. Nenhuma linha afetada.`);
      return res.status(500).json({
        message: 'Falha ao excluir arte. Operação não afetou nenhuma linha no banco de dados.'
      });
    }
    
    console.log(`[DELETE] Arte ID ${artId} excluída com sucesso. ID retornado: ${deleteResult.rows[0]?.id}`);
    
    // Verificar se há outras artes no mesmo grupo
    if (groupId) {
      const groupArtsResult = await db.execute(sql`
        SELECT id FROM arts WHERE "groupId" = ${groupId}
      `);
      
      const remainingCount = groupArtsResult.rowCount || 0;
      console.log(`[DELETE] Restam ${remainingCount} artes no grupo ${groupId}`);
    }
    
    return res.json({
      success: true,
      message: 'Arte excluída com sucesso',
      id: artId
    });
  } catch (error) {
    console.error(`[DELETE] Erro ao excluir arte ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir arte',
      error: String(error)
    });
  }
});

export default router;