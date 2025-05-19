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
    
    // Atualizar a arte diretamente com SQL
    await db.execute(sql`
      UPDATE arts 
      SET 
        title = ${primaryFormat.title},
        description = ${primaryFormat.description || ''},
        "imageUrl" = ${primaryFormat.imageUrl},
        "previewUrl" = ${primaryFormat.previewUrl || null},
        "editUrl" = ${primaryFormat.editUrl || ''},
        "categoryId" = ${artGroupData.categoryId},
        "isPremium" = ${artGroupData.isPremium},
        "fileType" = ${primaryFormat.fileType}
      WHERE id = ${id}
    `);
    
    // Responder com sucesso
    return res.json({
      message: 'Arte atualizada com sucesso',
      id: id,
      updated: [{
        id: id,
        format: primaryFormat.format,
        title: primaryFormat.title
      }]
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

export default router;