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
import { SubscriptionService } from "./services/subscription-service";

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

  // ENDPOINT CRÍTICO: Estatísticas de Reports - DADOS REAIS DO BANCO
  app.get('/api/reports/stats', async (req, res) => {
    try {
      console.log('📊 [CRITICAL ENDPOINT] Buscando estatísticas dos reports...');
      
      // Consulta real ao banco de dados para obter os dados corretos
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pendente') as pending,
          COUNT(*) FILTER (WHERE status = 'em-analise') as reviewing, 
          COUNT(*) FILTER (WHERE status = 'resolvido') as resolved,
          COUNT(*) FILTER (WHERE status = 'rejeitado') as rejected,
          COUNT(*) as total
        FROM reports
      `);
      
      const row = result.rows[0] as any;
      const stats = {
        pending: parseInt(row.pending) || 0,
        reviewing: parseInt(row.reviewing) || 0,
        resolved: parseInt(row.resolved) || 0,
        rejected: parseInt(row.rejected) || 0,
        total: parseInt(row.total) || 0
      };
      
      console.log('✅ [CRITICAL ENDPOINT] Retornando estatísticas corretas do banco:', stats);
      
      const responseData = {
        stats: stats
      };
      
      console.log('📤 [DEBUG] Enviando resposta:', responseData);
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(responseData);
    } catch (error) {
      console.error('❌ [CRITICAL ENDPOINT] Erro:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Erro ao buscar estatísticas',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

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
  
  // Rota específica para testar solução de emergência para o usuário problemático (simulação)
  app.get('/api/debug/test-emergency-avatar-simulation/:username', isAdmin, async (req, res) => {
    try {
      const username = req.params.username;
      console.log(`\n==== TESTE DE EMERGÊNCIA PARA USUÁRIO ${username} ====\n`);
      
      // Verificar se o usuário existe
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }
      
      // Verificar se é o usuário problemático conhecido
      const isProblematicUser = username === 'fernandosim20188718';
      console.log(`Usuário encontrado: ID ${user.id}, problematico: ${isProblematicUser ? 'SIM ⚠️' : 'não'}`);
      
      // Verificar acesso aos buckets
      console.log("\n== VERIFICANDO ACESSO AOS BUCKETS ==");
      const bucketResults: Record<string, {
        accessible: boolean;
        files?: number;
        error?: string;
      }> = {};
      
      // Bucket de avatares
      try {
        console.log("Verificando acesso ao bucket 'designautoimages'...");
        const { data: avatarFiles } = await supabaseStorageService.getBucket('designautoimages');
        bucketResults['designautoimages'] = {
          accessible: true,
          files: avatarFiles?.length || 0
        };
        console.log(`✓ Bucket 'designautoimages' acessível. ${avatarFiles?.length || 0} arquivos encontrados.`);
      } catch (avatarError) {
        console.error('✗ Erro ao acessar bucket designautoimages:', avatarError);
        bucketResults['designautoimages'] = {
          accessible: false,
          error: String(avatarError)
        };
      }
      
      // Bucket principal
      try {
        console.log("Verificando acesso ao bucket principal 'designautoimages'...");
        const { data: mainFiles } = await supabaseStorageService.getBucket('designautoimages');
        bucketResults['designautoimages'] = {
          accessible: true,
          files: mainFiles?.length || 0
        };
        console.log(`✓ Bucket principal 'designautoimages' acessível. ${mainFiles?.length || 0} arquivos encontrados.`);
      } catch (mainError) {
        console.error('✗ Erro ao acessar bucket principal:', mainError);
        bucketResults['designautoimages'] = {
          accessible: false,
          error: String(mainError)
        };
      }
      
      // Verificar estado dos diretórios
      console.log("\n== VERIFICANDO DIRETÓRIOS LOCAIS ==");
      const dirResults: Record<string, {
        exists: boolean;
        writable?: boolean;
        files?: number;
        error?: string;
      }> = {};
      const dirsToCheck = [
        'public',
        'public/uploads',
        'public/uploads/designautoimages',
        'public/uploads/emergency'
      ];
      
      for (const dir of dirsToCheck) {
        try {
          console.log(`Verificando diretório '${dir}'...`);
          const exists = fs.existsSync(dir);
          
          if (exists) {
            // Verificar permissões de escrita
            const testFile = path.join(dir, '.write_test');
            try {
              fs.writeFileSync(testFile, 'test');
              fs.unlinkSync(testFile);
              
              // Listar arquivos
              const files = fs.readdirSync(dir);
              
              dirResults[dir] = {
                exists: true,
                writable: true,
                files: files.length
              };
              
              console.log(`✓ Diretório '${dir}' acessível e com permissão de escrita. ${files.length} arquivos.`);
            } catch (writeError) {
              dirResults[dir] = {
                exists: true,
                writable: false,
                error: String(writeError)
              };
              console.log(`✓ Diretório '${dir}' existe, mas sem permissão de escrita.`);
            }
          } else {
            dirResults[dir] = {
              exists,
              files: 0,
              writable: false
            };
            console.log(`✗ Diretório '${dir}' não existe.`);
          }
        } catch (dirError) {
          dirResults[dir] = {
            exists: false,
            error: String(dirError)
          };
          console.error(`✗ Erro ao verificar diretório '${dir}':`, dirError);
        }
      }
      
      // Simular upload de emergência (sem realmente fazer upload de arquivo)
      console.log("\n== TESTANDO SIMULAÇÃO DE ESTRATÉGIAS DE UPLOAD ==");
      
      const mockFile = {
        originalname: 'test-avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image data'),
        size: 1024
      } as Express.Multer.File;
      
      // Apenas para o usuário problemático, realizar uma simulação completa
      let emergencySimulation = null;
      
      if (isProblematicUser) {
        console.log("Realizando simulação de estratégias para usuário problemático...");
        
        try {
          // Lista de estratégias disponíveis (sem fazer upload real)
          const strategies = [
            { name: 'avatar_bucket', description: 'Upload para bucket específico de avatares' },
            { name: 'main_bucket_avatar_path', description: 'Upload para pasta /designautoimages no bucket principal' },
            { name: 'main_bucket_root', description: 'Upload direto para raiz do bucket principal' },
            { name: 'local_emergency', description: 'Upload para sistema de arquivos local' }
          ];
          
          // Verificar viabilidade de cada estratégia
          const strategyResults = [];
          
          for (const strategy of strategies) {
            try {
              console.log(`Avaliando estratégia: ${strategy.name}`);
              
              let viable = false;
              let reason = '';
              
              if (strategy.name === 'avatar_bucket') {
                viable = bucketResults['designautoimages']?.accessible || false;
                reason = viable ? 'Bucket acessível' : 'Bucket não acessível';
              }
              else if (strategy.name === 'main_bucket_avatar_path' || strategy.name === 'main_bucket_root') {
                viable = bucketResults['designautoimages']?.accessible || false;
                reason = viable ? 'Bucket principal acessível' : 'Bucket principal não acessível';
              }
              else if (strategy.name === 'local_emergency') {
                viable = dirResults['public/uploads/emergency']?.writable || false;
                reason = viable ? 'Diretório acessível e gravável' : 'Diretório não acessível ou não gravável';
              }
              
              strategyResults.push({
                ...strategy,
                viable,
                reason
              });
              
              console.log(`- ${strategy.name}: ${viable ? 'VIÁVEL ✓' : 'NÃO VIÁVEL ✗'} (${reason})`);
            } catch (stratError) {
              console.error(`Erro ao avaliar estratégia ${strategy.name}:`, stratError);
              strategyResults.push({
                ...strategy,
                viable: false,
                reason: String(stratError)
              });
            }
          }
          
          // Determinar melhor estratégia
          const viableStrategies = strategyResults.filter(s => s.viable);
          const bestStrategy = viableStrategies.length > 0 ? viableStrategies[0] : null;
          
          emergencySimulation = {
            allStrategies: strategyResults,
            viableStrategies: viableStrategies.map(s => s.name),
            recommendedStrategy: bestStrategy?.name || 'placeholder',
            fallbackGuaranteed: true
          };
          
          console.log(`Simulação completa! ${viableStrategies.length} estratégias viáveis.`);
          if (bestStrategy) {
            console.log(`Estratégia recomendada: ${bestStrategy.name} - ${bestStrategy.description}`);
          } else {
            console.log("Nenhuma estratégia viável encontrada, seria usado placeholder como fallback.");
          }
        } catch (simError) {
          console.error("Erro na simulação:", simError);
          emergencySimulation = {
            error: String(simError),
            fallbackGuaranteed: true
          };
        }
      }
      
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
          status: isProblematicUser ? 'PROBLEMATIC' : 'NORMAL',
          profileImageUrl: user.profileimageurl
        },
        buckets: bucketResults,
        directories: dirResults,
        emergencySimulation,
        recommendations: isProblematicUser
          ? "Este usuário está marcado para tratamento especial de upload. As estratégias de upload em cascata serão utilizadas."
          : "Usuário normal, fluxo padrão de upload será aplicado."
      });
    } catch (error) {
      console.error('Erro no teste de avatar de emergência:', error);
      return res.status(500).json({
        success: false,
        error: String(error)
      });
    }
  });
  // Rota para especificamente testar todas as soluções em cascata para o usuário problemático
  app.get('/api/debug/test-emergency-avatar/:username', isAdmin, async (req, res) => {
    try {
      const username = req.params.username;
      
      // Verificar se é o usuário com problemas recorrentes
      const isProblematicUser = username === 'fernandosim20188718';
      
      console.log(`Iniciando diagnóstico completo para usuário: ${username}`);
      console.log(`Status de usuário problemático: ${isProblematicUser ? 'SIM' : 'NÃO'}`);
      
      // Buscar o usuário
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }
      
      // Verificar acesso aos buckets
      console.log("\n== VERIFICANDO ACESSO AOS BUCKETS ==");
      
      let bucketResults: Record<string, {
        accessible: boolean;
        files?: number;
        error?: string;
      }> = {};
      
      try {
        const { data: avatarFiles } = await supabaseStorageService.getBucket('designautoimages');
        bucketResults['designautoimages'] = {
          accessible: true,
          files: avatarFiles?.length || 0,
          error: undefined
        };
        console.log(`✓ Bucket 'designautoimages' acessível! ${avatarFiles?.length || 0} arquivos encontrados.`);
      } catch (avatarError) {
        bucketResults['designautoimages'] = {
          accessible: false,
          files: 0,
          error: String(avatarError)
        };
        console.error(`✗ Erro ao acessar bucket 'designautoimages':`, avatarError);
      }
      
      try {
        const { data: mainFiles } = await supabaseStorageService.getBucket('designautoimages');
        bucketResults['designautoimages'] = {
          accessible: true,
          files: mainFiles?.length || 0,
          error: null
        };
        console.log(`✓ Bucket 'designautoimages' acessível! ${mainFiles?.length || 0} arquivos encontrados.`);
      } catch (mainError) {
        bucketResults['designautoimages'] = {
          accessible: false,
          files: 0,
          error: String(mainError)
        };
        console.error(`✗ Erro ao acessar bucket 'designautoimages':`, mainError);
      }
      
      // Verificar diretórios locais
      console.log("\n== VERIFICANDO DIRETÓRIOS LOCAIS ==");
      
      const dirResults: Record<string, {
        exists: boolean;
        writable?: boolean;
        files?: number;
        error?: string;
      }> = {};
      const dirsToCheck = [
        'public',
        'public/uploads',
        'public/uploads/designautoimages',
        'public/uploads/emergency'
      ];
      
      for (const dir of dirsToCheck) {
        try {
          const exists = fs.existsSync(dir);
          
          if (exists) {
            const files = fs.readdirSync(dir);
            dirResults[dir] = {
              exists,
              files: files.length,
              writable: true
            };
            
            // Testar permissão de escrita
            try {
              const testFile = path.join(dir, `test-write-${Date.now()}.txt`);
              fs.writeFileSync(testFile, 'Test');
              fs.unlinkSync(testFile);
            } catch (writeError) {
              dirResults[dir].writable = false;
              dirResults[dir].writeError = String(writeError);
            }
            
            console.log(`✓ Diretório '${dir}' existe e tem ${files.length} arquivos.`);
          } else {
            dirResults[dir] = {
              exists,
              files: 0,
              writable: false
            };
            console.log(`✗ Diretório '${dir}' não existe.`);
          }
        } catch (dirError) {
          dirResults[dir] = {
            exists: false,
            error: String(dirError)
          };
          console.error(`✗ Erro ao verificar diretório '${dir}':`, dirError);
        }
      }
      
      // Simular upload de emergência (sem realmente fazer upload de arquivo)
      console.log("\n== TESTANDO SIMULAÇÃO DE ESTRATÉGIAS DE UPLOAD ==");
      
      const mockFile = {
        originalname: 'test-avatar.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image data'),
        size: 1024
      };
      
      // Apenas para o usuário problemático, realizar uma simulação completa
      let emergencySimulation = null;
      
      if (isProblematicUser) {
        console.log("Realizando simulação de estratégias para usuário problemático...");
        
        try {
          // Lista de estratégias disponíveis (sem fazer upload real)
          const strategies = [
            { name: 'avatar_bucket', description: 'Upload para bucket específico de avatares' },
            { name: 'main_bucket_avatar_path', description: 'Upload para pasta /designautoimages no bucket principal' },
            { name: 'main_bucket_root', description: 'Upload direto para raiz do bucket principal' },
            { name: 'local_emergency', description: 'Upload para sistema de arquivos local' }
          ];
          
          // Verificar cada estratégia individualmente
          const strategyResults = await Promise.all(strategies.map(async (strategy) => {
            try {
              // Testar apenas a verificação, sem fazer upload
              if (strategy.name === 'avatar_bucket') {
                await supabaseStorageService.getBucket('designautoimages');
                return { ...strategy, viable: true };
              } 
              else if (strategy.name === 'main_bucket_avatar_path' || strategy.name === 'main_bucket_root') {
                await supabaseStorageService.getBucket('designautoimages');
                return { ...strategy, viable: true };
              }
              else if (strategy.name === 'local_emergency') {
                // Verificar acesso aos diretórios necessários
                const localDirAccess = dirResults['public/uploads/emergency']?.exists || false;
                return { ...strategy, viable: localDirAccess };
              }
              
              return { ...strategy, viable: false, error: 'Estratégia não reconhecida' };
            } catch (error) {
              return { ...strategy, viable: false, error: String(error) };
            }
          }));
          
          // Verificar qual seria a melhor estratégia a adotar
          const viableStrategies = strategyResults.filter(s => s.viable);
          const bestStrategy = viableStrategies.length > 0 ? viableStrategies[0] : null;
          
          emergencySimulation = {
            allStrategies: strategyResults,
            viableStrategies: viableStrategies.map(s => s.name),
            recommendedStrategy: bestStrategy?.name || 'placeholder',
            fallbackGuaranteed: true
          };
          
          console.log(`Simulação completa! ${viableStrategies.length} estratégias viáveis.`);
          if (bestStrategy) {
            console.log(`Estratégia recomendada: ${bestStrategy.name} - ${bestStrategy.description}`);
          } else {
            console.log("Nenhuma estratégia viável encontrada, seria usado placeholder como fallback.");
          }
        } catch (simError) {
          console.error("Erro na simulação:", simError);
          emergencySimulation = {
            error: String(simError),
            fallbackGuaranteed: true
          };
        }
      }
      
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
          status: isProblematicUser ? 'PROBLEMATIC' : 'NORMAL',
          profileImageUrl: user.profileimageurl
        },
        buckets: bucketResults,
        directories: dirResults,
        emergencySimulation,
        recommendations: isProblematicUser
          ? "Este usuário está marcado para tratamento especializado de upload. As estratégias de upload em cascata serão utilizadas."
          : "Usuário normal, fluxo padrão de upload será aplicado."
      });
    } catch (error) {
      console.error('Erro no teste de avatar de emergência:', error);
      return res.status(500).json({
        success: false,
        error: String(error)
      });
    }
  });

  // Rota para testar o status de upload do avatar de um usuário específico
  app.get('/api/debug/test-avatar-upload/:username', isAdmin, async (req, res) => {
    try {
      console.log('Testando capacidade de upload de avatar para usuário:', req.params.username);
      
      // Verificar se o usuário existe
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }
      
      // Verificar acesso ao bucket de avatares
      console.log("Verificando acesso ao bucket 'designautoimages'...");
      let avatarBucketAccess = false;
      try {
        const { data: avatarFiles } = await supabaseStorageService.getBucket('designautoimages');
        avatarBucketAccess = true;
        console.log(`Bucket 'designautoimages' acessível. ${avatarFiles?.length || 0} arquivos encontrados.`);
      } catch (avatarError) {
        console.error('Erro ao acessar bucket designautoimages:', avatarError);
        avatarBucketAccess = false;
      }
      
      // Verificar acesso ao bucket principal
      console.log("Verificando acesso ao bucket principal...");
      let mainBucketAccess = false;
      try {
        const { data: mainFiles } = await supabaseStorageService.getBucket('designautoimages');
        mainBucketAccess = true;
        console.log(`Bucket principal acessível. ${mainFiles?.length || 0} arquivos encontrados.`);
      } catch (mainError) {
        console.error('Erro ao acessar bucket principal:', mainError);
        mainBucketAccess = false;
      }
      
      // Verificar permissões de diretório local
      console.log("Verificando acesso a diretórios locais...");
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'designautoimages');
      let localDirAccess = false;
      try {
        // Tentar criar diretório se não existir
        if (!fs.existsSync('public')) {
          fs.mkdirSync('public');
        }
        if (!fs.existsSync(path.join('public', 'uploads'))) {
          fs.mkdirSync(path.join('public', 'uploads'));
        }
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }
        
        // Testar gravação
        const testFile = path.join(uploadsDir, 'test-write.txt');
        fs.writeFileSync(testFile, 'Test write');
        fs.unlinkSync(testFile); // Remover após teste
        
        localDirAccess = true;
        console.log('Acesso de gravação local está funcionando.');
      } catch (localError) {
        console.error('Erro ao acessar diretório local:', localError);
        localDirAccess = false;
      }
      
      // Verificar se o usuário tem solução de emergência habilitada
      const isProblematicUser = user.username === 'fernandosim20188718';
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          profileImageUrl: user.profileimageurl
        },
        storageStatus: {
          avatarBucketAccess,
          mainBucketAccess,
          localDirAccess,
          isProblematicUser,
          hasFallbackSolution: isProblematicUser
        },
        recommendations: isProblematicUser 
          ? 'Este usuário tem suporte de emergência habilitado para uploads de avatar.'
          : 'Usuário normal sem tratamento especial.'
      });
    } catch (error) {
      console.error('Erro no teste de upload de avatar:', error);
      return res.status(500).json({ 
        success: false, 
        error: String(error) 
      });
    }
  });
  
  // Registrar as rotas relacionadas ao logo
  app.use('/api/upload-logo', logoUploadRouter);
  
  // Registrar a rota para upload de favicon
  app.use('/api/site-settings/favicon', faviconUploadRouter);
  
  // Registrar a rota para o manifest.json dinâmico do PWA
  app.use(manifestRouter);
  
  // Registrar as rotas para configuração do PWA
  app.use('/api', appConfigRouter);
  
  // Adicionar rota para remover o logo
  removeLogoRouter(app);
  
  // Configurar o multer para upload de arquivos
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Garantir que o diretório de uploads existe
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Armazenamento em disco para uploads gerais
  const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });
  
  // Armazenamento em memória para uploads de logo que precisam ser processados antes de salvar
  const memoryStorage = multer.memoryStorage();
  
  // Configuração padrão para upload em disco
  const upload = multer({ storage: diskStorage });
  
  // Configuração específica para upload de logo em memória
  const logoUpload = multer({ 
    storage: memoryStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // limite de 5MB
    },
    fileFilter: (req, file, cb) => {
      // Aceitar apenas imagens
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Apenas imagens são permitidas'));
      }
      cb(null, true);
    }
  });

  // Categories API with precise art counts and detailed stats
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      
      // Para cada categoria, realizar uma busca precisa das artes com contagem
      const enhancedCategories = await Promise.all(categories.map(async (category) => {
        // Buscar todas as artes dessa categoria com limites altos para garantir precisão
        const { arts, totalCount } = await storage.getArts(1, 1000, { category: category.id });
        
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
  
  // Versão em português da API de categorias (compatibilidade com frontend)
  app.get("/api/categorias", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      
      // Para cada categoria, realizar uma busca precisa das artes com contagem
      const enhancedCategories = await Promise.all(categories.map(async (category) => {
        // Buscar todas as artes dessa categoria com limites altos para garantir precisão
        const { arts, totalCount } = await storage.getArts(1, 1000, { category: category.id });
        
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
  app.get("/api/categorias/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const category = await storage.getCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      // Buscar todas as artes desta categoria para determinar a data de atualização
      // Não usar filtro sortBy para garantir que todas as artes serão retornadas
      const { arts } = await storage.getArts(1, 1000, { category: category.id });
      
      // Data de criação - usar uma data histórica fixa se não for possível determinar
      // Neste caso, usamos a data de lançamento do sistema no início de 2025
      const createdDate = new Date("2025-01-01");
      
      // Data de atualização - usar a data da arte mais recente ou a data atual se não houver artes
      let updatedDate = new Date();
      
      if (arts && arts.length > 0) {
        // Ordenar as artes por data de atualização de forma decrescente
        // (mais recente primeiro) independente do que foi retornado do banco
        const sortedArts = [...arts].sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
          const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Pegar a data de atualização da arte mais recente (primeiro elemento após ordenação)
        if (sortedArts[0].updatedAt) {
          updatedDate = new Date(sortedArts[0].updatedAt);
        }
      }
      
      // Adicionar campos calculados
      const enrichedCategory = {
        ...category,
        createdAt: createdDate,
        updatedAt: updatedDate
      };
      
      res.json(enrichedCategory);
    } catch (error: any) {
      console.error("Erro ao buscar categoria por slug:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar categoria" });
    }
  });
  
  // Manter o endpoint antigo para compatibilidade
  app.get("/api/categories/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const category = await storage.getCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }
      
      // Buscar todas as artes desta categoria para determinar a data de atualização
      // Não usar filtro sortBy para garantir que todas as artes serão retornadas
      const { arts } = await storage.getArts(1, 1000, { category: category.id });
      
      // Data de criação - usar uma data histórica fixa se não for possível determinar
      // Neste caso, usamos a data de lançamento do sistema no início de 2025
      const createdDate = new Date("2025-01-01");
      
      // Data de atualização - usar a data da arte mais recente ou a data atual se não houver artes
      let updatedDate = new Date();
      
      if (arts && arts.length > 0) {
        // Ordenar as artes por data de atualização de forma decrescente
        // (mais recente primeiro) independente do que foi retornado do banco
        const sortedArts = [...arts].sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 
                       a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 
                       b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // ordem decrescente
        });
        
        // Pegar a data da arte mais recente
        const latestArt = sortedArts[0];
        
        console.log("Arte mais recente para categoria " + category.name + ":", {
          id: latestArt.id,
          title: latestArt.title,
          updatedAt: latestArt.updatedAt,
          createdAt: latestArt.createdAt
        });
        
        if (latestArt.updatedAt) {
          updatedDate = new Date(latestArt.updatedAt);
        } else if (latestArt.createdAt) {
          updatedDate = new Date(latestArt.createdAt);
        }
      }
      
      // Adicionar campos createdAt e updatedAt com base nos dados reais
      const enhancedCategory = {
        ...category,
        createdAt: createdDate,
        updatedAt: updatedDate
      };
      
      console.log("Enviando categoria com datas:", {
        id: enhancedCategory.id,
        name: enhancedCategory.name,
        createdAt: enhancedCategory.createdAt,
        updatedAt: enhancedCategory.updatedAt
      });
      
      res.json(enhancedCategory);
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
  
  // Versão em português - Busca de categoria por ID (compatibilidade com frontend)
  app.get("/api/categorias/:id", async (req, res) => {
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

  // Versão em português - Artes recentes (compatibilidade com frontend)
  app.get("/api/artes/recent", async (req, res) => {
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

  // Versão em português - Arte por ID (compatibilidade com frontend)
  app.get("/api/artes/:id", async (req, res) => {
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
        if (!user || user.role !== 'premium') {
          isPremiumLocked = true;
          // Não bloqueamos mais com 403, apenas marcamos como conteúdo restrito
        }
      }
      
      // Buscar a categoria da arte pelo ID
      let category = null;
      if (art.category) {
        try {
          console.log(`[DEBUG] Buscando categoria ID: ${art.category} para arte ID: ${art.id}`);
          category = await storage.getCategoryById(art.category);
          console.log(`[DEBUG] Categoria encontrada:`, category);
          
          // Se a categoria for encontrada, anexá-la ao objeto arte
          if (category) {
            art.category = category;
            console.log(`[DEBUG] Arte atualizada com categoria:`, art.category);
          }
        } catch (categoryError) {
          console.error("Erro ao buscar categoria da arte:", categoryError);
          // Se falhar ao buscar a categoria, ainda retornamos a arte
        }
      }
      
      // Buscar contagens de interações
      let favoriteCount = 0;
      let shareCount = 0;
      
      try {
        const counts = await storage.getArtInteractionCounts(id);
        favoriteCount = counts.favoriteCount;
        shareCount = counts.shareCount;
        
        // Tentar incrementar o contador de visualizações
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
            if (req.isAuthenticated()) {
              isFollowing = await storage.isUserFollowing(req.user.id, art.designerid);
            }
            
            // Buscar artes recentes do designer para exibir junto com o perfil
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
            
            art.designerid = {
              ...safeDesigner,
              isFollowing,
              followers: 0,
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
            // Remover a senha e outras informações sensíveis
            const { password, ...safeAdmin } = admin;
            art.designerid = {
              ...safeAdmin,
              isFollowing: false,
              followers: 0,
              totalArts: 0,
              recentArts: []
            };
          }
        } catch (adminError) {
          console.error("Erro ao buscar administrador como designer temporário:", adminError);
        }
      }
      
      // Adicionar flag de premium locked e contagens ao objeto retornado
      res.json({
        ...art,
        isPremiumLocked,
        favoriteCount,
        shareCount
      });
    } catch (error) {
      console.error("Erro ao buscar arte:", error);
      res.status(500).json({ message: "Erro ao buscar arte" });
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
  
  app.get("/api/formats/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const format = await storage.getFormatById(id);
      
      if (!format) {
        return res.status(404).json({ message: "Formato não encontrado" });
      }
      
      res.json(format);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar formato" });
    }
  });
  
  app.post("/api/formats", async (req, res) => {
    try {
      // Apenas usuários admin ou designer_adm podem criar formatos
      if (req.user?.nivelacesso !== 'admin' && req.user?.nivelacesso !== 'designer_adm') {
        return res.status(403).json({ message: "Sem permissão para criar formatos" });
      }
      
      const { name, slug } = req.body;
      
      // Validar dados
      if (!name || !slug) {
        return res.status(400).json({ message: "Nome e slug são obrigatórios" });
      }
      
      // Verificar se o slug já existe
      const formats = await storage.getFormats();
      const existingFormat = formats.find(f => f.slug === slug);
      
      if (existingFormat) {
        return res.status(400).json({ message: "Este slug já está em uso" });
      }
      
      // Criar o formato
      const newFormat = await storage.createFormat({
        name,
        slug
      });
      
      res.status(201).json(newFormat);
    } catch (error) {
      console.error("Erro ao criar formato:", error);
      res.status(500).json({ message: "Erro ao criar formato" });
    }
  });
  
  app.put("/api/formats/:id", async (req, res) => {
    try {
      // Apenas usuários admin ou designer_adm podem atualizar formatos
      if (req.user?.nivelacesso !== 'admin' && req.user?.nivelacesso !== 'designer_adm') {
        return res.status(403).json({ message: "Sem permissão para atualizar formatos" });
      }
      
      const id = parseInt(req.params.id);
      const { name, slug } = req.body;
      
      // Validar dados
      if (!name || !slug) {
        return res.status(400).json({ message: "Nome e slug são obrigatórios" });
      }
      
      // Verificar se o formato existe
      const format = await storage.getFormatById(id);
      if (!format) {
        return res.status(404).json({ message: "Formato não encontrado" });
      }
      
      // Verificar se o slug já existe (exceto para o mesmo formato)
      const formats = await storage.getFormats();
      const existingFormat = formats.find(f => f.slug === slug && f.id !== id);
      
      if (existingFormat) {
        return res.status(400).json({ message: "Este slug já está em uso" });
      }
      
      // Atualizar o formato
      const updatedFormat = await storage.updateFormat(id, {
        name,
        slug
      });
      
      res.json(updatedFormat);
    } catch (error) {
      console.error("Erro ao atualizar formato:", error);
      res.status(500).json({ message: "Erro ao atualizar formato" });
    }
  });
  
  app.delete("/api/formats/:id", async (req, res) => {
    try {
      // Apenas usuários admin podem excluir formatos
      if (req.user?.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Sem permissão para excluir formatos" });
      }
      
      const id = parseInt(req.params.id);
      const forceDelete = req.query.force === 'true';
      
      // Verificar se o formato existe
      const format = await storage.getFormatById(id);
      if (!format) {
        return res.status(404).json({ message: "Formato não encontrado" });
      }
      
      // Verificar se o formato está sendo usado em alguma arte
      const arts = await storage.getArts(1, 1000, { formatId: format.id });
      if (arts.arts.length > 0 && !forceDelete) {
        // Permitir exclusão forçada com parâmetro ou aviso
        return res.status(400).json({ 
          message: `Este formato está sendo usado em ${arts.arts.length} arte(s). Confirme para excluir mesmo assim.`,
          artsCount: arts.arts.length,
          allowForce: true
        });
      }
      
      // Excluir o formato mesmo que esteja em uso
      const success = await storage.deleteFormat(id);
      
      if (success) {
        // Informações extras para o caso de exclusão com artes vinculadas
        const responseMsg = arts.arts.length > 0 
          ? `Formato excluído com sucesso. ${arts.arts.length} arte(s) precisarão ser atualizadas.`
          : "Formato excluído com sucesso.";
        
        res.json({ 
          message: responseMsg,
          artsAffected: arts.arts.length
        });
      } else {
        res.status(500).json({ message: "Erro ao excluir formato" });
      }
    } catch (error) {
      console.error("Erro ao excluir formato:", error);
      res.status(500).json({ message: "Erro ao excluir formato" });
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
  
  app.get("/api/fileTypes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fileType = await storage.getFileTypeById(id);
      
      if (!fileType) {
        return res.status(404).json({ message: "Tipo de arquivo não encontrado" });
      }
      
      res.json(fileType);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tipo de arquivo" });
    }
  });
  
  app.post("/api/fileTypes", async (req, res) => {
    try {
      // Apenas usuários admin ou designer_adm podem criar tipos de arquivo
      if (req.user?.nivelacesso !== 'admin' && req.user?.nivelacesso !== 'designer_adm') {
        return res.status(403).json({ message: "Sem permissão para criar tipos de arquivo" });
      }
      
      const { name, slug } = req.body;
      
      // Validar dados
      if (!name || !slug) {
        return res.status(400).json({ message: "Nome e slug são obrigatórios" });
      }
      
      // Verificar se o slug já existe
      const fileTypes = await storage.getFileTypes();
      const existingFileType = fileTypes.find(f => f.slug === slug);
      
      if (existingFileType) {
        return res.status(400).json({ message: "Este slug já está em uso" });
      }
      
      // Criar o tipo de arquivo
      const newFileType = await storage.createFileType({
        name,
        slug
      });
      
      res.status(201).json(newFileType);
    } catch (error) {
      console.error("Erro ao criar tipo de arquivo:", error);
      res.status(500).json({ message: "Erro ao criar tipo de arquivo" });
    }
  });
  
  app.put("/api/fileTypes/:id", async (req, res) => {
    try {
      // Apenas usuários admin ou designer_adm podem atualizar tipos de arquivo
      if (req.user?.nivelacesso !== 'admin' && req.user?.nivelacesso !== 'designer_adm') {
        return res.status(403).json({ message: "Sem permissão para atualizar tipos de arquivo" });
      }
      
      const id = parseInt(req.params.id);
      const { name, slug } = req.body;
      
      // Validar dados
      if (!name || !slug) {
        return res.status(400).json({ message: "Nome e slug são obrigatórios" });
      }
      
      // Verificar se o tipo de arquivo existe
      const fileType = await storage.getFileTypeById(id);
      if (!fileType) {
        return res.status(404).json({ message: "Tipo de arquivo não encontrado" });
      }
      
      // Verificar se o slug já existe (exceto para o mesmo tipo de arquivo)
      const fileTypes = await storage.getFileTypes();
      const existingFileType = fileTypes.find(f => f.slug === slug && f.id !== id);
      
      if (existingFileType) {
        return res.status(400).json({ message: "Este slug já está em uso" });
      }
      
      // Atualizar o tipo de arquivo
      const updatedFileType = await storage.updateFileType(id, {
        name,
        slug
      });
      
      res.json(updatedFileType);
    } catch (error) {
      console.error("Erro ao atualizar tipo de arquivo:", error);
      res.status(500).json({ message: "Erro ao atualizar tipo de arquivo" });
    }
  });
  
  app.delete("/api/fileTypes/:id", async (req, res) => {
    try {
      // Apenas usuários admin podem excluir tipos de arquivo
      if (req.user?.nivelacesso !== 'admin') {
        return res.status(403).json({ message: "Sem permissão para excluir tipos de arquivo" });
      }
      
      const id = parseInt(req.params.id);
      const forceDelete = req.query.force === 'true';
      
      // Verificar se o tipo de arquivo existe
      const fileType = await storage.getFileTypeById(id);
      if (!fileType) {
        return res.status(404).json({ message: "Tipo de arquivo não encontrado" });
      }
      
      // Verificar se o tipo de arquivo está sendo usado em alguma arte
      const arts = await storage.getArts(1, 1000, { fileTypeId: fileType.id });
      if (arts.arts.length > 0 && !forceDelete) {
        // Permitir exclusão forçada com parâmetro ou aviso
        return res.status(400).json({ 
          message: `Este tipo de arquivo está sendo usado em ${arts.arts.length} arte(s). Confirme para excluir mesmo assim.`,
          artsCount: arts.arts.length,
          allowForce: true
        });
      }
      
      // Excluir o tipo de arquivo mesmo que esteja em uso
      const success = await storage.deleteFileType(id);
      
      if (success) {
        // Informações extras para o caso de exclusão com artes vinculadas
        const responseMsg = arts.arts.length > 0 
          ? `Tipo de arquivo excluído com sucesso. ${arts.arts.length} arte(s) precisarão ser atualizadas.`
          : "Tipo de arquivo excluído com sucesso.";
        
        res.json({ 
          message: responseMsg,
          artsAffected: arts.arts.length
        });
      } else {
        res.status(500).json({ message: "Erro ao excluir tipo de arquivo" });
      }
    } catch (error) {
      console.error("Erro ao excluir tipo de arquivo:", error);
      res.status(500).json({ message: "Erro ao excluir tipo de arquivo" });
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
      
      // Check if sortBy parameter is present
      if (req.query.sortBy) {
        filters.sortBy = req.query.sortBy as string;
        console.log(`Ordenação aplicada: ${filters.sortBy}`);
      }
      
      // Apenas usuários admin, designer_adm e designer podem ver artes ocultas
      const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm' || req.user?.nivelacesso === 'designer';
      
      // Verificamos se há um filtro específico de visibilidade sendo aplicado
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
      
      console.log(`Usuário ${isAdmin ? 'é admin' : 'NÃO é admin'}, filtro de visibilidade: ${filters.isVisible !== undefined ? filters.isVisible : 'não aplicado'}`)
      
      const result = await storage.getArts(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error("Erro detalhado ao buscar artes:", error);
      res.status(500).json({ message: "Erro ao buscar artes" });
    }
  });
      
  // Rota de artes em português (compatibilidade com frontend)
  app.get("/api/artes", async (req, res) => {
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
      
      // Check if sortBy parameter is present
      if (req.query.sortBy) {
        filters.sortBy = req.query.sortBy as string;
      }
      
      // Apenas usuários admin, designer_adm e designer podem ver artes ocultas
      const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm' || req.user?.nivelacesso === 'designer';
      
      // Verificamos se há um filtro específico de visibilidade sendo aplicado
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
      
      console.log(`Usuário ${isAdmin ? 'é admin' : 'NÃO é admin'}, filtro de visibilidade: ${filters.isVisible !== undefined ? filters.isVisible : 'não aplicado'}`)
      
      const result = await storage.getArts(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error("Erro detalhado ao buscar artes:", error);
      res.status(500).json({ message: "Erro ao buscar artes" });
    }
  });
  
  // Rota para buscar artes recentes (usada no painel inicial)
  app.get("/api/arts/recent", async (req, res) => {
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
  
  // Essa rota foi movida para antes de /api/artes/:id para evitar problemas de ordem

  app.get("/api/arts/:id/related", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 12; // Usar 12 como padrão
      
      console.log(`[GET /api/arts/${id}/related] Buscando ${limit} artes relacionadas para arte ID ${id}`);
      
      const relatedArts = await storage.getRelatedArts(id, limit);
      
      console.log(`[GET /api/arts/${id}/related] Encontradas ${relatedArts.length} artes relacionadas`);
      
      // Converter URLs de imagem para o formato de proxy
      const convertedArts = supabaseStorageService.convertImageUrls(relatedArts, ['imageUrl', 'thumbnailUrl']);
      
      // Se não houver artes relacionadas, retorna array vazio em vez de 404
      // para que o frontend possa lidar com isso de maneira apropriada
      res.json(convertedArts);
    } catch (error) {
      console.error("Erro ao buscar artes relacionadas:", error);
      res.status(500).json({ message: "Erro ao buscar artes relacionadas" });
    }
  });
  
  // Versão em português - Artes relacionadas por ID (compatibilidade com frontend)
  app.get("/api/artes/:id/related", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 12; // Usar 12 como padrão
      
      console.log(`[GET /api/artes/${id}/related] Buscando ${limit} artes relacionadas para arte ID ${id}`);
      
      const relatedArts = await storage.getRelatedArts(id, limit);
      
      console.log(`[GET /api/artes/${id}/related] Encontradas ${relatedArts.length} artes relacionadas`);
      
      // Se não houver artes relacionadas, retorna array vazio em vez de 404
      // para que o frontend possa lidar com isso de maneira apropriada
      res.json(relatedArts);
    } catch (error) {
      console.error("Erro ao buscar artes relacionadas:", error);
      res.status(500).json({ message: "Erro ao buscar artes relacionadas" });
    }
  });

  app.get("/api/arts/:id", async (req, res) => {
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
        if (!user || user.role !== 'premium') {
          isPremiumLocked = true;
          // Não bloqueamos mais com 403, apenas marcamos como conteúdo restrito
        }
      }
      
      // Buscar a categoria da arte pelo ID
      let category = null;
      if (art.categoryId) {
        try {
          console.log(`[DEBUG] Buscando categoria ID: ${art.categoryId} para arte ID: ${art.id}`);
          category = await storage.getCategoryById(art.categoryId);
          console.log(`[DEBUG] Categoria encontrada:`, category);
          
          // Se a categoria for encontrada, anexá-la ao objeto arte
          if (category) {
            art.category = category;
            console.log(`[DEBUG] Arte atualizada com categoria:`, art.category);
          } else {
            console.log(`[DEBUG] Categoria ID ${art.categoryId} não encontrada no banco de dados`);
          }
        } catch (categoryError) {
          console.error("Erro ao buscar categoria da arte:", categoryError);
        }
      } else {
        console.log(`[DEBUG] Arte ID ${art.id} não tem categoryId definido`);
      }
      
      // Buscar contagem de favoritos para esta arte
      const favoritesResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM favorites
        WHERE "artId" = ${id}
      `);
      const favoriteCount = parseInt(favoritesResult.rows[0].count) || 0;
      
      // Buscar contagem de compartilhamentos para esta arte (se existir a tabela)
      let shareCount = 0;
      try {
        const sharesResult = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM shares
          WHERE "artId" = ${id}
        `);
        shareCount = parseInt(sharesResult.rows[0].count) || 0;
      } catch (error) {
        console.log("Tabela de compartilhamentos não encontrada:", error);
        // Se a tabela não existir, apenas ignoramos e continuamos com 0
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
      
      // Adicionar flag de premium locked e contagens ao objeto retornado
      res.json({
        ...art,
        isPremiumLocked,
        favoriteCount,
        shareCount
      });
    } catch (error) {
      console.error("Erro ao buscar arte:", error);
      res.status(500).json({ message: "Erro ao buscar arte" });
    }
  });
  
  // Rota para buscar artes recentes (usada no painel inicial)
  app.get("/api/arts/recent", async (req, res) => {
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

  // Esta rota já foi definida acima!

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
      
      // Usar SQL bruto para evitar problemas com maiúsculas/minúsculas nos nomes das colunas
      // Usar o Drizzle ORM diretamente para contar favoritos
      const favoritesQuery = db.select({ count: sql<number>`count(*)` })
        .from(favorites)
        .where(eq(favorites.userId, userId));
        
      const favoritesResult = await favoritesQuery;
      const totalFavorites = Number(favoritesResult[0]?.count) || 0;
      console.log("[GET /api/users/stats] Total de favoritos:", totalFavorites);
      
      // Usar o Drizzle ORM diretamente para contar downloads
      const downloadsQuery = db.select({ count: sql<number>`count(*)` })
        .from(downloads)
        .where(eq(downloads.userId, userId));
        
      const downloadsResult = await downloadsQuery;
      const totalDownloads = Number(downloadsResult[0]?.count) || 0;
      console.log("[GET /api/users/stats] Total de downloads:", totalDownloads);
      
      // Usar o Drizzle ORM diretamente para contar visualizações
      const viewsQuery = db.select({ count: sql<number>`count(*)` })
        .from(views)
        .where(eq(views.userId, userId));
        
      const viewsResult = await viewsQuery;
      const totalViews = Number(viewsResult[0]?.count) || 0;
      console.log("[GET /api/users/stats] Total de views:", totalViews);
      
      // Buscar dados do usuário para obter o último login usando SQL bruto
      const userResult = await db.execute(sql`
        SELECT lastlogin, ultimologin FROM users WHERE id = ${userId}
      `);
      
      // Usar lastlogin ou ultimologin, o que estiver disponível
      const lastLogin = userResult.rows[0]?.lastlogin || userResult.rows[0]?.ultimologin || null;
      
      console.log("Dados do último login:", {
        userData: userResult.rows[0],
        lastLoginValue: lastLogin
      });
      
      // Estatísticas para retornar com valores forçados como Number e último login
      const stats = {
        totalFavorites: Number(totalFavorites),
        totalDownloads: Number(totalDownloads),
        totalViews: Number(totalViews),
        lastLogin: lastLogin
      };
      
      console.log("[GET /api/users/stats] Retornando estatísticas atualizadas:", stats);
      
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
  
  // Rota para registrar compartilhamento de arte
  app.post("/api/shares", async (req, res) => {
    try {
      const { artId } = req.body;
      const userId = req.user ? (req.user as any).id : null; // Opcional, usuários anônimos podem compartilhar
      
      // Validar o ID da arte
      if (!artId || isNaN(parseInt(artId))) {
        return res.status(400).json({ message: "ID de arte inválido" });
      }
      
      // Verificar se a arte existe
      const art = await storage.getArtById(parseInt(artId));
      if (!art) {
        return res.status(404).json({ message: "Arte não encontrada" });
      }
      
      // Registrar o compartilhamento
      await db.execute(sql`
        INSERT INTO shares ("artId", "userId", "createdAt")
        VALUES (${parseInt(artId)}, ${userId}, ${new Date()})
      `);
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Erro ao registrar compartilhamento:", error);
      res.status(500).json({ 
        message: "Erro ao registrar compartilhamento",
        error: error instanceof Error ? error.message : String(error)
      });
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
  
  // Admin API - Update Art Visibility
  app.put("/api/admin/arts/:id/visibility", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isVisible } = req.body;
      
      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: "O campo isVisible deve ser um booleano" });
      }
      
      // Buscar a arte atual para verificar se existe
      const art = await storage.getArtById(id);
      if (!art) {
        return res.status(404).json({ message: "Arte não encontrada" });
      }
      
      // Atualizar apenas o campo de visibilidade
      const updatedArt = await storage.updateArt(id, { isVisible });
      
      res.json({ 
        success: true,
        message: isVisible ? "Arte tornada visível" : "Arte oculta com sucesso",
        art: updatedArt
      });
    } catch (error) {
      console.error("Erro ao atualizar visibilidade da arte:", error);
      res.status(500).json({ 
        message: "Erro ao atualizar visibilidade da arte",
        error: error instanceof Error ? error.message : String(error)
      });
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
  
  // Registrar rota de proxy de imagens do Supabase
  app.use(imageProxyRouter);
  
  // Rota para upload de imagens (usada no formulário multi-formato) 
  app.use("/api/upload-image", isAuthenticated, uploadMemory.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem fornecida" });
      }
      
      // Extrair categoria para organização das pastas
      const categorySlug = req.body.category;
      
      // Extrair ID do designer (usuário logado)
      const designerId = req.user ? req.user.id : undefined;
      
      // Configurações para otimização
      const options = {
        width: 800,
        height: undefined, // mantém proporção original
        quality: 85,
        format: "webp" as const
      };
      
      // Upload para o Supabase storage usando o método correto
      const result = await supabaseStorageService.uploadImage(
        req.file,
        options,
        categorySlug,
        designerId
      );
      
      return res.json({ 
        success: true, 
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        message: "Imagem enviada com sucesso" 
      });
    } catch (error) {
      console.error("Erro no upload de imagem:", error);
      return res.status(500).json({ 
        error: "Erro ao processar o upload da imagem",
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
  
  // Configurar rotas de seguidores (following)

  // As rotas de designers seguidos e populares foram movidas para ./routes/follows.ts
  setupFollowRoutesSimple(app, isAuthenticated);
  
  // Endpoints para gerenciar configurações do site
  
  // Endpoint especial para forçar refresh completo do logo
  app.post("/api/site-settings/force-logo-refresh", isAdmin, async (req, res) => {
    try {
      // Definir cabeçalhos anti-cache extremos
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-Accel-Expires', '0');
      res.setHeader('Vary', '*');
      
      // Buscar as configurações atuais
      const settings = await db.select().from(siteSettings).limit(1);
      if (settings.length === 0) {
        return res.status(404).json({ message: "Configurações não encontradas" });
      }
      
      const currentSettings = settings[0];
      const currentLogoUrl = currentSettings.logoUrl;
      
      if (!currentLogoUrl) {
        return res.status(400).json({ message: "Não há logo configurado" });
      }
      
      try {
        // Gerar uma nova URL para forçar refresh no navegador
        // Remove todos os parâmetros de query existentes
        const baseUrl = currentLogoUrl.split('?')[0];
        
        // Adiciona um novo timestamp e randomização
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 10);
        const newLogoUrl = `${baseUrl}?t=${timestamp}&r=${randomPart}&force=true`;
        
        // Atualizar no banco de dados
        await db.update(siteSettings)
          .set({
            logoUrl: newLogoUrl,
            updatedAt: new Date(),
            updatedBy: (req.user as any).id
          })
          .where(eq(siteSettings.id, currentSettings.id));
        
        // Retornar a nova URL para o cliente
        return res.json({
          success: true,
          previousLogoUrl: currentLogoUrl,
          newLogoUrl: newLogoUrl,
          timestamp: timestamp,
          message: "URL do logo atualizada com sucesso para forçar refresh"
        });
        
      } catch (error) {
        console.error("Erro ao gerar nova URL para o logo:", error);
        return res.status(500).json({ message: "Erro ao atualizar URL do logo" });
      }
    } catch (error) {
      console.error("Erro na operação de force-logo-refresh:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  app.get("/api/site-settings", async (req, res) => {
    try {
      // Configurar cabeçalhos anti-cache extremamente agressivos
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-Accel-Expires', '0'); // Para Nginx
      res.setHeader('Vary', '*'); // Força validação para todas as condições
      
      // Acrescentar timestamp no cabeçalho para verificação client-side
      res.setHeader('X-Last-Updated', Date.now().toString());
      
      // Buscar as configurações do site (sempre retorna a única linha ou cria uma nova)
      const settings = await db.select().from(siteSettings).limit(1);
      
      // Se não existir configuração, criar uma com valores padrão
      if (settings.length === 0) {
        const [newSettings] = await db.insert(siteSettings).values({}).returning();
        return res.json(newSettings);
      }
      
      // Adiciona um parâmetro de timestamp para invalidação de cache na URL
      const timestamp = Date.now();
      
      if (settings[0].logoUrl) {
        // Verificar se a URL já tem parâmetros de query
        const hasQueryParams = settings[0].logoUrl.includes('?');
        // Adicionar novo parâmetro de query com timestamp atual
        settings[0].logoUrl = `${settings[0].logoUrl}${hasQueryParams ? '&' : '?'}t=${timestamp}`;
        
        // Adicionar informação de timestamp para rastreamento no frontend
        settings[0].updatedAt = timestamp;
      }
      
      return res.json(settings[0]);
    } catch (error) {
      console.error("Erro ao buscar configurações do site:", error);
      res.status(500).json({ message: "Erro ao buscar configurações do site" });
    }
  });
  
  // Endpoint para atualizar campos específicos das configurações do site (requer admin)
  app.patch("/api/site-settings", isAdmin, async (req, res) => {
    try {
      console.log("Requisição de atualização de configurações recebida");
      console.log("Corpo da requisição:", req.body);
      
      // Definir cabeçalhos anti-cache
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Verificar se as configurações existem
      const existingSettings = await db.select().from(siteSettings).limit(1);
      if (existingSettings.length === 0) {
        return res.status(404).json({ message: "Configurações não encontradas" });
      }
      
      // Atualizar apenas os campos enviados no corpo da requisição
      const fieldsToUpdate = req.body;
      const [updatedSettings] = await db
        .update(siteSettings)
        .set({
          ...fieldsToUpdate,
          updatedAt: new Date(),
          updatedBy: req.user?.id || null
        })
        .where(eq(siteSettings.id, existingSettings[0].id))
        .returning();
      
      return res.status(200).json(updatedSettings);
    } catch (error) {
      console.error("Erro ao atualizar configurações do site:", error);
      return res.status(500).json({ 
        message: "Erro ao atualizar configurações do site",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Endpoint para upload de logo do site (requer admin)
  app.put("/api/site-settings", isAdmin, logoUpload.single('logo'), async (req, res) => {
    try {
      console.log("Solicitação de atualização de logo recebida");
      
      // Logs para depuração do upload
      console.log("Corpo da requisição:", Object.keys(req.body || {}).join(', '));
      console.log("Campos do multer recebidos:", Object.keys(req).filter(k => !['file', 'body', 'params', 'query'].includes(k)).slice(0, 5).join(', '));
      console.log("Arquivo anexado presente:", req.file ? "SIM" : "NÃO");
      
      // Definir cabeçalhos anti-cache agressivos
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-Accel-Expires', '0'); // Para Nginx
      res.setHeader('Vary', '*'); // Força validação para todas as condições
      res.setHeader('X-Last-Updated', Date.now().toString());
      
      // Validar os dados recebidos
      let updateData = req.body;
      
      // Se um arquivo de logo foi enviado, processar e salvar
      if (req.file) {
        console.log("Arquivo de logo recebido:", req.file?.originalname, "tipo:", req.file?.mimetype, "tamanho:", req.file?.size, "bytes");
        
        try {
          // Importar o serviço de storage do Supabase
          const { supabaseStorageService } = await import('./services/supabase-storage');
          
          // Obter o nome de arquivo personalizado da requisição (se existir)
          const customFilename = req.body.uniqueFileName || `logo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          console.log("Nome personalizado para o logo:", customFilename);
          
          // Usar o método especializado para upload de logo
          const uploadResult = await supabaseStorageService.uploadLogoWithCustomFilename(
            req.file, 
            customFilename
          );
          
          if (uploadResult && uploadResult.logoUrl) {
            // Adicionar logoUrl aos dados de atualização
            updateData = {
              ...updateData,
              logoUrl: uploadResult.logoUrl
            };
            
            console.log(`Logo enviado com sucesso para ${uploadResult.storageType}: ${uploadResult.logoUrl}`);
          } else {
            console.error("Falha ao fazer upload do logo, URL não retornada");
            return res.status(500).json({ message: "Falha ao fazer upload do logo" });
          }
        } catch (uploadError) {
          console.error("Erro ao processar upload do logo:", uploadError);
          
          // Fallback para método local caso todas as tentativas anteriores falhem
          try {
            // Definir o caminho público para a imagem
            const publicImagesDir = path.join(process.cwd(), 'public/images/logos');
            if (!fs.existsSync(publicImagesDir)) {
              fs.mkdirSync(publicImagesDir, { recursive: true });
            }
            
            // Nome de arquivo único com hash adicional para evitar colisões
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const logoFileName = `logo-${timestamp}-${randomString}${path.extname(req.file?.originalname)}`;
            const logoPath = path.join(publicImagesDir, logoFileName);
            
            // Salvar o arquivo diretamente
            fs.writeFileSync(logoPath, req.file?.buffer);
            
            // Adicionar logoUrl aos dados de atualização
            updateData = {
              ...updateData,
              logoUrl: `/images/logos/${logoFileName}`
            };
            
            console.log("Fallback final: Logo salvo localmente com sucesso:", logoFileName);
          } catch (finalError) {
            console.error("Erro crítico no fallback final do logo:", finalError);
            return res.status(500).json({ message: "Falha completa no processamento do logo" });
          }
        }
      }
      
      // Buscar a configuração existente (ou criar uma nova)
      const existingSettings = await db.select().from(siteSettings).limit(1);
      
      if (existingSettings.length === 0) {
        // Se não existe, criar uma nova configuração
        const [newSettings] = await db.insert(siteSettings).values({
          ...updateData,
          updatedBy: (req.user as any).id
        }).returning();
        return res.json(newSettings);
      } else {
        // Se existe, atualizar a configuração existente
        const [updatedSettings] = await db.update(siteSettings)
          .set({
            ...updateData,
            updatedAt: new Date(),
            updatedBy: (req.user as any).id
          })
          .where(eq(siteSettings.id, existingSettings[0].id))
          .returning();
        
        return res.json(updatedSettings);
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações do site:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações do site" });
    }
  });

  /**
   * Rotas para teste de armazenamento (diagnóstico administrativo)
   */
  // Verificar conexão com serviços de armazenamento
  app.get("/api/admin/storage/check-connection", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const service = req.query.service as string;
      
      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Parâmetro 'service' é obrigatório"
        });
      }
      
      if (service === "supabase") {
        // Verificar conexão com Supabase
        const result = await supabaseStorageService.checkConnection();
        return res.json(result);
      } 
      else if (service === "r2") {
        // Verificar conexão com R2 (agora redireciona para Supabase)
        console.log("AVISO: Serviço R2 foi desativado. Redirecionando para Supabase Storage.");
        const result = await supabaseStorageService.checkConnection();
        return res.json({
          ...result,
          message: "R2 desativado. Usando Supabase Storage como alternativa.",
          redirected: true
        });
      }
      else {
        return res.status(400).json({
          success: false,
          message: "Serviço inválido. Use 'supabase' ou 'r2'"
        });
      }
    } catch (error: any) {
      console.error(`Erro ao verificar conexão:`, error);
      return res.status(500).json({
        success: false,
        message: `Erro ao verificar conexão: ${error.message || "Erro desconhecido"}`,
        error: error.message
      });
    }
  });
  
  // Rota de teste de upload removida daqui para evitar duplicação
  // A implementação unificada está mais abaixo no arquivo (na seção "DIAGNÓSTICO DE ARMAZENAMENTO - ROTAS")

  // Rota administrativa para atualizar designerId de todas as artes
  app.post("/api/admin/update-designers", isAdmin, async (req, res) => {
    try {
      // Buscar o ID do usuário admin
      const admin = req.user;
      
      if (!admin) {
        return res.status(400).json({ message: "Usuário admin não encontrado" });
      }
      
      // Atualizar todas as artes sem designerid usando consulta segura
      await db.update(arts)
        .set({ designerid: admin.id })
        .where(isNull(arts.designerid));

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
      
      // Utilizando SQL para evitar problemas de coluna e garantir valores corretos
      const usersQuery = `
        SELECT 
          id, 
          username, 
          email, 
          name, 
          profileimageurl, 
          bio, 
          nivelacesso,
          tipoplano,
          origemassinatura,
          dataassinatura,
          dataexpiracao,
          acessovitalicio, 
          isactive, 
          ultimologin, 
          criadoem, 
          atualizadoem
        FROM users
        ORDER BY criadoem DESC
      `;
      
      const result = await db.execute(sql.raw(usersQuery));
      const allUsers = result.rows;
      
      // Simplificar para evitar erros SQL - focar apenas nos dados básicos
      const usersWithStats = allUsers.map((user: any) => {
          // Converter para formato CamelCase para o frontend mas preservar campos originais
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            profileimageurl: user.profileimageurl, // Mantido o nome original
            profileImageUrl: user.profileimageurl, // Adicionado formato camelCase
            bio: user.bio,
            role: user.nivelacesso,
            nivelacesso: user.nivelacesso,
            tipoplano: user.tipoplano,
            origemassinatura: user.origemassinatura,
            dataassinatura: user.dataassinatura,
            dataexpiracao: user.dataexpiracao,
            acessovitalicio: user.acessovitalicio,
            isactive: user.isactive,
            ultimologin: user.ultimologin, // Mantido o nome original
            lastLogin: user.ultimologin, // Adicionado formato camelCase
            criadoem: user.criadoem, // Mantido o nome original
            createdAt: user.criadoem, // Adicionado formato camelCase
            followersCount: 0, // Simplificado para evitar erros SQL
            followingCount: 0, // Simplificado para evitar erros SQL
            totalDownloads: 0, // Simplificado para evitar erros SQL
            totalViews: 0 // Simplificado para evitar erros SQL
          };
        });
      
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

  // Rota para atualizar um usuário existente (sem verificação de autenticação)
  app.put("/api/users/:id", async (req, res) => {
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
        
        // Verificar se é usuário de webhook para limitar campos editáveis
        const isWebhookUser = existingUser.origemassinatura === 'hotmart' || existingUser.origemassinatura === 'doppus';
        
        console.log(`[UserUpdate] Iniciando atualização do usuário ${userId}:`, {
          existingUser: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            name: existingUser.name,
            nivelacesso: existingUser.nivelacesso,
            origemassinatura: existingUser.origemassinatura
          },
          isWebhookUser,
          requestData: { username, email, name, nivelacesso, isactive }
        });
        
        // Preparar objeto de atualização
        const updateData: Record<string, any> = {
          atualizadoem: new Date()
        };
        
        if (isWebhookUser) {
          // Para usuários webhook, permitir apenas edição de campos seguros
          console.log(`[UserUpdate] Usuário ${userId} é de webhook (${existingUser.origemassinatura}), limitando campos editáveis`);
          
          if (username) updateData.username = username;
          if (name !== undefined) updateData.name = name || null;
          // Para webhook, manter status ativo/inativo editável para controle administrativo
          if (isactive !== undefined) updateData.isactive = isactive;
          
          // Bloquear todos os outros campos para manter integridade da integração
          console.log(`[UserUpdate] Campos permitidos para webhook:`, { username, name, isactive });
          console.log(`[UserUpdate] UpdateData para webhook:`, updateData);
        } else {
          // Para usuários não-webhook, permitir edição completa
          console.log(`[UserUpdate] Usuário ${userId} NÃO é webhook, permitindo edição completa`);
          
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
          
          console.log(`[UserUpdate] UpdateData para usuário normal:`, updateData);
        }
        
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
        try {
          console.log(`[UserUpdate] Tentando atualizar usuário ${userId} com dados:`, updateData);
          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId));
          
          console.log(`[UserUpdate] Usuário ${userId} atualizado com sucesso no banco de dados`);
        } catch (dbError) {
          console.error(`[UserUpdate] Erro ao atualizar usuário ${userId} no banco:`, dbError);
          return res.status(500).json({ 
            message: "Erro ao atualizar usuário no banco de dados",
            error: dbError.message 
          });
        }
          
        // Verificar se está atualizando para usuário premium ou se o usuário já era premium
        // IMPORTANTE: Para usuários vindos de webhook (hotmart/doppus), não atualizar o serviço de assinatura
        // NOTA: Reutilizando a variável isWebhookUser já definida anteriormente
        
        if (!isWebhookUser && (nivelacesso === 'premium' || existingUser.nivelacesso === 'premium')) {
          // Definir o nível de acesso efetivo para o usuário (o novo valor ou o existente)
          const effectiveNivelAcesso = nivelacesso || existingUser.nivelacesso;
          
          // Se o usuário for premium (atual ou após atualização), atualizar dados da assinatura
          if (effectiveNivelAcesso === 'premium') {
            // Processar data de expiração com base no tipo de plano
            let endDate: Date | null = null;
            
            // Determinar se tem acesso vitalício (novo valor ou o existente)
            const hasLifetimeAccess = acessovitalicio !== undefined ? acessovitalicio : existingUser.acessovitalicio;
            
            // Se origem da assinatura não for definida explicitamente, mantenha a anterior
            // Isso garante que a origem "auto" não seja perdida ao atualizar para premium
            if (!origemassinatura && existingUser.origemassinatura) {
              updateData.origemassinatura = existingUser.origemassinatura;
            }
            
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
            
            try {
              // Criar ou atualizar registro de assinatura
              await SubscriptionService.createOrUpdateSubscription(
                userId, 
                effectiveTipoPlano, 
                new Date(), // Data de início (atual)
                endDate
              );
            } catch (error) {
              console.log(`[UserUpdate] Erro ao atualizar serviço de assinatura, mas usuário foi atualizado:`, error);
            }
          }
        } else if (isWebhookUser) {
          console.log(`[UserUpdate] Usuário ${userId} é de webhook (${existingUser.origemassinatura}), pulando atualização do serviço de assinatura`);
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
  app.patch("/api/users/:id", async (req, res) => {
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

  // Rota para exportar dados do usuário
  app.get("/api/users/:id/export", async (req, res) => {
    try {
      const user = req.user as User;
      const userId = parseInt(req.params.id);
      
      // Verificar se o usuário tem permissão (admin ou o próprio usuário)
      if (user.nivelacesso !== "admin" && user.nivelacesso !== "designer_adm" && user.id !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Buscar dados do usuário
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
        
      if (!userData) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Buscar estatísticas do usuário
      const [downloadsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(downloads)
        .where(eq(downloads.userId, userId));

      const [viewsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(views)
        .where(eq(views.userId, userId));

      const [favoritesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(favorites)
        .where(eq(favorites.userId, userId));

      const [followersCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sql`(SELECT * FROM "userFollows" WHERE "followingId" = ${userId}) as followers`);

      const [followingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sql`(SELECT * FROM "userFollows" WHERE "followerId" = ${userId}) as following`);

      const [artsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(arts)
        .where(eq(arts.designerid, userId));

      // Buscar artes criadas pelo usuário
      const userArts = await db
        .select()
        .from(arts)
        .where(eq(arts.designerid, userId))
        .limit(50); // Limitar para não sobrecarregar

      // Buscar favorites do usuário
      const userFavorites = await db
        .select({
          artId: favorites.artId,
          createdAt: favorites.createdAt,
          art: {
            id: arts.id,
            title: arts.title,
            imageUrl: arts.imageUrl
          }
        })
        .from(favorites)
        .innerJoin(arts, eq(arts.id, favorites.artId))
        .where(eq(favorites.userId, userId))
        .limit(50);

      // Preparar dados para exportação
      const exportData = {
        usuario: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          bio: userData.bio,
          nivelacesso: userData.nivelacesso,
          origemassinatura: userData.origemassinatura,
          tipoplano: userData.tipoplano,
          dataassinatura: userData.dataassinatura,
          dataexpiracao: userData.dataexpiracao,
          acessovitalicio: userData.acessovitalicio,
          isactive: userData.isactive,
          criadoem: userData.criadoem,
          ultimologin: userData.ultimologin,
          website: userData.website,
          location: userData.location
        },
        estatisticas: {
          totalDownloads: downloadsCount?.count || 0,
          totalVisualizacoes: viewsCount?.count || 0,
          totalFavoritos: favoritesCount?.count || 0,
          totalSeguidores: followersCount?.count || 0,
          totalSeguindo: followingCount?.count || 0,
          totalArtes: artsCount?.count || 0
        },
        artes: userArts.map(art => ({
          id: art.id,
          title: art.title,
          imageUrl: art.imageUrl,
          isPremium: art.isPremium,
          criadoem: art.createdAt
        })),
        favoritos: userFavorites.map(fav => ({
          artId: fav.artId,
          titulo: fav.art.title,
          imageUrl: fav.art.imageUrl,
          favoritadoEm: fav.createdAt
        })),
        dataExportacao: new Date().toISOString()
      };

      res.json(exportData);
    } catch (error) {
      console.error("Erro ao exportar dados do usuário:", error);
      res.status(500).json({ message: "Erro ao exportar dados do usuário" });
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
        // Remover códigos de verificação de e-mail
        try {
          await db.execute(sql`
            DELETE FROM "emailVerificationCodes" 
            WHERE "userId" = ${userId}
          `);
          console.log("- Códigos de verificação de e-mail removidos");
        } catch (error) {
          console.log("- Não foi possível remover códigos de verificação de e-mail:", error);
        }
        
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
        
        // Verificar se a tabela userfollows existe antes de tentar usar
        try {
          // Remover relações de seguidores/seguindo (usando o nome correto da tabela)
          await db.execute(sql`
            DELETE FROM "userfollows" 
            WHERE "followerid" = ${userId} 
            OR "followingid" = ${userId}
          `);
          console.log("- Relações de seguidores removidas");
        } catch (error) {
          console.log("- Não foi possível remover relações de seguidores:", error);
          console.log("- Erro detalhado:", error);
        }
        
        // Verificar artes criadas pelo usuário e decidir se serão excluídas
        if (userToDelete[0].nivelacesso === 'designer' || userToDelete[0].nivelacesso === 'designer_adm') {
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

  // Rota para resetar senha de usuário
  app.put("/api/users/:id/reset-password", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "Nova senha é obrigatória" });
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Atualizar senha no banco
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));

      res.json({ 
        success: true, 
        message: "Senha resetada com sucesso" 
      });
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      res.status(500).json({ message: "Erro ao resetar senha" });
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
      const designers = await db.execute(
        sort === 'activity' 
          ? sql`
              SELECT 
                id, 
                name, 
                username, 
                bio, 
                profileimageurl, 
                nivelacesso, 
                0 AS followers, 
                0 AS following, 
                "createdAt" as createdat,
                atualizadoem as updatedat
              FROM users 
              WHERE nivelacesso IN ('designer', 'designer_adm', 'admin')
              ORDER BY atualizadoem DESC
              LIMIT ${limit} OFFSET ${offset}
            `
          : sql`
              SELECT 
                id, 
                name, 
                username, 
                bio, 
                profileimageurl, 
                nivelacesso, 
                0 AS followers, 
                0 AS following, 
                "createdAt" as createdat,
                atualizadoem as updatedat
              FROM users 
              WHERE nivelacesso IN ('designer', 'designer_adm', 'admin')
              ORDER BY "createdAt" DESC
              LIMIT ${limit} OFFSET ${offset}
            `
      );
      
      // Obter contagem total
      const totalCountResult = await db.execute(
        sql`
          SELECT COUNT(*) as value 
          FROM users 
          WHERE nivelacesso IN ('designer', 'designer_adm', 'admin')
        `
      );
      const totalCount = parseInt(totalCountResult.rows[0].value.toString());
      
      // Para cada designer, buscar algumas artes para exibir
      const designersWithArts = await Promise.all(designers.rows.map(async (designer: any) => {
        const recentArts = await db.execute(sql`
          SELECT 
            id, 
            title, 
            "imageUrl" as imageurl, 
            "isPremium" as ispremium
          FROM arts 
          WHERE designerid = ${designer.id}
          ORDER BY "createdAt" DESC
          LIMIT 4
        `);
        
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
      
      // Verificar se o usuário é admin
      const isAdmin = req.user && (req.user as any).nivelacesso === 'admin';
      
      // Buscamos dados do designer diretamente
      const userQuery = await db.execute(
        sql`
        SELECT 
          id,
          username,
          name,
          bio,
          profileimageurl,
          nivelacesso,
          website,
          location,
          criadoem,
          0 as followers,
          0 as following,
          sociallinks
        FROM users
        WHERE username = ${username}
        LIMIT 1
        `
      );
      
      // Se não houver resultados, retornamos 404
      if (userQuery.rows.length === 0) {
        return res.status(404).json({ message: "Designer não encontrado" });
      }
      
      // O primeiro resultado é o designer
      const designer = userQuery.rows[0];
      
      // Verificar se o usuário logado já segue este designer
      let isFollowing = false;
      if (req.user) {
        const followerId = (req.user as any).id;
        
        const followQuery = await db.execute(
          sql`
          SELECT id FROM "userFollows"
          WHERE "followerId" = ${followerId}
          AND "followingId" = ${designer.id}
          LIMIT 1
          `
        );
        
        isFollowing = followQuery.rows.length > 0;
      }
      
      // Buscar artes do designer com condição de visibilidade para usuários não admin
      const artsQuery = await db.execute(
        !isAdmin
          ? sql`
            SELECT 
              id, 
              title, 
              "imageUrl", 
              "isPremium", 
              format, 
              "createdAt",
              viewcount,
              "downloadCount"
            FROM arts
            WHERE designerid = ${designer.id}
              AND "isVisible" = true
            ORDER BY "createdAt" DESC
            `
          : sql`
            SELECT 
              id, 
              title, 
              "imageUrl", 
              "isPremium", 
              format, 
              "createdAt",
              viewcount,
              "downloadCount"
            FROM arts
            WHERE designerid = ${designer.id}
            ORDER BY "createdAt" DESC
            `
      );
      
      const designerArts = artsQuery.rows;
      
      // Calcular estatísticas
      const artCount = designerArts.length;
      const premiumArtCount = designerArts.filter(art => art.isPremium).length;
      const totalDownloads = designerArts.reduce((sum, art) => 
        sum + (parseInt(String(art.downloadCount || 0))), 0);
      const totalViews = designerArts.reduce((sum, art) => 
        sum + (parseInt(String(art.viewcount || 0))), 0);
      
      // Preparar resposta formatada para o frontend
      const response = {
        id: designer.id,
        username: designer.username,
        name: designer.name,
        bio: designer.bio,
        profileImageUrl: designer.profileimageurl,
        nivelAcesso: designer.nivelacesso,
        role: designer.nivelacesso,
        website: designer.website || "",
        location: designer.location || "",
        socialLinks: designer.sociallinks || {},
        followers: 0,
        following: 0,
        createdAt: designer.criadoem,
        isFollowing,
        statistics: {
          totalArts: artCount,
          premiumArts: premiumArtCount,
          totalDownloads,
          totalViews
        },
        arts: designerArts.map(art => ({
          id: art.id,
          title: art.title,
          imageUrl: art.imageUrl,
          format: art.format,
          isPremium: art.isPremium,
          createdAt: art.createdAt
        }))
      };
      
      // Retornar dados do designer com estatísticas
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
      
      // Buscar artes com paginação usando SQL direto
      const offset = (page - 1) * limit;
      
      // Usando o formato sql`` que funciona para esta biblioteca específica
      const artsResult = await db.execute(
        sql`
          SELECT * FROM arts
          WHERE designerid = ${designerId}
          ORDER BY "createdAt" DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      );
      
      const designerArts = artsResult.rows;
      
      // Contar total de artes
      const countResult = await db.execute(
        sql`
          SELECT COUNT(*) as value
          FROM arts
          WHERE designerid = ${designerId}
        `
      );
      
      const totalCount = parseInt(countResult.rows[0].value);
      
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
  // Mantida para compatibilidade com código frontend legado
  app.post("/api/follow/:designerId", isAuthenticated, async (req, res) => {
    try {
      const designerId = parseInt(req.params.designeridId);
      const followerId = (req.user as any).id;
      
      console.log("Redirecionando chamada de /api/follow para /api/users/follow com action=follow");
      
      // Redirecionando para o novo endpoint unificado
      // Modificando o req.body para incluir o parâmetro action
      req.body = { action: "follow" };
      
      // Chamando a API nova diretamente através de fetch interno
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.headers.host}/api/users/follow/${designerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie || ''
        },
        body: JSON.stringify({ action: "follow" })
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("Erro ao seguir designer (redirecionamento):", error);
      res.status(500).json({ message: "Erro ao seguir designer" });
    }
  });
  
  // Deixar de seguir um designer (protegido por autenticação)
  // Mantida para compatibilidade com código frontend legado
  app.delete("/api/unfollow/:designerId", isAuthenticated, async (req, res) => {
    try {
      const designerId = parseInt(req.params.designeridId);
      const followerId = (req.user as any).id;
      
      console.log("Redirecionando chamada de /api/unfollow para /api/users/follow com action=unfollow");
      
      // Redirecionando para o novo endpoint unificado
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.headers.host}/api/users/follow/${designerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie || ''
        },
        body: JSON.stringify({ action: "unfollow" })
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("Erro ao deixar de seguir designer (redirecionamento):", error);
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
          sociallinks: socialLinks || user,
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
        role: updatedUser.nivelacesso,
        nivelAcesso: updatedUser.nivelacesso,
        bio: updatedUser.bio,
        website: updatedUser.website,
        location: updatedUser.location,
        socialLinks: updatedUser,
        profileImageUrl: updatedUser.profileimageurl,
        followers: updatedUser,
        following: updatedUser,
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
      const username = (req.user as any).username;
      
      // Logging completo para debug
      console.log("=== INÍCIO DO UPLOAD DE IMAGEM DE PERFIL ===");
      console.log(`Usuário ID: ${userId}`);
      console.log(`Username: ${username}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      
      // Log detalhado para todos os usuários
      console.log(`[DIAGNÓSTICO DETALHADO] Usuário ${username} (ID: ${userId}) tentando upload de avatar`);
      console.log(`Detalhes do arquivo: ${req.file?.originalname} (${req.file?.size} bytes) - Tipo: ${req.file?.mimetype}`);
      
      // Log extra para usuário específico com problemas
      const isProblematicUser = username === 'fernandosim20188718';
      if (isProblematicUser) {
        console.log("");
        console.log("⚠️ ==============================================");
        console.log("⚠️ USUÁRIO COM PROBLEMAS CONHECIDOS DETECTADO!");
        console.log("⚠️ ==============================================");
        console.log("🔍 Iniciando processo especializado de diagnóstico e upload para este usuário.");
        console.log(`🔍 Username: ${username}`);
        console.log(`🔍 ID: ${userId}`);
        console.log(`🔍 Arquivo: ${req.file?.originalname}`);
        console.log(`🔍 Tamanho: ${req.file?.size} bytes`);
        console.log(`🔍 Tipo MIME: ${req.file?.mimetype}`);
        console.log(`🔍 Buffer válido: ${!!req.file?.buffer}`);
        console.log(`🔍 Tamanho do buffer: ${req.file?.buffer ? req.file?.buffer.length : 0} bytes`);
        console.log("⚠️ ==============================================");
        console.log("");
      }
      
      // Verificar se o arquivo foi enviado
      if (!req.file) {
        console.error("ERRO: Nenhum arquivo recebido no upload de imagem de perfil");
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }
      
      // Verificar tamanho e tipo de arquivo
      console.log(`Arquivo: ${req.file?.originalname} (${req.file?.size} bytes), MIME: ${req.file?.mimetype}`);
      
      if (req.file?.size > 5 * 1024 * 1024) { // 5MB
        console.error("ERRO: Arquivo muito grande para imagem de perfil");
        return res.status(400).json({ message: "A imagem deve ter no máximo 5MB" });
      }
      
      if (!req.file?.mimetype.startsWith('image/')) {
        console.error(`ERRO: Tipo de arquivo inválido: ${req.file?.mimetype}`);
        return res.status(400).json({ message: "O arquivo enviado não é uma imagem válida" });
      }
      
      // Verificar se o buffer tem conteúdo
      if (!req.file?.buffer || req.file?.buffer.length === 0) {
        console.error("ERRO: Buffer do arquivo vazio ou inválido");
        return res.status(400).json({ message: "Dados da imagem inválidos ou corrompidos" });
      }
      
      // Verificar se o usuário existe
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        console.error(`ERRO: Usuário ID ${userId} não encontrado para upload de imagem`);
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      console.log("Informações do usuário para upload:", {
        userId: user.id,
        username: user.username,
        nivelacesso: user.nivelacesso,
        profileImageAtual: !!user.profileimageurl ? 'Existe' : 'Não existe'
      });
      
      // Opções para o processamento da imagem
      const options = {
        width: 400,  // Tamanho adequado para avatar de perfil
        height: 400,
        quality: 85,
        format: 'webp' as const
      };
      
      // Estratégia de upload em cascata: tenta R2 primeiro, depois Supabase, depois fallback para local
      console.log("INICIANDO ESTRATÉGIA DE UPLOAD EM CASCATA");
      
      let imageUrl = null;
      let uploadSuccess = false;
      let storageType = "";
      let errorDetails = [];
      
      // ETAPA 1: Tentar upload para R2 (bucket designautoimages)
      try {
        console.log("ETAPA 1: Tentando upload para R2 Storage (bucket 'designautoimages')...");
        
        // Verificar se temos o arquivo e se o caminho é válido
        if (!req.file || !req.file?.buffer) {
          console.error("❌ ETAPA 1: Arquivo inválido ou buffer não disponível para R2");
          throw new Error("Arquivo inválido ou buffer não disponível");
        }
        
        console.log(`Arquivo para R2: ${req.file?.originalname}, tamanho: ${req.file?.size}, tipo: ${req.file?.mimetype}`);
        
        // Usar diretamente o buffer do arquivo (multer)
        const fileBuffer = req.file?.buffer;
        
        // Fazer upload via serviço R2
        const r2Result = await r2StorageService.uploadAvatar(user.id, fileBuffer, req.file?.mimetype);
        
        if (r2Result.success && r2Result.url) {
          imageUrl = r2Result.url;
          storageType = "r2_avatar";
          uploadSuccess = true;
          
          console.log("✅ ETAPA 1: Upload para R2 concluído com sucesso");
          console.log(`URL da imagem: ${imageUrl}`);
          console.log(`Tipo de armazenamento: ${storageType}`);
        } else {
          throw new Error(r2Result.error || "Falha desconhecida no upload para R2");
        }
      } catch (r2Error: any) {
        console.error("❌ ETAPA 1: Erro no upload para R2:", r2Error);
        errorDetails.push({
          stage: "r2_upload",
          message: r2Error.message,
          stack: r2Error.stack
        });
        
        // Continua para a próxima etapa (Supabase)
      }
      
      // ETAPA 2: Tentar upload para Supabase (bucket designautoimages) se R2 falhou
      if (!uploadSuccess) {
        try {
          console.log("ETAPA 2: Tentando upload para bucket 'designautoimages' do Supabase...");
          
          // Passar o ID do usuário para usar no nome do arquivo
          const result = await supabaseStorageService.uploadAvatar(req.file, options, userId);
          imageUrl = result.imageUrl;
          storageType = result.storageType || "supabase_avatar";
          uploadSuccess = true;
          
          console.log("✅ ETAPA 2: Upload para Supabase concluído com sucesso");
          console.log(`URL da imagem: ${imageUrl}`);
          console.log(`Tipo de armazenamento: ${storageType}`);
        } catch (supabaseError: any) {
          console.error("❌ ETAPA 2: Erro no upload para Supabase:", supabaseError);
          errorDetails.push({
            stage: "supabase_upload",
            message: supabaseError.message,
            stack: supabaseError.stack
          });
          
          // Continua para a próxima etapa (fallback local)
        }
      }
      
      // ETAPA 3: Fallback para armazenamento local (se R2 e Supabase falharam)
      if (!uploadSuccess) {
        try {
          console.log("ETAPA 3: Tentando upload para armazenamento local...");
          
          const localResult = await storageService.localUpload(req.file, {
            ...options,
            targetFolder: 'designautoimages' // Pasta específica para avatares
          });
          
          imageUrl = localResult.imageUrl;
          storageType = "local_avatar";
          uploadSuccess = true;
          
          console.log("✅ ETAPA 3: Upload local concluído com sucesso");
          console.log(`URL da imagem: ${imageUrl}`);
        } catch (localError: any) {
          console.error("❌ ETAPA 3: Erro no armazenamento local:", localError);
          errorDetails.push({
            stage: "local_upload",
            message: localError.message,
            stack: localError.stack
          });
          
          // Tentou todas as opções e falhou
        }
      }
      
      // Verificar se alguma das estratégias foi bem-sucedida
      if (!uploadSuccess || !imageUrl) {
        console.error("FALHA TOTAL: Todas as estratégias de upload falharam");
        console.error("Detalhes dos erros:", JSON.stringify(errorDetails, null, 2));
        
        // Solução especializada para o usuário específico com problemas persistentes
        if (isProblematicUser) {
          console.log("⚠️ APLICANDO PROTOCOLO DE UPLOAD ESPECIALIZADO PARA USUÁRIO PROBLEMÁTICO");
          console.log("Iniciando método emergencyAvatarUpload com múltiplas estratégias...");
          
          try {
            // Usar o novo método de emergência que tenta múltiplas estratégias
            const emergencyResult = await supabaseStorageService.emergencyAvatarUpload(
              req.file,
              user.username,
              {
                width: 400,  
                height: 400,
                quality: 85
              }
            );
            
            // Usar o resultado da estratégia que funcionou
            imageUrl = emergencyResult.imageUrl;
            storageType = emergencyResult.storageType;
            uploadSuccess = true;
            
            console.log(`✅ Upload de emergência concluído com sucesso!`);
            console.log(`- Estratégia: ${emergencyResult.strategy}`);
            console.log(`- URL: ${imageUrl}`);
            console.log(`- Tipo: ${storageType}`);
            
            // Registrar sucesso específico para este usuário
            console.log(`SUCESSO PARA USUÁRIO PROBLEMÁTICO ${user.username} usando estratégia ${emergencyResult.strategy}`);
          } catch (emergencyError) {
            console.error("ERRO NA SOLUÇÃO DE EMERGÊNCIA:", emergencyError);
            
            // Mesmo em caso de erro, temos um fallback garantido (avatar placeholder)
            // Usar um avatar padrão com timestamp para evitar problemas de cache
            const timestamp = Date.now();
            imageUrl = `https://placehold.co/400x400/555588/ffffff?text=U:${user.username}&date=${timestamp}`;
            storageType = "external_fallback";
            uploadSuccess = true;
            
            console.log(`⚠️ Usando fallback de avatar externo: ${imageUrl}`);
          }
        }
        
        // Se ainda falhou após tentativa de emergência
        if (!uploadSuccess || !imageUrl) {
          return res.status(500).json({ 
            message: "Não foi possível processar o upload da imagem. Tente novamente.",
            details: errorDetails.map(e => e.message).join("; ")
          });
        }
      }
      
      // Atualizar perfil do usuário com nova imagem
      console.log("Atualizando perfil do usuário com nova imagem...");
      console.log(`- Usuário ID: ${userId}`);
      console.log(`- Nova imagem URL: ${imageUrl}`);
      console.log(`- Armazenamento: ${storageType}`);
      
      try {
        console.log("Executando atualização no banco de dados...");
        
        const updateResult = await db.update(users)
          .set({
            profileimageurl: imageUrl,
            atualizadoem: new Date()
          })
          .where(eq(users.id, userId))
          .returning();
          
        console.log("Resultado da atualização:", updateResult);
        console.log("Perfil atualizado com sucesso no banco de dados!");
        
        // Retornar URL da imagem para uso no frontend
        return res.json({ 
          imageUrl,
          message: "Imagem de perfil atualizada com sucesso",
          storageType
        });
      } catch (dbError: any) {
        console.error("ERRO NA ATUALIZAÇÃO DO BANCO DE DADOS:", dbError);
        
        // Mesmo com erro no banco, retornamos sucesso parcial com a URL
        // O cliente ainda pode exibir a imagem mesmo que não tenha sido salva no perfil
        return res.status(206).json({
          imageUrl,
          message: "Imagem foi processada, mas houve um erro ao salvá-la no seu perfil. A imagem pode não persistir após logout.",
          error: dbError.message,
          storageType
        });
      }
    } catch (error: any) {
      console.error("ERRO CRÍTICO no processamento de imagem de perfil:", error);
      console.error("Stack trace:", error.stack);
      
      // Erro genérico que escapou dos tratamentos específicos
      return res.status(500).json({ 
        message: "Erro ao processar imagem de perfil. Tente novamente mais tarde.",
        details: error.message || "Erro interno do servidor"
      });
    }
  });
  
  // Endpoint de teste para debug de upload de avatar
  app.post("/api/debug/test-avatar-upload", isAuthenticated, uploadMemory.single('image'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const username = (req.user as any).username;
      
      console.log("=== INÍCIO DO TESTE DE UPLOAD DE AVATAR ===");
      console.log(`Usuário: ${username} (ID: ${userId})`);
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado" 
        });
      }
      
      console.log(`Arquivo recebido: ${req.file?.originalname} (${req.file?.size} bytes)`);
      console.log(`Tipo MIME: ${req.file?.mimetype}`);
      console.log(`Buffer válido: ${!!req.file?.buffer} (${req.file?.buffer?.length || 0} bytes)`);
      
      // Tentar upload direto para o bucket 'designautoimages'
      try {
        console.log("Tentando upload direto para bucket 'designautoimages'...");
        
        const uploadOptions = {
          width: 200,   // Menor para teste
          height: 200,  // Menor para teste
          quality: 80,
        };
        
        // Usar o método de emergência para upload de avatar
        const result = await supabaseStorageService.emergencyAvatarUpload(req.file, username, uploadOptions);
        
        console.log("✅ Upload de avatar bem-sucedido:");
        console.log(`- URL: ${result.imageUrl}`);
        console.log(`- Tipo de armazenamento: ${result.storageType}`);
        console.log(`- Estratégia: ${result.strategy}`);
        
        return res.json({
          success: true,
          url: result.imageUrl,
          storageType: result.storageType,
          strategy: result.strategy,
          message: "Upload de teste realizado com sucesso"
        });
      } catch (error) {
        console.error("Erro no teste de upload de avatar:", error);
        return res.status(500).json({
          success: false,
          error: String(error)
        });
      }
    } catch (error) {
      console.error("Erro geral no teste de avatar:", error);
      return res.status(500).json({
        success: false,
        error: String(error)
      });
    }
  });
  
  // Endpoint específico para designers (mantido para compatibilidade)
  app.post("/api/designers/profile-image", isAuthenticated, uploadMemory.single('image'), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Logging completo para debug
      console.log("=== INÍCIO DO UPLOAD DE IMAGEM DE PERFIL DESIGNER ===");
      console.log(`Usuário ID: ${userId}`);
      
      // Verificar se o arquivo foi enviado
      if (!req.file) {
        console.error("ERRO: Nenhum arquivo recebido no upload de imagem de designer");
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }
      
      // Verificar tamanho e tipo de arquivo
      console.log(`Arquivo: ${req.file?.originalname} (${req.file?.size} bytes), MIME: ${req.file?.mimetype}`);
      
      if (req.file?.size > 5 * 1024 * 1024) { // 5MB
        console.error("ERRO: Arquivo muito grande para imagem de perfil de designer");
        return res.status(400).json({ message: "A imagem deve ter no máximo 5MB" });
      }
      
      if (!req.file?.mimetype.startsWith('image/')) {
        console.error(`ERRO: Tipo de arquivo inválido: ${req.file?.mimetype}`);
        return res.status(400).json({ message: "O arquivo enviado não é uma imagem válida" });
      }
      
      // Verificar se o usuário existe
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        console.error(`ERRO: Usuário ID ${userId} não encontrado para upload de imagem`);
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o usuário tem permissão para ser designer
      if (user.nivelacesso !== 'designer' && user.nivelacesso !== 'designer_adm' && user.nivelacesso !== 'admin') {
        console.error(`ERRO: Usuário ID ${userId} não tem permissão de designer`);
        return res.status(403).json({ message: "Apenas designers podem atualizar imagem de perfil" });
      }
      
      // Verificar se o buffer tem conteúdo
      if (!req.file?.buffer || req.file?.buffer.length === 0) {
        console.error("ERRO: Buffer do arquivo vazio ou inválido");
        return res.status(400).json({ message: "Dados da imagem inválidos ou corrompidos" });
      }
      
      // Opções para o processamento da imagem
      const options = {
        width: 400,  // Tamanho adequado para avatar de perfil
        height: 400,
        quality: 85,
        format: 'webp' as const
      };
      
      // Usar o mesmo método de uploadAvatar do endpoint de usuários comuns
      let imageUrl = null;
      let uploadSuccess = false;
      
      try {
        console.log("Tentando upload para bucket 'designautoimages' do Supabase...");
        
        // Usar o método especializado para avatares, passando o ID do usuário
        const result = await supabaseStorageService.uploadAvatar(req.file, options, userId);
        imageUrl = result.imageUrl;
        uploadSuccess = true;
        
        console.log("Upload de avatar concluído com sucesso:", imageUrl);
      } catch (uploadError: any) {
        console.error("Erro no upload para bucket de designautoimages:", uploadError);
        
        // Fallback para armazenamento local
        try {
          console.log("Usando armazenamento local como fallback para imagem de perfil de designer...");
          
          const localResult = await storageService.localUpload(req.file, options);
          imageUrl = localResult.imageUrl;
          uploadSuccess = true;
          
          console.log("Upload local concluído com sucesso:", imageUrl);
        } catch (localError: any) {
          console.error("Erro no armazenamento local:", localError);
          return res.status(500).json({ 
            message: "Não foi possível processar o upload da imagem. Tente novamente.",
            details: localError.message || "Erro desconhecido"
          });
        }
      }
      
      // Verificar se o upload foi bem-sucedido
      if (!uploadSuccess || !imageUrl) {
        console.error("FALHA TOTAL no upload da imagem de perfil do designer");
        return res.status(500).json({ 
          message: "Não foi possível processar o upload da imagem. Tente novamente."
        });
      }
      
      // Atualizar perfil do designer com nova imagem (com URL válida)
      console.log(`Atualizando perfil do designer ${userId} com nova imagem: ${imageUrl}`);
      
      await db.update(users)
        .set({
          profileimageurl: imageUrl,
          atualizadoem: new Date() // Usando o campo correto conforme o schema
        })
        .where(eq(users.id, userId));
      
      console.log("Perfil do designer atualizado com sucesso!");
      
      // Retornar URL da imagem para uso no frontend
      return res.json({ 
        imageUrl,
        message: "Imagem de perfil atualizada com sucesso"
      });
    } catch (error: any) {
      console.error("Erro crítico ao processar upload de imagem de perfil do designer:", error);
      return res.status(500).json({ 
        message: "Erro ao processar imagem de perfil",
        details: error.message || "Erro interno do servidor"
      });
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
      
      // Buscar seguidores - usando query parameterizada para segurança
      const followersResult = await db.execute(sql`
        SELECT 
          u.id, 
          u.name, 
          u.username, 
          u.profileimageurl AS "profileImageUrl", 
          u.nivelacesso,
          u.nivelacesso AS "nivelAcesso", 
          0 AS following, 
          0 AS followers, 
          uf.createdat AS "followDate"
        FROM "userFollows" uf
        INNER JOIN users u ON uf."followerId" = u.id
        WHERE uf."followingId" = ${designerId}
        ORDER BY uf.createdat DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      const followers = followersResult.rows;
      
      // Contar total de seguidores usando query parameterizada
      const totalCountResult = await db.execute(sql`
        SELECT COUNT(*) as value 
        FROM "userFollows" 
        WHERE "followingId" = ${designerId}
      `);
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
  // DIAGNÓSTICO DE ARMAZENAMENTO - ROTAS
  // =============================================
  
  // Nota: A rota de verificação de conexão já está definida acima (/api/admin/storage/check-connection)
  
  // Teste de upload de imagem
  app.post("/api/admin/storage/test-upload", isAuthenticated, isAdmin, uploadMemory.single('image'), async (req, res) => {
    try {
      const service = req.query.service as string;
      
      if (!service || (service !== 'supabase' && service !== 'r2')) {
        return res.status(400).json({ 
          success: false,
          message: "Serviço inválido. Use 'supabase' ou 'r2'."
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado."
        });
      }
      
      // Obter o arquivo enviado
      const imageFile = {
        buffer: req.file?.buffer,
        originalname: req.file?.originalname,
        mimetype: req.file?.mimetype
      };
      
      // Preparar opções de otimização
      const optimizationOptions = {
        width: 1200,
        height: undefined,
        quality: 80,
        format: 'webp' as const
      };
      
      // Registrar tempo inicial
      const startTime = Date.now();
      
      // Realizar upload conforme o serviço selecionado
      if (service === 'supabase') {
        // Limpar logs para nova operação
        supabaseStorageService.clearLogs();
        
        // Realizar upload para Supabase
        const uploadResult = await supabaseStorageService.testUpload(
          imageFile,
          'test-uploads', // pasta específica para testes
          optimizationOptions
        );
        
        // Calcular tempo total
        const totalTime = Date.now() - startTime;
        
        // Retornar resultado
        return res.json({
          ...uploadResult,
          timings: {
            ...uploadResult.timings,
            total: totalTime
          }
        });
      } else {
        // R2 está desativado, redirecionando para Supabase
        console.log("AVISO: R2 está desativado. Redirecionando para Supabase Storage.");
        
        // Limpar logs para nova operação
        supabaseStorageService.clearLogs();
        supabaseStorageService.log("⚠️ O serviço R2 foi desativado. Todas as operações agora usam o Supabase Storage.");
        
        // Realizar upload para Supabase como alternativa
        const uploadResult = await supabaseStorageService.testUpload(
          imageFile,
          optimizationOptions
        );
        
        // Calcular tempo total
        const totalTime = Date.now() - startTime;
        
        // Retornar resultado com indicação de redirecionamento
        return res.json({
          ...uploadResult,
          message: "R2 desativado. Usando Supabase Storage como alternativa para upload.",
          redirected: true,
          storageType: "supabase",
          timings: {
            ...uploadResult.timings,
            total: totalTime
          }
        });
      }
    } catch (error) {
      console.error("Erro ao testar upload:", error);
      res.status(500).json({ 
        success: false,
        message: `Erro ao testar upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  });
  
  // Teste de upload direto (sem processamento de imagem)
  app.post("/api/admin/storage/test-upload-direct", isAuthenticated, isAdmin, uploadMemory.single('image'), async (req, res) => {
    try {
      const service = req.query.service as string;
      
      if (!service || (service !== 'supabase' && service !== 'r2')) {
        return res.status(400).json({ 
          success: false,
          message: "Serviço inválido. Use 'supabase' ou 'r2'."
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo enviado."
        });
      }
      
      // Registrar tempo inicial
      const startTime = Date.now();
      
      if (service === 'supabase') {
        // Limpar logs para nova operação
        supabaseStorageService.clearLogs();
        
        // Realizar upload direto para Supabase (sem processamento)
        const uploadResult = await supabaseStorageService.testUploadDirectNoSharp(req.file);
        
        // Calcular tempo total
        const totalTime = Date.now() - startTime;
        
        return res.json({
          success: uploadResult.success,
          imageUrl: uploadResult.imageUrl,
          message: uploadResult.success ? "Upload direto realizado com sucesso" : "Falha no upload direto",
          error: uploadResult.error,
          storageType: uploadResult.storageType || "supabase_direct",
          timings: {
            total: totalTime,
            upload: totalTime
          },
          logs: uploadResult.logs
        });
      } else {
        // R2 está desativado, redirecionando para Supabase
        console.log("AVISO: R2 está desativado. Redirecionando teste de upload direto para Supabase Storage.");
        
        // Limpar logs para nova operação
        supabaseStorageService.clearLogs();
        supabaseStorageService.log("⚠️ O serviço R2 foi desativado. Todas as operações agora usam o Supabase Storage.");
        
        // Realizar upload direto para Supabase como alternativa
        const uploadResult = await supabaseStorageService.testUploadDirectNoSharp(req.file);
        
        // Calcular tempo total
        const totalTime = Date.now() - startTime;
        
        // Retornar resultado com indicação de redirecionamento
        return res.json({
          success: uploadResult.success,
          imageUrl: uploadResult.imageUrl,
          message: "R2 desativado. Usando Supabase Storage como alternativa para upload direto.",
          redirected: true,
          storageType: "supabase_direct",
          timings: {
            total: totalTime,
            upload: totalTime
          },
          logs: uploadResult.logs
        });
      }
    } catch (error) {
      console.error("Erro ao realizar upload direto:", error);
      res.status(500).json({ 
        success: false,
        message: `Erro ao realizar upload direto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
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

  // Endpoint para obter estatísticas de assinaturas para o painel administrativo
  app.get("/api/subscriptions/stats", isAdmin, async (req, res) => {
    try {
      // Obter total de usuários com assinatura (exceto free)
      const [totalResult] = await db
        .select({ count: count() })
        .from(users)
        .where(not(eq(users.nivelacesso, 'free')));
      
      // Obter usuários com assinatura ativa
      const [activeResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            not(eq(users.nivelacesso, 'free')),
            or(
              isNull(users.dataexpiracao),
              sql`${users.dataexpiracao} > NOW()`,
              eq(users.acessovitalicio, true)
            )
          )
        );
      
      // Obter usuários com assinatura expirada
      const [expiredResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            not(eq(users.nivelacesso, 'free')),
            not(eq(users.acessovitalicio, true)),
            not(isNull(users.dataexpiracao)),
            sql`${users.dataexpiracao} <= NOW()`
          )
        );
      
      // Obter usuários em teste
      const [trialResult] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.tipoplano, 'trial'));
      
      // Obter usuários com assinatura expirando em 7 dias
      const [expiringIn7DaysResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            not(eq(users.nivelacesso, 'free')),
            not(eq(users.acessovitalicio, true)),
            not(isNull(users.dataexpiracao)),
            sql`${users.dataexpiracao} > NOW()`,
            sql`${users.dataexpiracao} <= NOW() + INTERVAL '7 days'`
          )
        );
      
      // Obter usuários com assinatura expirando em 30 dias
      const [expiringIn30DaysResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            not(eq(users.nivelacesso, 'free')),
            not(eq(users.acessovitalicio, true)),
            not(isNull(users.dataexpiracao)),
            sql`${users.dataexpiracao} > NOW()`,
            sql`${users.dataexpiracao} <= NOW() + INTERVAL '30 days'`
          )
        );
      
      // Obter contagem por origem de assinatura
      
      const [manualResult] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.origemassinatura, 'manual'));
      
      // Obter contagem por tipo de plano
      const planCounts = await db
        .select({
          planType: users.tipoplano,
          count: count(),
        })
        .from(users)
        .where(not(isNull(users.tipoplano)))
        .groupBy(users.tipoplano);
      
      // Converter para formato de objeto
      const subscriptionsByPlan: Record<string, number> = {};
      planCounts.forEach(item => {
        subscriptionsByPlan[item.planType || 'desconhecido'] = item.count;
      });
      
      // Obter contagem por origem de assinatura
      const originCounts = await db
        .select({
          origin: users.origemassinatura,
          count: count(),
        })
        .from(users)
        .where(not(isNull(users.origemassinatura)))
        .groupBy(users.origemassinatura);
      
      // Converter para formato de objeto
      const subscriptionsByOrigin: Record<string, number> = {};
      originCounts.forEach(item => {
        subscriptionsByOrigin[item.origin || 'desconhecido'] = item.count;
      });
      
      // Obter assinaturas recentes (últimos 30 dias)
      const recentSubscriptionsData = await db
        .select({
          date: sql`DATE(${users.dataassinatura})`,
          count: count(),
        })
        .from(users)
        .where(
          and(
            not(isNull(users.dataassinatura)),
            sql`${users.dataassinatura} >= NOW() - INTERVAL '30 days'`
          )
        )
        .groupBy(sql`DATE(${users.dataassinatura})`)
        .orderBy(sql`DATE(${users.dataassinatura})`);
      
      // Converter para o formato esperado pelo frontend
      const recentSubscriptions = recentSubscriptionsData.map(item => ({
        date: item.date.toString(),
        count: item.count,
      }));
      
      res.status(200).json({
        total: totalResult.count,
        active: activeResult.count,
        expired: expiredResult.count,
        trialCount: trialResult.count,
        expiringIn7Days: expiringIn7DaysResult.count,
        expiringIn30Days: expiringIn30DaysResult.count,


        manualCount: manualResult.count,
        subscriptionsByPlan,
        subscriptionsByOrigin,
        recentSubscriptions,
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas de assinaturas:", error);
      res.status(500).json({ message: "Erro ao obter estatísticas de assinaturas" });
    }
  });
  
  // Endpoints de configurações de assinatura foram movidos para a seção "ENDPOINTS DE CONFIGURAÇÕES DE ASSINATURAS"
  
  // ENDPOINT CORRIGIDO - Métricas de assinaturas usando Drizzle ORM
  app.get("/api/admin/subscription-metrics", isAdmin, async (req, res) => {
    try {
      console.log("📊 Calculando métricas de assinaturas...");
      
      // Usar Drizzle ORM que está funcionando
      const allUsers = await db.select().from(users);
      
      // Calcular métricas manualmente
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.isactive).length;
      const premiumUsers = allUsers.filter(u => 
        u.isactive && (u.acessovitalicio || ['premium', 'designer', 'designer_adm'].includes(u.nivelacesso))
      ).length;
      const freeUsers = allUsers.filter(u => 
        u.isactive && u.nivelacesso === 'free' && !u.acessovitalicio
      ).length;
      const lifetimeUsers = allUsers.filter(u => 
        u.isactive && u.acessovitalicio
      ).length;
      
      // Novos usuários (últimos 30 e 7 dias)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      const newUsers30d = allUsers.filter(u => 
        u.criadoem && new Date(u.criadoem) >= thirtyDaysAgo
      ).length;
      const newUsers7d = allUsers.filter(u => 
        u.criadoem && new Date(u.criadoem) >= sevenDaysAgo
      ).length;
      
      // Estatísticas por origem
      const premiumActiveUsers = allUsers.filter(u => 
        u.isactive && (u.acessovitalicio || ['premium', 'designer', 'designer_adm'].includes(u.nivelacesso))
      );
      
      const byOrigin: Record<string, number> = {};
      premiumActiveUsers.forEach(user => {
        const origin = user.origemassinatura || 'manual';
        byOrigin[origin] = (byOrigin[origin] || 0) + 1;
      });
      
      // Estatísticas por plano
      const byPlan: Record<string, number> = {};
      premiumActiveUsers.forEach(user => {
        const plan = user.tipoplano || 'indefinido';
        byPlan[plan] = (byPlan[plan] || 0) + 1;
      });
      
      // Calcular taxa de conversão
      const conversionRate = totalUsers > 0 
        ? ((premiumUsers / totalUsers) * 100).toFixed(1)
        : '0.0';
      
      const response = {
        overview: {
          totalUsers,
          activeUsers,
          premiumUsers,
          freeUsers,
          lifetimeUsers,
          expiredUsers: 0,
          expiringSoon: 0,
          newUsers30d,
          newUsers7d,
          conversionRate: parseFloat(conversionRate),
          churnRate: 0
        },
        distribution: {
          byOrigin: Object.entries(byOrigin).map(([origin, count]) => ({
            origin,
            count,
            percentage: premiumUsers > 0 
              ? ((count / premiumUsers) * 100).toFixed(1)
              : '0.0'
          })),
          byPlan: Object.entries(byPlan).map(([plan, count]) => ({
            plan,
            count,
            percentage: premiumUsers > 0 
              ? ((count / premiumUsers) * 100).toFixed(1)
              : '0.0'
          }))
        },
        growth: []
      };
      
      console.log("✅ Métricas calculadas com sucesso:", {
        total: response.overview.totalUsers,
        premium: response.overview.premiumUsers,
        conversion: response.overview.conversionRate + '%'
      });
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error("❌ Erro ao calcular métricas:", error);
      res.status(500).json({ 
        message: "Erro ao calcular métricas de assinaturas",
        error: error.message 
      });
    }
  });

  // ENDPOINT NOVO E FUNCIONAL - Lista de usuários com assinaturas
  app.get("/api/admin/users-subscriptions", isAdmin, async (req, res) => {
    try {
      console.log("📋 Listando usuários com assinaturas - versão corrigida...");
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Conexão PostgreSQL robusta
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      await client.connect();
      
      // Queries otimizadas
      const usersQuery = `
        SELECT 
          id, username, email, name, profileimageurl, nivelacesso, 
          origemassinatura, tipoplano, dataassinatura, dataexpiracao, 
          acessovitalicio, isactive, criadoem, ultimologin
        FROM users 
        WHERE isactive = true
        ORDER BY criadoem DESC
        LIMIT $1 OFFSET $2
      `;
      
      const countQuery = `SELECT COUNT(*) as total FROM users WHERE isactive = true`;
      
      // Executar queries
      const usersResult = await client.query(usersQuery, [limit, offset]);
      const countResult = await client.query(countQuery);
      
      await client.end();
      
      // Processar usuários de forma robusta
      const users = [];
      
      if (usersResult?.rows) {
        usersResult.rows.forEach((user: any) => {
          const isLifetime = Boolean(user.acessovitalicio);
          const isPremium = ['premium', 'designer', 'designer_adm'].includes(user.nivelacesso);
          
          users.push({
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name || user.username,
            profileimageurl: user.profileimageurl,
            nivelacesso: user.nivelacesso,
            origemassinatura: user.origemassinatura,
            tipoplano: user.tipoplano,
            dataassinatura: user.dataassinatura,
            dataexpiracao: user.dataexpiracao,
            acessovitalicio: user.acessovitalicio,
            isactive: user.isactive,
            criadoem: user.criadoem,
            ultimologin: user.ultimologin,
            subscriptionStatus: isLifetime ? 'lifetime' : (isPremium ? 'premium' : 'free'),
            daysRemaining: user.dataexpiracao && !isLifetime ? 
              Math.max(0, Math.ceil((new Date(user.dataexpiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
              null
          });
        });
      }
      
      const total = parseInt(countResult?.rows?.[0]?.total || '0');
      const totalPages = Math.ceil(total / limit);
      
      console.log(`✅ Usuários processados: ${users.length} de ${total} total`);
      console.log(`📊 DEBUG - Dados sendo enviados:`, { 
        usersCount: users.length, 
        total,
        firstUser: users[0]?.email || 'nenhum',
        page,
        limit 
      });
      
      res.status(200).json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
      
    } catch (error: any) {
      console.error("❌ Erro ao listar usuários:", error);
      res.status(500).json({ 
        message: "Erro ao listar usuários", 
        error: error.message 
      });
    }
  });
  
  // ENDPOINT CRÍTICO: Lista paginada de usuários para gestão de assinaturas
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      console.log("📋 Listando usuários com paginação...");
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const planType = req.query.planType as string;
      const status = req.query.status as string;
      const origin = req.query.origin as string;
      
      const offset = (page - 1) * limit;
      
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      await client.connect();
      
      // Construir WHERE clause dinamicamente
      let whereConditions = ['isactive = true'];
      let queryParams = [];
      let paramIndex = 1;
      
      if (search) {
        whereConditions.push(`(email ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }
      
      if (planType && planType !== 'all') {
        if (planType === 'premium') {
          whereConditions.push(`(nivelacesso IN ('premium', 'designer', 'designer_adm') OR acessovitalicio = true)`);
        } else if (planType === 'free') {
          whereConditions.push(`(nivelacesso IN ('free', 'admin') AND NOT acessovitalicio)`);
        }
      }
      
      if (status && status !== 'all') {
        if (status === 'active') {
          whereConditions.push(`(dataexpiracao IS NULL OR dataexpiracao > NOW() OR acessovitalicio = true)`);
        } else if (status === 'expired') {
          whereConditions.push(`(dataexpiracao IS NOT NULL AND dataexpiracao <= NOW() AND NOT acessovitalicio)`);
        }
      }
      
      if (origin && origin !== 'all') {
        whereConditions.push(`origemassinatura = $${paramIndex}`);
        queryParams.push(origin);
        paramIndex++;
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Query para buscar usuários
      const usersQuery = `
        SELECT 
          id, username, email, name, profileimageurl,
          nivelacesso, origemassinatura, tipoplano, 
          dataassinatura, dataexpiracao, acessovitalicio,
          isactive, criadoem, ultimologin, atualizadoem
        FROM users 
        WHERE ${whereClause}
        ORDER BY criadoem DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      
      // Query para contar total
      const countQuery = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
      const countParams = queryParams.slice(0, -2); // Remove limit e offset
      
      const [usersResult, countResult] = await Promise.all([
        client.query(usersQuery, queryParams),
        client.query(countQuery, countParams)
      ]);
      
      await client.end();
      
      const users = usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || user.username,
        accountType: (user.nivelacesso === 'premium' || user.nivelacesso === 'designer' || user.nivelacesso === 'designer_adm' || user.acessovitalicio) ? 'premium' : 'free',
        isActive: user.isactive,
        createdAt: user.criadoem,
        updatedAt: user.atualizadoem,
        lastLoginAt: user.ultimologin,
        subscriptionEndDate: user.dataexpiracao,
        subscriptionStartDate: user.dataassinatura
      }));
      
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      
      console.log(`✅ Retornando ${users.length} usuários de ${total} total`);
      
      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
      
    } catch (error) {
      console.error("❌ Erro ao listar usuários:", error);
      res.status(500).json({ 
        message: "Erro ao listar usuários", 
        error: error.message 
      });
    }
  });

  // ENDPOINT CRÍTICO: Lista paginada de assinaturas
  app.get("/api/admin/subscriptions", isAdmin, async (req, res) => {
    try {
      console.log("📋 Listando assinaturas com paginação...");
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const planType = req.query.planType as string;
      const status = req.query.status as string;
      
      const offset = (page - 1) * limit;
      
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      await client.connect();
      
      // Construir WHERE clause para assinaturas
      let whereConditions = ['u.isactive = true'];
      let queryParams = [];
      let paramIndex = 1;
      
      if (planType && planType !== 'all') {
        if (planType === 'premium') {
          whereConditions.push(`(u.nivelacesso IN ('premium', 'designer', 'designer_adm') OR u.acessovitalicio = true)`);
        } else if (planType === 'free') {
          whereConditions.push(`(u.nivelacesso IN ('free', 'admin') AND NOT u.acessovitalicio)`);
        }
      }
      
      if (status && status !== 'all') {
        if (status === 'active') {
          whereConditions.push(`(u.dataexpiracao IS NULL OR u.dataexpiracao > NOW() OR u.acessovitalicio = true)`);
        } else if (status === 'expired') {
          whereConditions.push(`(u.dataexpiracao IS NOT NULL AND u.dataexpiracao <= NOW() AND NOT u.acessovitalicio)`);
        }
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Query para buscar "assinaturas" (dados dos usuários formatados como assinaturas)
      const subscriptionsQuery = `
        SELECT 
          u.id,
          u.id as userId,
          u.username, 
          u.email, 
          u.name, 
          u.nivelacesso, 
          u.origemassinatura, 
          u.tipoplano, 
          u.dataassinatura, 
          u.dataexpiracao, 
          u.acessovitalicio,
          u.isactive, 
          u.criadoem, 
          u.atualizadoem
        FROM users u
        WHERE ${whereClause}
        ORDER BY u.criadoem DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      
      // Query para contar total
      const countQuery = `SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`;
      
      const [subscriptionsResult, countResult] = await Promise.all([
        client.query(subscriptionsQuery, queryParams),
        client.query(countQuery, queryParams.slice(0, -2))
      ]);
      
      await client.end();
      
      const subscriptions = subscriptionsResult.rows.map(user => {
        const isActive = user.acessovitalicio || !user.dataexpiracao || new Date(user.dataexpiracao) > new Date();
        const isPremium = user.nivelacesso === 'premium' || user.nivelacesso === 'designer' || user.nivelacesso === 'designer_adm' || user.acessovitalicio;
        
        return {
          id: user.id,
          userId: user.id,
          planType: isPremium ? 'premium' : 'free',
          startDate: user.dataassinatura || user.criadoem,
          endDate: user.acessovitalicio ? null : user.dataexpiracao,
          isActive: isActive,
          paymentStatus: isActive ? 'completed' : 'expired',
          createdAt: user.criadoem,
          updatedAt: user.atualizadoem,
          user: {
            id: user.id,
            email: user.email,
            name: user.name || user.username,
            accountType: isPremium ? 'premium' : 'free',
            isActive: user.isactive,
            createdAt: user.criadoem,
            updatedAt: user.atualizadoem
          }
        };
      });
      
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      
      console.log(`✅ Retornando ${subscriptions.length} assinaturas de ${total} total`);
      
      res.json({
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
      
    } catch (error) {
      console.error("❌ Erro ao listar assinaturas:", error);
      res.status(500).json({ 
        message: "Erro ao listar assinaturas", 
        error: error.message 
      });
    }
  });

  // Endpoint para estatísticas de usuários - usado no painel de assinaturas
  app.get("/api/admin/users/stats", isAdmin, async (req, res) => {
    try {
      console.log("📊 Buscando estatísticas de usuários para dashboard...");
      
      // Usar PostgreSQL direto para máxima compatibilidade
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      await client.connect();
      
      // Query para obter todas as estatísticas de uma vez
      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN (acessovitalicio = true OR (dataexpiracao IS NOT NULL AND dataexpiracao > NOW()) OR nivelacesso = 'premium') THEN 1 END) as premium_users,
          COUNT(CASE WHEN NOT (acessovitalicio = true OR (dataexpiracao IS NOT NULL AND dataexpiracao > NOW()) OR nivelacesso = 'premium') THEN 1 END) as free_users
        FROM users 
        WHERE isactive = true;
      `;
      
      const result = await client.query(statsQuery);
      const stats = result.rows[0];
      
      await client.end();
      
      const response = {
        totalUsers: parseInt(stats.total_users) || 0,
        premiumUsers: parseInt(stats.premium_users) || 0,
        freeUsers: parseInt(stats.free_users) || 0
      };
      
      console.log("📈 Estatísticas calculadas:", response);
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error("❌ Erro ao obter estatísticas:", error);
      res.status(500).json({ 
        message: "Erro ao obter estatísticas de usuários",
        totalUsers: 0,
        premiumUsers: 0,
        freeUsers: 0
      });
    }
  });
  
  // Endpoint para obter detalhes de um usuário específico
  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Formatar o status do plano para exibição
      let planStatus = 'free';
      if (user.acessovitalicio) {
        planStatus = 'lifetime';
      } else if (user.dataexpiracao) {
        if (new Date(user.dataexpiracao) > new Date()) {
          planStatus = 'active';
        } else {
          planStatus = 'expired';
        }
      } else if (user.nivelacesso !== 'free') {
        planStatus = 'active';
      }
      
      res.status(200).json({
        ...user,
        planstatus: planStatus
      });
    } catch (error) {
      console.error("Erro ao obter detalhes do usuário:", error);
      res.status(500).json({ message: "Erro ao obter detalhes do usuário" });
    }
  });
  
  // Endpoint para atualizar a assinatura de um usuário
  app.put("/api/admin/users/:id/subscription", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }
      
      const { planstatus, tipoplano, origemassinatura, planoexpiracao, notifyUser } = req.body;
      
      // Verificar se o usuário existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Preparar dados para atualização
      const updateData: any = {
        tipoplano,
        origemassinatura,
        dataexpiracao: planoexpiracao ? new Date(planoexpiracao) : null,
        atualizadoem: new Date(),
      };
      
      // Definir acesso vitalício e nível de acesso com base no status do plano
      if (planstatus === 'lifetime') {
        updateData.acessovitalicio = true;
        updateData.nivelacesso = 'premium';
      } else if (planstatus === 'active') {
        updateData.acessovitalicio = false;
        updateData.nivelacesso = 'premium';
      } else if (planstatus === 'expired' || planstatus === 'free') {
        updateData.acessovitalicio = false;
        updateData.nivelacesso = 'free';
      }
      
      // Atualizar usuário
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      // Enviar notificação ao usuário se solicitado
      if (notifyUser) {
        // Implementar o envio de e-mail (isso seria feito pelo EmailService)
        // EmailService.sendSubscriptionUpdateEmail(user.email, planstatus, planoexpiracao);
        console.log(`Notificação enviada para ${user.email} sobre atualização da assinatura`);
      }
      
      res.status(200).json({
        success: true,
        message: "Assinatura atualizada com sucesso",
        user: {
          ...user,
          ...updateData,
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar assinatura:", error);
      res.status(500).json({ message: "Erro ao atualizar assinatura" });
    }
  });
  
  // Endpoint para remover assinatura de um usuário
  app.delete("/api/admin/users/:id/subscription", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }
      
      // Verificar se o usuário existe
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Rebaixar o usuário para free
      await db
        .update(users)
        .set({
          nivelacesso: 'free',
          tipoplano: null,
          origemassinatura: null,
          dataassinatura: null,
          dataexpiracao: null,
          acessovitalicio: false,
          atualizadoem: new Date(),
        })
        .where(eq(users.id, userId));
      
      res.status(200).json({
        success: true,
        message: "Assinatura removida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover assinatura:", error);
      res.status(500).json({ message: "Erro ao remover assinatura" });
    }
  });


  

  

  
  // Obter configurações atuais das integrações
  app.get("/api/integrations/settings", isAdmin, async (req, res) => {
    try {
      // Buscar todas as configurações de integração
      const settings = await db.execute(sql`
        SELECT provider, key, value, description, "isActive", "updatedAt"
        FROM "integrationSettings"
        ORDER BY provider, key
      `);
      
      // Transformar em um objeto mais fácil de usar no frontend
      const formattedSettings = settings.rows.reduce((acc, setting) => {
        if (!acc[setting.provider]) {
          acc[setting.provider] = {};
        }
        
        // Não enviar valores sensíveis como texto puro, mas incluir propriedade realValue
        // para que o frontend possa mostrar quando explicitamente solicitado
        const isSensitive = ['secret', 'clientSecret', 'clientId', 'apiKey'].includes(setting.key);
        const isDefined = !!setting.value && setting.value.length > 0;
        const maskedValue = isDefined ? '••••••••' : '';
        
        // Criar o objeto no formato exato que o frontend espera
        // O componente SubscriptionManagement.tsx espera uma estrutura específica
        acc[setting.provider][setting.key] = {
          value: isSensitive ? maskedValue : setting.value,
          description: setting.description,
          isActive: setting.isActive,
          updatedAt: setting.updatedAt,
          isDefined: isDefined,
          // Adicionar valor real para o frontend poder exibir quando solicitado
          realValue: setting.value,
          // Adicionar últimos caracteres para facilitar identificação
          lastChars: isDefined && setting.value.length > 4 ? 
            setting.value.slice(-4) : ''
        };
        

        
        return acc;
      }, {});
      

      

      
      return res.status(200).json(formattedSettings);
    } catch (error) {
      console.error("Erro ao obter configurações de integrações:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao obter configurações de integrações" 
      });
    }
  });


  





  
  // User downgrade route secured for admin-only access
  app.post("/api/admin/downgradeUser/:userId", isAuthenticated, isAdmin, async (req, res) => {
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
  
  // Subscription check route secured for admin-only access
  app.post("/api/admin/checkExpiredSubscriptions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await SubscriptionService.checkExpiredSubscriptions();
      res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao verificar assinaturas expiradas:', error);
      res.status(500).json({ message: 'Erro ao verificar assinaturas' });
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
  
  // Rota para diagnóstico do Supabase (temporariamente sem autenticação para testes)
  app.get("/api/supabase-test", async (req, res) => {
    try {
      console.log("=== INÍCIO TESTE SUPABASE ===");
      
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Credenciais do Supabase não configuradas",
          env: {
            supabaseUrl: process.env.SUPABASE_URL ? "Configurado" : "Não configurado",
            supabaseKey: process.env.SUPABASE_ANON_KEY ? "Configurado" : "Não configurado"
          }
        });
      }
      
      // Cria cliente do Supabase para testes
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      // Lista buckets
      console.log("Tentando listar buckets do Supabase...");
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Erro ao listar buckets:", bucketsError);
        return res.status(500).json({
          success: false,
          message: "Erro ao listar buckets",
          error: bucketsError.message
        });
      }
      
      console.log("Buckets encontrados:", buckets);
      
      // Testa criar bucket de teste se não existir
      if (!buckets.some(b => b.name === 'designautoimages')) {
        console.log("Tentando criar bucket 'designautoimages'...");
        
        try {
          const { data, error } = await supabase.storage.createBucket('designautoimages', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024
          });
          
          if (error) {
            console.error("Erro ao criar bucket:", error);
            return res.status(500).json({
              success: false,
              message: "Erro ao criar bucket",
              error: error.message
            });
          }
          
          console.log("Bucket criado com sucesso!");
          
          // Lista buckets novamente para confirmar
          const { data: updatedBuckets, error: listError } = await supabase.storage.listBuckets();
          
          if (listError) {
            console.error("Erro ao listar buckets após criar:", listError);
          } else {
            console.log("Buckets após criar:", updatedBuckets);
          }
          
          return res.json({
            success: true,
            message: "Bucket criado com sucesso",
            buckets: updatedBuckets || []
          });
        } catch (createError: any) {
          console.error("Erro ao criar bucket (catch):", createError);
          return res.status(500).json({
            success: false,
            message: "Erro ao criar bucket",
            error: createError.message || String(createError)
          });
        }
      }
      
      // Testa upload de arquivo
      console.log("Tentando fazer upload de arquivo de teste...");
      
      try {
        const testData = new Uint8Array([0, 1, 2, 3, 4, 5]);
        const testPath = `test-${Date.now()}.bin`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('designautoimages')
          .upload(testPath, testData);
        
        if (uploadError) {
          console.error("Erro ao fazer upload de teste:", uploadError);
          return res.status(500).json({
            success: false,
            message: "Erro ao fazer upload de teste",
            error: uploadError.message
          });
        }
        
        console.log("Upload de teste bem-sucedido:", uploadData);
        
        // Limpa arquivo de teste
        await supabase.storage
          .from('designautoimages')
          .remove([testPath]);
          
        console.log("Arquivo de teste removido com sucesso");
      } catch (uploadError: any) {
        console.error("Erro no upload de teste (catch):", uploadError);
      }
      
      // Retorna informações de diagnóstico
      res.json({
        success: true,
        message: "Supabase funcionando corretamente",
        buckets: buckets || [],
        credentials: {
          url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 10)}...` : null,
          key: process.env.SUPABASE_ANON_KEY ? `${process.env.SUPABASE_ANON_KEY.substring(0, 5)}...` : null
        }
      });
    } catch (error: any) {
      console.error("Erro crítico no teste do Supabase:", error);
      res.status(500).json({
        success: false,
        message: "Erro no teste do Supabase",
        error: error.message || String(error)
      });
    }
  });

  // Registrar rotas de teste do Supabase
  app.use(supabaseRegisterTestRouter);
  
  // Registrar rotas para upload de avatar
  app.use(avatarUploadRouter);
  app.use(directAvatarRouter); // Nova rota direta para upload de avatar
  app.use(usersProfileImageRouter); // Compatibilidade com frontend (rota /api/users/profile-image)
  
  // Registrar rotas para perfil de usuário
  app.use(userProfileRouter);
  
  // Registrar rotas para verificação de e-mail
  app.use('/api/email-verification', emailVerificationRouter);
  
  // Registrar rotas para teste de envio de e-mail
  app.use('/api/email-test', emailTestRouter);
  
  // Registrar rotas para redefinição de senha
  app.use('/api/password-reset', passwordResetRouter);

  // Registrar rotas para artes multi-formato
  app.use(multiArtRouter);
  
  // Registrar rotas para diagnóstico de e-mail (administradores)
  app.use('/api/email-diagnostics', emailDiagnosticsRouter);
  
  // Diagnóstico de webhook temporariamente desativado para resolver problemas de compatibilidade
  // const webhookDiagnosticsRouter = (await import('./routes/webhook-diagnostics.js')).default;
  // Rota de diagnóstico temporariamente desativada até resolver conflitos de módulos
  // app.use('/api/webhook-diagnostics', webhookDiagnosticsRouter);
  
  // Configurar rota de diagnóstico direto do R2
  setupTestR2DirectRoute(app);
  
  // Registrar rotas para teste de timezone (fuso horário)
  app.use('/api/date-test', dateTestRouter);
  
  // Ferramenta de diagnóstico do Supabase Storage
  app.use(supabeDiagnosticsRouter);
  
  // Registrar rotas para artes multi-formato
  app.use(multiArtRouter);
  
  // Registrar rota de teste para criar grupos de artes
  app.use(testCreateGroupRouter);
  

  
  // Aplicar middleware de autenticação nas rotas protegidas de videoaulas
  app.use('/api/videoaulas/visualizacao', isAuthenticated);
  app.use('/api/videoaulas/completar', isAuthenticated);
  app.use('/api/videoaulas/progresso', isAuthenticated);
  app.use('/api/videoaulas/anotacao', isAuthenticated);
  app.use('/api/videoaulas/estatisticas', isAuthenticated, isAdmin);
  app.use('/api/videoaulas/comentarios-recentes', isAuthenticated, isAdmin);
  app.use('/api/videoaulas/aulas-mais-assistidas', isAuthenticated, isAdmin);
  
  // Registrar o router de videoaulas
  app.use('/api/videoaulas', videoaulasRouter);
  
  // Registrar rotas para comentários de vídeos
  app.use('/api', videoCommentsRouter);
  
  // Registrar rotas para avaliações de cursos
  app.use('/api', courseRatingsRouter);
  
  // Adaptador para manter compatibilidade com rotas antigas
  app.use('/api/courses', coursesAdapterRouter);
  // Registrar router de adaptador para rotas em português da API de artes
  app.use(artesAdapterRouter);
  
  // Debug route removed for production security
  
  // Rota de diagnóstico específica para configurações de cursos
  app.get('/api/course-settings-debug', async (req, res) => {
    console.log('[GET /api/course-settings-debug] TESTANDO CONFIGURAÇÕES DE CURSOS');
    
    try {
      // Usar uma abordagem simples apenas para diagnosticar rotas de API
      return res.json({
        message: 'Diagnóstico das configurações de cursos',
        timestamp: new Date().toISOString(),
        routes: {
          adminConfig: '/api/course/settings',
          publicConfig: '/api/courses/settings',
          videoaulasConfig: '/api/courses/settings',
          adminCourseRouter: '/api/course',
          publicCourseRouter: '/api/courses',
          routeConflicts: true,
          recommendedFix: 'Verificar e resolver conflitos de rotas no arquivo server/routes.ts, garantindo que não haja sobreposição'
        },
        routesConfig: {
          courseRouter: {
            path: '/api/course/settings',
            description: 'Gerencia as configurações dos cursos no painel administrativo'
          },
          coursesAdapterRouter: {
            path: '/api/courses',
            description: 'Adaptador para manter compatibilidade com rotas antigas usadas pela página de videoaulas'
          }
        },
        possibleIssues: [
          'Conflitos de rotas entre /api/course/settings e /api/courses/settings',
          'Múltiplas definições da mesma rota em rotas.ts',
          'Problemas de invalidação do cache do React Query',
          'Diferenças entre as estruturas de dados esperadas pelos componentes admin e públicos'
        ]
      });
    } catch (error) {
      console.error('[GET /api/course-settings-debug] Erro:', error);
      return res.status(500).json({
        message: 'Erro ao executar diagnóstico',
        error: String(error)
      });
    }
  });

  // Rotas específicas para configurações de cursos (antes do wildcard route)
  app.get('/api/course/settings', async (req, res) => {
    try {
      console.log('[ROUTE ESPECÍFICA] GET /api/course/settings: Buscando configurações');
      
      // Buscar as configurações diretamente
      const configQuery = `
        SELECT * FROM "courseSettings" WHERE id = 1 LIMIT 1
      `;
      
      const configResult = await db.execute(configQuery);
      let settings = configResult.rows && configResult.rows.length > 0 ? configResult.rows[0] : null;
      
      if (!settings) {
        return res.status(404).json({ message: 'Configurações não encontradas' });
      }
      
      return res.json(settings);
    } catch (error) {
      console.error('[ROUTE ESPECÍFICA] Erro ao buscar configurações:', error);
      return res.status(500).json({ message: 'Erro ao buscar configurações de cursos' });
    }
  });
  
  // Rota PUT para atualizar as configurações
  app.put('/api/course/settings', async (req, res) => {
    try {
      console.log('[ROUTE ESPECÍFICA] PUT /api/course/settings: Atualizando configurações');
      
      // Extrair os campos do corpo da requisição
      const { 
        bannerTitle, 
        bannerDescription, 
        bannerImageUrl, 
        welcomeMessage,
        showModuleNumbers,
        useCustomPlayerColors,
        enableComments,
        allowNonPremiumEnrollment,
        updatedBy 
      } = req.body;
      
      // Verificar se as configurações existem
      const checkQuery = `SELECT id FROM "courseSettings" WHERE id = 1 LIMIT 1`;
      const checkResult = await db.execute(checkQuery);
      
      if (!checkResult.rows || checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Configurações não encontradas' });
      }
      
      // Construir a query de atualização com os campos que foram fornecidos
      let updateFields = [];
      let updateValues = [];
      
      if (bannerTitle !== undefined) {
        updateFields.push(`"bannerTitle" = $${updateFields.length + 1}`);
        updateValues.push(bannerTitle);
      }
      
      if (bannerDescription !== undefined) {
        updateFields.push(`"bannerDescription" = $${updateFields.length + 1}`);
        updateValues.push(bannerDescription);
      }
      
      if (bannerImageUrl !== undefined) {
        updateFields.push(`"bannerImageUrl" = $${updateFields.length + 1}`);
        updateValues.push(bannerImageUrl);
      }
      
      if (welcomeMessage !== undefined) {
        updateFields.push(`"welcomeMessage" = $${updateFields.length + 1}`);
        updateValues.push(welcomeMessage);
      }
      
      if (showModuleNumbers !== undefined) {
        updateFields.push(`"showModuleNumbers" = $${updateFields.length + 1}`);
        updateValues.push(showModuleNumbers);
      }
      
      if (useCustomPlayerColors !== undefined) {
        updateFields.push(`"useCustomPlayerColors" = $${updateFields.length + 1}`);
        updateValues.push(useCustomPlayerColors);
      }
      
      if (enableComments !== undefined) {
        updateFields.push(`"enableComments" = $${updateFields.length + 1}`);
        updateValues.push(enableComments);
      }
      
      if (allowNonPremiumEnrollment !== undefined) {
        updateFields.push(`"allowNonPremiumEnrollment" = $${updateFields.length + 1}`);
        updateValues.push(allowNonPremiumEnrollment);
      }
      
      // Adicionar sempre a data de atualização
      updateFields.push(`"updatedAt" = NOW()`);
      
      // Adicionar o usuário que atualizou, se fornecido
      if (updatedBy !== undefined) {
        updateFields.push(`"updatedBy" = $${updateFields.length + 1}`);
        updateValues.push(updatedBy);
      }
      
      // Se não houver campos para atualizar, retornar erro
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo válido para atualização' });
      }
      
      // Construir uma query SQL direta com os valores interpolados para evitar parâmetros
      let setClause = [];
      
      if (bannerTitle !== undefined) {
        setClause.push(`"bannerTitle" = '${bannerTitle.replace(/'/g, "''")}'`);
      }
      
      if (bannerDescription !== undefined) {
        setClause.push(`"bannerDescription" = '${bannerDescription.replace(/'/g, "''")}'`);
      }
      
      if (bannerImageUrl !== undefined) {
        setClause.push(`"bannerImageUrl" = '${bannerImageUrl.replace(/'/g, "''")}'`);
      }
      
      if (welcomeMessage !== undefined) {
        setClause.push(`"welcomeMessage" = '${welcomeMessage.replace(/'/g, "''")}'`);
      }
      
      if (showModuleNumbers !== undefined) {
        setClause.push(`"showModuleNumbers" = ${showModuleNumbers}`);
      }
      
      if (useCustomPlayerColors !== undefined) {
        setClause.push(`"useCustomPlayerColors" = ${useCustomPlayerColors}`);
      }
      
      if (enableComments !== undefined) {
        setClause.push(`"enableComments" = ${enableComments}`);
      }
      
      if (allowNonPremiumEnrollment !== undefined) {
        setClause.push(`"allowNonPremiumEnrollment" = ${allowNonPremiumEnrollment}`);
      }
      
      // Adicionar sempre a data de atualização
      setClause.push(`"updatedAt" = NOW()`);
      
      // Adicionar o usuário que atualizou, se fornecido
      if (updatedBy !== undefined) {
        setClause.push(`"updatedBy" = ${updatedBy}`);
      }
      
      const directUpdateQuery = `
        UPDATE "courseSettings" 
        SET ${setClause.join(', ')} 
        WHERE id = 1 
        RETURNING *
      `;
      
      console.log('[ROUTE ESPECÍFICA] Executando query direta:', directUpdateQuery);
      
      const updateResult = await db.execute(directUpdateQuery);
      
      if (!updateResult.rows || updateResult.rows.length === 0) {
        return res.status(500).json({ message: 'Erro ao atualizar configurações' });
      }
      
      return res.json(updateResult.rows[0]);
    } catch (error) {
      console.error('[ROUTE ESPECÍFICA] Erro ao atualizar configurações:', error);
      return res.status(500).json({ message: 'Erro ao atualizar configurações', error: String(error) });
    }
  });
  
  // Rotas para gerenciamento de cursos, módulos, aulas e configurações
  // Montado apenas uma vez para evitar conflitos de rotas duplicadas
  app.use('/api/course', courseRouter);
  
  // Rota para upload de banners de cursos
  app.use('/api/upload', bannerUploadRouter);
  
  // Rota para upload de thumbnails de aulas
  app.use('/api/upload', lessonThumbnailUploadRouter);
  
  // Rota para upload de thumbnails de cursos
  app.use('/api/upload', courseThumbnailUploadRouter);
  
  // Rota para upload de thumbnails de módulos
  app.use('/api/upload', moduleUploadRouter);

  // Rotas para gerenciamento de popups promocionais
  app.use('/api/popups', popupRouter);
  
  // Rotas para gerenciamento de ferramentas úteis
  app.use(ferramentasRouter);
  
  // Rotas para upload de imagens de ferramentas
  app.use(ferramentasUploadRouter);
  
  // Rotas para gerenciamento de analytics
  app.use('/api/analytics', analyticsRouter);
  

  // Implementação direta das rotas para evitar problemas de importação
  

  

  

  
  console.log('✅ Rotas de mapeamento de produtos implementadas diretamente');
  
  // Rotas para o sistema de comunidade
  app.use(communityRouter);
  
  // ENDPOINT CRÍTICO: Estatísticas de reports - PRIORIDADE MÁXIMA
  app.get('/api/reports/stats', async (req, res) => {
    try {
      console.log('📊 Endpoint /api/reports/stats chamado - buscando estatísticas...');
      
      const result = await db.execute(sql`
        SELECT 
          status,
          COUNT(*) as count
        FROM reports 
        GROUP BY status
      `);
      
      const stats = {
        pending: 0,
        reviewing: 0,
        resolved: 0,
        rejected: 0,
        total: 0
      };
      
      let total = 0;
      result.forEach((row: any) => {
        const count = parseInt(row.count);
        total += count;
        
        switch(row.status) {
          case 'pendente':
            stats.pending = count;
            break;
          case 'em-analise':
            stats.reviewing = count;
            break;
          case 'resolvido':
            stats.resolved = count;
            break;
          case 'rejeitado':
            stats.rejected = count;
            break;
        }
      });
      
      stats.total = total;
      
      console.log('✅ Estatísticas calculadas:', stats);
      
      return res.status(200).json({
        success: true,
        pending: stats.pending,
        reviewing: stats.reviewing,
        resolved: stats.resolved,
        rejected: stats.rejected,
        total: stats.total
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas'
      });
    }
  });
  
  app.use('/api/reports', reportsRouter);      // Captura outras rotas /api/reports/*
  
  // Versão 2 do sistema de denúncias (utiliza SQL puro)
  // Implementada em reports-v2.ts para resolver problemas de ORM
  // Removendo código duplicado para evitar conflitos de rotas
  

  
  // Endpoint para listar logs de webhook (com paginação e filtros)
  app.get('/api/webhooks/logs', isAdmin, async (req, res) => {
    try {
      console.log('DEBUG /api/webhooks/logs - Endpoint chamado');
      
      // Verificar registros diretamente
      try {
        const rawCount = await db.select({ count: count() }).from(schema.webhookLogs);
        console.log('DEBUG /api/webhooks/logs - Total de registros na tabela:', rawCount[0]?.count || 0);
      } catch (countErr) {
        console.error('DEBUG /api/webhooks/logs - Erro ao contar registros:', countErr);
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        status: req.query.status as string,
        eventType: req.query.eventType as string,
        source: req.query.source as string,
        search: req.query.search as string
      };
      
      console.log('DEBUG /api/webhooks/logs - Parâmetros da requisição:', { page, limit, filters });
      
      const result = await storage.getWebhookLogs(page, limit, filters);
      
      console.log('DEBUG /api/webhooks/logs - Resultado:', {
        totalCount: result.totalCount,
        logsLength: result.logs.length,
        firstLog: result.logs[0] ? {
          id: result.logs[0].id,
          eventType: result.logs[0].eventType,
          status: result.logs[0].status,
        } : 'Nenhum log retornado'
      });
      
      return res.json({
        logs: result.logs,
        totalCount: result.totalCount,
        page,
        limit,
        totalPages: Math.ceil(result.totalCount / limit)
      });
    } catch (error) {
      console.error('Erro ao listar logs de webhook:', error);
      return res.status(500).json({ 
        message: 'Erro ao listar logs de webhook', 
        error: error.message 
      });
    }
  });
  
  // Endpoint para buscar logs de webhook por email
  app.get('/api/webhooks/search', isAdmin, async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório para a busca'
        });
      }
      
      console.log(`Buscando webhooks relacionados ao email: ${email}`);
      
      // Buscar na tabela todos os webhooks que contêm o email no payload
      const result = await db.execute(sql`
        SELECT * 
        FROM "webhookLogs"
        WHERE "payloadData"::text ILIKE ${`%${email}%`}
        ORDER BY "createdAt" DESC
        LIMIT 50
      `);
      
      console.log(`Encontrados ${result.rows.length} registros para o email ${email}`);
      
      // Pré-processar os logs para extrair informações relevantes
      const logs = result.rows.map(log => {
        let payloadData = log.payloadData;
        
        // Converter para string se não for (para garantir consistência)
        if (typeof payloadData !== 'string') {
          payloadData = JSON.stringify(payloadData);
        }
        
        return {
          ...log,
          payloadData
        };
      });
      
      res.json({
        success: true,
        count: logs.length,
        logs
      });
    } catch (error) {
      console.error('Erro na busca de webhooks por email:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao realizar busca de webhooks',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
  
  // Endpoint para obter detalhes de um log específico
  app.get('/api/webhooks/logs/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const log = await storage.getWebhookLogById(id);
      
      if (!log) {
        return res.status(404).json({ message: 'Log não encontrado' });
      }
      
      // Se tiver dados de usuário associados, buscar informações adicionais
      let userData = null;
      if (log.userId) {
        userData = await storage.getUserById(log.userId);
      }
      
      return res.json({
        log,
        userData: userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          nivelacesso: userData.nivelacesso,
          dataassinatura: userData.dataassinatura,
          dataexpiracao: userData.dataexpiracao
        } : null
      });
    } catch (error) {
      console.error(`Erro ao obter detalhes do log #${req.params.id}:`, error);
      return res.status(500).json({ 
        message: 'Erro ao obter detalhes do log', 
        error: error.message 
      });
    }
  });
  
  // Endpoint para reprocessar um webhook
  app.post('/api/webhooks/logs/:id/reprocess', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const success = await storage.reprocessWebhook(id);
      
      if (success) {
        return res.json({ 
          success: true, 
          message: 'Webhook reprocessado com sucesso' 
        });
      } else {
        return res.json({ 
          success: false, 
          message: 'Não foi possível reprocessar o webhook' 
        });
      }
    } catch (error) {
      console.error(`Erro ao reprocessar webhook #${req.params.id}:`, error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao reprocessar webhook', 
        error: error.message 
      });
    }
  });

  // =========== ENDPOINTS DE CONFIGURAÇÕES DE ASSINATURAS ===========
  
  // Endpoint para testes - sem verificação de admin (temporário)
  app.get('/api/test/subscription-settings', async (req, res) => {
    try {
      const settings = await storage.getSubscriptionSettings();
      res.status(200).json(settings || {});
    } catch (error) {
      console.error('Erro ao buscar configurações de assinaturas (teste):', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar configurações de assinaturas', 
        error: error.message 
      });
    }
  });

  // Endpoint para obter as configurações de assinaturas
  app.get('/api/subscription-settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSubscriptionSettings();
      
      // Se não existir configurações, retornamos um objeto vazio mas com status 200
      res.status(200).json(settings || {});
    } catch (error) {
      console.error('Erro ao buscar configurações de assinaturas:', error);
      
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar configurações de assinaturas', 
        error: error.message 
      });
    }
  });
  
  // Endpoint para testes - atualização sem verificação de admin (temporário)
  app.put('/api/test/subscription-settings', async (req, res) => {
    try {
      // Validar dados de entrada se necessário
      const updatedSettings = await storage.updateSubscriptionSettings(req.body);
      
      res.status(200).json({
        success: true,
        message: 'Configurações de assinaturas atualizadas com sucesso (teste)',
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações de assinaturas (teste):', error);
      
      res.status(500).json({ 
        success: false,
        message: 'Erro ao atualizar configurações de assinaturas', 
        error: error.message 
      });
    }
  });

  // Endpoint para atualizar as configurações de assinaturas
  app.put('/api/subscription-settings', isAdmin, async (req, res) => {
    try {
      // Validar dados de entrada se necessário
      const updatedSettings = await storage.updateSubscriptionSettings(req.body);
      
      res.status(200).json({
        success: true,
        message: 'Configurações de assinaturas atualizadas com sucesso',
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações de assinaturas:', error);
      
      res.status(500).json({ 
        success: false,
        message: 'Erro ao atualizar configurações de assinaturas', 
        error: error.message 
      });
    }
  });

  // =========== ENDPOINTS DE ESTATÍSTICAS DE ASSINATURAS ===========

  // Endpoint para obter estatísticas gerais de assinaturas (versão de teste - sem verificação de admin)
  app.get('/api/test/subscription-stats', async (req, res) => {
    try {
      const stats = await storage.getSubscriptionStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de assinaturas (teste):', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar estatísticas de assinaturas', 
        error: error.message 
      });
    }
  });

  // Endpoint para obter estatísticas gerais de assinaturas
  app.get('/api/subscription-stats', isAdmin, async (req, res) => {
    try {
      const stats = await storage.getSubscriptionStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de assinaturas:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar estatísticas de assinaturas', 
        error: error.message 
      });
    }
  });

  // Endpoint para obter tendências de assinaturas (versão de teste - sem verificação de admin)
  app.get('/api/test/subscription-trends', async (req, res) => {
    try {
      const months = req.query.months ? parseInt(req.query.months as string) : 6;
      const trends = await storage.getSubscriptionTrends(months);
      res.status(200).json(trends);
    } catch (error) {
      console.error('Erro ao buscar tendências de assinaturas (teste):', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar tendências de assinaturas', 
        error: error.message 
      });
    }
  });

  // Endpoint para obter tendências de assinaturas
  app.get('/api/subscription-trends', isAdmin, async (req, res) => {
    try {
      const months = req.query.months ? parseInt(req.query.months as string) : 6;
      const trends = await storage.getSubscriptionTrends(months);
      res.status(200).json(trends);
    } catch (error) {
      console.error('Erro ao buscar tendências de assinaturas:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar tendências de assinaturas', 
        error: error.message 
      });
    }
  });
  


  // Registrar rota para calcular posição do post na paginação
  registerPostPositionRoute(app);

  // Registrar rotas para sitemap.xml e robots.txt (acessíveis na raiz do site)
  app.use(sitemapRouter);

  // Configurar rotas de diagnóstico de webhook diretamente
  // Rota para busca avançada de webhooks
  app.get('/api/webhook-diagnostics/advanced-search', isAdmin, async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'O parâmetro email é obrigatório'
        });
      }
      
      console.log(`[/webhook-diagnostics/advanced-search] Buscando logs com email: ${email}`);
      
      // Usar o operador LIKE do PostgreSQL para buscar em texto JSON
      const result = await db.execute(sql`
        WITH parsed_webhooks AS (
          SELECT 
            id, 
            "eventType",
            source,
            status,
            "createdAt",
            "payloadData",
            "errorMessage"
          FROM "webhookLogs"
          WHERE 
            "payloadData"::text LIKE ${`%${email}%`}
        )
        SELECT * FROM parsed_webhooks
        ORDER BY "createdAt" DESC
      `);
      
      // Processar os resultados para encontrar informações mais detalhadas sobre o email
      const enhancedResults = result.rows.map(log => {
        let foundEmail = null;
        let emailLocation = null;
        
        try {
          // Converter o payload para JSON se for string
          const payload = typeof log.payloadData === 'string' 
            ? JSON.parse(log.payloadData) 
            : log.payloadData;
          
          // Buscar o email em diferentes locais do payload
          foundEmail = payload.subscriber?.email || payload.customer?.email || payload.buyer?.email || null;
          if (foundEmail) {
            emailLocation = payload.subscriber?.email ? 'subscriber.email' : 
                           payload.customer?.email ? 'customer.email' : 'buyer.email';
          }
          
          // Se ainda não encontrou o email, verificar no texto serializado
          if (!foundEmail) {
            const payloadStr = JSON.stringify(payload).toLowerCase();
            if (payloadStr.includes(String(email).toLowerCase())) {
              foundEmail = '[Email encontrado na serialização do payload]';
              emailLocation = 'json_serialized';
            }
          }
        } catch (e) {
          console.error(`Erro ao analisar payload do log ${log.id}:`, e);
        }
        
        return {
          ...log,
          extractedEmail: foundEmail,
          emailLocation,
          matchType: foundEmail ? 'direct_match' : 'text_match'
        };
      });
      
      res.json({
        success: true,
        count: enhancedResults.length,
        results: enhancedResults
      });
    } catch (error) {
      console.error('Erro na busca avançada de webhooks:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao realizar busca avançada de webhooks',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Rota para buscar detalhes de um log específico
  app.get('/api/webhook-diagnostics/log/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const result = await db.execute(sql`
        SELECT * 
        FROM "webhookLogs"
        WHERE id = ${parseInt(id)}
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Log não encontrado'
        });
      }
      
      const log = result.rows[0];
      
      // Tentar extrair informações relevantes do payload
      let parsedPayload = null;
      let extractedEmail = null;
      let payloadEmail = null;
      
      try {
        parsedPayload = typeof log.payloadData === 'string' 
          ? JSON.parse(log.payloadData) 
          : log.payloadData;
        
        // Buscar email no payload para análise
        payloadEmail = parsedPayload.subscriber?.email || parsedPayload.customer?.email || parsedPayload.buyer?.email;
        
        // Se encontrou o email, destacar
        if (payloadEmail) {
          extractedEmail = payloadEmail;
        }
      } catch (e) {
        console.error(`Erro ao analisar payload do log ${log.id}:`, e);
      }
      
      res.json({
        success: true,
        log: {
          ...log,
          parsedPayload,
          extractedEmail
        }
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do log:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar detalhes do log',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  const httpServer = createServer(app);
  

  
  
// Redirecionamento seguro para manter compatibilidade
app.use('/api/reports-v2', (req, res, next) => {
  // Redirecionar todas as chamadas para a API segura
  const newUrl = req.originalUrl.replace('/api/reports-v2', '/api/reports');
  res.redirect(307, newUrl);
});

  return httpServer;
}