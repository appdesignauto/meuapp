import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { arts, insertUserSchema, users, userFollows, categories, collections, views, downloads, favorites, communityPosts, communityComments, formats, fileTypes, testimonials, designerStats, subscriptions, siteSettings, insertSiteSettingsSchema, type User, emailVerificationCodes } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { flexibleAuth } from "./auth-flexible";
import imageUploadRoutes from "./routes/image-upload";
import { setupFollowRoutesSimple } from "./routes/follows-simple";
import { db } from "./db";
import { eq, isNull, desc, and, count, sql, asc, not, or, ne, inArray } from "drizzle-orm";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import bcrypt from "bcrypt";
import { SQL } from "drizzle-orm/sql";
import multer from "multer";
import path from "path";
import fs from "fs";

// Importações adicionais para o upload de imagem
import uploadRouter from "./routes/upload-image";
// Usando apenas Supabase Storage para armazenamento de imagens
import { supabaseStorageService } from "./services/supabase-storage";


import uploadMemory from "./middlewares/upload";
import sharp from "sharp";

// Versão promisificada do scrypt
const scryptAsync = promisify(scrypt);

// Importar nossas rotas personalizadas
import logoUploadRouter from './routes/logo-upload';
import faviconUploadRouter from './routes/favicon-upload'; // Nova rota para upload de favicon
import removeLogoRouter from './routes/remove-logo';
import supabaseRegisterTestRouter from './routes/supabase-register-test';
import avatarUploadRouter from './routes/avatar-upload';
import directAvatarRouter from './routes/direct-avatar'; // Nova rota direta de avatar
import usersProfileImageRouter from './routes/users-profile-image'; // Compatibilidade frontend/produção
import userProfileRouter from './routes/user-profile';
import emailVerificationRouter from './routes/email-verification';
import emailTestRouter from './routes/email-test';
import { emailDiagnosticsRouter } from './routes/email-diagnostics';
import passwordResetRouter from './routes/password-reset';
import { setupTestR2DirectRoute } from './routes/test-r2-direct';
import dateTestRouter from './routes/date-test-routes';
import supabeDiagnosticsRouter from './routes/supabase-diagnostics';
import multiArtRouter from './routes/multi-art'; // Rota para artes multi-formato
import testCreateGroupRouter from './routes/test-create-group'; // Rota de teste para criar grupos
import videoaulasRouter from './routes/videoaulas-routes'; // Rotas para as videoaulas
import courseRouter from './routes/course-routes'; // Rotas para gerenciamento de módulos e aulas
// Importações removidas - serão tratadas diretamente no local de uso
import manifestRouter from './routes/manifest-route'; // Rota para o manifest.json do PWA
import appConfigRouter from './routes/app-config-routes'; // Rotas para configuração do PWA
import imageProxyRouter from './routes/image-proxy'; // Proxy para imagens do Supabase
import coursesRouter from './routes/courses-routes'; // Rotas para gerenciamento de cursos
import { registerPostPositionRoute } from './routes/post-position-route'; // Rota para calcular posição
import ferramentasRouter from './routes/ferramentas-routes'; // Rotas para gerenciamento de ferramentas úteis do post
import popupRouter from './routes/popup-routes'; // Rotas para gerenciamento de popups promocionais
import coursesAdapterRouter from './routes/courses-adapter'; // Adaptador para compatibilidade com rotas antigas
import artesAdapterRouter from './routes/artes-adapter'; // Adaptador para rotas em português da API de artes
import videoCommentsRouter from './routes/video-comments-routes'; // Rotas para comentários de videoaulas
import courseRatingsRouter from './routes/course-ratings-routes'; // Rotas para avaliações de cursos
import lessonThumbnailUploadRouter from './routes/lesson-thumbnail-upload'; // Rota para upload de thumbnails de aulas
import courseThumbnailUploadRouter from './routes/course-thumbnail-upload'; // Rota para upload de thumbnails de cursos
import bannerUploadRouter from './routes/banner-upload'; // Rota para upload de banners de
import moduleUploadRouter from './routes/module-upload'; // Rota para upload de thumbnails de módulos cursos
import communityRouter from './routes/community-routes'; // Rotas para o sistema de comunidade
import ferramentasUploadRouter from './routes/ferramentas-upload'; // Rotas para upload de imagens 
import analyticsRouter from './routes/analytics'; // Rotas para gerenciamento de analytics
import sitemapRouter from './routes/sitemap'; // Rotas para sitemap.xml e robots.txt
import { convertImageUrlsMiddleware } from './routes/image-url-proxy'; // Middleware para converter URLs de imagens
import imageProxyTestRouter from './routes/image-proxy-test'; // Rota para testar o proxy de imagens
import reportsRouter from './routes/reports'; // Rotas para o sistema de denúncias (versão completamente funcional)
 // Rotas para estatísticas dos reports
// Arquivo reports-v2 removido por questões de segurança // Rotas para o sistema de denúncias (reescrito)

import { PrismaClient } from '@prisma/client';

export async function registerRoutes(app: Express): Promise<Server> {
  // Aplicar middleware global para converter URLs de imagens para todas as respostas JSON
  app.use(convertImageUrlsMiddleware());
  
  // Rota simples de verificação de saúde
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      message: 'Servidor está funcionando corretamente'
    });
  });

  // 🚀 ENDPOINT FUNCIONANDO - Novo nome para evitar conflitos de middleware
  app.get("/api/admin/subscription-data", (req, res) => {
    console.log("🚀 ENDPOINT FUNCIONANDO: Consultando usuários...");
    
    // Definir headers antes de qualquer resposta
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    client.connect()
      .then(() => {
        return client.query(`
          SELECT 
            id, username, email, name, nivelacesso, 
            tipoplano, dataassinatura, dataexpiracao, origemassinatura, criadoem
          FROM users 
          WHERE isactive = true
  // All subscription endpoints and metrics have been removed

  return server;
}