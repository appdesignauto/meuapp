import express from 'express';
import { storage } from '../storage';
import { Request, Response, NextFunction } from 'express';
import { sql, eq } from 'drizzle-orm';
import { db } from '../db';
import { arts } from '@shared/schema';
import { supabaseStorageService } from '../services/supabase-storage';

// Middleware para verificar se o usuário é admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  const user = req.user as any;
  if (!user || (user.nivelacesso !== 'admin' && user.nivelacesso !== 'designer_adm' && user.nivelacesso !== 'designer')) {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }
  
  next();
};

/**
 * Arquivo que implementa rotas em português como adaptadores para as rotas em inglês
 * Isso permite compatibilidade com o frontend que já está usando os endpoints em português
 * enquanto mantém as APIs originais em inglês funcionando para retrocompatibilidade
 */

const router = express.Router();

// Listar artes com paginação e filtros - "/api/artes"
router.get('/api/artes', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 8;
    
    // Parse filters
    const filters: any = {};
    
    if (req.query.categoryId) {
      filters.categoryId = parseInt(req.query.categoryId as string);
    }
    
    if (req.query.formatId) {
      filters.formatId = parseInt(req.query.formatId as string);
    }
    
    if (req.query.fileTypeId) {
      filters.fileTypeId = parseInt(req.query.fileTypeId as string);
    }
    
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    
    // Verifica se filtro premium está aplicado
    if (req.query.isPremium) {
      filters.isPremium = req.query.isPremium === 'true';
    }
    
    // Verifica se parâmetro de ordenação está presente
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy as string;
      console.log(`Ordenação aplicada: ${filters.sortBy}`);
    } else {
      // Para o painel de artes, sempre ordenar do mais recente para o mais antigo
      filters.sortBy = 'recentes';
      console.log('Aplicando ordenação padrão: mais recentes primeiro');
    }
    
    // Verificar se o usuário é admin para determinar visibilidade
    const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm' || req.user?.nivelacesso === 'designer';
    
    // Verificar se um filtro de visibilidade está sendo aplicado
    if (req.query.isVisible !== undefined) {
      // Se for 'all', não aplicamos filtro - admin verá todas as artes
      if (req.query.isVisible === 'all') {
        // Não aplicamos filtro
        console.log("Filtro 'all' selecionado: mostrando todas as artes");
      } else {
        // Se o filtro for true ou false, aplicamos essa condição específica
        filters.isVisible = req.query.isVisible === 'true';
        console.log(`Filtro de visibilidade aplicado: ${filters.isVisible ? 'visíveis' : 'ocultas'}`);
      }
    } else if (!isAdmin) {
      // Se o usuário não for admin, vai ver apenas artes visíveis
      filters.isVisible = true;
      console.log("Usuário não é admin: mostrando apenas artes visíveis");
    } else {
      // Para admin sem filtro específico, vê todas as artes
      console.log("Admin sem filtro: mostrando todas as artes");
    }
    
    console.log(`Usuário ${isAdmin ? 'é admin' : 'NÃO é admin'}, filtro de visibilidade: ${filters.isVisible !== undefined ? filters.isVisible : 'não aplicado'}`);
    
    const result = await storage.getArts(page, limit, filters);
    
    // Converter URLs de imagem para o formato de proxy
    if (result.arts && result.arts.length > 0) {
      result.arts = supabaseStorageService.convertImageUrls(result.arts, ['imageUrl', 'thumbnailUrl']);
    }
    
    res.json(result);
  } catch (error) {
    console.error("Erro detalhado ao buscar artes:", error);
    res.status(500).json({ message: "Erro ao buscar artes" });
  }
});

