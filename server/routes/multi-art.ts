import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { ArtGroupSchema } from '@shared/interfaces/art-groups';
import { db } from '../db';
import { arts } from '@shared/schema';
import { isAdmin, isAuthenticated } from '../middlewares/auth';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

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

// Rota para buscar artes por ID de grupo (para todos os usuários)
router.get('/api/arts/group/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    
    // Verificar se o usuário é admin para determinar o filtro de visibilidade
    const isUserAdmin = req.user?.nivelacesso === 'admin' || 
                        req.user?.nivelacesso === 'designer_adm' || 
                        req.user?.nivelacesso === 'designer';
    
    // Buscar todas as artes do grupo
    let query = db.select().from(arts);
    
    if (isUserAdmin) {
      query = query.where(eq(arts.groupId, groupId));
    } else {
      query = query.where(
        and(
          eq(arts.groupId, groupId),
          eq(arts.isVisible, true)
        )
      );
    }
    
    const groupArts = await query;
    
    if (!groupArts || groupArts.length === 0) {
      return res.status(404).json({
        message: 'Grupo de artes não encontrado'
      });
    }
    
    return res.json({
      groupId,
      totalArts: groupArts.length,
      arts: groupArts
    });
  } catch (error) {
    console.error('Erro ao buscar grupo de artes:', error);
    return res.status(500).json({
      message: 'Erro ao buscar grupo de artes'
    });
  }
});

// Rota administrativa para buscar artes por ID de grupo (somente admin)
router.get('/api/admin/arts/group/:groupId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é admin ou designer autorizado
    const userRole = req.user?.nivelacesso;
    if (userRole !== 'admin' && userRole !== 'designer_adm' && userRole !== 'designer') {
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
      });
    }
    
    const { groupId } = req.params;
    
    // Buscar todas as artes do grupo (sem filtro de visibilidade para admin)
    const groupArts = await db.select()
      .from(arts)
      .where(eq(arts.groupId, groupId));
    
    if (!groupArts || groupArts.length === 0) {
      return res.status(404).json({
        message: 'Grupo de artes não encontrado'
      });
    }
    
    console.log(`Buscando grupo ${groupId} para edição (${groupArts.length} artes encontradas)`);
    
    return res.json({
      groupId,
      totalArts: groupArts.length,
      arts: groupArts
    });
  } catch (error) {
    console.error('Erro ao buscar grupo de artes para edição:', error);
    return res.status(500).json({
      message: 'Erro ao buscar grupo de artes para edição'
    });
  }
});

// Nova rota para atualizar um grupo de artes (PUT)
router.put('/api/admin/arts/group/:groupId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é admin ou designer autorizado
    const userRole = req.user?.nivelacesso;
    if (userRole !== 'admin' && userRole !== 'designer_adm') {
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para atualizar artes.'
      });
    }
    
    const { groupId } = req.params;
    
    // Validar os dados recebidos
    const artGroupData = ArtGroupSchema.parse(req.body);
    
    // Buscar todas as artes existentes do grupo
    const existingArts = await db.select()
      .from(arts)
      .where(eq(arts.groupId, groupId));
    
    if (!existingArts || existingArts.length === 0) {
      return res.status(404).json({
        message: 'Grupo de artes não encontrado'
      });
    }
    
    console.log(`Atualizando grupo ${groupId}. Artes existentes: ${existingArts.length}, Formatos novos: ${artGroupData.formats.length}`);
    
    // Criar um mapa de formatos existentes para facilitar atualizações
    const existingFormats = new Map();
    existingArts.forEach(art => {
      existingFormats.set(art.format, art);
    });
    
    // Arrays para rastrear mudanças
    const updatedArts = [];
    const newArts = [];
    
    // ID da coleção padrão (se necessário)
    const defaultCollectionId = 1; // Altere conforme necessário
    
    // Atualizar artes existentes e criar novas quando necessário
    for (const format of artGroupData.formats) {
      // Verificar se esse formato já existe no grupo
      const existingArt = existingFormats.get(format.format);
      
      if (existingArt) {
        // Atualizar arte existente
        const updateData = {
          title: format.title,
          description: format.description || '',
          imageUrl: format.imageUrl,
          previewUrl: format.previewUrl || null,
          editUrl: format.editUrl,
          categoryId: artGroupData.categoryId,
          isPremium: artGroupData.isPremium,
          fileType: format.fileType,
          updatedAt: new Date().toISOString()
        };
        
        // Realizar a atualização no banco de dados
        const [updatedArt] = await db
          .update(arts)
          .set(updateData)
          .where(eq(arts.id, existingArt.id))
          .returning();
        
        updatedArts.push({
          id: updatedArt.id,
          format: format.format,
          title: format.title,
          action: 'updated'
        });
        
        // Remover do mapa para rastrear o que foi atualizado
        existingFormats.delete(format.format);
      } else {
        // Criar nova arte para o formato que não existia
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
          isVisible: true,
          designerid: req.user?.id || 1,
          collectionId: defaultCollectionId,
          groupId: groupId
        };
        
        // Criar a arte no banco de dados
        const newArt = await storage.createArt(artData);
        
        // Verificar se o groupId foi salvo corretamente
        if (!newArt.groupId) {
          console.warn(`ALERTA: Nova arte ID ${newArt.id} no grupo ${groupId} foi criada sem groupId. Tentando atualizar...`);
          try {
            // Tentar atualizar o groupId usando SQL direto para evitar problemas com o nome da coluna
            // Importante: no PostgreSQL, a sintaxe correta tem um WHERE separado por espaço
            const result = await db.execute(sql`
              UPDATE arts 
              SET "groupId" = ${groupId}
              WHERE id = ${newArt.id}
            `);
            
            // Log de confirmação
            console.log(`SQL executado para atualizar groupId da nova arte ${newArt.id} no grupo ${groupId}`);
            
            if (result.rowCount > 0) {
              console.log(`Nova arte ID ${newArt.id} atualizada com groupId ${groupId}`);
            } else {
              console.error(`Nenhuma linha atualizada para nova arte ${newArt.id}`);
            }
          } catch (updateError) {
            console.error(`Erro ao atualizar groupId para nova arte ${newArt.id}:`, updateError);
          }
        }
        
        newArts.push({
          id: newArt.id,
          format: format.format,
          title: format.title,
          action: 'created',
          groupId: newArt.groupId || groupId
        });
      }
    }
    
    // Opcional: lidar com formatos que existiam mas não foram atualizados
    // Se desejar remover formatos que não estão mais na lista:
    /*
    for (const [format, art] of existingFormats.entries()) {
      await db.delete(arts).where(eq(arts.id, art.id));
    }
    */
    
    return res.json({
      message: 'Grupo de artes atualizado com sucesso',
      groupId,
      updated: updatedArts,
      created: newArts
    });
  } catch (error) {
    console.error('Erro ao atualizar grupo de artes:', error);
    
    // Tratar erros de validação do Zod
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: fromZodError(error).message
      });
    }
    
    // Erro genérico
    return res.status(500).json({
      message: 'Erro ao atualizar o grupo de artes'
    });
  }
});

export default router;