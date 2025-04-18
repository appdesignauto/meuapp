import express, { Request, Response } from 'express';
import { db } from '../db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Endpoint para remover o logo
router.post('/', async (req: Request, res: Response) => {
  try {
    // Buscar a configuração existente
    const existingSettings = await db.select().from(siteSettings).limit(1);
    
    if (existingSettings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuração não encontrada'
      });
    }
    
    const defaultLogoPath = '/images/logo.png'; // Logo padrão
    
    // Atualizar no banco de dados, removendo a referência ao logo atual
    const [updatedSettings] = await db.update(siteSettings)
      .set({
        logoUrl: defaultLogoPath,
        updatedAt: new Date(),
        updatedBy: (req.user as any)?.id || null
      })
      .where(eq(siteSettings.id, existingSettings[0].id))
      .returning();
    
    // Notificar o cliente
    return res.json({
      success: true,
      message: 'Logo removido com sucesso',
      logoUrl: defaultLogoPath,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Erro ao remover o logo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar a remoção do logo',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;