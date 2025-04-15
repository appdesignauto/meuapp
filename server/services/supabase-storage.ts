import { createClient } from '@supabase/supabase-js';
import { randomUUID } from "crypto";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { storageService } from './storage';

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Credenciais do Supabase não configuradas corretamente.");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Nome do bucket para armazenar as imagens
const BUCKET_NAME = 'designauto-images';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export class SupabaseStorageService {
  private initialized = false;

  constructor() {
    this.initBucket().catch(err => {
      console.error("Erro ao inicializar bucket do Supabase:", err);
    });
  }

  /**
   * Inicializa o bucket do Supabase se não existir
   */
  async initBucket(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verifica se o bucket já existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

      if (!bucketExists) {
        console.log(`Criando bucket '${BUCKET_NAME}' no Supabase...`);
        // Cria o bucket com acesso público para leitura
        const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true, // Permite acesso público às imagens
          fileSizeLimit: 5 * 1024 * 1024 // Limite de 5MB por arquivo
        });

        if (error) {
          throw new Error(`Erro ao criar bucket: ${error.message}`);
        }
        
        console.log(`Bucket '${BUCKET_NAME}' criado com sucesso!`);
      } else {
        console.log(`Bucket '${BUCKET_NAME}' já existe no Supabase.`);
      }

      this.initialized = true;
    } catch (error) {
      console.error("Erro ao inicializar o Supabase Storage:", error);
      throw error;
    }
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
   * Gera um nome de arquivo único
   */
  private generateFilename(originalFilename: string, isThumb = false): string {
    const extension = '.webp'; // Sempre usamos WebP para otimização
    const uuid = randomUUID();
    return `${isThumb ? 'thumbnails/' : ''}${uuid}${extension}`;
  }

  /**
   * Faz upload de uma imagem otimizada para o Supabase Storage
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ imageUrl: string; thumbnailUrl: string; storageType?: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }

    // Certifica-se de que o bucket existe
    await this.initBucket();

    try {
      console.log("Tentando upload para Supabase Storage...");
      console.log(`Nome original: ${file.originalname}`);
      console.log(`Tipo MIME: ${file.mimetype}`);
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

      // Gera nomes de arquivos únicos
      const imagePath = this.generateFilename(file.originalname);
      const thumbnailPath = this.generateFilename(file.originalname, true);

      // Upload da imagem principal para o Supabase
      const { error: imageError, data: imageData } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(imagePath, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: false
        });

      if (imageError) {
        throw new Error(`Erro no upload da imagem principal: ${imageError.message}`);
      }

      // Upload do thumbnail para o Supabase
      const { error: thumbError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: 'image/webp',
          upsert: false
        });

      if (thumbError) {
        // Se falhar o upload do thumbnail, tenta remover a imagem principal para evitar inconsistência
        await supabase.storage.from(BUCKET_NAME).remove([imagePath]);
        throw new Error(`Erro no upload do thumbnail: ${thumbError.message}`);
      }

      console.log("Upload para Supabase Storage concluído com sucesso!");

      // Obtém URLs públicas para acesso
      const { data: imageUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(imagePath);

      const { data: thumbnailUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(thumbnailPath);

      return {
        imageUrl: imageUrlData.publicUrl,
        thumbnailUrl: thumbnailUrlData.publicUrl,
        storageType: "supabase"
      };
    } catch (error) {
      console.error("Erro no upload para Supabase:", error);
      
      // Tenta usar o fallback local em caso de erro
      console.log("Tentando fallback local após erro no Supabase...");
      return await storageService.localUpload(file, options);
    }
  }

  /**
   * Upload direto sem otimização (para testes)
   */
  async uploadDirectWithoutOptimization(
    file: Express.Multer.File
  ): Promise<{ imageUrl: string; thumbnailUrl: string; storageType?: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }

    // Certifica-se de que o bucket existe
    await this.initBucket();

    try {
      console.log("Tentando upload direto para Supabase Storage sem otimização...");
      console.log(`Nome original: ${file.originalname}`);
      console.log(`Tipo MIME: ${file.mimetype}`);
      console.log(`Tamanho: ${file.size} bytes`);

      // Gera nome de arquivo único
      const extension = path.extname(file.originalname) || '.jpg';
      const uuid = randomUUID();
      const filePath = `original/${uuid}${extension}`;

      // Upload do arquivo original sem processamento
      const { error, data } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new Error(`Erro no upload direto: ${error.message}`);
      }

      console.log("Upload direto para Supabase concluído com sucesso!");

      // Obtém URL pública para acesso
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        imageUrl: urlData.publicUrl,
        thumbnailUrl: urlData.publicUrl, // Mesmo arquivo para thumbnail
        storageType: "supabase_direct"
      };
    } catch (error) {
      console.error("Erro no upload direto para Supabase:", error);
      
      // Como não temos acesso ao método privado, usamos o fallback normal
      console.log("Tentando fallback local após erro no upload direto...");
      // Criamos um fallback local direto aqui mesmo
      try {
        // Certifica-se de que o diretório public/uploads/original existe
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'original');
        
        try {
          if (!fs.existsSync('public')) {
            fs.mkdirSync('public');
          }
          if (!fs.existsSync(path.join('public', 'uploads'))) {
            fs.mkdirSync(path.join('public', 'uploads'));
          }
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
          }
        } catch (err) {
          console.error("Erro ao criar diretórios para upload direto:", err);
        }
        
        // Gera um nome único para o arquivo
        const uniqueId = randomUUID();
        const extension = path.extname(file.originalname) || '.jpg';
        const fileName = `${uniqueId}${extension}`;
        
        // Caminho completo do arquivo
        const filePath = path.join(uploadsDir, fileName);
        
        // Salva o arquivo original
        fs.writeFileSync(filePath, file.buffer);
        
        console.log("Upload direto local bem-sucedido!");
        
        // Retorna a URL relativa
        return {
          imageUrl: `/uploads/original/${fileName}`,
          thumbnailUrl: `/uploads/original/${fileName}`, // Mesmo arquivo para thumbnail
          storageType: "local_direct"
        };
      } catch (fallbackError) {
        console.error("Erro no fallback local direto:", fallbackError);
        return {
          imageUrl: "https://placehold.co/800x600?text=Imagem+Indisponível",
          thumbnailUrl: "https://placehold.co/400x300?text=Thumbnail+Indisponível",
          storageType: "error"
        };
      }
    }
  }

  /**
   * Remove uma imagem do Supabase Storage
   */
  async deleteImage(url: string): Promise<boolean> {
    try {
      // Extrai o caminho do arquivo da URL pública
      const filePath = this.extractPathFromUrl(url);
      if (!filePath) {
        console.error("Não foi possível extrair o caminho do arquivo da URL:", url);
        return false;
      }

      // Verifica se é um thumbnail
      const isThumbnail = filePath.startsWith('thumbnails/');
      
      // Remove a imagem principal
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error(`Erro ao remover imagem do Supabase: ${error.message}`);
        return false;
      }

      // Se não for thumbnail, tenta remover também o thumbnail correspondente
      if (!isThumbnail) {
        // Extrai o nome do arquivo da URL
        const filename = filePath.split('/').pop() || '';
        const thumbnailPath = `thumbnails/${filename}`;
        
        // Remove o thumbnail sem verificar erros (pode não existir)
        await supabase.storage.from(BUCKET_NAME).remove([thumbnailPath]);
      }

      console.log(`Imagem removida com sucesso do Supabase: ${filePath}`);
      return true;
    } catch (error) {
      console.error("Erro ao deletar imagem do Supabase:", error);
      return false;
    }
  }

  /**
   * Extrai o caminho do arquivo da URL pública do Supabase
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      // Padrão de URL do Supabase Storage: 
      // https://{instance}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      
      // Encontra o índice do bucket name
      const bucketIndex = parts.indexOf(BUCKET_NAME);
      if (bucketIndex === -1) {
        console.warn("Bucket não encontrado na URL:", url);
        return null;
      }
      
      // Extrai o caminho após o nome do bucket
      return parts.slice(bucketIndex + 1).join('/');
    } catch (error) {
      console.error("Erro ao extrair caminho da URL:", error);
      return null;
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();