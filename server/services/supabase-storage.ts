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
// Nome dos buckets para armazenamento de imagens
const BUCKET_NAME = 'designauto-images'; // Bucket para artes e imagens do sistema
const AVATARS_BUCKET = 'avatars'; // Bucket específico para avatares de usuários

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
   * Tenta criar o bucket caso ele não exista
   */
  async initBucket(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log("=== INICIALIZANDO SUPABASE STORAGE ===");
      
      // Tenta novamente se falhar na primeira tentativa
      let buckets = [];
      let listError = null;
      
      // Primeira tentativa
      const listResult = await supabase.storage.listBuckets();
      buckets = listResult.data || [];
      listError = listResult.error;
      
      // Segunda tentativa se a primeira falhar
      if (listError) {
        console.log("Primeira tentativa de listar buckets falhou, tentando novamente...");
        
        // Espera 1 segundo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResult = await supabase.storage.listBuckets();
        buckets = retryResult.data || [];
        listError = retryResult.error;
      }
      
      if (listError) {
        console.error("ERRO AO LISTAR BUCKETS DO SUPABASE:", listError);
        console.error("Detalhes do erro:", JSON.stringify(listError, null, 2));
      }
      
      console.log(`Total de buckets encontrados: ${buckets.length}`);
      
      if (!buckets || buckets.length === 0) {
        console.log("⚠️ ALERTA: Nenhum bucket encontrado na resposta do Supabase.");
        
        // Tenta criar os buckets necessários
        console.log("Tentando criar os buckets necessários...");
        
        // Tenta criar o bucket principal
        const createMainResult = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true
        });
        
        if (createMainResult.error) {
          console.error(`Erro ao criar o bucket principal '${BUCKET_NAME}':`, createMainResult.error);
        } else {
          console.log(`✅ Bucket principal '${BUCKET_NAME}' criado com sucesso!`);
        }
        
        // Tenta criar o bucket de avatares
        const createAvatarsResult = await supabase.storage.createBucket(AVATARS_BUCKET, {
          public: true
        });
        
        if (createAvatarsResult.error) {
          console.error(`Erro ao criar o bucket de avatares '${AVATARS_BUCKET}':`, createAvatarsResult.error);
        } else {
          console.log(`✅ Bucket de avatares '${AVATARS_BUCKET}' criado com sucesso!`);
        }
      } else {
        console.log(`Buckets disponíveis: ${buckets.map(b => b.name).join(', ')}`);
        
        // Verifica se o bucket principal existe
        const mainBucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
        
        if (mainBucketExists) {
          console.log(`✓ Bucket principal '${BUCKET_NAME}' já existe.`);
        } else {
          console.log(`Bucket principal '${BUCKET_NAME}' não encontrado. Tentando criar...`);
          const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true
          });
          
          if (createError) {
            console.error(`Erro ao criar o bucket principal:`, createError);
          } else {
            console.log(`✅ Bucket principal '${BUCKET_NAME}' criado com sucesso!`);
          }
        }
        
        // Verifica se o bucket de avatares existe
        const avatarsBucketExists = buckets.some(bucket => bucket.name === AVATARS_BUCKET);
        
        if (avatarsBucketExists) {
          console.log(`✓ Bucket de avatares '${AVATARS_BUCKET}' já existe.`);
        } else {
          console.log(`Bucket de avatares '${AVATARS_BUCKET}' não encontrado. Tentando criar...`);
          const { error: createError } = await supabase.storage.createBucket(AVATARS_BUCKET, {
            public: true
          });
          
          if (createError) {
            console.error(`Erro ao criar o bucket de avatares:`, createError);
          } else {
            console.log(`✅ Bucket de avatares '${AVATARS_BUCKET}' criado com sucesso!`);
          }
        }
      }
      
      // Define as políticas de acesso para o bucket de avatares
      try {
        console.log("Configurando políticas de acesso para o bucket de avatares...");
        await supabase.storage.from(AVATARS_BUCKET).getPublicUrl('test.txt');
        console.log("Políticas de acesso para o bucket de avatares configuradas.");
      } catch (policyError) {
        console.error("Erro ao configurar políticas de acesso:", policyError);
      }
      
      this.initialized = true;
      console.log("✅ Inicialização do Supabase Storage concluída");
    } catch (error) {
      console.error("ERRO AO INICIALIZAR SUPABASE STORAGE:", error);
      console.error("Detalhes completos:", JSON.stringify(error, null, 2));
      // Não lançamos o erro para permitir fallback para armazenamento local
      this.initialized = false;
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
  private extractPathFromUrl(url: string, bucketName = BUCKET_NAME): string | null {
    try {
      // Padrão de URL do Supabase Storage: 
      // https://{instance}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      
      // Encontra o índice do bucket name
      const bucketIndex = parts.indexOf(bucketName);
      if (bucketIndex === -1) {
        console.warn(`Bucket '${bucketName}' não encontrado na URL:`, url);
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
   * Método específico para upload de avatares usando o bucket 'avatars'
   * Otimiza e redimensiona a imagem para uso como avatar de perfil
   */
  async uploadAvatar(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ imageUrl: string; storageType?: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }

    // Certifica-se de que temos conexão com o Supabase
    await this.initBucket();

    try {
      console.log("==== UPLOAD DE AVATAR PARA BUCKET 'avatars' ====");
      console.log(`Nome original: ${file.originalname}`);
      console.log(`Tipo MIME: ${file.mimetype}`);
      console.log(`Tamanho: ${file.size} bytes`);

      // Lista os buckets para debug
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
          console.error("Erro ao listar buckets para debug:", listError);
        } else {
          console.log("Buckets disponíveis:", buckets.map(b => b.name).join(", "));
          if (buckets.some(b => b.name === AVATARS_BUCKET)) {
            console.log(`✓ Bucket '${AVATARS_BUCKET}' encontrado na lista!`);
          } else {
            console.warn(`⚠️ Bucket '${AVATARS_BUCKET}' NÃO encontrado na lista de buckets!`);
          }
        }
      } catch (bucketError) {
        console.error("Erro ao listar buckets:", bucketError);
      }

      // Otimização da imagem para avatar (quadrado, tamanho específico)
      console.log("Iniciando otimização da imagem...");
      const optimizedBuffer = await this.optimizeImage(file.buffer, {
        width: options.width || 400,   // Tamanho específico para avatar
        height: options.height || 400, // Avatar quadrado por padrão
        quality: options.quality || 85, // Qualidade boa para detalhes faciais
        format: "webp"                 // Formato moderno e comprimido
      });
      console.log(`Imagem otimizada: ${optimizedBuffer.length} bytes (${Math.round(optimizedBuffer.length/1024)}KB)`);

      // Gera nome de arquivo único
      const uuid = randomUUID();
      const avatarPath = `${uuid}.webp`;
      console.log(`Nome de arquivo para upload: ${avatarPath}`);

      // Upload do avatar para o bucket específico do Supabase
      console.log(`Tentando upload para bucket '${AVATARS_BUCKET}'...`);
      const uploadResult = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(avatarPath, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: true  // Sobrescreve se necessário
        });
        
      console.log("Resultado do upload:", JSON.stringify(uploadResult));
      
      if (uploadResult.error) {
        console.error(`ERRO NO UPLOAD DO AVATAR: ${uploadResult.error.message}`);
        console.error("Detalhes:", uploadResult.error);
        throw new Error(`Erro no upload do avatar: ${uploadResult.error.message}`);
      }

      console.log("✓ Upload para bucket de avatars concluído com sucesso!");

      // Obtém URL pública para acesso
      console.log("Obtendo URL pública...");
      const { data: urlData } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(avatarPath);
        
      console.log(`URL pública gerada: ${urlData.publicUrl}`);

      return {
        imageUrl: urlData.publicUrl,
        storageType: "supabase_avatar"
      };
    } catch (error) {
      console.error("Erro no upload de avatar para Supabase:", error);
      
      // Tenta usar o fallback local em caso de erro
      console.log("Tentando fallback local para avatar após erro no Supabase...");
      
      // Usamos o mesmo serviço de storage local, mas com pasta específica para avatares
      try {
        // Diretório para avatares
        const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        
        try {
          if (!fs.existsSync('public')) {
            fs.mkdirSync('public');
          }
          if (!fs.existsSync(path.join('public', 'uploads'))) {
            fs.mkdirSync(path.join('public', 'uploads'));
          }
          if (!fs.existsSync(avatarsDir)) {
            fs.mkdirSync(avatarsDir);
          }
        } catch (err) {
          console.error("Erro ao criar diretórios para avatares:", err);
        }
        
        // Otimização da imagem (mesma lógica do caso de sucesso)
        const optimizedBuffer = await this.optimizeImage(file.buffer, {
          width: options.width || 400,
          height: options.height || 400,
          quality: options.quality || 85,
          format: "webp"
        });
        
        // Gera um nome único para o arquivo
        const uniqueId = randomUUID();
        const fileName = `${uniqueId}.webp`;
        
        // Caminho completo do arquivo
        const filePath = path.join(avatarsDir, fileName);
        
        // Salva o arquivo otimizado
        fs.writeFileSync(filePath, optimizedBuffer);
        
        console.log("Upload local de avatar concluído com sucesso!");
        
        // Retorna a URL relativa
        return {
          imageUrl: `/uploads/avatars/${fileName}`,
          storageType: "local_avatar"
        };
      } catch (fallbackError) {
        console.error("Erro no fallback local para avatar:", fallbackError);
        return {
          imageUrl: "https://placehold.co/400x400?text=Avatar+Indisponível",
          storageType: "error"
        };
      }
    }
  }
  
  /**
   * Nova solução para upload de logos que corrige os problemas de arquivos vazios
   */
  /**
   * Otimiza uma imagem de logo
   * - Redimensiona para dimensões ideais para header (máximo 300px altura, mantendo proporção)
   * - Converte para WebP para melhor compressão, exceto SVGs
   * - Ajusta qualidade para tamanho web otimizado
   */
  async optimizeLogo(
    buffer: Buffer,
    mimeType: string
  ): Promise<{ buffer: Buffer, extension: string, mimeType: string }> {
    // Verificar se é SVG - não otimizamos SVGs, apenas retornamos como está
    if (mimeType === 'image/svg+xml') {
      console.log("Logo é SVG, não necessita otimização");
      return { 
        buffer: buffer,
        extension: '.svg',
        mimeType: 'image/svg+xml'
      };
    }
    
    try {
      console.log("Iniciando otimização do logo...");
      
      // Obter informações da imagem original
      const metadata = await sharp(buffer).metadata();
      console.log(`Dimensões originais: ${metadata.width || 'unknown'}x${metadata.height || 'unknown'}`);
      console.log(`Formato original: ${metadata.format || 'unknown'}`);
      
      // Configurar o processamento com sharp
      let sharpInstance = sharp(buffer);
      
      // Redimensionar para altura máxima de 300px mantendo proporção
      sharpInstance = sharpInstance.resize({
        height: 300,
        fit: "inside",
        withoutEnlargement: true,
      });
      
      // Converter para WebP com qualidade de 85%
      const optimizedBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer();
      
      console.log(`Logo otimizado: ${buffer.length} bytes -> ${optimizedBuffer.length} bytes`);
      console.log(`Taxa de compressão: ${((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(2)}%`);
      
      return {
        buffer: optimizedBuffer,
        extension: '.webp',
        mimeType: 'image/webp'
      };
    } catch (error) {
      console.error("Erro ao otimizar logo, usando original:", error);
      // Em caso de erro, retornamos o buffer original
      const extension = mimeType.includes('png') ? '.png' : 
                        mimeType.includes('svg') ? '.svg' : 
                        mimeType.includes('jp') ? '.jpg' : '.png';
      
      return { 
        buffer: buffer,
        extension: extension,
        mimeType: mimeType
      };
    }
  }
  
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

    // Verificar se o buffer do arquivo tem conteúdo e validar em detalhes
    if (!file.buffer) {
      console.error("ERRO CRÍTICO: Propriedade buffer não existe no arquivo!");
      throw new Error("Estrutura do arquivo inválida - buffer não existe");
    }
    
    if (file.buffer.length === 0) {
      console.error("ERRO CRÍTICO: O buffer do arquivo existe mas está vazio (comprimento zero)!");
      throw new Error("O arquivo enviado está vazio (buffer com comprimento zero)");
    }
    
    // Logar detalhes do buffer para diagnóstico
    console.log(`Buffer válido encontrado: ${file.buffer.length} bytes`);
    console.log(`Tipo do buffer: ${Buffer.isBuffer(file.buffer) ? 'Buffer nativo' : typeof file.buffer}`);
    console.log(`Primeiros 20 bytes (hex): ${file.buffer.slice(0, 20).toString('hex')}`);
    
    // Verificação adicional para garantir que é um buffer válido
    if (!Buffer.isBuffer(file.buffer)) {
      console.error("AVISO: O buffer não é um Buffer nativo. Tentando converter...");
      file.buffer = Buffer.from(file.buffer);
      console.log(`Buffer convertido: ${file.buffer.length} bytes após conversão`);
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
    
    // Determinar o tipo de conteúdo adequado do arquivo original
    let contentType = file.mimetype;
    const originalExtension = path.extname(file.originalname) || '.png';
    
    if (!contentType || contentType === 'application/octet-stream') {
      if (originalExtension.toLowerCase() === '.png') contentType = 'image/png';
      else if (['.jpg', '.jpeg'].includes(originalExtension.toLowerCase())) contentType = 'image/jpeg';
      else if (originalExtension.toLowerCase() === '.svg') contentType = 'image/svg+xml';
      else contentType = 'image/png';
    }
    
    // Otimizar o logo antes de salvar
    console.log("Iniciando processo de otimização do logo...");
    const { buffer: optimizedBuffer, extension, mimeType: finalMimeType } = 
      await this.optimizeLogo(file.buffer, contentType);
    
    // Preparar nome de arquivo com a extensão correta após otimização
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    
    // Nome do arquivo padronizado para evitar problemas
    const safeFilename = `logo_${timestamp}_${randomId}${extension}`
      .replace(/[^a-zA-Z0-9_.-]/g, '_')
      .toLowerCase();
    
    // Caminho no Supabase (pasta 'logos' para separação clara)
    const supabasePath = `logos/${safeFilename}`;
    
    // Caminho local (fallback)
    const localPath = path.join(logosDir, safeFilename);
    
    console.log(`Processando upload com nome: ${safeFilename}`);
    console.log(`Tipo de conteúdo final: ${finalMimeType}`);
    console.log(`Tamanho do logo otimizado: ${optimizedBuffer.length} bytes`);
    
    // Primeiro: tentar upload para supabase com o buffer otimizado
    try {
      console.log("Tentando upload do logo otimizado para Supabase...");
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(supabasePath, optimizedBuffer, {
          contentType: finalMimeType,
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
        // Escrever arquivo localmente usando o buffer otimizado
        fs.writeFileSync(localPath, optimizedBuffer);
        
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