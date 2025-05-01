import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { ArtGroupSchema } from '@shared/interfaces/art-groups';
import { db } from '../db';
import { arts } from '@shared/schema';
import { isAdmin, isAuthenticated } from '../middlewares/auth';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

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
    
    // Registrar o início do processo
    console.log(`Criando grupo de arte ${artGroupId} com ${artGroupData.formats.length} formatos`);

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
        artGroupId // ID do grupo para vincular as artes relacionadas
      };

      // Criar a arte no banco de dados
      const newArt = await storage.createArt(artData);
      
      // Adicionar ao array de artes criadas
      createdArts.push({
        id: newArt.id,
        format: format.format,
        title: format.title
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

// Rota para buscar artes por ID de grupo
router.get('/api/arts/group/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    
    // Verificar se o usuário é admin para determinar o filtro de visibilidade
    const isUserAdmin = req.user?.nivelacesso === 'admin' || 
                        req.user?.nivelacesso === 'designer_adm' || 
                        req.user?.nivelacesso === 'designer';
    
    // Buscar todas as artes do grupo
    const groupArts = await db.select()
      .from(arts)
      .where(
        isUserAdmin 
          ? eq(arts.artGroupId, groupId)
          : eq(arts.artGroupId, groupId) && eq(arts.isVisible, true)
      );
    
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

export default router;