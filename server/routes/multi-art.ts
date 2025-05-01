import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { ArtGroupSchema } from '@shared/interfaces/art-groups';
import { db } from '../db';
import { arts } from '@shared/schema';
import { isAdmin, isAuthenticated } from '../middlewares/auth';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();

// Rota para criar artes com múltiplos formatos
router.post(
  '/api/admin/arts/multi',
  isAuthenticated,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      // Validar dados de entrada
      const artGroupData = ArtGroupSchema.parse(req.body);

      // Se não houver formatos, retorne erro
      if (artGroupData.formats.length === 0) {
        return res.status(400).json({
          message: 'Pelo menos um formato deve ser fornecido'
        });
      }

      // Para cada formato, crie uma arte
      const createdArts = [];
      const errors = [];

      // Variáveis para relacionamento entre artes
      const artGroupId = Date.now().toString(); // ID de grupo único baseado em timestamp

      for (const format of artGroupData.formats) {
        try {
          // Extrair propriedades do formato
          const { 
            format: formatName, 
            imageUrl, 
            previewUrl, 
            editUrl, 
            title, 
            description, 
            fileType 
          } = format;

          // Preparar dados para inserção
          const artData = {
            title,
            description,
            imageUrl,
            previewUrl: previewUrl || null,
            editUrl: editUrl || null,
            categoryId: artGroupData.categoryId,
            isPremium: artGroupData.isPremium,
            format: formatName,
            fileType,
            isVisible: true,
            designerid: req.user.id,
            artGroupId // Relacionamento entre artes do mesmo conjunto
          };

          // Inserir arte no banco de dados
          const newArt = await storage.createArt(artData);
          createdArts.push(newArt);
        } catch (formatError) {
          console.error(`Erro ao criar arte para formato ${format.format}:`, formatError);
          errors.push({
            format: format.format,
            error: formatError instanceof Error ? formatError.message : 'Erro desconhecido'
          });
        }
      }

      // Se nenhuma arte foi criada, retorne erro
      if (createdArts.length === 0) {
        return res.status(500).json({
          message: 'Falha ao criar artes multi-formato',
          errors
        });
      }

      // Retornar resposta com as artes criadas e possíveis erros
      return res.status(201).json({
        message: `Criadas ${createdArts.length} artes em um grupo de ${artGroupData.formats.length} formatos`,
        createdArts,
        errors: errors.length > 0 ? errors : undefined,
        artGroupId
      });
    } catch (error) {
      console.error('Erro ao processar criação de arte multi-formato:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Dados inválidos',
          errors: fromZodError(error).message
        });
      }

      return res.status(500).json({
        message: 'Erro interno ao processar arte multi-formato',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

export default router;