// Obter arte por ID - "/api/artes/:id"
router.get('/api/artes/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const art = await storage.getArtById(id);
    
    if (!art) {
      return res.status(404).json({ message: "Arte não encontrada" });
    }
    
    // Verificar se o usuário é admin para permitir acesso a artes ocultas
    const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm' || req.user?.nivelacesso === 'designer';
    
    // Se a arte estiver oculta e o usuário não for admin, retornar 404
    if (art.isVisible === false && !isAdmin) {
      return res.status(404).json({ message: "Arte não encontrada" });
    }
    
    // Verificar se é conteúdo premium e adicionar flag em vez de bloquear acesso
    let isPremiumLocked = false;
    if (art.isPremium) {
      const user = req.user as any;
      const isPremiumUser = user && 
                            (user.nivelacesso === 'premium' || 
                             user.nivelacesso === 'designer' || 
                             user.nivelacesso === 'designer_adm' || 
                             user.nivelacesso === 'admin' ||
                             user.acessovitalicio ||
                             (user.role && 
                              ['premium', 'designer', 'designer_adm', 'admin'].includes(user.role)));
      
      if (!isPremiumUser) {
        isPremiumLocked = true;
      }
    }
    
    // Buscar a categoria da arte
    try {
      if (art.categoryId) {
        console.log(`[DEBUG] Buscando categoria ID: ${art.categoryId} para arte ID: ${id}`);
        const category = await storage.getCategoryById(art.categoryId);
        if (category) {
          console.log(`[DEBUG] Categoria encontrada: ${JSON.stringify(category)}`);
          // Usamos uma atribuição com tipo any para contornar a verificação de tipo
          (art as any).category = category;
          console.log(`[DEBUG] Arte atualizada com categoria: ${JSON.stringify(category)}`);
        }
      }
    } catch (catError) {
      console.error(`Erro ao buscar categoria para arte ${id}:`, catError);
    }
    
    // Buscar o designer da arte
    try {
      if (art.designerid) {
        const designer = await storage.getUser(art.designerid);
        if (designer) {
          // Criar objeto designer com tipo any para contornar verificações de tipo
          const designerObj: any = { ...designer, isFollowing: false };
          
          // Verificar se o usuário logado segue este designer
          if (req.user?.id) {
            // Usar consulta SQL direta ou método existente adequado
            // Como fallback, definimos como false
            designerObj.isFollowing = false;
          }
          
          // Simplificamos para não depender de métodos que podem não existir
          designerObj.totalArts = 0;
          designerObj.recentArts = [];

          try {
            // Utilizar métodos existentes no storage de maneira compatível
            const arts = await storage.getArtsByDesignerId(designer.id);
            
            // Verificar se a resposta é um array ou um objeto com propriedade arts
            if (arts) {
              if (Array.isArray(arts)) {
                // Se for array, usamos diretamente
                designerObj.totalArts = arts.length;
                designerObj.recentArts = arts.slice(0, 4);
              } else if (arts.arts && Array.isArray(arts.arts)) {
                // Se for objeto com propriedade arts
                designerObj.totalArts = arts.totalCount || arts.arts.length;
                designerObj.recentArts = arts.arts.slice(0, 4);
              }
            }
          } catch (artsError) {
            console.error(`Erro ao buscar artes do designer: ${artsError}`);
          }
          
          // Atribuir designer ao objeto art usando type assertion
          (art as any).designer = designerObj;
        }
      }
    } catch (designerError) {
      console.error(`Erro ao buscar designer para arte ${id}:`, designerError);
    }
    
    // Adicionar contagens básicas de interações diretamente na resposta
    try {
      // Usar lógica simplificada para minimizar erros
      const interactionCounts = {
        favoriteCount: 0,
        shareCount: 0,
        downloadCount: 0,
        viewCount: art.viewcount || 0
      };
      
      // Atribuir contagens ao objeto art
      Object.assign(art, interactionCounts);
    } catch (countError) {
      console.error(`Erro ao registrar visualização: ${countError}`);
    }
    
    // Registrar visualização (assíncrono, não bloqueia resposta)
    try {
      // Registrar visualização apenas se o usuário estiver autenticado
      if (req.user?.id) {
        try {
          // Verificar se existem visualizações usando método existente
          const userViews = await storage.getViewsByUserId(req.user.id);
          const existingView = userViews?.find(v => v.artId === id);
          
          if (!existingView) {
            // Criar uma nova visualização
            await storage.createView({
              userId: req.user.id,
              artId: id
            });
          }
          
          // Incrementar contador de visualizações na arte
          if (art.viewcount !== undefined) {
            art.viewcount += 1;
          }
        } catch (innerError) {
          console.error(`Erro interno ao verificar visualizações: ${innerError}`);
        }
      }
    } catch (viewError) {
      console.error(`Erro ao registrar visualização: ${viewError}`);
    }
    
    // Converter URLs de imagem para o formato de proxy
    const artWithConvertedUrls = supabaseStorageService.convertImageUrls(art, ['imageUrl', 'thumbnailUrl']);
    
    // Se houver designer com imagens, converter também
    if (artWithConvertedUrls.designer && artWithConvertedUrls.designer.recentArts) {
      artWithConvertedUrls.designer.recentArts = supabaseStorageService.convertImageUrls(
        artWithConvertedUrls.designer.recentArts, 
        ['imageUrl', 'thumbnailUrl']
      );
    }
    
    // Retornar a arte com todas as informações adicionais
    res.json({
      ...artWithConvertedUrls,
      isPremiumLocked,
      atualizadoem: artWithConvertedUrls.updatedAt // Garantir a compatibilidade com o frontend
    });
  } catch (error) {
    console.error("Erro ao buscar arte por ID:", error);
    res.status(500).json({ message: "Erro ao buscar arte" });
  }
});

