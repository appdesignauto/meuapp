import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { ArtGroupSchema } from '@shared/interfaces/art-groups';
import { db } from '../db';
import { arts } from '@shared/schema';
// Importar middleware de autenticação do arquivo principal
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  next();
};
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

    // Validar os dados recebidos - aceitar tanto formato de criação quanto edição
    console.log('Dados recebidos para validação:', JSON.stringify(req.body, null, 2));
    
    // Verificar se o campo formats existe e é válido
    if (!req.body.formats || !Array.isArray(req.body.formats) || req.body.formats.length === 0) {
      return res.status(400).json({
        message: 'Dados inválidos: o campo "formats" é obrigatório e deve ser um array não vazio'
      });
    }
    
    // Validar cada formato individualmente
    for (const format of req.body.formats) {
      if (!format.format || !format.title || !format.imageUrl || !format.editUrl || !format.fileType) {
        return res.status(400).json({
          message: 'Dados inválidos: cada formato deve ter os campos obrigatórios (format, title, imageUrl, editUrl, fileType)'
        });
      }
    }
    
    // Validar categoryId
    if (!req.body.categoryId || isNaN(parseInt(req.body.categoryId))) {
      return res.status(400).json({
        message: 'Dados inválidos: categoryId é obrigatório e deve ser um número válido'
      });
    }
    
    // Criar objeto com dados validados
    const artGroupData = {
      categoryId: parseInt(req.body.categoryId),
      isPremium: req.body.isPremium || false,
      formats: req.body.formats
    };
    
    // Gerar um ID de grupo único para vincular as artes
    const artGroupId = uuidv4();
    
    // Verificar se estamos editando uma arte existente
    // Adicionar log detalhado para debug
    console.log('Body completo recebido:', JSON.stringify(req.body, null, 2));
    console.log('artId na requisição:', req.body.artId);
    const existingArtId = req.body.artId ? parseInt(req.body.artId) : null;
    console.log('existingArtId convertido:', existingArtId);
    
    if (existingArtId) {
      console.log(`Atualizando arte existente ID: ${existingArtId} e convertendo para grupo ${artGroupId}`);
      
      // Verificar se a arte existe (usando getArtById que é a função existente)
      const existingArt = await storage.getArtById(existingArtId);
      if (!existingArt) {
        return res.status(404).json({
          message: `Arte com ID ${existingArtId} não encontrada`
        });
      }
      
      console.log(`Arte existente encontrada: ${existingArt.id}, título: ${existingArt.title}, formato: ${existingArt.format}`);
      
      
      // Pegar o formato da arte atual para atualização
      const existingFormat = existingArt.format;
      
      // Atualizar apenas a arte existente
      // Encontrar o formato correspondente nos dados enviados
      console.log(`Formatos disponíveis:`, JSON.stringify(artGroupData.formats.map((f: any) => f.format)));
      console.log(`Procurando formato: ${existingFormat}`);
      
      // Se não encontrar o formato específico, usar o primeiro formato disponível
      const formatToUpdate = artGroupData.formats.find((f: any) => f.format === existingFormat) || artGroupData.formats[0];
      
      if (formatToUpdate) {
        console.log(`Formato selecionado para atualização: ${formatToUpdate.format}`);
        console.log(`Detalhes do formato:`, JSON.stringify(formatToUpdate, null, 2));
        
        // Preparar dados para atualização com verificações de segurança
        const updateData = {
          title: formatToUpdate.title || artGroupData.formats[0].title,
          description: formatToUpdate.description || '',
          imageUrl: formatToUpdate.imageUrl,
          editUrl: formatToUpdate.editUrl || '',
          categoryId: artGroupData.categoryId,
          isPremium: artGroupData.isPremium,
          fileType: formatToUpdate.fileType || artGroupData.formats[0].fileType,
          groupId: artGroupId,
          updatedAt: new Date().toISOString()
        };
        
        // Atualizar a arte no banco
        await db.update(arts)
          .set(updateData)
          .where(eq(arts.id, existingArtId));
        
        console.log(`Arte ID ${existingArtId} atualizada com sucesso.`);
        
        // Criar outros formatos como novas artes se houver mais de um formato
        const otherFormats = artGroupData.formats.filter(f => f.format !== existingFormat);
        const createdArts = [{
          id: existingArtId,
          format: existingFormat,
          title: formatToUpdate.title,
          groupId: artGroupId,
          action: 'updated'
        }];
        
        // ID da coleção padrão
        const defaultCollectionId = 1;
        
        // Criar os outros formatos
        for (const format of otherFormats) {
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
            isVisible: true,
            designerid: req.user?.id || 1,
            collectionId: defaultCollectionId,
            groupId: artGroupId
          };
          
          console.log(`Criando arte adicional formato: ${format.format}, groupId: ${artGroupId}`);
          
          // Criar nova arte
          const newArt = await storage.createArt(artData);
          
          // Adicionar ao array
          createdArts.push({
            id: newArt.id,
            format: format.format,
            title: format.title,
            groupId: newArt.groupId || artGroupId,
            action: 'created'
          });
        }
        
        // Retornar sucesso
        return res.status(200).json({
          message: `Arte ${existingArtId} convertida para grupo com sucesso`,
          groupId: artGroupId,
          totalArts: createdArts.length,
          arts: createdArts
        });
      } else {
        return res.status(400).json({
          message: `Formato da arte existente não encontrado nos dados enviados`
        });
      }
    }
    
    // Se não for edição de arte existente, continuar com criação normal
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
        isVisible: format.fileType === 'imagens-png' ? false : true,
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

