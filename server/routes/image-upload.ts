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

      // Verifica se as chaves do R2 estão configuradas
      if (
        !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY ||
        !process.env.R2_ENDPOINT ||
        !process.env.R2_BUCKET_NAME
      ) {
        return res.status(500).json({ 
          message: "Cloudflare R2 não configurado corretamente",
          details: "Configure as variáveis de ambiente R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME e R2_PUBLIC_URL"
        });
      }

      // Processa e faz upload da imagem no R2
      const options = {
        width: req.body.width ? parseInt(req.body.width) : undefined,
        height: req.body.height ? parseInt(req.body.height) : undefined,
        quality: req.body.quality ? parseInt(req.body.quality) : 80,
      };

      console.log("Iniciando upload para R2...");
      const urls = await storageService.uploadImage(req.file, options);
      console.log("Upload concluído com sucesso:", urls);
      res.status(200).json(urls);
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

      // Verifica se as chaves do R2 estão configuradas
      if (
        !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY ||
        !process.env.R2_ENDPOINT
      ) {
        console.warn("R2 não configurado. Ignorando deleção.");
        return res.status(200).json({ message: "Operação simulada com sucesso" });
      }

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