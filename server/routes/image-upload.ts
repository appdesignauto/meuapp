import { Router, Request, Response } from "express";
import upload from "../middlewares/upload";
import { storageService } from "../services/storage";
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

      // Verifica se o R2 está configurado
      const r2Configured = process.env.R2_ACCESS_KEY_ID && 
                         process.env.R2_SECRET_ACCESS_KEY && 
                         process.env.R2_ENDPOINT && 
                         process.env.R2_BUCKET_NAME;
      
      // Tenta fazer upload para o R2 primeiro, se configurado
      if (r2Configured) {
        try {
          // Certifica-se de que o bucket name não contenha = no início
          if (process.env.R2_BUCKET_NAME?.startsWith('=')) {
            console.warn(`Aviso: O bucket name "${process.env.R2_BUCKET_NAME}" começa com '=', o que pode causar problemas.`);
          }
          
          // Exibe informações completas para depuração
          console.log("Detalhes das credenciais do R2:");
          console.log(`- R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID?.length} caracteres`);
          console.log(`- R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY?.length} caracteres`);
          console.log(`- R2_ENDPOINT: ${process.env.R2_ENDPOINT}`);
          console.log(`- R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME}`);
          console.log(`- R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL || "(não configurado)"}`);
          
          console.log("Iniciando upload para R2...");
          const urls = await storageService.uploadImage(req.file, options);
          console.log("Upload R2 concluído com sucesso:", urls);
          return res.status(200).json(urls);
        } catch (error: any) {
          console.error("Erro detalhado do R2:", error);
          
          // Se houvermos solicitado apenas o modo R2 (sem fallback), retornamos o erro
          if (req.body.r2Only === 'true') {
            return res.status(500).json({
              message: "Erro no upload para R2",
              details: error.message,
              errorCode: error.Code || 'unknown'
            });
          }
          
          // Se não, continuamos para o fallback
          console.log("Usando fallback local devido a erro no R2");
        }
      } else if (req.body.r2Only === 'true') {
        // Se o cliente solicitou apenas R2 mas não temos credenciais, retornamos erro
        return res.status(500).json({ 
          message: "Cloudflare R2 não configurado corretamente",
          details: "Configure as variáveis de ambiente R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME e R2_PUBLIC_URL"
        });
      } else {
        console.warn("R2 não configurado, usando armazenamento local.");
      }

      // Fallback: armazenamento local
      console.log("Usando armazenamento local");
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

      // Verificamos se é uma URL local (começa com /uploads/)
      const isLocalImage = imageUrl.startsWith('/uploads/');
      
      // Para imagens R2, verificamos se o R2 está configurado
      if (!isLocalImage && 
          (!process.env.R2_ACCESS_KEY_ID || 
           !process.env.R2_SECRET_ACCESS_KEY || 
           !process.env.R2_ENDPOINT)) {
        console.warn("R2 não configurado e tentando deletar imagem remota.");
        return res.status(500).json({ 
          message: "Não é possível remover imagens remotas sem configurar o R2"
        });
      }

      console.log(`Deletando imagem: ${imageUrl} (tipo: ${isLocalImage ? 'local' : 'R2'})`);
      await storageService.deleteImage(imageUrl);
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