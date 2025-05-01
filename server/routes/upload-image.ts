import { Router, Request, Response } from "express";
import multer from "multer";
import { supabaseStorageService } from "../services/supabase-storage";
import { isAuthenticated } from "../middlewares/auth";
import sharp from "sharp";

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 
  }
});

const router = Router();

// Rota para fazer upload de imagem
router.post("/api/upload-image", isAuthenticated, upload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhuma imagem enviada" });
    }

    console.log("Iniciando upload de imagem");
    console.log(`File size: ${req.file.size} bytes`);
    console.log(`File mimetype: ${req.file.mimetype}`);
    console.log(`Categoria: ${req.body.category || 'default'}`);

    // Opções de processamento da imagem
    const options = {
      width: req.body.width ? parseInt(req.body.width) : undefined,
      height: req.body.height ? parseInt(req.body.height) : undefined,
      quality: req.body.quality ? parseInt(req.body.quality) : 80,
    };

    // Obter a categoria para a estrutura de pastas
    const category = req.body.category || 'default';
    
    // Obter o ID do designer (se fornecido) para a estrutura de pastas
    const designerId = req.user?.id;
    
    // Upload para o Supabase
    const result = await supabaseStorageService.uploadImage(
      req.file, 
      options, 
      category,
      designerId
    );
    
    console.log("Upload concluído com sucesso:", result);
    
    return res.status(200).json({
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl || result.imageUrl,
      success: true
    });

  } catch (error: any) {
    console.error("Erro no upload de imagem:", error);
    res.status(500).json({
      message: "Erro ao processar imagem",
      error: error.message,
    });
  }
});

export default router;