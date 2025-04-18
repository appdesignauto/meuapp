import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { arts, insertUserSchema, users, userFollows, categories, collections, views, downloads, favorites, communityPosts, communityComments, formats, fileTypes, testimonials, designerStats, subscriptions, type User } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import imageUploadRoutes from "./routes/image-upload";
import { setupFollowRoutes } from "./routes/follows";
import { db } from "./db";
import { eq, isNull, desc, and, count, sql, asc, not, or, ne, inArray } from "drizzle-orm";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { SQL } from "drizzle-orm/sql";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storageService } from "./services/storage";
import { supabaseStorageService } from "./services/supabase-storage";
import { SubscriptionService } from "./services/subscription-service";
import { HotmartService } from "./services/hotmart-service";
import uploadMemory from "./middlewares/upload";

// Versão promisificada do scrypt
const scryptAsync = promisify(scrypt);

export async function registerRoutes(app: Express): Promise<Server> {
  // Rota de debug para testar getUserByUsername
  app.get('/api/debug/getUserByUsername/:username', async (req, res) => {
    try {
      console.log('DEBUG tentando encontrar usuário:', req.params.username);
      
      // Usar consulta SQL direta para diagnóstico
      const result = await db.execute(sql`
        SELECT * FROM users WHERE username = ${req.params.username}
      `);
      console.log('DEBUG resultado SQL direto:', result.rows);
      
      // Tentar buscar usando o método do storage
      const user = await storage.getUserByUsername(req.params.username);
      console.log('DEBUG getUserByUsername result:', user);
      
      res.setHeader('Content-Type', 'application/json');
      return res.json({ success: true, sqlResult: result.rows, storageResult: user });
    } catch (error) {
      console.error('DEBUG error in getUserByUsername:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ success: false, error: String(error) });
    }
  });
  // Setup authentication middleware and routes
  const { isAuthenticated, isPremium, isAdmin, isDesigner, hasRole } = setupAuth(app);
  
  // Configurar o multer para upload de arquivos
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Garantir que o diretório de uploads existe
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });
  
  const upload = multer({ storage: multerStorage });

  // Categories API with precise art counts and detailed stats
  app.get("/api/categories", async (req, res) => {
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
          new Date(b.atualizadoem).getTime() - new Date(a.atualizadoem).getTime()
        );
        
        // Data da última atualização é a data da arte mais recente
        const lastUpdate = sortedArts[0].atualizadoem;
        
        // Coletar formatos únicos de artes nesta categoria
        const uniqueFormats = Array.from(new Set(arts.map(art => art.format)));
        
        // Retornar categoria com informações extras completas
        return {
          ...category,
          artCount: totalCount,
          lastUpdate,
          formats: uniqueFormats
        };
      }));
      
      res.json(enhancedCategories);
    } catch (error) {
      console.error("Erro ao buscar categorias com estatísticas:", error);
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });
  
  // Get Category by Slug
  app.get("/api/categories/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const category = await storage.getCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Erro ao buscar categoria por slug:", error);
      res.status(500).json({ message: "Erro ao buscar categoria" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar categoria" });
    }
  });

  // Formats API
  app.get("/api/formats", async (req, res) => {
    try {
      const formats = await storage.getFormats();
      res.json(formats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar formatos" });
    }
  });

  // File Types API
  app.get("/api/fileTypes", async (req, res) => {
    try {
      const fileTypes = await storage.getFileTypes();
      res.json(fileTypes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tipos de arquivo" });
    }
  });

  // Collections API
  app.get("/api/collections", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const search = req.query.search as string | undefined;
      
      const result = await storage.getCollections(page, limit, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar coleções" });
    }
  });

  app.get("/api/collections/featured", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const featuredCollections = await storage.getFeaturedCollections(limit);
      res.json(featuredCollections);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar coleções em destaque" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollectionById(id);
      
      if (!collection) {
        return res.status(404).json({ message: "Coleção não encontrada" });
      }
      
      const arts = await storage.getArtsByCollectionId(id);
      res.json({ collection, arts });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar coleção" });
    }
  });

  // Arts API
  app.get("/api/arts", async (req, res) => {
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
      
      // Check if premium filter is applied
      if (req.query.isPremium) {
        filters.isPremium = req.query.isPremium === 'true';
      }
      
      const result = await storage.getArts(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error("Erro detalhado ao buscar artes:", error);
      res.status(500).json({ 
        message: "Erro ao buscar artes", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Rota para buscar artes recentes (usada no painel inicial)
  app.get("/api/arts/recent", async (req, res) => {
    try {
      // Buscar as 6 artes mais recentes diretamente da tabela artes
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
        ORDER BY "createdAt" DESC 
        LIMIT 6
      `);
      
      const arts = artsResult.rows.map(art => ({
        id: art.id,
        title: art.title,
        imageUrl: art.imageUrl,
        format: art.format,
        isPremium: art.isPremium,
        createdAt: art.createdAt,
        updatedAt: art.updatedAt
      }));
      
      res.json({ arts });
    } catch (error) {
      console.error("Erro ao buscar artes recentes:", error);
      res.status(500).json({ message: "Erro ao buscar artes recentes" });
    }
  });

  app.get("/api/arts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const art = await storage.getArtById(id);
      
      if (!art) {
        return res.status(404).json({ message: "Arte não encontrada" });
      }
      
      // Verificar se é conteúdo premium e adicionar flag em vez de bloquear acesso
      let isPremiumLocked = false;
      if (art.isPremium) {
        const user = req.user as any;
        if (!user || user.role !== 'premium') {
          isPremiumLocked = true;
          // Não bloqueamos mais com 403, apenas marcamos como conteúdo restrito
        }
      }
      
      // Incrementar contador de visualizações
      try {
        // Registrar a visualização
        const viewData = {
          artId: id,
          userId: req.user ? (req.user as any).id : null,
          sourceIp: req.ip
        };
        
        await storage.recordView(viewData);
        
        // Atualizar o contador de visualizações
        if (art.viewcount !== undefined) {
          art.viewcount += 1;
          await storage.updateArtViewCount(id, art.viewcount);
        }
      } catch (viewError) {
        console.error("Erro ao registrar visualização:", viewError);
        // Não interrompe o fluxo principal se o contador falhar
      }
      
      // Buscar informações do designer se existir
      if (art.designerid) {
        try {
          const designer = await storage.getUserById(art.designerid);
          if (designer) {
            // Remover a senha e outras informações sensíveis
            const { password, ...safeDesigner } = designer;
            
            // Buscar estatísticas do designer
            const stats = await storage.getDesignerStats(art.designerid);
            
            // Buscar status de seguidor para o usuário atual (se autenticado)
            let isFollowing = false;
            if (req.user) {
              const userId = (req.user as any).id;
              isFollowing = await storage.isFollowing(userId, art.designerid);
            }
            
            // Buscar 4 artes recentes do designer, excluindo a arte atual
            let recentArts = [];
            try {
              const designerArts = await storage.getArtsByDesignerId(art.designerid, 5);
              recentArts = designerArts
                .filter(recentArt => recentArt.id !== art.id)
                .slice(0, 4)
                .map(recentArt => ({
                  id: recentArt.id,
                  title: recentArt.title,
                  imageUrl: recentArt.imageUrl
                }));
            } catch (artsError) {
              console.error("Erro ao buscar artes recentes do designer:", artsError);
            }
            
            art.designer = {
              ...safeDesigner,
              isFollowing,
              followers: stats?.followers || 0,
              totalArts: stats?.totalArts || 0,
              recentArts
            };
          }
        } catch (designerError) {
          console.error("Erro ao buscar informações do designer:", designerError);
          // Se falhar ao buscar o designer, ainda retornamos a arte
        }
      } 
      // Se não existir designer, usar administrador como designer temporário para demonstração
      else {
        // Usar administrador (id 1) como designer temporário (apenas para fins de demonstração)
        try {
          const admin = await storage.getUserById(1);
          if (admin) {
            const { password, ...safeAdmin } = admin;
            
            // Buscar todos as artes do admin
            const adminArts = await storage.getArtsByDesignerId(1, 10);
            const otherArts = adminArts
              .filter(a => a.id !== art.id)
              .slice(0, 4)
              .map(a => ({
                id: a.id,
                title: a.title || 'Arte sem título',
                imageUrl: a.imageUrl || ''
              }));
            
            art.designer = {
              ...safeAdmin,
              isFollowing: false,
              followers: Math.floor(Math.random() * 100) + 10, // Valor demonstrativo
              totalArts: adminArts.length,
              recentArts: otherArts
            };
          }
        } catch (adminError) {
          console.error("Erro ao usar admin como designer temporário:", adminError);
        }
      }
      
      // Adicionar flag de premium locked ao objeto retornado
      res.json({
        ...art,
        isPremiumLocked
      });
    } catch (error) {
      console.error("Erro ao buscar arte:", error);
      res.status(500).json({ message: "Erro ao buscar arte" });
    }
  });
  
  // Rota para buscar artes recentes (usada no painel inicial)
  app.get("/api/arts/recent", async (req, res) => {
    try {
      // Buscar as 6 artes mais recentes diretamente da tabela artes
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
        ORDER BY "createdAt" DESC 
        LIMIT 6
      `);
      
      const arts = artsResult.rows.map(art => ({
        id: art.id,
        title: art.title,
        imageUrl: art.imageUrl,
        format: art.format,
        isPremium: art.isPremium,
        createdAt: art.createdAt,
        updatedAt: art.updatedAt
      }));
      
      res.json({ arts });
    } catch (error) {
      console.error("Erro ao buscar artes recentes:", error);
      res.status(500).json({ message: "Erro ao buscar artes recentes" });
    }
  });

  app.get("/api/arts/:id/related", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      const relatedArts = await storage.getRelatedArts(id, limit);
      
      // Filtrar artes premium se o usuário não estiver logado ou não for premium
      const user = req.user as any;
      let filteredArts = relatedArts;
      
      if (!user || user.role !== 'premium') {
        filteredArts = relatedArts.filter(art => !art.isPremium);
      }
      
      res.json(filteredArts);
    } catch (error) {
      console.error("Erro ao buscar artes relacionadas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Testimonials API
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar depoimentos" });
    }
  });

  // Favorites API
  // Estatísticas do usuário - versão revisada
  app.get("/api/users/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      console.log("[GET /api/users/stats] Buscando estatísticas para o usuário:", userId);
      
      // Usar Drizzle ORM direto para minimizar erros de SQL com diagnóstico detalhado
      // Contar favoritos com diagnóstico detalhado
      try {
        // Verificar a tabela de favoritos
        const allFavorites = await db.select().from(favorites);
        console.log("[DEBUG] Todos os favoritos na tabela:", allFavorites);
        
        // Contar favoritos
        const favoritesQuery = db.select({ count: sql<number>`count(*)` })
          .from(favorites)
          .where(eq(favorites.userId, userId));
          
        const favoritesResult = await favoritesQuery;
        const totalFavorites = Number(favoritesResult[0]?.count) || 0;
        console.log("[GET /api/users/stats] Total de favoritos:", totalFavorites, "Tipo:", typeof totalFavorites);
        
        // Verificar IDs no frontend vs. backend
        console.log("[DEBUG] Verificação de IDs - Atual userId:", userId, "Tipo:", typeof userId);
        console.log("[DEBUG] Favoritos do usuário:", await db.select().from(favorites).where(eq(favorites.userId, userId)));
      } catch (e) {
        console.error("[GET /api/users/stats] Erro ao contar favoritos:", e);
      }
      
      // Contar favoritos
      const favoritesQuery = db.select({ count: sql<number>`count(*)` })
        .from(favorites)
        .where(eq(favorites.userId, userId));
        
      const favoritesResult = await favoritesQuery;
      const totalFavorites = Number(favoritesResult[0]?.count) || 0;
      
      // Contar downloads
      const downloadsQuery = db.select({ count: sql<number>`count(*)` })
        .from(downloads)
        .where(eq(downloads.userId, userId));
        
      const downloadsResult = await downloadsQuery;
      const totalDownloads = Number(downloadsResult[0]?.count) || 0;
      console.log("[GET /api/users/stats] Total de downloads:", totalDownloads, "Tipo:", typeof totalDownloads);
      
      // Contar visualizações
      const viewsQuery = db.select({ count: sql<number>`count(*)` })
        .from(views)
        .where(eq(views.userId, userId));
        
      const viewsResult = await viewsQuery;
      const totalViews = Number(viewsResult[0]?.count) || 0;
      console.log("[GET /api/users/stats] Total de views:", totalViews, "Tipo:", typeof totalViews);
      
      // Estatísticas para retornar com valores forçados como Number
      const stats = {
        totalFavorites: Number(totalFavorites),
        totalDownloads: Number(totalDownloads),
        totalViews: Number(totalViews)
      };
      
      console.log("[GET /api/users/stats] Retornando estatísticas:", stats);
      
      // Retornar estatísticas
      res.json(stats);
    } catch (error) {
      console.error("[GET /api/users/stats] Erro ao buscar estatísticas do usuário:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas do usuário" });
    }
  });
  
  // Downloads API
  app.get("/api/downloads", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userDownloads = await storage.getDownloadsByUserId(userId);
      
      // Enriquece os downloads com informações da arte
      const enrichedDownloads = await Promise.all(
        userDownloads.map(async (download) => {
          try {
            // Garantir que artId seja um número
            const artId = Number(download.artId);
            if (isNaN(artId)) {
              console.error(`ID de arte inválido: ${download.artId}`);
              return download;
            }
            
            const art = await storage.getArtById(artId);
            return {
              ...download,
              art
            };
          } catch (error) {
            console.error(`Erro ao buscar arte ${download.artId} para download:`, error);
            return download;
          }
        })
      );
      
      // Filtrar downloads que não têm arte válida
      const validDownloads = enrichedDownloads.filter(download => download.art);
      
      res.json({ downloads: validDownloads, totalCount: validDownloads.length });
    } catch (error) {
      console.error("Erro ao buscar downloads:", error);
      res.status(500).json({ message: "Erro ao buscar downloads" });
    }
  });
  
  // Download specific art
  app.post("/api/downloads", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { artId } = req.body;
      
      // Verificar se a arte existe
      const art = await storage.getArtById(Number(artId));
      if (!art) {
        return res.status(404).json({ message: "Arte não encontrada" });
      }
      
      // Registrar o download
      const download = await storage.createDownload({ 
        userId, 
        artId: Number(artId)
        // A data é adicionada automaticamente pelo campo defaultNow()
      });
      
      res.status(201).json(download);
    } catch (error) {
      console.error("Erro ao registrar download:", error);
      res.status(500).json({ message: "Erro ao registrar download" });
    }
  });
  
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const favorites = await storage.getFavoritesByUserId(userId);
      
      // Enriquece os favoritos com informações da arte
      const enrichedFavorites = await Promise.all(
        favorites.map(async (favorite) => {
          try {
            // Garantir que artId seja um número
            const artId = Number(favorite.artId);
            if (isNaN(artId)) {
              console.error(`ID de arte inválido: ${favorite.artId}`);
              return favorite;
            }
            
            const art = await storage.getArtById(artId);
            return {
              ...favorite,
              art
            };
          } catch (error) {
            console.error(`Erro ao buscar arte ${favorite.artId} para favorito:`, error);
            return favorite;
          }
        })
      );
      
      // Filtrar favoritos que não têm arte válida
      const validFavorites = enrichedFavorites.filter(favorite => favorite.art);
      
      res.json({ favorites: validFavorites, totalCount: validFavorites.length });
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error);
      res.status(500).json({ message: "Erro ao buscar favoritos" });
    }
  });

  // Check if art is favorited
  app.get("/api/favorites/check/:artId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const artId = parseInt(req.params.artId);
      const favorite = await storage.getFavorite(userId, artId);
      res.json({ isFavorited: !!favorite });
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
      res.status(500).json({ message: "Erro ao verificar favorito" });
    }
  });

  // Add favorite
  app.post("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { artId } = req.body;
      
      // Verificar se já existe o favorito
      const existingFavorite = await storage.getFavorite(userId, artId);
      if (existingFavorite) {
        return res.status(400).json({ message: "Arte já favoritada" });
      }
      
      const favorite = await storage.createFavorite({ userId, artId });
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Erro ao adicionar favorito:", error);
      res.status(500).json({ message: "Erro ao adicionar favorito" });
    }
  });

  // Remove favorite
  app.delete("/api/favorites/:artId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const artId = parseInt(req.params.artId);
      
      const removed = await storage.deleteFavorite(userId, artId);
      
      if (!removed) {
        return res.status(404).json({ message: "Favorito não encontrado" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
      res.status(500).json({ message: "Erro ao remover favorito" });
    }
  });

  // Admin API - Create Art
  app.post("/api/admin/arts", isAdmin, async (req, res) => {
    try {
      const newArt = await storage.createArt(req.body);
      // Resposta com status 201 (Created) e a nova arte
      res.status(201).json(newArt);
    } catch (error) {
      console.error("Erro ao criar arte:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Erro ao criar arte" });
    }
  });

  // Admin API - Update Art
  app.put("/api/admin/arts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedArt = await storage.updateArt(id, req.body);
      
      if (!updatedArt) {
        return res.status(404).json({ message: "Arte não encontrada" });
      }
      
      res.json(updatedArt);
    } catch (error) {
      console.error("Erro ao atualizar arte:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Erro ao atualizar arte" });
    }
  });

  // Admin API - Delete Art
  app.delete("/api/admin/arts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteArt(id);
      
      if (!success) {
        return res.status(404).json({ message: "Arte não encontrada" });
      }
      
      res.status(204).send(); // No Content
    } catch (error) {
      console.error("Erro ao excluir arte:", error);
      res.status(500).json({ message: "Erro ao excluir arte" });
    }
  });

  // Admin API - Create Category
  app.post("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const newCategory = await storage.createCategory(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Erro ao criar categoria" });
    }
  });

  // Admin API - Update Category
  app.put("/api/admin/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedCategory = await storage.updateCategory(id, req.body);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Erro ao atualizar categoria" });
    }
  });

  // Admin API - Delete Category
  app.delete("/api/admin/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      res.status(204).send(); // No Content
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      res.status(500).json({ message: "Erro ao excluir categoria" });
    }
  });

  // Registrar rotas de upload de imagem
  app.use(imageUploadRoutes);
  
  // Configurar rotas de seguidores (following)
  setupFollowRoutes(app, isAuthenticated);

  // Rota administrativa para atualizar designerId de todas as artes
  app.post("/api/admin/update-designers", isAdmin, async (req, res) => {
    try {
      // Buscar o ID do usuário admin
      const admin = req.user;
      
      if (!admin) {
        return res.status(400).json({ message: "Usuário admin não encontrado" });
      }
      
      // Atualizar todas as artes sem designerid usando SQL direto
      await db.execute(`
        UPDATE arts 
        SET designerid = ${admin.id} 
        WHERE designerid IS NULL
      `);

      return res.status(200).json({ 
        message: "Designers atualizados com sucesso", 
        designerid: admin.id 
      });
    } catch (error) {
      console.error("Erro ao atualizar designers:", error);
      res.status(500).json({ message: "Erro ao atualizar designers" });
    }
  });

  // =============================================
  // GERENCIAMENTO DE USUÁRIOS

  // Rota para listar todos os usuários (apenas para administradores)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Verificar se o usuário tem permissão de administrador
      if (user.nivelacesso !== "admin" && user.nivelacesso !== "designer_adm" && user.nivelacesso !== "support") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Utilizando SQL para evitar problemas de coluna (lastLogin vs lastlogin)
      const usersQuery = `
        SELECT 
          id, 
          username, 
          email, 
          name, 
          profileimageurl, 
          bio, 
          role,
          nivelacesso,
          tipoplano,
          origemassinatura,
          dataassinatura,
          dataexpiracao,
          acessovitalicio, 
          isactive, 
          lastlogin, 
          "createdAt", 
          updatedat
        FROM users
        ORDER BY "createdAt" DESC
      `;
      
      const result = await db.execute(sql.raw(usersQuery));
      const allUsers = result.rows;
      
      // Enriquecer com estatísticas
      const usersWithStats = await Promise.all(
        allUsers.map(async (user: any) => {
          // Contar seguidores (para designers)
          const followersQuery = `
            SELECT COUNT(*) as count
            FROM "userFollows"
            WHERE "followingId" = ${user.id}
          `;
          
          const followersResult = await db.execute(sql.raw(followersQuery));
          const followersCount = parseInt(followersResult.rows[0].count) || 0;
          
          // Contar seguindo
          const followingQuery = `
            SELECT COUNT(*) as count
            FROM "userFollows"
            WHERE "followerId" = ${user.id}
          `;
          
          const followingResult = await db.execute(sql.raw(followingQuery));
          const followingCount = parseInt(followingResult.rows[0].count) || 0;
          
          // Estatísticas para designers
          let totalDownloads = 0;
          let totalViews = 0;
          let lastLogin = user.lastlogin;
          
          if (user.role === "designer" || user.role === "designer_adm") {
            // Contar downloads de artes deste designer
            const downloadsQuery = `
              SELECT COUNT(*) as count
              FROM downloads d
              JOIN arts a ON d."artId" = a.id
              WHERE a.designerid = ${user.id}
            `;
            
            const downloadsResult = await db.execute(sql.raw(downloadsQuery));
            totalDownloads = parseInt(downloadsResult.rows[0].count) || 0;
            
            // Contar visualizações de artes deste designer
            const viewsQuery = `
              SELECT COUNT(*) as count
              FROM views v
              JOIN arts a ON v."artId" = a.id
              WHERE a.designerid = ${user.id}
            `;
            
            const viewsResult = await db.execute(sql.raw(viewsQuery));
            totalViews = parseInt(viewsResult.rows[0].count) || 0;
          }
          
          // Converter para formato CamelCase para o frontend
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            profileImageUrl: user.profileimageurl,
            bio: user.bio,
            role: user.role,
            nivelacesso: user.nivelacesso,
            tipoplano: user.tipoplano,
            origemassinatura: user.origemassinatura,
            dataassinatura: user.dataassinatura,
            dataexpiracao: user.dataexpiracao,
            acessovitalicio: user.acessovitalicio,
            isactive: user.isactive,
            lastLogin: lastLogin,
            createdAt: user.createdat || user["createdAt"],
            followersCount,
            followingCount,
            totalDownloads,
            totalViews
          };
        })
      );
      
      res.json(usersWithStats);
    } catch (error: any) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Rota para criar um novo usuário (apenas para administradores)
  app.post("/api/users", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Verificar se o usuário tem permissão de administrador ou suporte
      if (user.nivelacesso !== "admin" && user.nivelacesso !== "designer_adm" && user.nivelacesso !== "support") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { 
        username, 
        email, 
        password, 
        name, 
        nivelacesso, 
        isactive,
        tipoplano,
        origemassinatura,
        dataassinatura,
        dataexpiracao,
        acessovitalicio
      } = req.body;
      
      // Log para debug
      console.log("Dados recebidos para criação de usuário:", {
        nivelacesso,
        tipoplano,
        origemassinatura,
        dataassinatura,
        dataexpiracao,
        acessovitalicio
      });
      
      // Verificar se o username ou email já existem
      const existingUser = await db
        .select()
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, email)))
        .limit(1);
        
      if (existingUser.length > 0) {
        return res.status(400).json({ 
          message: existingUser[0].username === username 
            ? "Nome de usuário já existe" 
            : "Email já cadastrado"
        });
      }
      
      // Nova regra: todo usuário criado pelo adm ou pelo suporte terá senha padrão designauto@123
      // Nova regra: todo usuário criado pelo adm ou pelo suporte terá senha padrão designauto@123
      const usandoSenhaPadrao = (user.nivelacesso === "admin" || user.nivelacesso === "support");
      const senhaParaUsar = usandoSenhaPadrao ? "designauto@123" : password;
        
      console.log(`Usuário sendo criado por ${user.nivelacesso}, usando ${usandoSenhaPadrao ? "senha padrão 'designauto@123'" : "senha personalizada"}`);
      
      // Se estiver usando a senha padrão, registrar isso na observação do administrador
      if (usandoSenhaPadrao) {
        const dataAtual = new Date().toISOString().split('T')[0];
        const observacao = req.body.observacaoadmin || '';
        req.body.observacaoadmin = `${observacao} [${dataAtual}] Criado com senha padrão por ${user.username} (${user.nivelacesso}).`.trim();
      }
      
      // Criptografar a senha
      const salt = randomBytes(16).toString("hex");
      const buf = await scryptAsync(senhaParaUsar, salt, 64) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      // Nível de acesso padrão se não for especificado
      const userNivelAcesso = nivelacesso || "free";
      
      // Criar o usuário usando nomes de colunas em lowercase conforme o banco
      const userData: any = {
        username,
        email,
        password: hashedPassword,
        name: name || null,
        nivelacesso: userNivelAcesso,
        role: userNivelAcesso, // Mantemos o role igual ao nivelacesso para compatibilidade
        isactive: isactive !== undefined ? isactive : true,
        profileimageurl: null,
        bio: null,
        // Ajustar para horário de Brasília (UTC-3)
        lastlogin: new Date(new Date().getTime() - 3 * 60 * 60 * 1000),
        // Ajustar para horário de Brasília (UTC-3)
        createdat: new Date(new Date().getTime() - 3 * 60 * 60 * 1000),
        updatedat: new Date(new Date().getTime() - 3 * 60 * 60 * 1000)
      };
      
      // Adicionar campos de assinatura para usuários premium
      if (userNivelAcesso === 'premium') {
        userData.origemassinatura = origemassinatura || 'manual';
        userData.tipoplano = tipoplano || 'mensal';
        userData.dataassinatura = dataassinatura ? new Date(dataassinatura) : new Date();
        
        // Para planos vitalícios
        if (tipoplano === 'vitalicio' || acessovitalicio) {
          userData.acessovitalicio = true;
          userData.dataexpiracao = null;
        } 
        // Para planos com expiração
        else {
          userData.acessovitalicio = false;
          
          if (dataexpiracao) {
            userData.dataexpiracao = new Date(dataexpiracao);
          } else {
            // Calcular data de expiração baseada no tipo de plano
            const expDate = new Date(userData.dataassinatura);
            if (tipoplano === 'anual') {
              expDate.setDate(expDate.getDate() + 365);
            } else {
              // padrão para mensal e personalizado: 30 dias
              expDate.setDate(expDate.getDate() + 30);
            }
            userData.dataexpiracao = expDate;
          }
        }
      }
      
      // Log para debug
      console.log("Dados finais para inserção de usuário:", userData);
      
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Rota para atualizar um usuário existente (apenas para administradores)
  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const userId = parseInt(req.params.id);
      
      console.log(`[UserUpdate] Atualizando usuário ${userId}. Requisição feita por: ${user.username} (ID: ${user.id}, Nível: ${user.nivelacesso})`);
      console.log(`[UserUpdate] Dados recebidos:`, req.body);
      
      // Verificar se o usuário tem permissão de administrador ou é o próprio usuário
      if (user.nivelacesso !== "admin" && user.nivelacesso !== "designer_adm" && user.id !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Se não for admin, limitar quais campos podem ser atualizados
      if (user.nivelacesso !== "admin" && user.nivelacesso !== "designer_adm") {
        // Usuários regulares só podem editar seus próprios dados básicos
        const { name, bio, profileimageurl, website, location } = req.body;
        
        await db
          .update(users)
          .set({
            name: name || null,
            bio: bio || null,
            profileimageurl: profileimageurl || null,
            website: website || null,
            location: location || null,
            // Ajustar para horário de Brasília (UTC-3)
            atualizadoem: new Date(new Date().getTime() - 3 * 60 * 60 * 1000)
          })
          .where(eq(users.id, userId));
      } else {
        // Admins podem editar tudo
        const { username, email, password, name, nivelacesso, isactive, bio, origemassinatura, tipoplano, dataassinatura, dataexpiracao, acessovitalicio, observacaoadmin } = req.body;
        
        // Verificar se usuário existe
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
          
        if (!existingUser) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        
        // Verificar se o novo username ou email já existem (se foram alterados)
        if ((username && username !== existingUser.username) || 
            (email && email !== existingUser.email)) {
          const duplicateUser = await db
            .select()
            .from(users)
            .where(
              and(
                or(
                  username ? eq(users.username, username) : sql`FALSE`,
                  email ? eq(users.email, email) : sql`FALSE`
                ),
                ne(users.id, userId)
              )
            )
            .limit(1);
            
          if (duplicateUser.length > 0) {
            return res.status(400).json({ 
              message: duplicateUser[0].username === username 
                ? "Nome de usuário já existe" 
                : "Email já cadastrado"
            });
          }
        }
        
        // Preparar objeto de atualização
        const updateData: Record<string, any> = {
          atualizadoem: new Date()
        };
        
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (name !== undefined) updateData.name = name || null;
        if (bio !== undefined) updateData.bio = bio || null;
        if (nivelacesso) {
          updateData.nivelacesso = nivelacesso;
          // Também atualizamos o role para compatibilidade
          updateData.role = nivelacesso;
        }
        if (isactive !== undefined) updateData.isactive = isactive;
        if (origemassinatura !== undefined) updateData.origemassinatura = origemassinatura || null;
        if (tipoplano !== undefined) updateData.tipoplano = tipoplano || null;
        if (dataassinatura !== undefined) updateData.dataassinatura = dataassinatura ? new Date(dataassinatura) : null;
        if (dataexpiracao !== undefined) updateData.dataexpiracao = dataexpiracao ? new Date(dataexpiracao) : null;
        if (acessovitalicio !== undefined) updateData.acessovitalicio = acessovitalicio;
        if (observacaoadmin !== undefined) updateData.observacaoadmin = observacaoadmin || null;
        
        // Criptografar a nova senha se fornecida
        if (password) {
          // Nova regra: quando admin ou suporte reseta a senha de outros usuários, usa a senha padrão designauto@123
          const usandoSenhaPadrao = (user.nivelacesso === "admin" || user.nivelacesso === "support") && user.id !== userId;
          const senhaParaUsar = usandoSenhaPadrao ? "designauto@123" : password;
            
          console.log(`Senha sendo alterada por ${user.nivelacesso}, usando ${usandoSenhaPadrao ? "senha padrão 'designauto@123'" : "senha personalizada"}`);
          
          // Se estiver usando a senha padrão, registrar isso na observação do administrador
          if (usandoSenhaPadrao) {
            const dataAtual = new Date().toISOString().split('T')[0];
            const observacaoAtual = existingUser.observacaoadmin || '';
            const observacaoNova = observacaoadmin || '';
            
            // Usar a nova observação se fornecida, ou adicionar à existente
            const observacaoFinal = observacaoadmin !== undefined 
              ? `${observacaoNova} [${dataAtual}] Senha redefinida para padrão por ${user.username} (${user.nivelacesso}).`.trim()
              : `${observacaoAtual} [${dataAtual}] Senha redefinida para padrão por ${user.username} (${user.nivelacesso}).`.trim();
              
            updateData.observacaoadmin = observacaoFinal;
          }
          
          const salt = randomBytes(16).toString("hex");
          const buf = await scryptAsync(senhaParaUsar, salt, 64) as Buffer;
          const hashedPassword = `${buf.toString("hex")}.${salt}`;
          updateData.password = hashedPassword;
        }
        
        // Atualizar usuário
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));
          
        // Verificar se está atualizando para usuário premium ou se o usuário já era premium
        // Consultar status atual do usuário para verificar se já era premium
        if (nivelacesso === 'premium' || existingUser.nivelacesso === 'premium') {
          // Definir o nível de acesso efetivo para o usuário (o novo valor ou o existente)
          const effectiveNivelAcesso = nivelacesso || existingUser.nivelacesso;
          
          // Se o usuário for premium (atual ou após atualização), atualizar dados da assinatura
          if (effectiveNivelAcesso === 'premium') {
            // Processar data de expiração com base no tipo de plano
            let endDate: Date | null = null;
            
            // Determinar se tem acesso vitalício (novo valor ou o existente)
            const hasLifetimeAccess = acessovitalicio !== undefined ? acessovitalicio : existingUser.acessovitalicio;
            
            if (hasLifetimeAccess) {
              // Usuário com acesso vitalício não tem data de expiração
              endDate = null;
            } else if (dataexpiracao) {
              // Usar a data de expiração fornecida
              endDate = new Date(dataexpiracao);
            } else if (existingUser.dataexpiracao) {
              // Manter a data de expiração existente
              endDate = new Date(existingUser.dataexpiracao);
            }
            
            // Determinar o tipo de plano (novo valor ou o existente)
            const effectiveTipoPlano = tipoplano || existingUser.tipoplano || 'mensal';
            
            console.log(`Atualizando assinatura premium para o usuário ${userId}:`, {
              tipo: effectiveTipoPlano,
              vitalicio: hasLifetimeAccess,
              expiracao: endDate
            });
            
            // Criar ou atualizar registro de assinatura
            await SubscriptionService.createOrUpdateSubscription(
              userId, 
              effectiveTipoPlano, 
              new Date(), // Data de início (atual)
              endDate
            );
          }
        }
      }
      
      // Retornar usuário atualizado
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      console.log(`[UserUpdate] Usuário ${userId} atualizado. Novos dados:`, {
        username: updatedUser.username,
        nivelacesso: updatedUser.nivelacesso,
        tipoplano: updatedUser.tipoplano,
        origemassinatura: updatedUser.origemassinatura,
        dataassinatura: updatedUser.dataassinatura,
        dataexpiracao: updatedUser.dataexpiracao,
        acessovitalicio: updatedUser.acessovitalicio
      });
        
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // Rota para atualizar um usuário existente via PATCH
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const userId = parseInt(req.params.id);
      
      console.log(`[UserUpdate PATCH] Atualizando usuário ${userId}. Requisição feita por: ${user.username} (ID: ${user.id}, Nível: ${user.nivelacesso})`);
      console.log(`[UserUpdate PATCH] Dados recebidos:`, req.body);
      
      // Verificar se o usuário tem permissão de administrador ou é o próprio usuário
      if (user.nivelacesso !== "admin" && user.nivelacesso !== "designer_adm" && user.id !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Se não for admin, limitar quais campos podem ser atualizados
      if (user.nivelacesso !== "admin" && user.nivelacesso !== "designer_adm") {
        // Usuários regulares só podem editar seus próprios dados básicos
        const { name, bio, profileimageurl, website, location } = req.body;
        
        const updateData: Record<string, any> = {
          atualizadoem: new Date()
        };
        
        if (name !== undefined) updateData.name = name || null;
        if (bio !== undefined) updateData.bio = bio || null;
        if (profileimageurl !== undefined) updateData.profileimageurl = profileimageurl || null;
        if (website !== undefined) updateData.website = website || null;
        if (location !== undefined) updateData.location = location || null;
        
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));
      } else {
        // Admins podem editar tudo (mesma lógica do PUT)
        const { username, email, password, name, nivelacesso, isactive, bio, origemassinatura, tipoplano, dataassinatura, dataexpiracao, acessovitalicio, observacaoadmin, website, location } = req.body;
        
        // Verificar se usuário existe
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
          
        if (!existingUser) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        
        // Preparar objeto de atualização
        const updateData: Record<string, any> = {
          atualizadoem: new Date()
        };
        
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (name !== undefined) updateData.name = name || null;
        if (bio !== undefined) updateData.bio = bio || null;
        if (website !== undefined) updateData.website = website || null;
        if (location !== undefined) updateData.location = location || null;
        if (nivelacesso) {
          updateData.nivelacesso = nivelacesso;
          updateData.role = nivelacesso;
        }
        if (isactive !== undefined) updateData.isactive = isactive;
        if (origemassinatura !== undefined) updateData.origemassinatura = origemassinatura || null;
        if (tipoplano !== undefined) updateData.tipoplano = tipoplano || null;
        if (dataassinatura !== undefined) updateData.dataassinatura = dataassinatura ? new Date(dataassinatura) : null;
        if (dataexpiracao !== undefined) updateData.dataexpiracao = dataexpiracao ? new Date(dataexpiracao) : null;
        if (acessovitalicio !== undefined) updateData.acessovitalicio = acessovitalicio;
        if (observacaoadmin !== undefined) updateData.observacaoadmin = observacaoadmin || null;
        
        // Atualizar usuário
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));
      }
      
      // Retornar usuário atualizado
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Erro ao atualizar usuário (PATCH):", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // Rota para excluir um usuário (apenas para administradores)
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Evitar que um administrador exclua a si mesmo
      const requestingUser = req.user as User;
      if (requestingUser.id === userId) {
        return res.status(400).json({ message: "Não é possível excluir seu próprio usuário" });
      }
      
      // Verificar se o usuário existe
      const userToDelete = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
        
      if (userToDelete.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Excluir todas as referências ao usuário em outras tabelas
      console.log(`Deletando usuário ${userId} - ${userToDelete[0].username} (${userToDelete[0].email})`);
      console.log("Removendo referências em outras tabelas...");
      
      try {
        // Remover assinaturas
        try {
          await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
          console.log("- Assinaturas removidas");
        } catch (error) {
          console.log("- Não foi possível remover assinaturas:", error);
        }
        
        // Remover favoritos
        try {
          await db.delete(favorites).where(eq(favorites.userId, userId));
          console.log("- Favoritos removidos");
        } catch (error) {
          console.log("- Não foi possível remover favoritos:", error);
        }
        
        // Remover visualizações
        try {
          await db.delete(views).where(eq(views.userId, userId));
          console.log("- Visualizações removidas");
        } catch (error) {
          console.log("- Não foi possível remover visualizações:", error);
        }
        
        // Remover downloads
        try {
          await db.delete(downloads).where(eq(downloads.userId, userId));
          console.log("- Downloads removidos");
        } catch (error) {
          console.log("- Não foi possível remover downloads:", error);
        }
        
        // Remover comentários na comunidade
        try {
          await db.delete(communityComments).where(eq(communityComments.userId, userId));
          console.log("- Comentários removidos");
        } catch (error) {
          console.log("- Não foi possível remover comentários:", error);
        }
        
        // Remover posts na comunidade
        try {
          await db.delete(communityPosts).where(eq(communityPosts.userId, userId));
          console.log("- Posts removidos");
        } catch (error) {
          console.log("- Não foi possível remover posts:", error);
        }
        
        // Verificar se a tabela userFollows existe antes de tentar usar
        try {
          // Remover relações de seguidores/seguindo
          await db.execute(sql.raw(`
            DELETE FROM "userFollows" 
            WHERE "followerId" = ${userId} 
            OR "followingId" = ${userId}
          `));
          console.log("- Relações de seguidores removidas");
        } catch (error) {
          console.log("- Não foi possível remover relações de seguidores:", error);
        }
        
        // Verificar artes criadas pelo usuário e decidir se serão excluídas
        if (userToDelete[0].role === 'designer' || userToDelete[0].role === 'designer_adm') {
          const artsCount = await db
            .select({ count: count() })
            .from(arts)
            .where(eq(arts.designerid, userId));
            
          if (artsCount[0].count > 0) {
            console.log(`- Usuário possui ${artsCount[0].count} artes como designer. Artes serão mantidas.`);
          }
        }
        
        // Finalmente, excluir o usuário
        const result = await db
          .delete(users)
          .where(eq(users.id, userId));
          
        if (!result || result.rowCount === 0) {
          return res.status(500).json({ message: "Erro ao excluir usuário" });
        }
        
        console.log(`Usuário ${userId} excluído com sucesso`);
        
        res.json({ 
          success: true, 
          message: "Usuário excluído com sucesso" 
        });
      } catch (deleteError) {
        console.error("Erro ao excluir referências do usuário:", deleteError);
        throw deleteError; // Propaga o erro para o tratamento geral
      }
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // =============================================
  // SISTEMA DE DESIGNERS - ROTAS
  // =============================================

  // Lista de todos os designers (usuários com role designer ou admin)
  app.get("/api/designers", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const sort = (req.query.sort as string) || 'recent'; // 'activity', 'recent'
      const offset = (page - 1) * limit;
      
      // Buscar todos os usuários com nivelacesso 'designer', 'designer_adm' ou 'admin'
      // Executar SQL direto para evitar problemas com o TypeScript
      const designersQuery = `
        SELECT 
          id, 
          name, 
          username, 
          bio, 
          profileimageurl, 
          nivelacesso, 
          role, 
          0 AS followers, 
          0 AS following, 
          "createdAt" as createdat,
          updatedat
        FROM users 
        WHERE nivelacesso IN ('designer', 'designer_adm', 'admin')
        ORDER BY ${sort === 'activity' ? 'updatedat' : '"createdAt"'} DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const designers = await db.execute(sql.raw(designersQuery));
      
      // Obter contagem total
      const totalCountQuery = `
        SELECT COUNT(*) as value 
        FROM users 
        WHERE nivelacesso IN ('designer', 'designer_adm', 'admin')
      `;
      
      const totalCountResult = await db.execute(sql.raw(totalCountQuery));
      const totalCount = parseInt(totalCountResult.rows[0].value.toString());
      
      // Para cada designer, buscar algumas artes para exibir
      const designersWithArts = await Promise.all(designers.rows.map(async (designer: any) => {
        const artsQuery = `
          SELECT 
            id, 
            title, 
            "imageUrl" as imageurl, 
            "isPremium" as ispremium
          FROM arts 
          WHERE designerid = ${designer.id}
          ORDER BY "createdAt" DESC
          LIMIT 4
        `;
        
        const recentArts = await db.execute(sql.raw(artsQuery));
        
        // Adaptamos os nomes de campo para o padrão CamelCase esperado pelo frontend
        return {
          ...designer,
          profileImageUrl: designer.profileimageurl,
          createdAt: designer.createdat,
          nivelAcesso: designer.nivelacesso, // Adicionamos o nivelacesso explicitamente
          arts: recentArts.rows.map((art: any) => ({
            id: art.id,
            title: art.title,
            imageUrl: art.imageurl,
            isPremium: art.ispremium
          }))
        };
      }));
      
      res.json({
        designers: designersWithArts,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Erro ao buscar designers:", error);
      res.status(500).json({ message: "Erro ao buscar designers" });
    }
  });
  
  // Detalhes de um designer específico por username
  app.get("/api/designers/:username", async (req, res) => {
    try {
      const username = req.params.username;
      
      // Buscar designer pelo username - executando SQL direto
      const designerQuery = `
        SELECT 
          id, 
          name, 
          username, 
          bio, 
          profileimageurl, 
          nivelacesso, 
          role, 
          0 AS followers, 
          0 AS following, 
          "createdAt" as createdat
        FROM users 
        WHERE username = '${username}'
      `;
      
      const result = await db.execute(sql.raw(designerQuery));
      const designer = result.rows[0];
      
      if (!designer) {
        return res.status(404).json({ message: "Designer não encontrado" });
      }
      
      // Verificar se o usuário logado já segue este designer
      let isFollowing = false;
      if (req.user) {
        const followerId = (req.user as any).id;
        const followQuery = `
          SELECT * FROM "userFollows"
          WHERE "followerId" = ${followerId} AND "followingId" = ${designer.id}
        `;
        
        const followResult = await db.execute(sql.raw(followQuery));
        isFollowing = followResult.rows.length > 0;
      }
      
      // Buscar as artes deste designer
      const artsQuery = `
        SELECT 
          id, 
          title, 
          "imageUrl" as imageurl, 
          "isPremium" as ispremium, 
          format, 
          "createdAt" as createdat,
          viewcount,
          "downloadCount" as downloadcount
        FROM arts
        WHERE designerid = ${designer.id}
        ORDER BY "createdAt" DESC
      `;
      
      const artsResult = await db.execute(sql.raw(artsQuery));
      const designerArts = artsResult.rows;
      
      // Contagens
      const artCount = designerArts.length;
      const premiumArtCount = designerArts.filter((art: any) => art.isPremium).length;
      
      // Calcular estatísticas
      // Agora que a coluna downloadCount existe, calculamos a soma real
      const totalDownloads = designerArts.reduce((sum: number, art: any) => sum + (parseInt(art.downloadcount) || 0), 0);
      const totalViews = designerArts.reduce((sum: number, art: any) => sum + (parseInt(art.viewcount) || 0), 0);
      
      // Adaptamos os nomes de campo para o padrão CamelCase esperado pelo frontend
      const response = {
        ...designer,
        // Ajustar campos para camelCase para manter compatibilidade com frontend
        profileImageUrl: designer.profileimageurl,
        createdAt: designer.createdat,
        nivelAcesso: designer.nivelacesso, // Adicionamos o nivelacesso explicitamente
        isFollowing,
        statistics: {
          totalArts: artCount,
          premiumArts: premiumArtCount,
          totalDownloads,
          totalViews
        },
        arts: designerArts.map((art: any) => ({
          id: art.id,
          title: art.title,
          imageUrl: art.imageurl,
          format: art.format,
          isPremium: art.ispremium,
          createdAt: art.createdat
        }))
      };
      
      res.json(response);
    } catch (error) {
      console.error("Erro ao buscar detalhes do designer:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do designer" });
    }
  });
  
  // Buscar artes de um designer específico (paginada)
  app.get("/api/designers/:id/arts", async (req, res) => {
    try {
      const designerId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      
      // Verificar se o designer existe
      const [designer] = await db.select()
        .from(users)
        .where(eq(users.id, designerId));
      
      if (!designer) {
        return res.status(404).json({ message: "Designer não encontrado" });
      }
      
      // Buscar artes com paginação
      const offset = (page - 1) * limit;
      const designerArts = await db.select()
        .from(arts)
        .where(eq(arts.designerid, designerId))
        .orderBy(desc(arts.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Contar total de artes
      const [{ value: totalCount }] = await db.select({
        value: count()
      })
      .from(arts)
      .where(eq(arts.designerid, designerId));
      
      res.json({
        arts: designerArts,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Erro ao buscar artes do designer:", error);
      res.status(500).json({ message: "Erro ao buscar artes do designer" });
    }
  });
  
  // Seguir um designer (protegido por autenticação)
  app.post("/api/follow/:designerId", isAuthenticated, async (req, res) => {
    try {
      const designerId = parseInt(req.params.designerId);
      const followerId = (req.user as any).id;
      
      // Verificar se o designer existe
      const [designer] = await db.select()
        .from(users)
        .where(eq(users.id, designerId));
      
      if (!designer) {
        return res.status(404).json({ message: "Designer não encontrado" });
      }
      
      // Verificar se não está tentando seguir a si mesmo
      if (followerId === designerId) {
        return res.status(400).json({ message: "Você não pode seguir a si mesmo" });
      }
      
      // Verificar se já segue
      const [existingFollow] = await db.select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, followerId),
            eq(userFollows.followingId, designerId)
          )
        );
      
      if (existingFollow) {
        return res.status(400).json({ message: "Você já segue este designer" });
      }
      
      // Criar novo registro de seguidor
      await db.insert(userFollows)
        .values({
          followerId,
          followingId: designerId
        });
      
      // Atualizar contadores de seguidores e seguindo
      await db.execute(sql.raw(`
        UPDATE users 
        SET followers = followers + 1 
        WHERE id = ${designerId}
      `));
      
      await db.execute(sql.raw(`
        UPDATE users 
        SET following = following + 1 
        WHERE id = ${followerId}
      `));
      
      res.status(201).json({ message: "Designer seguido com sucesso" });
    } catch (error) {
      console.error("Erro ao seguir designer:", error);
      res.status(500).json({ message: "Erro ao seguir designer" });
    }
  });
  
  // Deixar de seguir um designer (protegido por autenticação)
  app.delete("/api/unfollow/:designerId", isAuthenticated, async (req, res) => {
    try {
      const designerId = parseInt(req.params.designerId);
      const followerId = (req.user as any).id;
      
      // Verificar se o registro de seguidor existe
      const [existingFollow] = await db.select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, followerId),
            eq(userFollows.followingId, designerId)
          )
        );
      
      if (!existingFollow) {
        return res.status(400).json({ message: "Você não segue este designer" });
      }
      
      // Remover registro de seguidor
      await db.delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, followerId),
            eq(userFollows.followingId, designerId)
          )
        );
      
      // Atualizar contadores de seguidores e seguindo (decremento)
      await db.execute(sql.raw(`
        UPDATE users 
        SET followers = GREATEST(followers - 1, 0) 
        WHERE id = ${designerId}
      `));
      
      await db.execute(sql.raw(`
        UPDATE users 
        SET following = GREATEST(following - 1, 0) 
        WHERE id = ${followerId}
      `));
      
      res.status(200).json({ message: "Deixou de seguir o designer com sucesso" });
    } catch (error) {
      console.error("Erro ao deixar de seguir designer:", error);
      res.status(500).json({ message: "Erro ao deixar de seguir designer" });
    }
  });
  
  // Atualizar perfil do designer (protegido por autenticação)
  app.put("/api/designers/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { name, bio, website, location, socialLinks } = req.body;
      
      // Verificar se o usuário existe
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o usuário tem permissão para ser designer
      if (user.nivelacesso !== 'designer' && user.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Apenas designers podem atualizar perfil" });
      }
      
      // Atualizar perfil do designer
      await db.update(users)
        .set({
          name: name || user.name,
          bio: bio || user.bio,
          website: website || user.website,
          location: location || user.location,
          sociallinks: socialLinks || user.sociallinks,
          atualizadoem: new Date()
        })
        .where(eq(users.id, userId));
      
      // Buscar dados atualizados do usuário
      const [updatedUser] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        nivelAcesso: updatedUser.nivelacesso,
        bio: updatedUser.bio,
        website: updatedUser.website,
        location: updatedUser.location,
        socialLinks: updatedUser.sociallinks,
        profileImageUrl: updatedUser.profileimageurl,
        followers: updatedUser.followers,
        following: updatedUser.following,
        createdAt: updatedUser.criadoem
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });
  
  // Atualizar imagem de perfil do designer (protegido por autenticação)
  // Endpoint para upload de imagem de perfil para usuários comuns
  app.post("/api/users/profile-image", isAuthenticated, uploadMemory.single('image'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Verificar se o arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }
      
      // Verificar se o usuário existe
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Opções para o processamento da imagem
      const options = {
        width: 400,  // Tamanho adequado para avatar de perfil
        height: 400,
        quality: 85,
        format: 'webp' as const
      };
      
      // Tentar fazer upload usando Supabase (prioridade)
      let imageUrl;
      
      // Usando Supabase Storage (prioridade)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        try {
          console.log("Tentando upload de imagem de perfil para Supabase...");
          
          // Verificar se temos um arquivo para processar
          if (req.file) {
            const uploadResult = await supabaseStorageService.uploadImage(req.file, options);
            imageUrl = uploadResult.imageUrl;
          }
          
          console.log("Upload para Supabase concluído com sucesso:", imageUrl);
        } catch (supabaseError) {
          console.error("Erro no upload para Supabase:", supabaseError);
          // Se falhar, continua para próximo método
        }
      }
      
      // Fallback para R2 se Supabase falhar
      if (!imageUrl && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
        try {
          console.log("Tentando upload de imagem de perfil para R2...");
          
          if (req.file) {
            const r2Result = await storageService.uploadImage(req.file, options);
            imageUrl = r2Result.imageUrl;
          }
          
          console.log("Upload para R2 concluído com sucesso:", imageUrl);
        } catch (r2Error) {
          console.error("Erro no upload para R2:", r2Error);
          // Se falhar, continua para o último método
        }
      }
      
      // Último recurso: armazenamento local
      if (!imageUrl && req.file) {
        console.log("Usando armazenamento local para imagem de perfil...");
        
        // Se estamos usando o storage em disco do multer, pegamos o caminho do arquivo
        if (req.file.path) {
          imageUrl = '/uploads/' + path.basename(req.file.path);
          console.log("Caminho da imagem local:", imageUrl);
        } else {
          // Caso contrário, usamos o método localUpload do serviço
          const localResult = await storageService.localUpload(req.file, options);
          imageUrl = localResult.imageUrl;
        }
      }
      
      // Atualizar perfil do usuário com nova imagem
      await db.update(users)
        .set({
          profileimageurl: imageUrl,
          atualizadoem: new Date() // Usando o campo correto conforme o schema
        })
        .where(eq(users.id, userId));
      
      // Retornar URL da imagem para uso no frontend
      return res.json({ imageUrl });
    } catch (error) {
      console.error("Erro ao processar upload de imagem de perfil:", error);
      return res.status(500).json({ message: "Erro ao processar imagem de perfil" });
    }
  });
  
  // Endpoint específico para designers (mantido para compatibilidade)
  app.post("/api/designers/profile-image", isAuthenticated, uploadMemory.single('image'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Verificar se o arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }
      
      // Verificar se o usuário existe
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o usuário tem permissão para ser designer
      if (user.nivelacesso !== 'designer' && user.nivelacesso !== 'designer_adm' && user.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Apenas designers podem atualizar imagem de perfil" });
      }
      
      // Opções para o processamento da imagem
      const options = {
        width: 400,  // Tamanho adequado para avatar de perfil
        height: 400,
        quality: 85,
        format: 'webp' as const
      };
      
      // Tentar fazer upload usando Supabase (prioridade)
      let imageUrl;
      
      // Usando Supabase Storage (prioridade)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        try {
          console.log("Tentando upload de imagem de perfil para Supabase...");
          
          // Verificar se temos um arquivo para processar
          if (req.file) {
            const uploadResult = await supabaseStorageService.uploadImage(req.file, options);
            imageUrl = uploadResult.imageUrl;
          }
          
          console.log("Upload para Supabase concluído com sucesso:", imageUrl);
        } catch (supabaseError) {
          console.error("Erro no upload para Supabase:", supabaseError);
          // Se falhar, continua para próximo método
        }
      }
      
      // Fallback para R2 se Supabase falhar
      if (!imageUrl && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
        try {
          console.log("Tentando upload de imagem de perfil para R2...");
          
          if (req.file) {
            const r2Result = await storageService.uploadImage(req.file, options);
            imageUrl = r2Result.imageUrl;
          }
          
          console.log("Upload para R2 concluído com sucesso:", imageUrl);
        } catch (r2Error) {
          console.error("Erro no upload para R2:", r2Error);
          // Se falhar, continua para o último método
        }
      }
      
      // Último recurso: armazenamento local
      if (!imageUrl && req.file) {
        console.log("Usando armazenamento local para imagem de perfil...");
        
        // Se estamos usando o storage em disco do multer, pegamos o caminho do arquivo
        if (req.file.path) {
          imageUrl = '/uploads/' + path.basename(req.file.path);
          console.log("Caminho da imagem local:", imageUrl);
        } else {
          // Caso contrário, usamos o método localUpload do serviço
          const localResult = await storageService.localUpload(req.file, options);
          imageUrl = localResult.imageUrl;
        }
      }
      
      // Atualizar perfil do designer com nova imagem
      await db.update(users)
        .set({
          profileimageurl: imageUrl,
          atualizadoem: new Date() // Usando o campo correto conforme o schema
        })
        .where(eq(users.id, userId));
      
      res.json({ 
        message: "Imagem de perfil atualizada com sucesso",
        profileImageUrl: imageUrl 
      });
    } catch (error) {
      console.error("Erro ao atualizar imagem de perfil", error);
      res.status(500).json({ message: "Erro ao atualizar imagem de perfil" });
    }
  });

  // Listar seguidores de um designer
  app.get("/api/designers/:id/followers", async (req, res) => {
    try {
      const designerId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Verificar se o designer existe
      const [designer] = await db.select()
        .from(users)
        .where(eq(users.id, designerId));
      
      if (!designer) {
        return res.status(404).json({ message: "Designer não encontrado" });
      }
      
      // Calcular offset para paginação
      const offset = (page - 1) * limit;
      
      // Buscar seguidores - usando SQL direto para evitar problemas de case
      const followersQuery = `
        SELECT 
          u.id, 
          u.name, 
          u.username, 
          u.profileimageurl AS "profileImageUrl", 
          u.role,
          u.nivelacesso AS "nivelAcesso", 
          0 AS following, 
          0 AS followers, 
          uf.createdat AS "followDate"
        FROM "userFollows" uf
        INNER JOIN users u ON uf."followerId" = u.id
        WHERE uf."followingId" = ${designerId}
        ORDER BY uf.createdat DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const followersResult = await db.execute(sql.raw(followersQuery));
      const followers = followersResult.rows;
      
      // Contar total de seguidores usando SQL direto
      const totalCountQuery = `
        SELECT COUNT(*) as value 
        FROM "userFollows" 
        WHERE "followingId" = ${designerId}
      `;
      
      const totalCountResult = await db.execute(sql.raw(totalCountQuery));
      const totalCount = parseInt(totalCountResult.rows[0].value.toString());
      
      res.json({
        followers,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Erro ao buscar seguidores:", error);
      res.status(500).json({ message: "Erro ao buscar seguidores" });
    }
  });
  
  // =============================================
  // SISTEMA DE ASSINATURAS - ROTAS
  // =============================================
  
  // Verificar assinaturas expiradas e rebaixar usuários (apenas para admin)
  app.post("/api/admin/subscriptions/check-expired", isAdmin, async (req, res) => {
    try {
      const downgradedCount = await SubscriptionService.checkExpiredSubscriptions();
      res.json({ 
        success: true, 
        message: `${downgradedCount} usuários rebaixados para free`,
        downgradedCount
      });
    } catch (error) {
      console.error("Erro ao verificar assinaturas expiradas:", error);
      res.status(500).json({ message: "Erro ao verificar assinaturas expiradas" });
    }
  });
  
  // Força downgrade de um usuário específico para nível free (apenas para admin - para testes)
  app.post("/api/admin/subscriptions/force-downgrade/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Verificar se o usuário existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
        
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Forçar rebaixamento
      const success = await SubscriptionService.downgradeUserToFree(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Erro ao rebaixar usuário" });
      }
      
      res.json({ 
        success: true, 
        message: `Usuário ${user.username} rebaixado para free com sucesso`
      });
    } catch (error) {
      console.error("Erro ao rebaixar usuário:", error);
      res.status(500).json({ message: "Erro ao rebaixar usuário" });
    }
  });

  // Rota para webhook da Hotmart
  app.post("/api/webhooks/hotmart", async (req, res) => {
    try {
      console.log("Webhook da Hotmart recebido:", req.body);
      
      // Validação básica do webhook
      if (!req.body || !req.body.data || !req.body.event) {
        return res.status(400).json({ 
          success: false, 
          message: "Webhook inválido" 
        });
      }
      
      // Processar o webhook usando o serviço
      const result = await SubscriptionService.processHotmartWebhook(req.body);
      
      res.json({ 
        success: true, 
        message: "Webhook processado com sucesso", 
        result 
      });
    } catch (error) {
      console.error("Erro ao processar webhook da Hotmart:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao processar webhook", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Rota para testar rebaixamento de usuário específico (com verificação Hotmart)
  // Temporariamente removida restrição isAdmin para testes
  app.post("/api/test/downgradeUser/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const forceDowngrade = req.body.force === true;
      
      const result = await SubscriptionService.downgradeUserToFree(userId, forceDowngrade);
      
      res.json({ 
        success: true, 
        message: `Processamento de rebaixamento concluído.`, 
        result 
      });
    } catch (error) {
      console.error(`Erro ao rebaixar usuário ${req.params.userId}:`, error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao rebaixar usuário", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Rota para testar verificação de assinaturas expiradas
  app.post("/api/test/expireSubscriptions", async (req, res) => {
    try {
      const result = await SubscriptionService.checkExpiredSubscriptions();
      res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao verificar assinaturas expiradas:', error);
      res.status(500).json({ message: 'Erro ao verificar assinaturas' });
    }
  });
  
  // Rota para testar verificação de assinatura na Hotmart
  app.post("/api/test/checkHotmart", async (req, res) => {
    try {
      const email = req.query.email as string || 'hotmart@example.com';
      console.log(`Teste - Verificando assinatura na Hotmart para e-mail: ${email}`);
      
      const hasActiveSubscription = await HotmartService.hasActiveSubscription(email);
      
      console.log(`Teste - Resultado da verificação na Hotmart: ${hasActiveSubscription ? 'Ativa' : 'Inativa'}`);
      
      res.status(200).json({ 
        email, 
        hasActiveSubscription,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao verificar assinatura na Hotmart:', error);
      res.status(500).json({ message: 'Erro ao verificar assinatura na Hotmart' });
    }
  });
  
  // Rota para teste de logs
  app.post("/api/test/log", (req, res) => {
    const message = req.query.message || 'Teste de log';
    console.log(`[TESTE] ${message}`);
    res.status(200).json({ message: `Log registrado: ${message}` });
  });
  
  // Rota de diagnóstico para execução de SQL - apenas para desenvolvimento
  app.get("/api/execute-sql", isAuthenticated, async (req, res) => {
    try {
      // Forçar permissão para testes de diagnóstico
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ message: "Query inválida" });
      }
      
      // Por segurança, só permitir SELECT COUNT(*) para diagnóstico
      if (!query.toLowerCase().includes("select count(*)")) {
        return res.status(403).json({ message: "Apenas consultas SELECT COUNT(*) são permitidas" });
      }
      
      const result = await db.execute(sql.raw(query));
      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao executar SQL:", error);
      res.status(500).json({ message: "Erro ao executar SQL" });
    }
  });

  const httpServer = createServer(app);
  
  // Inicializar o serviço da Hotmart se as credenciais estiverem disponíveis
  if (process.env.HOTMART_CLIENT_ID && process.env.HOTMART_CLIENT_SECRET) {
    const useSandbox = true; // Usar sandbox para desenvolvimento/teste
    HotmartService.initialize(
      process.env.HOTMART_CLIENT_ID,
      process.env.HOTMART_CLIENT_SECRET,
      useSandbox
    );
    console.log('Serviço da Hotmart inicializado com sucesso no modo Sandbox');
  } else {
    console.log('Credenciais da Hotmart não encontradas. A verificação de renovações na Hotmart não estará disponível.');
  }
  
  return httpServer;
}
