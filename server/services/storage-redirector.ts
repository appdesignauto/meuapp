import { SupabaseStorageService } from './supabase-storage';
import * as sharp from "sharp";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

// Nome dos buckets para armazenamento de imagens (usando Supabase)
const BUCKET_NAME = 'designautoimages';
const AVATARS_BUCKET = 'designautoimages'; // Usando o mesmo bucket para avatares
const PUBLIC_STORAGE_URL = 'https://klfghciqgamdmkrmhdwz.supabase.co/storage/v1/object/public';

// Instanciação do serviço Supabase
export const supabaseStorage = new SupabaseStorageService();

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

/**
 * Classe redirecionadora que encaminha todas as operações de armazenamento para o Supabase
 */
export class StorageRedirector {
  constructor() {
    console.log("🔄 Inicializando StorageRedirector - Redirecionando tudo para Supabase Storage");
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
   * Upload direto sem otimização - redireciona para Supabase
   */
  async uploadDirectWithoutOptimization(
    file: Express.Multer.File
  ): Promise<{ imageUrl: string; thumbnailUrl: string; storageType?: string }> {
    console.log("🔄 Redirecionando uploadDirectWithoutOptimization para Supabase");
    try {
      const result = await supabaseStorage.uploadDirectWithoutOptimization(file);
      return {
        ...result,
        storageType: "supabase_direct"
      };
    } catch (error) {
      console.error("Erro no upload direto para Supabase:", error);
      // Fallback para upload local
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
   * Upload de imagem - redireciona para Supabase
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ imageUrl: string; thumbnailUrl: string; storageType?: string }> {
    console.log("🔄 Redirecionando uploadImage para Supabase");
    try {
      const result = await supabaseStorage.uploadImage(file, options);
      return {
        ...result,
        storageType: "supabase"
      };
    } catch (error) {
      console.error("Erro no upload para Supabase:", error);
      // Fallback para upload local
      return await this.localUpload(file, options);
    }
  }

  /**
   * Deleta imagem - redireciona para Supabase
   */
  async deleteImage(imageUrl: string): Promise<void> {
    console.log("🔄 Redirecionando deleteImage para Supabase");
    // Verifica se é uma URL local
    if (imageUrl.startsWith('/uploads/')) {
      await this.deleteLocalImage(imageUrl);
      return;
    }
    
    // Se for uma URL do Supabase, deleta do Supabase
    try {
      await supabaseStorage.deleteImage(imageUrl);
    } catch (error) {
      console.error("Erro ao deletar imagem do Supabase:", error);
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
   * Fallback para caso o Supabase falhe
   * Salva a imagem localmente e retorna URLs baseadas no sistema de arquivos local
   */
  async localUpload(
    file: Express.Multer.File,
    options: ImageOptimizationOptions & { targetFolder?: string } = {}
  ): Promise<{ imageUrl: string; thumbnailUrl: string; storageType?: string }> {
    try {
      const { targetFolder } = options;
      
      console.log("Iniciando upload local", targetFolder ? `na pasta '${targetFolder}'` : "na pasta padrão");
      
      // Diretório base para uploads
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Se tiver uma pasta específica (ex: designautoimages), usar essa estrutura
      const targetDir = targetFolder 
        ? path.join(uploadsDir, targetFolder) 
        : uploadsDir;
        
      const thumbnailsDir = targetFolder 
        ? path.join(uploadsDir, targetFolder, 'thumbnails')
        : path.join(uploadsDir, 'thumbnails');
      
      console.log("Diretórios de destino:");
      console.log(`- Imagem principal: ${targetDir}`);
      console.log(`- Thumbnails: ${thumbnailsDir}`);
      
      // Cria os diretórios necessários
      try {
        if (!fs.existsSync('public')) {
          console.log("Criando diretório 'public'");
          fs.mkdirSync('public');
        }
        
        if (!fs.existsSync(uploadsDir)) {
          console.log("Criando diretório 'uploads'");
          fs.mkdirSync(uploadsDir);
        }
        
        if (targetFolder && !fs.existsSync(targetDir)) {
          console.log(`Criando diretório '${targetFolder}'`);
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        if (!fs.existsSync(thumbnailsDir)) {
          console.log("Criando diretório de thumbnails");
          fs.mkdirSync(thumbnailsDir, { recursive: true });
        }
      } catch (mkdirError) {
        console.error("Erro ao criar diretórios para upload local:", mkdirError);
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
  
      // Gera nomes de arquivo únicos
      const uuid = randomUUID();
      const extension = ".webp"; // Sempre webp para otimização
      const imageName = `${uuid}${extension}`;
      const thumbnailName = `${uuid}${extension}`;
  
      // Caminhos completos
      const imagePath = path.join(targetDir, imageName);
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
  
      // Salva os arquivos
      fs.writeFileSync(imagePath, optimizedBuffer);
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);
  
      console.log("Upload local concluído com sucesso!");
      
      // Constrói as URLs relativas
      let imageUrl = targetFolder 
        ? `/uploads/${targetFolder}/${imageName}`
        : `/uploads/${imageName}`;
        
      let thumbnailUrl = targetFolder 
        ? `/uploads/${targetFolder}/thumbnails/${thumbnailName}`
        : `/uploads/thumbnails/${thumbnailName}`;
  
      return {
        imageUrl,
        thumbnailUrl,
        storageType: "local"
      };
    } catch (error) {
      console.error("Erro no upload local:", error);
      return {
        imageUrl: "https://placehold.co/800x600?text=Imagem+Indisponível",
        thumbnailUrl: "https://placehold.co/400x300?text=Thumbnail+Indisponível",
        storageType: "placeholder"
      };
    }
  }
}

export const storageService = new StorageRedirector();