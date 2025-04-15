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

      // Verifica se o R2 está configurado corretamente
      const r2Configured = process.env.R2_ACCESS_KEY_ID && 
                          process.env.R2_SECRET_ACCESS_KEY && 
                          process.env.R2_ENDPOINT && 
                          process.env.R2_BUCKET_NAME;
      
      if (r2Configured) {
        try {
          console.log("Iniciando upload para R2...");
          const urls = await storageService.uploadImage(req.file, options);
          console.log("Upload R2 concluído com sucesso:", urls);
          return res.status(200).json(urls);
        } catch (r2Error: any) {
          console.error("Falha no upload para R2, tentando fallback local:", r2Error.message);
          // Continua para o fallback local
        }
      } else {
        console.warn("R2 não configurado completamente. Usando armazenamento local.");
      }

      // Fallback: armazenamento local
      console.log("Usando armazenamento local como fallback");
      const localUrls = await storageService.localUpload(req.file, options);
      console.log("Upload local concluído com sucesso:", localUrls);
      res.status(200).json({
        ...localUrls,
        storageType: "local" // Indica ao cliente que este é um upload local
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