// Rota para editar uma arte individual (conversão para grupo)
router.put('/api/admin/arts/multi/:artId', async (req: Request, res: Response) => {
  try {
    console.log(`Tentativa de edição - Arte ID: ${req.params.artId}`);
    console.log('Dados recebidos:', JSON.stringify(req.body, null, 2));
    console.log('Sessão:', req.session);
    console.log('IsAuthenticated:', req.isAuthenticated?.());
    console.log('Passport user:', req.user);
    
    // Verificação de autenticação mais robusta
    if (!req.isAuthenticated?.() || !req.user) {
      console.log('Falha na autenticação - usuário não logado');
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }

    const userRole = (req.user as any)?.nivelacesso;
    console.log('Nível de acesso do usuário:', userRole);
    
    if (userRole !== 'admin' && userRole !== 'designer_adm') {
      return res.status(403).json({
        message: 'Erro na criação',
        description: 'Acesso negado. Você não tem permissão para editar artes.'
      });
    }

    const artId = parseInt(req.params.artId);
    console.log(`Processando edição da arte ID: ${artId}`);

    // Validação básica dos dados
    if (!req.body.formats || !Array.isArray(req.body.formats) || req.body.formats.length === 0) {
      return res.status(400).json({
        message: 'Erro na criação',
        description: 'Dados inválidos: formatos são obrigatórios'
      });
    }

    // Buscar a arte existente
    const existingArt = await storage.getArtById(artId);
    if (!existingArt) {
      return res.status(404).json({
        message: 'Erro na criação',
        description: 'Arte não encontrada'
      });
    }

    console.log(`Arte encontrada: ${existingArt.title}, formato: ${existingArt.format}`);

    // Gerar um novo groupId se a arte não tiver um
    const groupId = existingArt.groupId || uuidv4();
    
    // Encontrar o formato que corresponde à arte existente
    const currentFormat = req.body.formats.find((f: any) => f.format === existingArt.format) || req.body.formats[0];
    
    // Atualizar a arte existente
    const updateData = {
      title: currentFormat.title,
      description: currentFormat.description || '',
      imageUrl: currentFormat.imageUrl,
      editUrl: currentFormat.editUrl || '',
      categoryId: parseInt(req.body.categoryId),
      isPremium: req.body.isPremium || false,
      fileType: currentFormat.fileType,
      groupId: groupId
    };

    await db.update(arts)
      .set(updateData)
      .where(eq(arts.id, artId));

    console.log(`Arte ${artId} atualizada com sucesso`);

    // Criar novas artes para outros formatos (se houver)
    const newArts = [];
    for (const format of req.body.formats) {
      if (format.format !== existingArt.format) {
        const artData = {
          title: format.title,
          description: format.description || '',
          imageUrl: format.imageUrl,
          previewUrl: format.previewUrl || null,
          editUrl: format.editUrl || '',
          categoryId: parseInt(req.body.categoryId),
          isPremium: req.body.isPremium || false,
          format: format.format,
          fileType: format.fileType,
          isVisible: format.fileType === 'imagens-png' ? false : true,
          designerid: (req.user as any)?.id || 1,
          collectionId: 1,
          groupId: groupId
        };

        const newArt = await storage.createArt(artData);
        newArts.push(newArt);
        console.log(`Nova arte criada: ${newArt.id} formato: ${format.format}`);
      }
    }

    return res.status(200).json({
      message: 'Arte atualizada com sucesso',
      groupId: groupId,
      updatedArt: artId,
      newArts: newArts.map(art => ({ id: art.id, format: art.format }))
    });

  } catch (error) {
    console.error('Erro ao editar arte:', error);
    return res.status(500).json({
      message: 'Erro na criação',
      description: 'Falha ao processar a edição da arte'
    });
  }
});

