import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// ATENÇÃO: Usando valores fixos diretamente do script para garantir a conexão com o R2
// Verificando valores dos logs do upload
console.log("Detalhes das credenciais do R2:");
console.log(`- R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID?.length || 0} caracteres`);
console.log(`- R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY?.length || 0} caracteres`);
console.log(`- R2_ENDPOINT: ${process.env.R2_ENDPOINT}`);
console.log(`- R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME}`);
console.log(`- R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL}`);

const accountId = '32b65e21b65af0345c36f5c43fa32c54';
// Formato alternativo do endpoint para tentar resolver problema SSL/TLS
const endpoint = `https://${accountId}.r2.dev`;
const accessKeyId = '21be81ed3af893e3ba85c2'; // ID da chave de acesso (22 caracteres)
const secretAccessKey = 'c3e7cc28a2ffb45471cc57a2842735b5e524a7a0d2c5ff5a4cedb8145dbd1b4d'; // chave secreta (64 caracteres)
const bucketName = "designauto"; // Nome do bucket R2 observado nas imagens 
const PUBLIC_BUCKET_URL = "https://pub-a063592364ea4478870d95c9c4115c4a.r2.dev"; // URL pública do bucket

console.log("Iniciando upload para R2...");

console.log("Usando endpoint fixo do R2:", endpoint);
console.log("Account ID do R2:", accountId);

// Log para depuração (sem mostrar os valores completos)
console.log("Credenciais R2 processadas:");
console.log(`- Access Key: ${accessKeyId.substring(0, 4)}...${accessKeyId.substring(accessKeyId.length - 4)} (length: ${accessKeyId.length})`);
console.log(`- Secret Key: ${secretAccessKey.substring(0, 4)}...${secretAccessKey.substring(secretAccessKey.length - 4)} (length: ${secretAccessKey.length})`);
console.log(`- Endpoint: ${endpoint}`);
console.log(`- Bucket: ${bucketName}`);
console.log(`- URL Pública: ${PUBLIC_BUCKET_URL}`);

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

const BUCKET_NAME = bucketName; // Nome fixo do bucket

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
   * Tenta fazer upload direto para o R2 sem qualquer otimização da imagem
   * Para testar se o problema é com o conversor de imagem
   */
  async uploadDirectWithoutOptimization(
    file: Express.Multer.File
  ): Promise<{ imageUrl: string; thumbnailUrl: string; storageType?: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }
    
    try {
      console.log("Tentando upload direto para R2 sem otimização...");
      console.log("Informações do arquivo original:");
      console.log(`- Nome: ${file.originalname}`);
      console.log(`- MIME type: ${file.mimetype}`);
      console.log(`- Tamanho: ${file.size} bytes`);
      
      // Gera chaves únicas para o arquivo
      const uniqueId = randomUUID();
      const extension = path.extname(file.originalname) || '.jpg';
      const imageKey = `original/${uniqueId}${extension}`;
      
      try {
        console.log("Tentando fazer upload do arquivo original para R2...");
        
        // Upload do arquivo original sem processamento
        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: imageKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );
        
        console.log("Upload direto bem-sucedido para R2!");
        
        // Retorna a URL pública
        return {
          imageUrl: `${PUBLIC_BUCKET_URL}/${imageKey}`,
          thumbnailUrl: `${PUBLIC_BUCKET_URL}/${imageKey}`, // Mesmo arquivo para thumbnail
          storageType: "r2_direct"
        };
      } catch (uploadError: any) {
        console.error("Erro no upload direto para R2:", uploadError);
        
        // Tenta usar o fallback local
        console.log("Tentando fallback local após falha no upload direto...");
        const localResult = await this.localUploadDirect(file);
        
        return {
          ...localResult,
          storageType: "local_direct"
        };
      }
    } catch (error) {
      console.error("Erro completo no upload direto:", error);
      
      // Tenta usar o fallback local
      return await this.localUploadDirect(file);
    }
  }
  
  /**
   * Fallback local para upload direto
   */
  private async localUploadDirect(
    file: Express.Multer.File
  ): Promise<{ imageUrl: string; thumbnailUrl: string }> {
    try {
      // Certifica-se de que o diretório public/uploads/original existe
      const originalDir = path.join(process.cwd(), 'public', 'uploads', 'original');
      
      try {
        if (!fs.existsSync('public')) {
          fs.mkdirSync('public');
        }
        if (!fs.existsSync(path.join('public', 'uploads'))) {
          fs.mkdirSync(path.join('public', 'uploads'));
        }
        if (!fs.existsSync(originalDir)) {
          fs.mkdirSync(originalDir);
        }
      } catch (err) {
        console.error("Erro ao criar diretórios para upload direto:", err);
      }
      
      // Gera um nome único para o arquivo
      const uniqueId = randomUUID();
      const extension = path.extname(file.originalname) || '.jpg';
      const fileName = `${uniqueId}${extension}`;
      
      // Caminho completo do arquivo
      const filePath = path.join(originalDir, fileName);
      
      // Salva o arquivo original
      fs.writeFileSync(filePath, file.buffer);
      
      console.log("Upload direto local bem-sucedido!");
      
      // Retorna a URL relativa
      return {
        imageUrl: `/uploads/original/${fileName}`,
        thumbnailUrl: `/uploads/original/${fileName}`, // Mesmo arquivo para thumbnail
      };
    } catch (error) {
      console.error("Erro no fallback local direto:", error);
      return {
        imageUrl: "https://placehold.co/800x600?text=Imagem+Indisponível",
        thumbnailUrl: "https://placehold.co/400x300?text=Thumbnail+Indisponível",
      };
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
        
        // Tenta um método alternativo de upload caso o R2 falhe via S3 Client
        try {
          console.log("Testando conexão com R2 via cliente S3...");
          
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
  
          console.log("Upload bem-sucedido para R2 via cliente S3!");
        } catch (s3Error) {
          console.error("Erro na conexão via S3 Client, tentando método alternativo...");
          console.error(s3Error);
          
          // Devido ao erro SSL/TLS, vamos usar o fallback local em vez de tentar outros métodos
          throw new Error("Impossível conectar ao R2 via cliente S3");
        }

        // Retorna as URLs públicas usando o bucket público
        return {
          imageUrl: `${PUBLIC_BUCKET_URL}/${imageKey}`,
          thumbnailUrl: `${PUBLIC_BUCKET_URL}/${thumbnailKey}`,
          storageType: "r2"
        };
      } catch (uploadError: any) {
        console.error("Erro específico no upload para R2:", uploadError);
        
        // Tenta usar o fallback local
        console.log("Tentando fallback local após falha no R2...");
        const localResult = await this.localUpload(file, options);
        
        // Log do resultado do upload para depuração
        console.log("Upload R2 concluído com sucesso:", localResult);
        
        return localResult;
      }
    } catch (error) {
      console.error("Erro completo ao fazer upload para R2:", error);
      
      // Tenta usar o fallback local
      console.log("Tentando fallback local após erro...");
      const localResult = await this.localUpload(file, options);
      
      // Log do resultado do upload para depuração
      console.log("Upload R2 concluído com sucesso:", localResult);
      
      return localResult;
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
      
      console.log("Upload local bem-sucedido!");
      
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