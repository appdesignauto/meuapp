import { Router, Request, Response } from "express";
import upload from "../middlewares/upload";
import { supabaseStorageService } from "../services/supabase-storage";
import { r2StorageService } from "../services/r2-storage";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { Express } from "express";

const router = Router();

// Para autenticação, usaremos o método hasRole com 'admin'
// A autenticação real será aplicada quando registrarmos as rotas no app Express principal

// Rota para upload de imagem
router.post(
  "/api/admin/upload",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }

      // Opções de processamento da imagem
      const options = {
        width: req.body.width ? parseInt(req.body.width) : undefined,
        height: req.body.height ? parseInt(req.body.height) : undefined,
        quality: req.body.quality ? parseInt(req.body.quality) : 80,
      };

      // Verifica qual serviço de armazenamento usar
      const storageService = req.query.storage || req.body.storage || 'supabase';
      const skipOptimization = req.query.skipOptimization === 'true';
      
      // Usando Supabase Storage (prioridade)
      if (storageService === 'supabase') {
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
          try {
            console.log("Usando Supabase Storage para upload de arte...");
            console.log(`Nome original: ${req.file.originalname}`);
            console.log(`Tipo MIME: ${req.file.mimetype}`);
            console.log(`Tamanho: ${req.file.size} bytes`);
            
            if (skipOptimization) {
              console.log(">>> TESTE: Fazendo upload direto para Supabase, sem otimização");
              const urls = await supabaseStorageService.uploadDirectWithoutOptimization(req.file);
              console.log("Upload direto para Supabase concluído:", urls);
              return res.status(200).json({...urls, uploadType: "direct"});
            } else {
              console.log("Iniciando otimização da imagem da arte...");
              
              // Obtém a categoria (se fornecida) para a estrutura de pastas
              const categorySlug = req.body.categorySlug || req.query.categorySlug;
              if (categorySlug) {
                console.log(`Categoria fornecida para organização: ${categorySlug}`);
              } else {
                console.log(`Nenhuma categoria fornecida para organização de pastas`);
              }
              
              // Obtém o ID do designer (se fornecido) para a estrutura de pastas
              const designerId = req.body.designerId || req.query.designerId || 
                                (req.user ? req.user.id : undefined);
              
              if (designerId) {
                console.log(`Designer ID fornecido para organização: ${designerId}`);
              } else {
                console.log(`Nenhum ID de designer fornecido, usando estrutura padrão`);
              }
              
              // Log para debugging do FormData
              console.log('FormData enviado:', {
                categorySlug: req.body.categorySlug,
                designerId: req.body.designerId,
                storage: req.body.storage
              });
              
              // Passa a categoria e o ID do designer para o método de upload
              const urls = await supabaseStorageService.uploadImage(
                req.file, 
                options, 
                categorySlug as string,
                typeof designerId === 'string' ? parseInt(designerId) : designerId as number
              );
              console.log("Upload da arte para Supabase concluído com sucesso:", urls);
              return res.status(200).json({
                ...urls,
                storageType: "supabase_art"
              });
            }
          } catch (error: any) {
            console.error("Erro no upload para Supabase:", error);
            
            if (req.body.supabaseOnly === 'true') {
              return res.status(500).json({
                message: "Erro no upload para Supabase",
                details: error.message
              });
            }
            
            console.log("Usando fallback após erro no Supabase");
          }
        } else {
          console.warn("Supabase não configurado corretamente.");
          
          if (req.body.supabaseOnly === 'true') {
            return res.status(500).json({
              message: "Supabase não configurado corretamente",
              details: "Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY"
            });
          }
        }
      }
      
      // Verifica se o R2 está configurado (como segundo serviço)
      const r2Configured = (storageService === 'r2' || storageService === 'cloudflare') && 
                         process.env.R2_ACCESS_KEY_ID && 
                         process.env.R2_SECRET_ACCESS_KEY && 
                         process.env.R2_ENDPOINT && 
                         process.env.R2_BUCKET_NAME;
      
      if (r2Configured) {
        try {
          console.log("Usando Cloudflare R2 para upload...");
          
          // Otimização da imagem
          let fileBuffer = req.file.buffer;
          
          if (!skipOptimization) {
            // Otimiza a imagem antes do upload para R2
            fileBuffer = await sharp(req.file.buffer)
              .resize(options.width || 1200, options.height, {
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: options.quality || 80 })
              .toBuffer();
            
            console.log("Imagem otimizada para R2 upload");
          }
          
          // Faz upload para o R2
          const result = await r2StorageService.uploadFile(
            process.env.R2_BUCKET_NAME || 'designautoimages',
            req.file.originalname,
            fileBuffer,
            'image/webp'
          );
          
          if (!result.success) {
            throw new Error(result.error || "Falha no upload para R2");
          }
          
          console.log("Upload R2 concluído com sucesso:", result);
          
          return res.status(200).json({
            imageUrl: result.url,
            thumbnailUrl: result.url, // Mesmo URL para thumbnail
            storageType: "r2"
          });
        } catch (error: any) {
          console.error("Erro detalhado:", error);
          
          if (req.body.r2Only === 'true') {
            return res.status(500).json({
              message: "Erro no upload para R2",
              details: error.message,
              errorCode: error.Code || 'unknown'
            });
          }
          
          console.log("Continuando para próxima opção de armazenamento...");
        }
      }

      // Fallback final: armazenamento local
      console.log("Usando armazenamento local como fallback final...");
      
      try {
        // Criar estrutura de diretórios
        const publicDir = path.join(process.cwd(), 'public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const designautoImagesDir = path.join(uploadsDir, 'designautoimages');

        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir);
        }
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }
        if (!fs.existsSync(designautoImagesDir)) {
          fs.mkdirSync(designautoImagesDir);
        }

        // Gerar nome único
        const uuid = randomUUID();
        const fileExtension = '.webp'; // Sempre usamos WebP para otimização
        const filename = `${uuid}${fileExtension}`;
        const filepath = path.join(designautoImagesDir, filename);

        // Otimizar imagem se necessário
        let outputBuffer = req.file.buffer;
        
        if (!skipOptimization) {
          outputBuffer = await sharp(req.file.buffer)
            .resize(options.width || 1200, options.height, {
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: options.quality || 80 })
            .toBuffer();
        }

        // Salvar arquivo
        fs.writeFileSync(filepath, outputBuffer);

        // URL relativa para o frontend
        const relativeUrl = `/uploads/designautoimages/${filename}`;
        
        console.log("Upload local concluído com sucesso:", { imageUrl: relativeUrl });
        
        return res.status(200).json({
          imageUrl: relativeUrl,
          thumbnailUrl: relativeUrl,
          storageType: "local"
        });
      } catch (localError: any) {
        console.error("Erro no upload local:", localError);
        throw new Error(`Falha no upload local: ${localError.message}`);
      }
    } catch (error: any) {
      console.error("Erro no upload de imagem:", error);
      res.status(500).json({
        message: "Erro ao processar imagem",
        error: error.message,
      });
    }
  }
);

// Rota para remoção de imagem (temporariamente desativada para evitar erros)
// TODO: Implementar a funcionalidade de remoção usando o serviço de armazenamento centralizado
router.delete(
  "/api/admin/images",
  async (req: Request, res: Response) => {
    try {
      res.status(501).json({ 
        message: "Funcionalidade temporariamente desativada durante atualizações no sistema de armazenamento.",
        info: "Esta funcionalidade será reimplementada em breve."
      });
    } catch (error: any) {
      console.error("Erro ao processar requisição:", error);
      res.status(500).json({
        message: "Erro interno do servidor",
        error: error.message,
      });
    }
  }
);

export default router;