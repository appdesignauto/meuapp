import { Router, Request, Response } from "express";
import upload from "../middlewares/upload";
import { supabaseStorageService } from "../services/supabase-storage";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Credenciais do Supabase não configuradas corretamente.");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Nome do bucket para armazenamento de imagens
const BUCKET_NAME = 'designauto-images';

// Constantes para dimensões recomendadas de thumbnail
const THUMBNAIL_SIZES = {
  standard: { width: 720, height: 405 }, // 16:9 ratio
  small: { width: 480, height: 270 }
};

// Rota para upload de thumbnail da aula
router.post(
  "/api/admin/upload-lesson-thumbnail",
  upload.single("thumbnail"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }

      console.log(`Iniciando upload de thumbnail: ${req.file.originalname}`);
      console.log(`Tipo MIME: ${req.file.mimetype}, Tamanho: ${req.file.size} bytes`);

      // Opções de otimização
      const optimizeWidth = req.body.width ? parseInt(req.body.width) : THUMBNAIL_SIZES.standard.width;
      const optimizeHeight = req.body.height ? parseInt(req.body.height) : THUMBNAIL_SIZES.standard.height;
      const quality = req.body.quality ? parseInt(req.body.quality) : 80;

      // Pasta específica para thumbnails no bucket
      const thumbnailFolder = "lesson-thumbnails";

      // Gerar nome único com prefixo para diferenciar no bucket
      const uuid = randomUUID();
      const filename = `thumbnail-${uuid}.webp`;
      const filePath = `${thumbnailFolder}/${filename}`;

      // Otimizar a imagem antes de fazer upload
      const optimizedImageBuffer = await sharp(req.file.buffer)
        .resize(optimizeWidth, optimizeHeight, {
          fit: "cover", 
          position: "centre",
        })
        .webp({ quality })
        .toBuffer();

      console.log(`Imagem otimizada para dimensões: ${optimizeWidth}x${optimizeHeight}, qualidade: ${quality}`);

      // Usando Supabase Storage para upload
      try {
        // Upload da imagem otimizada
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, optimizedImageBuffer, {
            contentType: "image/webp",
            upsert: true, // Sobrescrever se existir
          });

        if (error) {
          console.error("Erro no upload para Supabase:", error);
          throw new Error(error.message);
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        console.log("Thumbnail enviado com sucesso para Supabase Storage");
        
        return res.status(200).json({
          thumbnailUrl: urlData.publicUrl,
          message: "Thumbnail enviado com sucesso",
          sizes: THUMBNAIL_SIZES
        });
      } catch (supabaseError: any) {
        console.error("Falha no upload para Supabase:", supabaseError);
        
        // Fallback para armazenamento local
        try {
          // Criar estrutura de diretórios
          const publicDir = path.join(process.cwd(), 'public');
          const uploadsDir = path.join(publicDir, 'uploads');
          const thumbnailsDir = path.join(uploadsDir, 'lesson-thumbnails');

          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
          }
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
          }
          if (!fs.existsSync(thumbnailsDir)) {
            fs.mkdirSync(thumbnailsDir);
          }

          // Salvar arquivo
          const localFilePath = path.join(thumbnailsDir, filename);
          fs.writeFileSync(localFilePath, optimizedImageBuffer);

          // URL relativa para o frontend
          const relativeUrl = `/uploads/lesson-thumbnails/${filename}`;
          
          console.log("Upload local de fallback concluído com sucesso:", { thumbnailUrl: relativeUrl });
          
          return res.status(200).json({
            thumbnailUrl: relativeUrl,
            message: "Thumbnail enviado com sucesso (armazenamento local)",
            sizes: THUMBNAIL_SIZES
          });
        } catch (localError: any) {
          console.error("Erro no upload local:", localError);
          throw new Error(`Falha no upload local: ${localError.message}`);
        }
      }
    } catch (error: any) {
      console.error("Erro no upload de thumbnail:", error);
      res.status(500).json({
        message: "Erro ao processar imagem do thumbnail",
        error: error.message,
      });
    }
  }
);

export default router;