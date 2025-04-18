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
   * Inicializa o bucket do Supabase
   * 
   * Nota: Assume que o bucket já foi criado manualmente no painel do Supabase.
   * Criar buckets via API requer permissões especiais de serviço.
   */
  async initBucket(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verifica a conexão com o Supabase
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error("Erro ao conectar com Supabase Storage:", error.message);
        throw error;
      }
      
      // Lista todos os buckets disponíveis para depuração
      console.log("Buckets disponíveis no Supabase:", buckets?.map(b => b.name).join(', ') || 'Nenhum bucket encontrado');
      
      // Verifica se o bucket existe
      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

      if (!bucketExists) {
        console.log(`Aviso: O bucket '${BUCKET_NAME}' não existe no Supabase.`);
        console.log("Por favor, crie manualmente o bucket no painel do Supabase com as seguintes configurações:");
        console.log("- Nome: designauto-images");
        console.log("- Acesso: público");
        console.log("- Tamanho máximo de arquivo: 5MB");
        
        // Não lançamos erro, apenas avisamos e continuamos - upload fallback para local
        console.log("Uploads serão direcionados para o armazenamento local até que o bucket seja criado.");
      } else {
        console.log(`Bucket '${BUCKET_NAME}' encontrado no Supabase.`);
      }

      this.initialized = true;
    } catch (error) {
      console.error("Erro ao inicializar o Supabase Storage:", error);
      // Não lançamos erro, apenas avisamos - upload fallback para local
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
  
  /**
   * Nova solução para upload de logos que corrige os problemas de arquivos vazios
   */
  async uploadLogoWithCustomFilename(
    file: Express.Multer.File, 
    customFilename?: string
  ): Promise<{ logoUrl: string; storageType: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }

    console.log("=== INÍCIO DO PROCESSO DE UPLOAD DE LOGO ===");
    console.log(`Arquivo recebido: ${file.originalname} (${file.size} bytes)`);
    console.log(`Tipo MIME: ${file.mimetype}`);
    
    // A inicialização do bucket é feita de qualquer forma, independente de usar local ou não
    await this.initBucket();

    // Verificar se o buffer do arquivo tem conteúdo
    if (!file.buffer || file.buffer.length === 0) {
      console.error("ERRO CRÍTICO: O buffer do arquivo está vazio!");
      throw new Error("O arquivo enviado está vazio ou corrompido");
    }

    // Criar diretório local de qualquer forma (para fallback)
    const logosDir = path.join(process.cwd(), 'public/images/logos');
    try {
      if (!fs.existsSync(logosDir)) {
        fs.mkdirSync(logosDir, { recursive: true });
      }
    } catch (err) {
      console.error("Erro ao criar diretório local de logos:", err);
    }
    
    // Preparar nome de arquivo e caminhos
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname) || '.png';
    
    // Nome do arquivo padronizado para evitar problemas
    const safeFilename = `logo_${timestamp}_${randomId}${extension}`
      .replace(/[^a-zA-Z0-9_.-]/g, '_')
      .toLowerCase();
    
    // Caminho no Supabase (usando original para manter padrão)
    const supabasePath = `original/${safeFilename}`;
    
    // Caminho local (fallback)
    const localPath = path.join(logosDir, safeFilename);
    
    // Determinar o tipo de conteúdo adequado
    let contentType = file.mimetype;
    if (!contentType || contentType === 'application/octet-stream') {
      if (extension.toLowerCase() === '.png') contentType = 'image/png';
      else if (['.jpg', '.jpeg'].includes(extension.toLowerCase())) contentType = 'image/jpeg';
      else if (extension.toLowerCase() === '.svg') contentType = 'image/svg+xml';
      else contentType = 'image/png';
    }
    
    console.log(`Processando upload com nome: ${safeFilename}`);
    console.log(`Tipo de conteúdo: ${contentType}`);
    
    // Primeiro: tentar upload para supabase
    try {
      console.log("Tentando upload para Supabase...");
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(supabasePath, file.buffer, {
          contentType: contentType,
          upsert: true
        });

      if (error) throw error;
      
      // Sucesso no upload para Supabase
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(supabasePath);
        
      console.log(`Upload para Supabase concluído: ${urlData.publicUrl}`);
      
      // Verificar se o arquivo tem conteúdo após upload
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        const contentLength = Number(response.headers.get('content-length') || '0');
        
        console.log(`Verificação de conteúdo: ${contentLength} bytes`);
        
        if (contentLength <= 0) {
          console.warn("AVISO: Arquivo enviado para Supabase tem tamanho zero. Tentando fallback local.");
          throw new Error("Arquivo vazio após upload para Supabase");
        }
      } catch (verifyError) {
        console.error("Erro ao verificar arquivo no Supabase:", verifyError);
        throw verifyError;
      }
        
      return {
        logoUrl: urlData.publicUrl,
        storageType: "supabase"
      };
      
    } catch (supabaseError) {
      console.error("Erro no upload para Supabase:", supabaseError);
      console.log("Tentando fallback para armazenamento local...");
      
      // Fallback: armazenamento local
      try {
        // Escrever arquivo localmente
        fs.writeFileSync(localPath, file.buffer);
        
        const localUrl = `/images/logos/${safeFilename}`;
        console.log(`Upload local concluído: ${localUrl}`);
        
        return {
          logoUrl: localUrl,
          storageType: "local"
        };
      } catch (localError) {
        console.error("Erro no fallback local:", localError);
        throw new Error("Falha em todas as tentativas de upload do logo");
      }
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();