// Rota para editar/atualizar um grupo de artes existente
router.put('/api/admin/arts/group/:groupId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é admin ou designer_adm
    const userRole = req.user?.nivelacesso;
    if (userRole !== 'admin' && userRole !== 'designer_adm') {
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para editar artes.'
      });
    }

    const { groupId } = req.params;
    
    // Validar os dados recebidos usando a mesma validação da criação
    console.log('Dados recebidos para atualização:', JSON.stringify(req.body, null, 2));
    
    // Verificar se o campo formats existe e é válido
    if (!req.body.formats || !Array.isArray(req.body.formats) || req.body.formats.length === 0) {
      return res.status(400).json({
        message: 'Dados inválidos: o campo "formats" é obrigatório e deve ser um array não vazio'
      });
    }
    
    // Validar cada formato individualmente
    for (const format of req.body.formats) {
      if (!format.format || !format.title || !format.imageUrl || !format.editUrl || !format.fileType) {
        return res.status(400).json({
          message: 'Dados inválidos: cada formato deve ter os campos obrigatórios (format, title, imageUrl, editUrl, fileType)'
        });
      }
    }
    
    // Validar categoryId
    if (!req.body.categoryId || isNaN(parseInt(req.body.categoryId))) {
      return res.status(400).json({
        message: 'Dados inválidos: categoryId é obrigatório e deve ser um número válido'
      });
    }
    
    // Criar objeto com dados validados
    const artGroupData = {
      categoryId: parseInt(req.body.categoryId),
      isPremium: req.body.isPremium || false,
      formats: req.body.formats
    };

    console.log(`Atualizando grupo de artes: ${groupId}`);

    // Buscar artes existentes do grupo
    const existingArtsResult = await db.execute(sql`
      SELECT * FROM arts WHERE "groupId" = ${groupId}
    `);
    
    const existingArts = existingArtsResult.rows || [];
    
    if (existingArts.length === 0) {
      return res.status(404).json({
        message: 'Grupo de artes não encontrado'
      });
    }

    // Criar mapa dos formatos existentes para facilitar a atualização
    const existingFormats = new Map();
    existingArts.forEach((art: any) => {
      existingFormats.set(art.format, art);
    });

    // Arrays para controle das operações
    const updatedArts = [];
    const newArts = [];
    
    // ID da coleção padrão (se necessário)
    const defaultCollectionId = 1;
    
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
          isVisible: format.fileType === 'imagens-png' ? false : true,
          designerid: req.user?.id || 1,
          collectionId: defaultCollectionId,
          groupId: groupId
        };

        console.log(`Criando nova arte formato: ${format.format} para grupo ${groupId}`);

        // Criar a arte no banco de dados
        const newArt = await storage.createArt(artData);
        
        newArts.push({
          id: newArt.id,
          format: format.format,
          title: format.title,
          action: 'created'
        });
      }
    }

    // Remover artes que não estão mais no grupo (formatos removidos)
    const removedArts = [];
    for (const [format, art] of existingFormats) {
      await db.delete(arts).where(eq(arts.id, art.id));
      removedArts.push({
        id: art.id,
        format: format,
        title: art.title,
        action: 'removed'
      });
    }

    // Retornar sucesso com informações das operações realizadas
    return res.status(200).json({
      message: 'Grupo de artes atualizado com sucesso',
      groupId: groupId,
      operations: {
        updated: updatedArts,
        created: newArts,
        removed: removedArts
      },
      totalArts: updatedArts.length + newArts.length
    });

  } catch (error) {
    console.error('Erro ao atualizar grupo de artes:', error);
    
    return res.status(500).json({
      message: 'Erro ao processar a atualização do grupo de artes'
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
    
    // Buscar todas as artes do grupo usando SQL direto para evitar problemas com o nome da coluna
    let querySQL;
    
    if (isUserAdmin) {
      querySQL = sql`
        SELECT * FROM arts 
        WHERE "groupId" = ${groupId}
      `;
    } else {
      querySQL = sql`
        SELECT * FROM arts 
        WHERE "groupId" = ${groupId} AND "isVisible" = true
      `;
    }
    
    const result = await db.execute(querySQL);
    
    const groupArts = result.rows || [];
    
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
    
    // Buscar todas as artes do grupo usando SQL direto para evitar problemas
    const result = await db.execute(sql`
      SELECT * FROM arts 
      WHERE "groupId" = ${groupId}
    `);
    
    // Converter resultados para o formato esperado
    const groupArts = result.rows || [];
    
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
    
    // Buscar todas as artes existentes do grupo usando SQL direto para evitar problemas com o nome da coluna
    const result = await db.execute(sql`
      SELECT * FROM arts 
      WHERE "groupId" = ${groupId}
    `);
    
    const existingArts = result.rows || [];
    
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
          isVisible: format.fileType === 'imagens-png' ? false : true,
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