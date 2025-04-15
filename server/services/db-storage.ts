import { db } from "../db";
import { randomUUID } from "crypto";
import sharp from "sharp";
import path from "path";
import { Request, Response } from "express";

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export class DbStorageService {
  /**
   * Otimiza uma imagem antes de armazená-la
   */
  async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<Buffer> {
    const {
      width,
      height,
      quality = 80,
      format = "webp",
    } = options;

    // Configura o processamento com sharp
    let sharpInstance = sharp(buffer);
    
    // Redimensiona se width ou height forem fornecidos
    if (width || height) {
      sharpInstance = sharpInstance.resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Converte e otimiza para o formato especificado
    if (format === "webp") {
      return await sharpInstance.webp({ quality }).toBuffer();
    } else if (format === "jpeg") {
      return await sharpInstance.jpeg({ quality }).toBuffer();
    } else {
      return await sharpInstance.png({ quality }).toBuffer();
    }
  }

  /**
   * Faz upload de uma imagem otimizada para o banco de dados
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ imageUrl: string; thumbnailUrl: string; storageType?: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }

    try {
      console.log("Iniciando upload para PostgreSQL...");
      console.log(`Nome original: ${file.originalname}`);
      console.log(`Tipo de conteúdo: ${file.mimetype}`);
      console.log(`Tamanho: ${file.size} bytes`);

      // Otimização da imagem principal
      const optimizedBuffer = await this.optimizeImage(file.buffer, {
        ...options,
        width: options.width || 1200, // Limita o tamanho máximo
        quality: options.quality || 80,
      });

      // Cria uma versão thumbnail para listagens e previews
      const thumbnailBuffer = await this.optimizeImage(file.buffer, {
        width: 400,
        quality: 75,
      });

      // Gera identificadores únicos para as imagens
      const imageId = randomUUID();
      const extension = options.format === 'webp' ? '.webp' : 
                        options.format === 'jpeg' ? '.jpg' : '.png';
      const filename = `${imageId}${extension}`;

      // Salva imagem e thumbnail no banco de dados
      const result = await db.query(
        `INSERT INTO image_storage 
         (filename, original_filename, content_type, size, data, thumbnail) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [
          filename, 
          file.originalname,
          `image/${options.format || 'webp'}`,
          optimizedBuffer.length,
          optimizedBuffer,
          thumbnailBuffer
        ]
      );

      const imageId2 = result.rows[0].id;
      
      console.log("Upload para PostgreSQL bem-sucedido! ID:", imageId2);

      // Retorna URLs para acessar as imagens
      return {
        imageUrl: `/api/images/${imageId2}`,
        thumbnailUrl: `/api/images/${imageId2}/thumbnail`,
        storageType: "postgresql"
      };
    } catch (error) {
      console.error("Erro no upload para PostgreSQL:", error);
      throw new Error(`Falha ao armazenar imagem no banco de dados: ${error.message}`);
    }
  }

  /**
   * Recupera uma imagem do banco de dados
   */
  async getImage(id: number, isThumbnail: boolean = false): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const result = await db.query(
        `SELECT ${isThumbnail ? 'thumbnail' : 'data'} as image_data, content_type 
         FROM image_storage 
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        buffer: result.rows[0].image_data,
        contentType: result.rows[0].content_type
      };
    } catch (error) {
      console.error(`Erro ao recuperar imagem (id=${id}):`, error);
      return null;
    }
  }

  /**
   * Remove uma imagem do banco de dados
   */
  async deleteImage(id: number): Promise<boolean> {
    try {
      const result = await db.query(
        'DELETE FROM image_storage WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Erro ao deletar imagem (id=${id}):`, error);
      return false;
    }
  }

  /**
   * Middleware Express para servir imagens
   */
  serveImageMiddleware() {
    return async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).send('ID inválido');
        }

        const isThumbnail = req.path.includes('/thumbnail');
        const image = await this.getImage(id, isThumbnail);

        if (!image) {
          return res.status(404).send('Imagem não encontrada');
        }

        // Define cabeçalhos para cache
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Content-Type', image.contentType);
        
        return res.send(image.buffer);
      } catch (error) {
        console.error('Erro ao servir imagem:', error);
        return res.status(500).send('Erro ao processar imagem');
      }
    };
  }
}

// Singleton
export const dbStorageService = new DbStorageService();