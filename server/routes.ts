import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { arts, insertUserSchema, users, userFollows, categories, collections, views, downloads, favorites, communityPosts, communityComments, formats, fileTypes, testimonials, designerStats, subscriptions, type User } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import imageUploadRoutes from "./routes/image-upload";
import { db } from "./db";
import { eq, isNull, desc, and, count, sql, asc, not, or, ne, inArray } from "drizzle-orm";
import { randomBytes, scrypt } from "crypto";
import { SQL } from "drizzle-orm/sql";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storageService } from "./services/storage";
import { supabaseStorageService } from "./services/supabase-storage";
import uploadMemory from "./middlewares/upload";

export async function registerRoutes(app: Express): Promise<Server> {
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
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        // Data da última atualização é a data da arte mais recente
        const lastUpdate = sortedArts[0].updatedAt;
        
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
      if (user.role !== "admin" && user.role !== "designer_adm" && user.role !== "support") {
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
      
      // Verificar se o usuário tem permissão de administrador
      if (user.role !== "admin" && user.role !== "designer_adm") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { username, email, password, name, role, isactive } = req.body;
      
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
      
      // Criptografar a senha
      const salt = randomBytes(16).toString("hex");
      const buf = await scrypt(password, salt, 64) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      // Criar o usuário
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          name: name || null,
          role: role || "free",
          isActive: isactive !== undefined ? isactive : true,
          profileimageurl: null,
          bio: null,
          // Ajustar para horário de Brasília (UTC-3)
          lastLogin: new Date(new Date().getTime() - 3 * 60 * 60 * 1000),
          // Ajustar para horário de Brasília (UTC-3)
          createdAt: new Date(new Date().getTime() - 3 * 60 * 60 * 1000),
          updatedAt: new Date(new Date().getTime() - 3 * 60 * 60 * 1000)
        })
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
      
      // Verificar se o usuário tem permissão de administrador ou é o próprio usuário
      if (user.role !== "admin" && user.role !== "designer_adm" && user.id !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Se não for admin, limitar quais campos podem ser atualizados
      if (user.role !== "admin" && user.role !== "designer_adm") {
        // Usuários regulares só podem editar seus próprios dados básicos
        const { name, bio, profileimageurl } = req.body;
        
        await db
          .update(users)
          .set({
            name: name || null,
            bio: bio || null,
            profileimageurl: profileimageurl || null,
            // Ajustar para horário de Brasília (UTC-3)
            updatedAt: new Date(new Date().getTime() - 3 * 60 * 60 * 1000)
          })
          .where(eq(users.id, userId));
      } else {
        // Admins podem editar tudo
        const { username, email, password, name, role, isactive, bio } = req.body;
        
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
          updatedAt: new Date()
        };
        
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (name !== undefined) updateData.name = name || null;
        if (bio !== undefined) updateData.bio = bio || null;
        if (role) updateData.role = role;
        if (isactive !== undefined) updateData.isactive = isactive;
        
        // Criptografar a nova senha se fornecida
        if (password) {
          const salt = randomBytes(16).toString("hex");
          const buf = await scrypt(password, salt, 64) as Buffer;
          const hashedPassword = `${buf.toString("hex")}.${salt}`;
          updateData.password = hashedPassword;
        }
        
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
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
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
      
      // Buscar todos os usuários com role 'designer', 'designer_adm' ou 'admin'
      // Executar SQL direto para evitar problemas com o TypeScript
      const designersQuery = `
        SELECT 
          id, 
          name, 
          username, 
          bio, 
          profileimageurl, 
          role, 
          0 AS followers, 
          0 AS following, 
          "createdAt" as createdat,
          updatedat
        FROM users 
        WHERE role IN ('designer', 'designer_adm', 'admin')
        ORDER BY ${sort === 'activity' ? 'updatedat' : '"createdAt"'} DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const designers = await db.execute(sql.raw(designersQuery));
      
      // Obter contagem total
      const totalCountQuery = `
        SELECT COUNT(*) as value 
        FROM users 
        WHERE role IN ('designer', 'designer_adm', 'admin')
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
      if (user.role !== 'designer' && user.role !== 'admin') {
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
          updatedat: new Date()
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
        bio: updatedUser.bio,
        website: updatedUser.website,
        location: updatedUser.location,
        socialLinks: updatedUser.sociallinks,
        profileImageUrl: updatedUser.profileimageurl,
        followers: updatedUser.followers,
        following: updatedUser.following,
        createdAt: updatedUser.createdAt
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });
  
  // Atualizar imagem de perfil do designer (protegido por autenticação)
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
      if (user.role !== 'designer' && user.role !== 'designer_adm' && user.role !== 'admin') {
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
          updatedat: new Date()
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

  const httpServer = createServer(app);
  return httpServer;
}
