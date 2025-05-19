import { Request, Response } from 'express';
import { isAuthenticated, isAdmin } from '../middlewares/auth';
import { db } from '../db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

export default function setupRemoveLogoRoute(app: any) {
  // Rota para remover o logo completamente do sistema
  app.post('/api/remove-logo', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      // Obter as configurações atuais do site
      const [currentSettings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
      
      if (!currentSettings) {
        return res.status(404).json({ error: 'Configurações do site não encontradas' });
      }

      // Verificar se há um logo definido
      const currentLogoUrl = currentSettings.logoUrl;
      
      // Se não houver logo, não há nada para remover
      if (!currentLogoUrl || currentLogoUrl === '/images/logo.png') {
        return res.status(400).json({ error: 'Não há logo personalizado para remover' });
      }

      // Primeiro, remover o arquivo físico se ele existir no servidor
      // e não for um endereço remoto (começa com http)
      if (!currentLogoUrl.startsWith('http')) {
        try {
          // Converter URL relativa para caminho no sistema de arquivos
          const logoPath = path.join(process.cwd(), 'public', currentLogoUrl);
          if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath);
            console.log(`Arquivo de logo removido: ${logoPath}`);
          }
        } catch (fileError) {
          console.error('Erro ao remover arquivo físico do logo:', fileError);
          // Continuar mesmo se falhar a remoção do arquivo
        }
      }

      // Atualizar o registro no banco de dados para remover a referência ao logo
      // Definir como null ou como logo padrão
      await db.update(siteSettings)
        .set({ 
          logoUrl: '/images/logo.png',  // Logo padrão ou vazio
          updatedAt: new Date(),
          updatedBy: req.user?.id || null
        })
        .where(eq(siteSettings.id, 1));

      // Retornar sucesso
      return res.status(200).json({ 
        success: true, 
        message: 'Logo removido com sucesso', 
        logoUrl: '/images/logo.png' 
      });
      
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      return res.status(500).json({ error: 'Erro ao processar a solicitação de remoção do logo' });
    }
  });
}