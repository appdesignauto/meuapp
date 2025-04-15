import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware and routes
  const { isAuthenticated, isPremium, isAdmin, isDesigner, hasRole } = setupAuth(app);

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar categorias" });
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
      res.status(500).json({ message: "Erro ao buscar artes" });
    }
  });

  app.get("/api/arts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const art = await storage.getArtById(id);
      
      if (!art) {
        return res.status(404).json({ message: "Arte não encontrada" });
      }
      
      // Check if user has access to premium content
      if (art.isPremium) {
        const user = req.user as any;
        if (!user || user.role !== 'premium') {
          return res.status(403).json({ 
            message: "Conteúdo premium. Faça upgrade para acessar.",
            isPremium: true
          });
        }
      }
      
      res.json(art);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar arte" });
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

  const httpServer = createServer(app);
  return httpServer;
}