// Obter artes recentes - "/api/artes/recent"
router.get('/api/artes/recent', async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é admin para determinar visibilidade
    const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm' || req.user?.nivelacesso === 'designer';
    
    // Buscar as 6 artes mais recentes diretamente da tabela artes (apenas visíveis para usuários normais)
    const artsResult = await db.execute(sql`
      SELECT 
        id, 
        "createdAt", 
        "updatedAt", 
        title, 
        "imageUrl",
        format,
        "isPremium"
      FROM arts 
      WHERE ${!isAdmin ? sql`"isVisible" = TRUE` : sql`1=1`}
      ORDER BY "createdAt" DESC 
      LIMIT 6
    `);
    
    let arts = artsResult.rows.map(art => ({
      id: art.id,
      title: art.title,
      imageUrl: art.imageUrl,
      format: art.format,
      isPremium: art.isPremium,
      createdAt: art.createdAt,
      updatedAt: art.updatedAt
    }));
    
    // Converter URLs de imagem para o formato de proxy
    arts = supabaseStorageService.convertImageUrls(arts, ['imageUrl', 'thumbnailUrl']);
    
    res.json({ arts });
  } catch (error) {
    console.error("Erro ao buscar artes recentes:", error);
    res.status(500).json({ message: "Erro ao buscar artes recentes" });
  }
});

// Obter artes relacionadas - "/api/artes/:id/related"
router.get('/api/artes/:id/related', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 12; // Usar 12 como padrão
    
    console.log(`[GET /api/artes/${id}/related] Buscando ${limit} artes relacionadas para arte ID ${id}`);
    
    let relatedArts = await storage.getRelatedArts(id, limit);
    
    console.log(`[GET /api/artes/${id}/related] Encontradas ${relatedArts.length} artes relacionadas`);
    
    // Converter URLs de imagem para o formato de proxy
    if (relatedArts.length > 0) {
      relatedArts = supabaseStorageService.convertImageUrls(relatedArts, ['imageUrl', 'thumbnailUrl']);
    }
    
    // Se não houver artes relacionadas, retorna array vazio em vez de 404
    // para que o frontend possa lidar com isso de maneira apropriada
    res.json(relatedArts);
  } catch (error) {
    console.error("Erro ao buscar artes relacionadas:", error);
    res.status(500).json({ message: "Erro ao buscar artes relacionadas" });
  }
});

