import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { randomUUID } from "crypto";

// Configuração do cliente S3 (compatível com Cloudflare R2)
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "designauto-images";
const PUBLIC_BUCKET_URL = process.env.R2_PUBLIC_URL || "";

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export class StorageService {
  private generateKey(filename: string, isThumb = false): string {
    const extension = this.getImageExtension(filename);
    const uuid = randomUUID();
    return `${isThumb ? "thumbnails/" : ""}${uuid}${extension}`;
  }

  private getImageExtension(filename: string): string {
    // Assegura que a extensão seja .webp para otimização, independente do original
    return ".webp";
  }

  /**
   * Otimiza uma imagem antes de fazer upload
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

    // Converte e otimiza para webp
    if (format === "webp") {
      return await sharpInstance.webp({ quality }).toBuffer();
    } else if (format === "jpeg") {
      return await sharpInstance.jpeg({ quality }).toBuffer();
    } else {
      return await sharpInstance.png({ quality }).toBuffer();
    }
  }

  /**
   * Faz upload de uma imagem otimizada para o R2
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }

    try {
      // Verificar se as credenciais do R2 estão disponíveis
      if (
        !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY ||
        !process.env.R2_ENDPOINT
      ) {
        console.warn("Credenciais do R2 não configuradas, usando armazenamento local");
        return this.localUpload(file, options);
      }

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

      // Gera chaves únicas para os arquivos
      const imageKey = this.generateKey(file.originalname);
      const thumbnailKey = this.generateKey(file.originalname, true);

      // Upload da imagem principal
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: imageKey,
          Body: optimizedBuffer,
          ContentType: "image/webp",
        })
      );

      // Upload do thumbnail
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: "image/webp",
        })
      );

      // Retorna as URLs públicas se o bucket tiver configuração pública
      if (PUBLIC_BUCKET_URL) {
        return {
          imageUrl: `${PUBLIC_BUCKET_URL}/${imageKey}`,
          thumbnailUrl: `${PUBLIC_BUCKET_URL}/${thumbnailKey}`,
        };
      }

      // Se não tiver URL pública, gera URLs assinadas (válidas por 7 dias)
      const imageCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey,
      });

      const thumbnailCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: thumbnailKey,
      });

      const imageUrl = await getSignedUrl(s3Client, imageCommand, {
        expiresIn: 604800, // 7 dias em segundos
      });

      const thumbnailUrl = await getSignedUrl(s3Client, thumbnailCommand, {
        expiresIn: 604800,
      });

      return { imageUrl, thumbnailUrl };
    } catch (error) {
      console.error("Erro ao fazer upload para R2:", error);
      // Em caso de erro, usamos o armazenamento local
      return this.localUpload(file, options);
    }
  }

  /**
   * Remove uma imagem do R2
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // Extrai a chave da URL
    const key = this.extractKeyFromUrl(imageUrl);
    if (!key) return;

    try {
      // Deleta imagem principal
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );

      // Tenta deletar a thumbnail correspondente
      if (key.startsWith("thumbnails/")) return;
      
      const thumbnailKey = `thumbnails/${key}`;
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
        })
      );
    } catch (error) {
      console.error("Erro ao deletar imagem:", error);
    }
  }

  /**
   * Extrai a chave do objeto da URL
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      if (PUBLIC_BUCKET_URL && url.startsWith(PUBLIC_BUCKET_URL)) {
        return url.replace(`${PUBLIC_BUCKET_URL}/`, "");
      }
      
      // Tenta extrair de URL assinada - isso é uma aproximação e pode precisar de ajustes
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/");
      // Remove o primeiro segmento vazio e o nome do bucket
      return pathSegments.slice(2).join("/");
    } catch (e) {
      console.error("Erro ao extrair chave da URL:", e);
      return null;
    }
  }

  /**
   * Fallback para caso não esteja configurado o R2
   * Salva a imagem localmente e retorna URLs baseadas no sistema de arquivos local
   */
  async localUpload(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Certifica-se de que o diretório public/uploads existe
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
      
      try {
        if (!fs.existsSync('public')) {
          fs.mkdirSync('public');
        }
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }
        if (!fs.existsSync(thumbnailsDir)) {
          fs.mkdirSync(thumbnailsDir);
        }
      } catch (err) {
        console.error("Erro ao criar diretórios:", err);
      }
      
      // Otimização da imagem principal
      const optimizedBuffer = await this.optimizeImage(file.buffer, {
        ...options,
        width: options.width || 1200,
        quality: options.quality || 80,
      });

      // Cria uma versão thumbnail
      const thumbnailBuffer = await this.optimizeImage(file.buffer, {
        width: 400,
        quality: 75,
      });
      
      // Gera nomes únicos para os arquivos
      const imageId = randomUUID();
      const thumbnailId = randomUUID();
      const imageName = `${imageId}.webp`;
      const thumbnailName = `${thumbnailId}.webp`;
      
      // Caminhos completos dos arquivos
      const imagePath = path.join(uploadsDir, imageName);
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
      
      // Salva os arquivos
      fs.writeFileSync(imagePath, optimizedBuffer);
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);
      
      // Retorna URLs relativas
      return {
        imageUrl: `/uploads/${imageName}`,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
      };
    } catch (error) {
      console.error("Erro no fallback local:", error);
      // Último recurso: retorna URLs padrão
      return {
        imageUrl: "https://placehold.co/800x600?text=Imagem+Indisponível",
        thumbnailUrl: "https://placehold.co/400x300?text=Thumbnail+Indisponível",
      };
    }
  }
}

export const storageService = new StorageService();