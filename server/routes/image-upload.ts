import { Router, Request, Response } from "express";
import upload from "../middlewares/upload";
import { storageService } from "../services/storage";
import { supabaseStorageService } from "../services/supabase-storage";
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
          
          if (skipOptimization) {
            console.log(">>> TESTE: Fazendo upload direto para R2, sem otimização da imagem");
            const urls = await storageService.uploadDirectWithoutOptimization(req.file);
            console.log("Upload R2 direto concluído com sucesso:", urls);
            return res.status(200).json({...urls, uploadType: "direct"});
          } else {
            const urls = await storageService.uploadImage(req.file, options);
            console.log("Upload R2 concluído com sucesso:", urls);
            return res.status(200).json(urls);
          }
        } catch (error: any) {
          console.error("Erro detalhado do R2:", error);
          
          if (req.body.r2Only === 'true') {
            return res.status(500).json({
              message: "Erro no upload para R2",
              details: error.message,
              errorCode: error.Code || 'unknown'
            });
          }
          
          console.log("Usando fallback local devido a erro no R2");
        }
      }

      // Fallback final: armazenamento local
      console.log("Usando armazenamento local (fallback)");
      const localUrls = await storageService.localUpload(req.file, options);
      console.log("Upload local concluído com sucesso:", localUrls);
      return res.status(200).json({
        ...localUrls,
        storageType: "local"
      });
    } catch (error: any) {
      console.error("Erro no upload de imagem:", error);
      res.status(500).json({
        message: "Erro ao processar imagem",
        error: error.message,
      });
    }
  }
);

// Rota para remoção de imagem
router.delete(
  "/api/admin/images",
  async (req: Request, res: Response) => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "URL da imagem não fornecida" });
      }

      // Verificamos o tipo de imagem pela URL
      const isLocalImage = imageUrl.startsWith('/uploads/');
      const isSupabaseImage = imageUrl.includes('supabase.co') || imageUrl.includes('supabase.in');
      const isR2Image = !isLocalImage && !isSupabaseImage;
      
      // Determina qual serviço usar para deletar
      if (isSupabaseImage) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
          console.warn("Supabase não configurado e tentando deletar imagem do Supabase.");
          return res.status(500).json({ 
            message: "Não é possível remover imagens do Supabase sem configurar as credenciais"
          });
        }
        
        console.log(`Deletando imagem do Supabase: ${imageUrl}`);
        const success = await supabaseStorageService.deleteImage(imageUrl);
        
        if (!success) {
          return res.status(500).json({ message: "Falha ao deletar imagem do Supabase" });
        }
      } else if (isR2Image) {
        if (!process.env.R2_ACCESS_KEY_ID || 
            !process.env.R2_SECRET_ACCESS_KEY || 
            !process.env.R2_ENDPOINT) {
          console.warn("R2 não configurado e tentando deletar imagem do R2.");
          return res.status(500).json({ 
            message: "Não é possível remover imagens do R2 sem configurar as credenciais"
          });
        }
        
        console.log(`Deletando imagem do R2: ${imageUrl}`);
        await storageService.deleteImage(imageUrl);
      } else {
        // Imagem local
        console.log(`Deletando imagem local: ${imageUrl}`);
        await storageService.deleteImage(imageUrl);
      }
      
      res.status(200).json({ message: "Imagem removida com sucesso" });
    } catch (error: any) {
      console.error("Erro ao remover imagem:", error);
      res.status(500).json({
        message: "Erro ao remover imagem",
        error: error.message,
      });
    }
  }
);

export default router;