// Obter categorias - "/api/categorias"
router.get('/api/categorias', async (req: Request, res: Response) => {
  try {
    const categories = await storage.getCategories();
    
    // Para cada categoria, realizar uma busca precisa das artes com contagem
    const enhancedCategories = await Promise.all(categories.map(async (category) => {
      // Buscar todas as artes dessa categoria com limites altos para garantir precisão
      const { arts, totalCount } = await storage.getArts(1, 1000, { categoryId: category.id });
      
      // Se não há artes, retornamos com contagem zero e data atual
      if (arts.length === 0) {
        return {
          ...category,
          artCount: 0,
          lastUpdate: new Date(),
          formats: []
        };
      }
      
      // Ordenar por data de atualização e pegar a mais recente
      const sortedArts = [...arts].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      // Data da última atualização é a data da arte mais recente
      const lastUpdate = sortedArts[0].updatedAt;
      
      // Coletar formatos únicos de artes nesta categoria
      const uniqueFormats = Array.from(new Set(arts.map(art => art.format)));
      
      return {
        ...category,
        artCount: totalCount,
        lastUpdate,
        formats: uniqueFormats
      };
    }));
    
    res.json(enhancedCategories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    res.status(500).json({ message: "Erro ao buscar categorias" });
  }
});

// Obter formatos - "/api/formatos"
router.get('/api/formatos', async (req: Request, res: Response) => {
  try {
    const formats = await storage.getFormats();
    res.json(formats);
  } catch (error) {
    console.error("Erro ao buscar formatos:", error);
    res.status(500).json({ message: "Erro ao buscar formatos" });
  }
});

// Obter tipos de arquivo - "/api/tiposArquivo"
router.get('/api/tiposArquivo', async (req: Request, res: Response) => {
  try {
    const fileTypes = await storage.getFileTypes();
    res.json(fileTypes);
  } catch (error) {
    console.error("Erro ao buscar tipos de arquivo:", error);
    res.status(500).json({ message: "Erro ao buscar tipos de arquivo" });
  }
});

// Rotas para favoritos em português

// Rota para obter todos os favoritos do usuário - "/api/favoritos"
router.get('/api/favoritos', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 8;
    
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Obter o ID do usuário da sessão
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(400).json({ message: "Usuário não identificado" });
    }
    
    // Obter favoritos com paginação
    const favorites = await storage.getUserFavorites(userId, page, limit);
    
    // Converter URLs de imagem para o formato de proxy 
    if (favorites.favorites && favorites.favorites.length > 0) {
      // Verificar se cada favorito tem a propriedade art e converter suas URLs
      favorites.favorites = favorites.favorites.map(favorite => {
        if (favorite.art) {
          favorite.art = supabaseStorageService.convertImageUrls(favorite.art, ['imageUrl', 'thumbnailUrl']);
        }
        return favorite;
      });
    }
    
    res.json(favorites);
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    res.status(500).json({ message: "Erro ao buscar favoritos" });
  }
});

// Rota para verificar se uma arte está favoritada - "/api/favoritos/check/:id"
router.get('/api/favoritos/check/:id', async (req: Request, res: Response) => {
  try {
    const artId = parseInt(req.params.id);
    
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.json({ isFavorite: false });
    }
    
    // Obter o ID do usuário da sessão
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.json({ isFavorite: false });
    }
    
    // Verificar se a arte está favoritada
    const isFavorite = await storage.checkFavorite(userId, artId);
    res.json({ isFavorite });
  } catch (error) {
    console.error("Erro ao verificar favorito:", error);
    res.status(500).json({ message: "Erro ao verificar favorito" });
  }
});

// Rota para alternar favorito - "/api/favoritos/toggle/:id"
router.post('/api/favoritos/toggle/:id', async (req: Request, res: Response) => {
  try {
    const artId = parseInt(req.params.id);
    
    // Verificar se o usuário está autenticado
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    // Obter o ID do usuário da sessão
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(400).json({ message: "Usuário não identificado" });
    }
    
    // Alternar o estado do favorito
    const result = await storage.toggleFavorite(userId, artId);
    res.json(result);
  } catch (error) {
    console.error("Erro ao alternar favorito:", error);
    res.status(500).json({ message: "Erro ao alternar favorito" });
  }
});

// Rotas de administração de artes

