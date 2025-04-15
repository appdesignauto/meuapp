import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// Formatando o endpoint para garantir compatibilidade
let endpoint = process.env.R2_ENDPOINT || "";

// Remove https:// ou http:// se estiver presente
endpoint = endpoint.replace(/^https?:\/\//, '');

// Remove qualquer parte de URL após o domínio (como /bucket-name)
if (endpoint.includes('/')) {
  endpoint = endpoint.split('/')[0];
}

// Certifica-se de que o endpoint começa com https://
endpoint = `https://${endpoint}`;

console.log("Endpoint formatado:", endpoint);

// Função para sanitizar credenciais
function sanitizeCredential(credential: string = "", targetLength: number = 32): string {
  // Remove espaços, tabs, quebras de linha e caracteres invisíveis
  let cleaned = credential.trim().replace(/\s+/g, '');
  
  // Remove aspas que podem ter sido incluídas por engano
  cleaned = cleaned.replace(/["'`]/g, '');
  
  // Verifica e ajusta o tamanho da credencial se necessário
  if (cleaned.length > targetLength) {
    console.warn(`Aviso: A credencial tem ${cleaned.length} caracteres, cortando para ${targetLength}.`);
    cleaned = cleaned.substring(0, targetLength);
  } else if (cleaned.length < targetLength) {
    console.warn(`Aviso: A credencial tem ${cleaned.length} caracteres, menos que o esperado ${targetLength}.`);
  }
  
  return cleaned;
}

// Processa as credenciais para garantir que estejam no formato correto
// Cloudflare R2 precisa de chaves de 32 caracteres
const accessKeyId = sanitizeCredential(process.env.R2_ACCESS_KEY_ID, 32);
const secretAccessKey = sanitizeCredential(process.env.R2_SECRET_ACCESS_KEY, 32);

// Sanitiza o bucket name também, removendo espaços ou = extras
const bucketName = (process.env.R2_BUCKET_NAME || "").trim().replace(/^=+/, '');

// Log para depuração (sem mostrar os valores completos)
console.log("Credenciais R2 processadas:");
if (accessKeyId.length >= 8) {
  console.log(`- Access Key: ${accessKeyId.substring(0, 4)}...${accessKeyId.substring(accessKeyId.length - 4)} (length: ${accessKeyId.length})`);
} else {
  console.log(`- Access Key: (muito curta ou vazia, length: ${accessKeyId.length})`);
}

if (secretAccessKey.length >= 8) {
  console.log(`- Secret Key: ${secretAccessKey.substring(0, 4)}...${secretAccessKey.substring(secretAccessKey.length - 4)} (length: ${secretAccessKey.length})`);
} else {
  console.log(`- Secret Key: (muito curta ou vazia, length: ${secretAccessKey.length})`);
}
console.log(`- Endpoint: ${endpoint}`);
console.log(`- Bucket: ${bucketName}`);

// Configuração do cliente S3 (compatível com Cloudflare R2)
const s3Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // Necessário para serviços S3-compatíveis como R2
});

const BUCKET_NAME = bucketName || "designauto-images";
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
  ): Promise<{ imageUrl: string; thumbnailUrl: string; storageType?: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }

    try {
      // Verificar se as credenciais do R2 estão disponíveis
      if (
        !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY ||
        !process.env.R2_ENDPOINT ||
        !process.env.R2_BUCKET_NAME
      ) {
        throw new Error("Credenciais do R2 não configuradas. Configure as variáveis de ambiente R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT e R2_BUCKET_NAME.");
      }
      
      console.log("Tentando upload para R2 com endpoint:", endpoint);
      console.log("Bucket R2:", BUCKET_NAME);
      console.log("URL pública R2:", PUBLIC_BUCKET_URL);

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

      try {
        // Exibe informações do cliente S3 para depuração
        console.log("Configuração do cliente S3:");
        console.log("- Region:", s3Client.config.region);
        console.log("- Endpoint:", s3Client.config.endpoint);
        console.log("- ForcePathStyle:", s3Client.config.forcePathStyle);
        
        // Testa a conexão antes do upload
        console.log("Testando conexão com R2...");
        
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
      } catch (uploadError: any) {
        console.error("Erro específico no upload para R2:", uploadError);
        
        // Propaga o erro original para análise mais detalhada
        throw uploadError;
      }

      // Retorna as URLs públicas se o bucket tiver configuração pública
      if (PUBLIC_BUCKET_URL) {
        return {
          imageUrl: `${PUBLIC_BUCKET_URL}/${imageKey}`,
          thumbnailUrl: `${PUBLIC_BUCKET_URL}/${thumbnailKey}`,
          storageType: "r2"
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

      return { 
        imageUrl, 
        thumbnailUrl,
        storageType: "r2-signed"
      };
    } catch (error) {
      console.error("Erro completo ao fazer upload para R2:", error);
      throw error;
    }
  }

  /**
   * Remove uma imagem (R2 ou local)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // Verifica se é uma URL local
    if (imageUrl.startsWith('/uploads/')) {
      await this.deleteLocalImage(imageUrl);
      return;
    }
    
    // Caso contrário, tenta deletar do R2
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
      console.error("Erro ao deletar imagem do R2:", error);
    }
  }
  
  /**
   * Remove uma imagem armazenada localmente
   */
  async deleteLocalImage(imageUrl: string): Promise<void> {
    try {
      // Caminho da imagem no sistema de arquivos
      const filePath = path.join(process.cwd(), 'public', imageUrl);
      
      // Deleta a imagem principal se existir
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Imagem local deletada: ${filePath}`);
      }
      
      // Tenta encontrar e deletar o thumbnail correspondente
      if (!imageUrl.includes('/thumbnails/')) {
        const filename = path.basename(imageUrl);
        const thumbnailPath = path.join(
          process.cwd(), 
          'public', 
          'uploads', 
          'thumbnails', 
          filename
        );
        
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
          console.log(`Thumbnail local deletado: ${thumbnailPath}`);
        }
      }
    } catch (error) {
      console.error("Erro ao deletar imagem local:", error);
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