// Rota para excluir uma arte por ID - "/api/admin/artes/:id"
router.delete('/api/admin/artes/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    console.log('[DELETE] Iniciando exclusão da arte ID:', id);
    
    // Verificar se a arte existe
    const art = await storage.getArtById(id);
    
    if (!art) {
      console.log('[DELETE] Arte ID não encontrada:', id);
      return res.status(404).json({ message: "Arte não encontrada" });
    }
    
    // Primeiro excluir todas as referências à arte
    console.log('[DELETE] Removendo registros relacionados à arte ID:', id);
    
    try {
      // Usar transação para garantir que todas as exclusões ocorram ou nenhuma
      await db.transaction(async (tx) => {
        // 1. Remover visualizações
        await tx.execute(sql`DELETE FROM views WHERE "artId" = ${id}`);
        console.log('[DELETE] Visualizações removidas para arte ID:', id);
        
        // 2. Remover downloads
        await tx.execute(sql`DELETE FROM downloads WHERE "artId" = ${id}`);
        console.log('[DELETE] Downloads removidos para arte ID:', id);
        
        // 3. Remover favoritos
        await tx.execute(sql`DELETE FROM favorites WHERE "artId" = ${id}`);
        console.log('[DELETE] Favoritos removidos para arte ID:', id);
        
        // 4. Remover a própria arte
        await tx.execute(sql`DELETE FROM arts WHERE id = ${id}`);
        console.log('[DELETE] Arte ID removida com sucesso:', id);
      });
      
      // Desativar cache para esta resposta
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Retornar sucesso
      return res.status(200).json({ 
        message: "Arte excluída com sucesso",
        timestamp: Date.now() // Adicionar timestamp para evitar cache
      });
    } catch (error) {
      console.error(`[DELETE] Erro na transação: ${error}`);
      return res.status(500).json({ 
        message: "Erro ao excluir arte: falha na transação de banco de dados",
        error: error.message
      });
    }
  } catch (error) {
    console.error(`[DELETE] Erro ao excluir arte: ${error}`);
    res.status(500).json({ message: "Erro ao excluir arte" });
  }
});

// Rota para atualizar uma arte por ID - "/api/admin/artes/:id"
router.put('/api/admin/artes/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verificar se a arte existe
    const art = await storage.getArtById(id);
    
    if (!art) {
      return res.status(404).json({ message: "Arte não encontrada" });
    }
    
    // Atualizar os campos da arte conforme o corpo da requisição
    const updates = req.body;
    
    // Remover campos que não devem ser atualizados
    delete updates.id;
    delete updates.createdAt;
    delete updates._timestamp; // Remover timestamp que é usado apenas para evitar cache
    
    // Adicionar data de atualização
    updates.updatedAt = new Date();
    
    console.log(`Atualizando arte ${id} com os campos:`, updates);
    
    try {
      // Uso de método atualizado e mais seguro para evitar problemas com tipos
      if (updates.isVisible !== undefined) {
        // Converter para booleano explicitamente
        const isVisibleValue = updates.isVisible === true || updates.isVisible === 'true';
        console.log(`Atualizando visibilidade da arte ${id} para: ${isVisibleValue} (tipo: ${typeof isVisibleValue})`);
        
        // Usar variáveis SQL para evitar injeção ou problemas de tipo
        await db.update(arts)
          .set({ 
            isVisible: isVisibleValue, 
            updatedAt: updates.updatedAt 
          })
          .where(eq(arts.id, id))
          .execute();
        
        console.log(`Atualização de visibilidade concluída para arte ${id}`);
      } else if (updates.isPremium !== undefined) {
        // Converter para booleano explicitamente
        const isPremiumValue = updates.isPremium === true || updates.isPremium === 'true';
        console.log(`Atualizando status premium da arte ${id} para: ${isPremiumValue} (tipo: ${typeof isPremiumValue})`);
        
        await db.update(arts)
          .set({ 
            isPremium: isPremiumValue, 
            updatedAt: updates.updatedAt 
          })
          .where(eq(arts.id, id))
          .execute();
        
        console.log(`Atualização de premium concluída para arte ${id}`);
      } else {
        // Para outros campos, usar método builder também
        await db.update(arts)
          .set(updates)
          .where(eq(arts.id, id))
          .execute();
      }
    } catch (updateError) {
      console.error("Erro específico na atualização SQL:", updateError);
      throw updateError;
    }
    
    // Desativar cache para esta resposta
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).json({ 
      message: "Arte atualizada com sucesso",
      timestamp: Date.now() // Adicionar timestamp para evitar cache
    });
  } catch (error) {
    console.error("Erro ao atualizar arte:", error);
    res.status(500).json({ message: "Erro ao atualizar arte" });
  }
});

export default router;