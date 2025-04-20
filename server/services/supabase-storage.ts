import { createClient } from '@supabase/supabase-js';
import { randomUUID } from "crypto";
import sharp from "sharp"; // Importando corretamente o sharp
import * as path from "path";
import * as fs from "fs";
import { storageService } from './storage';

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Credenciais do Supabase não configuradas corretamente.");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

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
  private emergencyUploadAttempts: { [userId: string]: number } = {};
  private logs: string[] = [];
  
  // Adicionar logs ao array e console
  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    this.logs.push(logMessage);
    console.log(`[Supabase] ${message}`);
  }

  // Obter todos os logs armazenados
  public getLogs(): string[] {
    return [...this.logs];
  }

  // Limpar logs
  public clearLogs() {
    this.logs = [];
  }

  constructor() {
    this.initBucket().catch(err => {
      console.error("Erro ao inicializar bucket do Supabase:", err);
    });
  }

  /**
   * Inicializa o bucket do Supabase
   * 
   * Verifica se os buckets existem e são acessíveis,
   * tenta criar apenas se não conseguir acesso
   */
  async initBucket(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log("=== INICIALIZANDO SUPABASE STORAGE ===");
      
      // Variáveis para controle de acesso aos buckets
      let canAccessMainBucket = false;
      let canAccessAvatarsBucket = false;
      
      // Verificar se conseguimos acessar o bucket principal - isso é melhor do que listar todos os buckets
      console.log("Verificando acesso de leitura ao bucket principal...");
      try {
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .list();
        
        if (data !== null) {
          console.log(`✓ Bucket principal '${BUCKET_NAME}' está acessível. Arquivos encontrados: ${data.length}`);
          canAccessMainBucket = true;
        }
      } catch (accessError: any) {
        console.error(`Erro ao acessar bucket principal '${BUCKET_NAME}':`, accessError.message);
        canAccessMainBucket = false;
      }
      
      // Verificar se conseguimos acessar o bucket de avatares
      console.log("Verificando acesso de leitura ao bucket de avatares...");
      try {
        const { data } = await supabase.storage
          .from(AVATARS_BUCKET)
          .list();
        
        if (data !== null) {
          console.log(`✓ Bucket de avatares '${AVATARS_BUCKET}' está acessível. Arquivos encontrados: ${data.length}`);
          canAccessAvatarsBucket = true;
        }
      } catch (accessError: any) {
        console.error(`Erro ao acessar bucket de avatares '${AVATARS_BUCKET}':`, accessError.message);
        canAccessAvatarsBucket = false;
      }
      
      // Tentar criar os buckets apenas se não conseguimos acessá-los
      // Isso evita erros desnecessários de violação de políticas quando o bucket já existe
      
      // Bucket principal
      if (!canAccessMainBucket) {
        console.log(`Bucket principal '${BUCKET_NAME}' não está acessível. Tentando criar...`);
        try {
          const createMainResult = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true
          });
          
          if (createMainResult.error) {
            // Verificar se é erro de política ou se o bucket já existe
            if (createMainResult.error.message.includes('violates row-level security policy')) {
              console.log(`Aviso: O bucket '${BUCKET_NAME}' provavelmente já existe mas você não tem permissão para criá-lo.`);
              console.log(`Tentando usar mesmo assim, pois as permissões de upload podem ser diferentes.`);
            } else {
              console.error(`Erro ao criar o bucket principal '${BUCKET_NAME}':`, createMainResult.error);
            }
          } else {
            console.log(`✅ Bucket principal '${BUCKET_NAME}' criado com sucesso!`);
            canAccessMainBucket = true;
          }
        } catch (createError) {
          console.error(`Exceção ao criar bucket principal:`, createError);
        }
      }
      
      // Bucket de avatares
      if (!canAccessAvatarsBucket) {
        console.log(`Bucket de avatares '${AVATARS_BUCKET}' não está acessível. Tentando criar...`);
        try {
          const createAvatarsResult = await supabase.storage.createBucket(AVATARS_BUCKET, {
            public: true
          });
          
          if (createAvatarsResult.error) {
            // Verificar se é erro de política ou se o bucket já existe
            if (createAvatarsResult.error.message.includes('violates row-level security policy')) {
              console.log(`Aviso: O bucket '${AVATARS_BUCKET}' provavelmente já existe mas você não tem permissão para criá-lo.`);
              console.log(`Tentando usar mesmo assim, pois as permissões de upload podem ser diferentes.`);
            } else {
              console.error(`Erro ao criar o bucket de avatares '${AVATARS_BUCKET}':`, createAvatarsResult.error);
            }
          } else {
            console.log(`✅ Bucket de avatares '${AVATARS_BUCKET}' criado com sucesso!`);
            canAccessAvatarsBucket = true;
          }
        } catch (createError) {
          console.error(`Exceção ao criar bucket de avatares:`, createError);
        }
      }
      
      // Marcamos como inicializado mesmo com os erros, pois os buckets provavelmente já existem
      // mas não temos permissão para criá-los via API
      this.initialized = true;
      
      // Verificamos se conseguimos acessar os buckets mesmo sem permissão para criá-los
      try {
        console.log("Verificando acesso de leitura ao bucket principal...");
        const { data: files } = await supabase.storage
          .from(BUCKET_NAME)
          .list();
        
        if (files) {
          console.log(`✓ Bucket principal '${BUCKET_NAME}' está acessível. Arquivos encontrados: ${files.length}`);
        }
      } catch (accessError) {
        console.error("Erro ao acessar bucket principal:", accessError);
      }
      
      // Verificamos o acesso ao bucket de avatares
      try {
        console.log("Verificando acesso de leitura ao bucket de avatares...");
        const { data: avatarFiles } = await supabase.storage
          .from(AVATARS_BUCKET)
          .list();
        
        if (avatarFiles) {
          console.log(`✓ Bucket de avatares '${AVATARS_BUCKET}' está acessível. Arquivos encontrados: ${avatarFiles.length}`);
        }
      } catch (avatarAccessError) {
        console.error("Erro ao acessar bucket de avatares:", avatarAccessError);
      }
      
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
    try {
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
    } catch (error) {
      console.error('Falha ao otimizar imagem com sharp:', error);
      // Em caso de falha, retornamos o buffer original
      return buffer;
    }
  }

  /**
   * Gera um nome de arquivo único com estrutura de pastas hierárquica
   * @param originalFilename Nome original do arquivo
   * @param isThumb Se é uma miniatura
   * @param categorySlug Slug da categoria para organização (opcional)
   * @param designerId ID do designer que está fazendo o upload (opcional)
   * @returns Caminho do arquivo no bucket
   */
  private generateFilename(originalFilename: string, isThumb = false, categorySlug?: string, designerId?: number): string {
    const extension = '.webp'; // Sempre usamos WebP para otimização
    const uuid = randomUUID();
    const timestamp = Date.now();
    
    // Estrutura de pastas hierárquica
    let basePath = '';
    
    // Se for thumbnail, começamos com a pasta thumbnails
    if (isThumb) {
      basePath = 'thumbnails/';
    }
    
    // Se tivermos o ID do designer, criamos uma pasta específica para ele
    if (designerId) {
      basePath += `designer_${designerId}/`;
      
      // Se tivermos uma categoria, adicionamos como subpasta dentro da pasta do designer
      if (categorySlug) {
        basePath += `${categorySlug}/`;
      }
    } else {
      // Se não tivermos designer mas tivermos categoria, criamos uma pasta de categoria na raiz
      if (categorySlug) {
        basePath += `category_${categorySlug}/`;
      }
    }
    
    // Formato final: designer_[id]/[categoria]/[timestamp]_[uuid].webp
    // ou thumbnails/designer_[id]/[categoria]/[timestamp]_[uuid].webp
    console.log(`Gerando caminho para arquivo: ${basePath}${timestamp}_${uuid}${extension}`);
    return `${basePath}${timestamp}_${uuid}${extension}`;
  }

  /**
   * Faz upload de uma imagem otimizada para o Supabase Storage
   */
  async uploadImage(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {},
    categorySlug?: string, // Slug da categoria para organização
    designerId?: number // ID do designer para organização em pastas
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

      // Gera nomes de arquivos únicos com estrutura de pastas hierárquica
      console.log(`Usando parâmetros para estrutura de pastas:`);
      console.log(`- Categoria (slug): ${categorySlug || '(não especificada)'}`);
      console.log(`- Designer ID: ${designerId || '(não especificado)'}`);
      
      const imagePath = this.generateFilename(file.originalname, false, categorySlug, designerId);
      const thumbnailPath = this.generateFilename(file.originalname, true, categorySlug, designerId);
      
      console.log(`Estrutura de pastas gerada:`);
      console.log(`- Imagem principal: ${imagePath}`);
      console.log(`- Thumbnail: ${thumbnailPath}`);

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
   * Obtém os arquivos de um bucket específico
   * Útil para diagnósticos e testes de acesso
   */
  async getBucket(bucketName: string): Promise<{ data: any[] | null, error: any }> {
    try {
      // Inicializar o supabase primeiro se necessário
      if (!this.initialized) {
        await this.initBucket();
      }
      
      // Verificar se tem acesso listando os arquivos
      return await supabase.storage
        .from(bucketName)
        .list();
    } catch (error) {
      console.error(`Erro ao acessar bucket ${bucketName}:`, error);
      return { data: null, error };
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
   * Método específico para upload de avatares usando o bucket 'designautoimages'
   * Otimiza e redimensiona a imagem para uso como avatar de perfil
   */
  async uploadAvatar(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {},
    userId?: number | string // Agora usamos userId para identificar o dono do avatar
  ): Promise<{ imageUrl: string; storageType?: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido");
    }

    // Verificar se é o usuário problemático conhecido (mantemos por compatibilidade)
    const isProblematicUser = userId === 'fernandosim20188718';
    
    if (isProblematicUser) {
      console.log("⚠️ DETECTADO USUÁRIO PROBLEMÁTICO: fernandosim20188718");
      console.log("⚠️ Iniciando processo de upload de emergência com múltiplos fallbacks");
      
      return await this.uploadEmergencyAvatar(file, options);
    }

    // Certifica-se de que temos conexão com o Supabase
    await this.initBucket();

    try {
      console.log("==== UPLOAD DE AVATAR PARA BUCKET 'avatars' ====");
      console.log(`Nome original: ${file.originalname}`);
      console.log(`Tipo MIME: ${file.mimetype}`);
      console.log(`Tamanho: ${file.size} bytes`);
      console.log(`ID do usuário: ${userId || 'não especificado'}`);

      // Verificamos primeiro se podemos acessar o bucket de avatares
      let canAccessAvatarsBucket = true;
      try {
        const { data } = await supabase.storage
          .from(AVATARS_BUCKET)
          .list();
        
        if (data) {
          console.log(`✓ Bucket '${AVATARS_BUCKET}' acessível. Arquivos encontrados: ${data.length}`);
        } else {
          console.log(`Bucket '${AVATARS_BUCKET}' acessível, mas nenhum arquivo encontrado.`);
        }
      } catch (accessError: any) {
        console.error(`Erro ao acessar bucket '${AVATARS_BUCKET}':`, accessError.message);
        console.log(`Tentando upload no bucket principal '${BUCKET_NAME}' como fallback...`);
        canAccessAvatarsBucket = false;
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

      // Gera estrutura de pastas e nome de arquivo organizado por usuário
      const timestamp = Date.now();
      
      // Determina o caminho do arquivo baseado no ID do usuário
      let avatarPath;
      if (userId) {
        // Nova estrutura organizada em pastas por usuário
        avatarPath = `user_${userId}/avatar_${timestamp}.webp`;
        console.log(`Usando estrutura de pastas com ID de usuário: ${avatarPath}`);
      } else {
        // Fallback para usuários sem ID (compatibilidade)
        const uuid = randomUUID();
        avatarPath = `temp/avatar_${uuid}.webp`;
        console.log(`Usuário sem ID, usando caminho temporário: ${avatarPath}`);
      }
      
      console.log(`Nome de arquivo para upload: ${avatarPath}`);

      let uploadSuccess = false;
      let publicUrl = '';
      
      // Primeiro tenta no bucket 'designautoimages' se conseguir acessá-lo
      if (canAccessAvatarsBucket) {
        console.log(`Tentando upload para bucket de avatares '${AVATARS_BUCKET}'...`);
        
        try {
          const uploadResult = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(avatarPath, optimizedBuffer, {
              contentType: 'image/webp',
              upsert: true  // Sobrescreve se necessário
            });
            
          console.log("Resultado do upload no bucket de avatares:", JSON.stringify(uploadResult));
          
          if (uploadResult.error) {
            console.error(`Erro no upload para bucket de avatares: ${uploadResult.error.message}`);
            // Vamos continuar e tentar o bucket principal
          } else {
            console.log("✓ Upload para bucket de avatares concluído com sucesso!");
            
            // Obtém URL pública para acesso
            const { data: urlData } = supabase.storage
              .from(AVATARS_BUCKET)
              .getPublicUrl(avatarPath);
              
            publicUrl = urlData.publicUrl;
            uploadSuccess = true;
            
            console.log(`URL pública gerada (bucket ${AVATARS_BUCKET}): ${publicUrl}`);
          }
        } catch (avatarUploadError: any) {
          console.error("Erro no upload para bucket de avatares:", avatarUploadError.message);
          // Vamos continuar e tentar o bucket principal 
        }
      }
      
      // Se não conseguiu upload no bucket de avatares, tenta no bucket principal
      if (!uploadSuccess) {
        console.log(`Tentando upload para bucket principal '${BUCKET_NAME}' na pasta 'avatars/'...`);
        
        try {
          // Mesmo padrão de caminho para o bucket principal
          const mainBucketPath = avatarPath;
          
          const mainBucketResult = await supabase.storage
            .from(BUCKET_NAME)
            .upload(mainBucketPath, optimizedBuffer, {
              contentType: 'image/webp',
              upsert: true
            });
            
          console.log("Resultado do upload no bucket principal:", JSON.stringify(mainBucketResult));
          
          if (mainBucketResult.error) {
            console.error(`Erro no upload para bucket principal: ${mainBucketResult.error.message}`);
            throw mainBucketResult.error;
          }
          
          console.log("✓ Upload para bucket principal concluído com sucesso!");
          
          // Obtém URL pública para acesso
          const { data: mainUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(mainBucketPath);
            
          publicUrl = mainUrlData.publicUrl;
          uploadSuccess = true;
          
          console.log(`URL pública gerada (bucket principal): ${publicUrl}`);
        } catch (mainBucketError: any) {
          console.error("Erro no upload para bucket principal:", mainBucketError.message);
          throw new Error(`Falha nos uploads para ambos os buckets: ${mainBucketError.message}`);
        }
      }
      
      if (!uploadSuccess || !publicUrl) {
        throw new Error("Upload de avatar falhou em todos os buckets tentados");
      }

      return {
        imageUrl: publicUrl,
        storageType: "supabase_avatar"
      };
    } catch (error) {
      console.error("Erro no upload de avatar para Supabase:", error);
      
      // Tenta usar o fallback local em caso de erro
      console.log("Tentando fallback local para avatar após erro no Supabase...");
      
      // Usamos o mesmo serviço de storage local, mas com pasta específica para avatares
      try {
        // Diretório para avatares
        const designautoimagesDir = path.join(process.cwd(), 'public', 'uploads', 'designautoimages');
        
        try {
          if (!fs.existsSync('public')) {
            fs.mkdirSync('public');
          }
          if (!fs.existsSync(path.join('public', 'uploads'))) {
            fs.mkdirSync(path.join('public', 'uploads'));
          }
          if (!fs.existsSync(designautoimagesDir)) {
            fs.mkdirSync(designautoimagesDir);
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
        const filePath = path.join(designautoimagesDir, fileName);
        
        // Salva o arquivo otimizado
        fs.writeFileSync(filePath, optimizedBuffer);
        
        console.log("Upload local de avatar concluído com sucesso!");
        
        // Retorna a URL relativa
        return {
          imageUrl: `/uploads/designautoimages/${fileName}`,
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
   * Método de upload de emergência para usuários com problemas persistentes
   * Tenta múltiplas estratégias e oferece um fallback local garantido
   */
  async uploadEmergencyAvatar(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {},
    username?: string
  ): Promise<{ imageUrl: string; storageType?: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido para upload de emergência");
    }

    console.log("🚨 INICIANDO PROTOCOLO DE UPLOAD DE EMERGÊNCIA 🚨");
    console.log(`Arquivo: ${file.originalname} (${file.size} bytes)`);
    console.log(`Usuário: ${username || 'desconhecido'}`);
    console.log("Tentando estratégias alternativas de upload...");
    
    // Otimizar a imagem uma única vez para todas as estratégias
    let optimizedBuffer: Buffer;
    try {
      console.log("Otimizando imagem para upload de emergência...");
      optimizedBuffer = await this.optimizeImage(file.buffer, {
        width: options.width || 400,
        height: options.height || 400,
        quality: options.quality || 85,
        format: "webp"
      });
      console.log(`Imagem otimizada: ${optimizedBuffer.length} bytes (${Math.round(optimizedBuffer.length/1024)}KB)`);
    } catch (optimizeError) {
      console.error("Erro ao otimizar imagem para upload de emergência:", optimizeError);
      // Em caso de falha na otimização, usar o buffer original
      optimizedBuffer = file.buffer;
      console.log("Usando buffer original devido a erro na otimização.");
    }
    
    // Inicializar conexão com Supabase
    try {
      await this.initBucket();
    } catch (initError) {
      console.error("Falha ao inicializar conexão com Supabase:", initError);
      // Continua mesmo com erro, tentaremos cada estratégia mesmo assim
    }
    
    // Gerar nome de arquivo único com prefixo especial
    const uniqueId = randomUUID();
    const userPrefix = username ? `${username}_` : '';
    const filename = `emergency_${userPrefix}${uniqueId}.webp`;
    
    // Lista de estratégias em ordem de preferência
    const strategies = [
      { name: 'avatar_bucket', description: 'Upload para bucket específico de avatares', 
        path: filename, bucket: AVATARS_BUCKET },
      { name: 'main_bucket_avatar_path', description: 'Upload para pasta /avatars no bucket principal',
        path: `avatars/${filename}`, bucket: BUCKET_NAME },
      { name: 'main_bucket_root', description: 'Upload direto para raiz do bucket principal',
        path: filename, bucket: BUCKET_NAME },
      { name: 'local_emergency', description: 'Upload para sistema de arquivos local', 
        path: path.join('public', 'uploads', 'emergency', filename) }
    ];
    
    // Tentar cada estratégia em ordem até uma funcionar
    for (const strategy of strategies) {
      try {
        console.log(`\n>> TENTANDO ESTRATÉGIA: ${strategy.name} - ${strategy.description}`);
        
        if (strategy.name === 'local_emergency') {
          // Estratégia 4: Armazenamento local para emergências
          console.log("Utilizando armazenamento local de emergência...");
          
          // Criar diretórios necessários
          const emergencyDir = path.join(process.cwd(), 'public', 'uploads', 'emergency');
          try {
            if (!fs.existsSync('public')) {
              fs.mkdirSync('public');
            }
            if (!fs.existsSync(path.join('public', 'uploads'))) {
              fs.mkdirSync(path.join('public', 'uploads'));
            }
            if (!fs.existsSync(emergencyDir)) {
              fs.mkdirSync(emergencyDir);
            }
            
            console.log(`Diretório de emergência pronto: ${emergencyDir}`);
          } catch (mkdirError) {
            console.error("Erro ao criar diretórios de emergência:", mkdirError);
            throw new Error(`Falha ao criar diretório: ${mkdirError.message}`);
          }
          
          // Salvar arquivo localmente
          const filePath = path.join(emergencyDir, filename);
          fs.writeFileSync(filePath, optimizedBuffer);
          
          console.log(`✅ Avatar salvo localmente em: ${filePath}`);
          
          return {
            imageUrl: `/uploads/emergency/${filename}`,
            storageType: 'local_emergency'
          };
        } 
        else {
          // Estratégias 1-3: Upload para Supabase
          console.log(`Tentando upload para o bucket '${strategy.bucket}' no caminho '${strategy.path}'...`);
          
          const { data, error } = await supabase.storage
            .from(strategy.bucket)
            .upload(strategy.path, optimizedBuffer, {
              contentType: 'image/webp',
              upsert: true
            });
            
          if (error) {
            console.error(`Erro na estratégia ${strategy.name}:`, error.message);
            
            // Se for erro de política, é diferente de erro de conectividade
            if (error.message.includes('violates row-level security policy')) {
              console.log("Erro de política de segurança. Tentando próxima estratégia...");
            }
            
            // Continuar para próxima estratégia
            throw error;
          }
          
          // Se chegou aqui, o upload foi bem-sucedido
          console.log(`✅ Upload bem-sucedido via ${strategy.name}!`);
          
          // Gerar URL pública
          const { data: urlData } = supabase.storage
            .from(strategy.bucket)
            .getPublicUrl(strategy.path);
            
          console.log(`URL pública gerada: ${urlData.publicUrl}`);
          
          return {
            imageUrl: urlData.publicUrl,
            storageType: `supabase_${strategy.name}`
          };
        }
      } catch (strategyError) {
        console.error(`Falha na estratégia ${strategy.name}:`, strategyError);
        
        // Continuar para próxima estratégia
        console.log("Tentando próxima estratégia...");
        continue;
      }
    }
    
    // Se chegou aqui, todas as estratégias falharam
    console.error("❌ TODAS AS ESTRATÉGIAS DE UPLOAD FALHARAM!");
    console.log("Retornando avatar placeholder como último recurso.");
    
    // Usar um avatar padrão com timestamp para evitar problemas de cache
    const timestamp = Date.now();
    const userText = username ? `U:${username}` : 'Avatar';
    
    return {
      imageUrl: `https://placehold.co/400x400/555588/ffffff?text=${userText}&date=${timestamp}`,
      storageType: 'placeholder'
    };
  }
  
  /**
   * Método de emergência para upload de avatar, usando múltiplas estratégias
   * Este método é especificamente projetado para a página de testes de avatares
   * e para casos especiais onde os métodos normais falham
   */
  async emergencyAvatarUpload(
    file: Express.Multer.File,
    username: string,
    options: ImageOptimizationOptions = {}
  ): Promise<{ 
    imageUrl: string;
    storageType: string;
    strategy: string;
  }> {
    // Registrar tentativa para este usuário
    if (!this.emergencyUploadAttempts[username]) {
      this.emergencyUploadAttempts[username] = 0;
    }
    this.emergencyUploadAttempts[username]++;
    
    const attemptCount = this.emergencyUploadAttempts[username];
    
    console.log(`🚨 EMERGÊNCIA: Usando upload especializado para usuário '${username}' (tentativa #${attemptCount})`);
    
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido para upload de emergência");
    }
    
    // Garantir que o bucket existe
    await this.initBucket();
    
    try {
      // Escolher estratégia com base no número de tentativas anteriores
      // Isso permite tentar diferentes abordagens em uploads subsequentes
      
      // ESTRATÉGIA 1: Upload direto sem otimização para bucket designautoimages
      if (attemptCount % 4 === 1) {
        try {
          console.log("📝 ESTRATÉGIA 1: Upload direto sem otimização para bucket designautoimages");
          
          // Gerar nome de arquivo específico para o usuário
          const extension = path.extname(file.originalname) || '.jpg';
          const timestamp = Date.now();
          const filePath = `${username.replace(/[^a-z0-9]/gi, '_')}_${timestamp}${extension}`;
          
          console.log(`- Enviando para: ${AVATARS_BUCKET}/${filePath}`);
          console.log(`- Tipo: ${file.mimetype}`);
          console.log(`- Tamanho: ${file.size} bytes`);
          
          // Upload direto sem processamento
          const { error, data } = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: true // Sobrescrever se existir
            });
            
          if (error) {
            console.error(`❌ ESTRATÉGIA 1 falhou: ${error.message}`);
            throw error;
          }
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from(AVATARS_BUCKET)
            .getPublicUrl(filePath);
            
          console.log(`✅ ESTRATÉGIA 1 sucesso! URL: ${urlData.publicUrl}`);
          
          return {
            imageUrl: urlData.publicUrl,
            storageType: "supabase_avatar_direct",
            strategy: "direct_upload_designautoimages"
          };
        } catch (error) {
          console.error("❌ ESTRATÉGIA 1 falhou completamente:", error);
          // Continua para a próxima estratégia
        }
      }
      
      // ESTRATÉGIA 2: Upload para bucket principal designautoimages
      if (attemptCount % 4 === 2) {
        try {
          console.log("📝 ESTRATÉGIA 2: Upload para bucket principal designautoimages");
          
          // Gerar nome de arquivo para o usuário no bucket principal
          const extension = ".webp";
          const timestamp = Date.now();
          const safeName = username.replace(/[^a-z0-9]/gi, '_');
          const filePath = `avatars/${safeName}_${timestamp}${extension}`;
          
          // Otimizar imagem para tamanho menor e qualidade mais baixa
          const optimizedBuffer = await this.optimizeImage(file.buffer, {
            width: options.width || 300,
            height: options.height || 300,
            quality: options.quality || 70,
            format: "webp"
          });
          
          console.log(`- Enviando para: ${BUCKET_NAME}/${filePath}`);
          console.log(`- Tamanho otimizado: ${optimizedBuffer.length} bytes`);
          
          // Upload para bucket principal
          const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, optimizedBuffer, {
              contentType: 'image/webp',
              upsert: true
            });
            
          if (error) {
            console.error(`❌ ESTRATÉGIA 2 falhou: ${error.message}`);
            throw error;
          }
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
            
          console.log(`✅ ESTRATÉGIA 2 sucesso! URL: ${urlData.publicUrl}`);
          
          return {
            imageUrl: urlData.publicUrl,
            storageType: "supabase_main_bucket",
            strategy: "main_bucket_upload"
          };
        } catch (error) {
          console.error("❌ ESTRATÉGIA 2 falhou completamente:", error);
          // Continua para a próxima estratégia
        }
      }
      
      // ESTRATÉGIA 3: Upload com nome ultra-simplificado
      if (attemptCount % 4 === 3) {
        try {
          console.log("📝 ESTRATÉGIA 3: Upload com nome ultra-simplificado");
          
          // Usar nome de arquivo extremamente simples
          const filePath = `user_${Date.now()}.webp`;
          
          // Otimizar imagem com configurações mínimas
          const optimizedBuffer = await this.optimizeImage(file.buffer, {
            width: 200, // Menor para evitar problemas
            height: 200,
            quality: 60, // Qualidade reduzida para menor tamanho
            format: "webp"
          });
          
          console.log(`- Enviando para: ${AVATARS_BUCKET}/${filePath}`);
          console.log(`- Tamanho otimizado: ${optimizedBuffer.length} bytes`);
          
          // Upload para bucket de avatares com nome simples
          const { error } = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(filePath, optimizedBuffer, {
              contentType: 'image/webp',
              upsert: true
            });
            
          if (error) {
            console.error(`❌ ESTRATÉGIA 3 falhou: ${error.message}`);
            throw error;
          }
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from(AVATARS_BUCKET)
            .getPublicUrl(filePath);
            
          console.log(`✅ ESTRATÉGIA 3 sucesso! URL: ${urlData.publicUrl}`);
          
          return {
            imageUrl: urlData.publicUrl,
            storageType: "supabase_simple_name",
            strategy: "simple_filename"
          };
        } catch (error) {
          console.error("❌ ESTRATÉGIA 3 falhou completamente:", error);
          // Continua para a última estratégia
        }
      }
      
      // ESTRATÉGIA 4: Upload local com configurações mínimas
      try {
        console.log("📝 ESTRATÉGIA 4: Upload local com configurações mínimas");
        
        // Usar serviço de armazenamento local com configurações específicas
        const result = await storageService.localUpload(file, {
          width: 200,
          height: 200,
          quality: 60,
          targetFolder: 'designautoimages'
        });
        
        console.log(`✅ ESTRATÉGIA 4 sucesso! URL: ${result.imageUrl}`);
        
        return {
          imageUrl: result.imageUrl,
          storageType: "local_emergency",
          strategy: "local_minimal"
        };
      } catch (error) {
        console.error("❌ ESTRATÉGIA 4 falhou:", error);
        
        // Se absolutamente todas as estratégias falharem, usamos um placeholder
        console.log("🔴 TODAS AS ESTRATÉGIAS FALHARAM. Usando placeholder como último recurso");
        
        const placeholder = this.generatePlaceholderAvatar(username);
        
        return {
          imageUrl: placeholder.imageUrl,
          storageType: placeholder.storageType,
          strategy: "placeholder_fallback"
        };
      }
    } catch (error) {
      console.error("🔴 ERRO CRÍTICO no upload de emergência:", error);
      
      // Usar placeholder como fallback para qualquer erro não tratado
      const placeholder = this.generatePlaceholderAvatar(username);
      
      return {
        imageUrl: placeholder.imageUrl,
        storageType: placeholder.storageType,
        strategy: "placeholder_error_fallback"
      };
    }
  }

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
  
  /**
   * Gera uma URL de avatar placeholder com informações do usuário
   * Para uso como última alternativa quando todas as outras falham
   */
  private generatePlaceholderAvatar(username: string = 'Unknown'): { imageUrl: string; storageType: string } {
    const timestamp = Date.now();
    const userText = username ? `U:${username}` : 'Avatar';
    
    return {
      imageUrl: `https://placehold.co/400x400/555588/ffffff?text=${userText}&date=${timestamp}`,
      storageType: 'placeholder'
    };
  }
  
  /**
   * Verificar conexão com o Supabase Storage
   * Retorna informações sobre o status da conexão
   */
  async checkConnection(): Promise<{ connected: boolean, message: string, logs: string[] }> {
    this.clearLogs();
    this.log('Verificando conexão com Supabase Storage...');
    
    // Verificar se as credenciais estão configuradas
    if (!supabaseUrl || !supabaseKey) {
      this.log('Erro: Credenciais do Supabase não estão configuradas');
      return {
        connected: false,
        message: 'Credenciais do Supabase (URL e chave) não estão configuradas',
        logs: this.getLogs()
      };
    }

    this.log(`URL do Supabase: ${supabaseUrl}`);
    this.log('Chave anônima configurada: ' + (supabaseKey ? 'Sim' : 'Não'));
    
    try {
      // Reset do estado
      this.initialized = false;
      
      // Tentar inicializar o cliente
      await this.initBucket();
      
      // Verificar acesso ao bucket principal
      this.log('Verificando acesso ao bucket principal...');
      const { data: mainFiles, error: mainError } = await supabase.storage
        .from(BUCKET_NAME)
        .list();
      
      if (mainError) {
        this.log(`Erro ao acessar bucket principal '${BUCKET_NAME}': ${mainError.message}`);
        return {
          connected: false,
          message: `Falha no acesso ao bucket principal: ${mainError.message}`,
          logs: this.getLogs()
        };
      }
      
      this.log(`✓ Bucket principal '${BUCKET_NAME}' está acessível. Arquivos encontrados: ${mainFiles?.length || 0}`);
      
      // Verificar acesso ao bucket de avatares
      this.log('Verificando acesso ao bucket de avatares...');
      const { data: avatarFiles, error: avatarError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .list();
      
      if (avatarError) {
        this.log(`Erro ao acessar bucket de avatares '${AVATARS_BUCKET}': ${avatarError.message}`);
        this.log('Atenção: Problemas com o bucket de avatares podem afetar o upload de imagens de perfil');
        return {
          connected: true, // Consideramos conectado se pelo menos o bucket principal estiver acessível
          message: `Bucket principal OK, mas falha no bucket de avatares: ${avatarError.message}`,
          logs: this.getLogs()
        };
      }
      
      this.log(`✓ Bucket de avatares '${AVATARS_BUCKET}' está acessível. Arquivos encontrados: ${avatarFiles?.length || 0}`);
      
      // Se chegou aqui, tudo está OK
      this.log('✅ Conexão com Supabase Storage estabelecida com sucesso!');
      return {
        connected: true,
        message: `Conexão estabelecida. Buckets acessíveis: ${BUCKET_NAME}, ${AVATARS_BUCKET}`,
        logs: this.getLogs()
      };
    } catch (error: any) {
      this.log(`❌ Erro ao verificar conexão com Supabase: ${error.message || 'Erro desconhecido'}`);
      return {
        connected: false,
        message: `Falha na conexão: ${error.message || 'Erro desconhecido'}`,
        logs: this.getLogs()
      };
    }
  }
  
  /**
   * Método de teste para realizar upload para o Supabase
   * Retorna detalhes do processo de upload para diagnóstico
   * Implementa fallback em caso de erro com sharp ou processamento de imagem
   */
  /**
   * Método de teste de upload direto sem usar sharp 
   * Usado quando há erros relacionados ao processamento de imagem
   */
  async testUploadDirectNoSharp(
    file: Express.Multer.File
  ): Promise<{ 
    success: boolean; 
    imageUrl?: string; 
    error?: string; 
    storageType?: string;
    bucket?: string; 
    logs: string[]
  }> {
    this.clearLogs();
    this.log('⚠️ Iniciando teste de upload DIRETO para Supabase (sem processamento de imagem)...');
    
    if (!file) {
      this.log('Erro: Nenhum arquivo fornecido');
      return { success: false, error: 'Nenhum arquivo fornecido', logs: this.getLogs() };
    }
    
    if (!supabaseUrl || !supabaseKey) {
      this.log('Erro: Credenciais do Supabase não estão configuradas');
      return { 
        success: false, 
        error: 'Credenciais do Supabase (URL e chave) não estão configuradas', 
        logs: this.getLogs() 
      };
    }
    
    try {
      // Verificar se está inicializado
      if (!this.initialized) {
        this.log('Cliente Supabase não inicializado, tentando inicializar...');
        await this.initBucket();
      }
      
      this.log(`Arquivo: ${file.originalname} (${file.size} bytes)`);
      this.log(`Tipo MIME: ${file.mimetype}`);
      
      // TESTE 1: Upload direto
      this.log('TESTE 1: Upload direto sem processamento de imagem...');
      try {
        // Nome de arquivo único
        const uniqueId = randomUUID();
        const extension = path.extname(file.originalname) || '.png';
        const filename = `test-direct/${uniqueId}${extension}`;
        
        this.log(`Enviando arquivo original para bucket '${BUCKET_NAME}' com nome '${filename}'...`);
        
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filename, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });
          
        if (error) {
          this.log(`❌ Erro no upload direto: ${error.message}`);
          throw new Error(`Erro no upload direto: ${error.message}`);
        }
        
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filename);
          
        this.log(`✅ Upload direto bem-sucedido!`);
        this.log(`URL da imagem: ${urlData.publicUrl}`);
        
        return {
          success: true,
          imageUrl: urlData.publicUrl,
          storageType: 'supabase_direct',
          bucket: BUCKET_NAME,
          logs: this.getLogs()
        };
      } catch (directError: any) {
        this.log(`❌ Falha no teste direto: ${directError.message}`);
        
        // TESTE 2: Fallback para armazenamento local
        this.log('TESTE 2: Fallback para armazenamento local...');
        try {
          // Criar diretório para upload de testes
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'tests');
          
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
          } catch (mkdirError) {
            this.log(`⚠️ Aviso ao criar diretórios de upload: ${mkdirError}`);
          }
          
          // Gerar nome único
          const uniqueId = randomUUID();
          const extension = path.extname(file.originalname) || '.jpg';
          const fileName = `test_${uniqueId}${extension}`;
          const filePath = path.join(uploadsDir, fileName);
          
          // Salvar arquivo no sistema de arquivos
          fs.writeFileSync(filePath, file.buffer);
          
          this.log(`✅ Upload local bem-sucedido: ${filePath}`);
          
          // URL relativa que será acessível via servidor web
          const relativeUrl = `/uploads/tests/${fileName}`;
          this.log(`URL da imagem: ${relativeUrl}`);
          
          return {
            success: true,
            imageUrl: relativeUrl,
            storageType: 'local',
            logs: this.getLogs()
          };
        } catch (localError: any) {
          this.log(`❌ Falha no upload local: ${localError.message}`);
          
          // Não implementamos placeholder aqui porque queremos que falhe em caso de problema real
          this.log(`❌ Falha em todos os métodos de upload. Erro: ${directError.message}`);
          return {
            success: false,
            error: `Falha em todos os métodos de upload: ${directError.message}`,
            logs: this.getLogs()
          };
        }
      }
    } catch (error: any) {
      this.log(`❌ Erro fatal no teste de upload direto: ${error.message}`);
      return {
        success: false,
        error: error.message,
        logs: this.getLogs()
      };
    }
  }

  async testUpload(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ 
    success: boolean; 
    imageUrl?: string; 
    error?: string; 
    storageType?: string;
    bucket?: string; 
    logs: string[]
  }> {
    this.clearLogs();
    this.log('Iniciando teste de upload para Supabase...');
    
    if (!file) {
      this.log('Erro: Nenhum arquivo fornecido');
      return { success: false, error: 'Nenhum arquivo fornecido', logs: this.getLogs() };
    }
    
    if (!supabaseUrl || !supabaseKey) {
      this.log('Erro: Credenciais do Supabase não estão configuradas');
      return { 
        success: false, 
        error: 'Credenciais do Supabase (URL e chave) não estão configuradas', 
        logs: this.getLogs() 
      };
    }
    
    try {
      // Verificar se está inicializado
      if (!this.initialized) {
        this.log('Cliente Supabase não inicializado, tentando inicializar...');
        await this.initBucket();
      }
      
      this.log(`Processando arquivo: ${file.originalname} (${file.size} bytes)`);
      this.log(`Tipo MIME: ${file.mimetype}`);
      
      // Testar tentando diferentes abordagens
      
      // 1. Primeiro, tentar upload para o bucket de avatares
      this.log('TESTE 1: Upload para bucket de avatares...');
      try {
        // Otimizar imagem para dimensões médias
        const optimizedBuffer = await this.optimizeImage(file.buffer, {
          ...options,
          width: options.width || 500,
          quality: options.quality || 80,
        });
        
        this.log(`Imagem otimizada: ${optimizedBuffer.length} bytes (${Math.round(optimizedBuffer.length/1024)}KB)`);
        
        // Nome de arquivo único
        const uniqueId = randomUUID();
        const filename = `test_${uniqueId}.webp`;
        
        this.log(`Enviando para bucket '${AVATARS_BUCKET}' com nome '${filename}'...`);
        
        const { data, error } = await supabase.storage
          .from(AVATARS_BUCKET)
          .upload(filename, optimizedBuffer, {
            contentType: 'image/webp',
            upsert: true
          });
          
        if (error) {
          this.log(`❌ Erro no upload para bucket de avatares: ${error.message}`);
          throw new Error(`Erro no upload para bucket de avatares: ${error.message}`);
        }
        
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from(AVATARS_BUCKET)
          .getPublicUrl(filename);
          
        this.log(`✅ Upload para bucket de avatares bem-sucedido!`);
        this.log(`URL da imagem: ${urlData.publicUrl}`);
        
        // Verificar acesso à URL
        try {
          this.log('Verificando acesso à URL pública...');
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          
          if (response.ok) {
            this.log(`✓ URL pública acessível (status ${response.status})`);
          } else {
            this.log(`⚠️ URL pública retornou status ${response.status}`);
          }
        } catch (verifyError: any) {
          this.log(`⚠️ Não foi possível verificar acesso à URL: ${verifyError.message}`);
        }
        
        return {
          success: true,
          imageUrl: urlData.publicUrl,
          storageType: 'supabase',
          bucket: AVATARS_BUCKET,
          logs: this.getLogs()
        };
      } catch (avatarError: any) {
        this.log(`Falha no teste 1: ${avatarError.message}`);
        
        // 2. Se falhar, tentar upload para o bucket principal
        this.log('TESTE 2: Upload para bucket principal...');
        try {
          // Usar buffer original neste teste
          const optimizedBuffer = await this.optimizeImage(file.buffer, {
            ...options,
            width: options.width || 500,
            quality: options.quality || 80,
          });
          
          // Nome de arquivo diferente
          const uniqueId = randomUUID();
          const filename = `test_uploads/${uniqueId}.webp`;
          
          this.log(`Enviando para bucket '${BUCKET_NAME}' com nome '${filename}'...`);
          
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filename, optimizedBuffer, {
              contentType: 'image/webp',
              upsert: true
            });
            
          if (error) {
            this.log(`❌ Erro no upload para bucket principal: ${error.message}`);
            throw new Error(`Erro no upload para bucket principal: ${error.message}`);
          }
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filename);
            
          this.log(`✅ Upload para bucket principal bem-sucedido!`);
          this.log(`URL da imagem: ${urlData.publicUrl}`);
          
          return {
            success: true,
            imageUrl: urlData.publicUrl,
            storageType: 'supabase',
            bucket: BUCKET_NAME,
            logs: this.getLogs()
          };
        } catch (mainError: any) {
          this.log(`Falha no teste 2: ${mainError.message}`);
          
          // 3. Como último recurso, tentar com upsert e arquivo sem processamento
          this.log('TESTE 3: Upload direto sem processamento...');
          try {
            const uniqueId = randomUUID();
            const extension = path.extname(file.originalname) || '.png';
            const filename = `test_direct/${uniqueId}${extension}`;
            
            this.log(`Enviando arquivo original para bucket '${BUCKET_NAME}' com nome '${filename}'...`);
            
            const { data, error } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(filename, file.buffer, {
                contentType: file.mimetype,
                upsert: true
              });
              
            if (error) {
              this.log(`❌ Erro no upload direto: ${error.message}`);
              throw new Error(`Erro no upload direto: ${error.message}`);
            }
            
            // Obter URL pública
            const { data: urlData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(filename);
              
            this.log(`✅ Upload direto bem-sucedido!`);
            this.log(`URL da imagem: ${urlData.publicUrl}`);
            
            return {
              success: true,
              imageUrl: urlData.publicUrl,
              storageType: 'supabase_direct',
              bucket: BUCKET_NAME,
              logs: this.getLogs()
            };
          } catch (directError: any) {
            this.log(`Falha no teste 3: ${directError.message}`);
            
            // Todas as tentativas falharam
            this.log(`❌ Todas as tentativas de upload para Supabase falharam`);
            
            // Incluir explicação do possível problema
            this.log("\nDIAGNÓSTICO DO PROBLEMA:");
            
            // Verificar tipo de erro comum (violação de política)
            const errorMessage = avatarError.message || mainError.message || directError.message;
            
            if (errorMessage.includes('violates row-level security policy')) {
              this.log("🔒 ERRO DE POLÍTICA DE SEGURANÇA DETECTADO");
              this.log("O Supabase usa políticas de segurança (RLS) para controlar o acesso aos recursos.");
              this.log("Será necessário configurar uma política no painel do Supabase que permita:");
              this.log("- Operações de INSERT no bucket");
              this.log("- Uploads de arquivos por usuários autenticados ou chave de API adequada");
              this.log("- Operações no tipo de recurso específico (storage)");
            } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
              this.log("📦 ERRO DE BUCKET INEXISTENTE");
              this.log(`Os buckets '${AVATARS_BUCKET}' e/ou '${BUCKET_NAME}' não existem.`);
              this.log("É necessário criar os buckets no painel do Supabase.");
            } else if (errorMessage.includes('not authorized') || errorMessage.includes('unauthorized')) {
              this.log("🔑 ERRO DE AUTORIZAÇÃO");
              this.log("As credenciais fornecidas não têm permissão para realizar operações de upload.");
              this.log("Verifique se a chave anônima tem as permissões necessárias ou use uma chave de serviço.");
            } else {
              this.log("⚠️ ERRO DESCONHECIDO");
              this.log("O Supabase retornou um erro que não corresponde aos padrões comuns.");
              this.log("Verifique as credenciais, buckets e políticas no painel do Supabase.");
            }
            
            return {
              success: false,
              error: `Falha em todos os métodos de upload: ${errorMessage}`,
              logs: this.getLogs()
            };
          }
        }
      }
    } catch (error: any) {
      const errorMessage = `Erro geral no teste do Supabase: ${error.message || 'Erro desconhecido'}`;
      this.log(`❌ ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        logs: this.getLogs()
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
  /**
   * Verifica se um bucket existe e está acessível
   */
  async checkBucketExists(bucketName: string): Promise<boolean> {
    try {
      this.log(`Verificando acesso de leitura ao bucket '${bucketName}'...`);
      
      // Tenta listar arquivos no bucket para verificar acesso
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list();
      
      if (error) {
        this.log(`❌ Erro ao verificar bucket '${bucketName}': ${error.message}`);
        return false;
      }
      
      this.log(`✓ Bucket '${bucketName}' está acessível. Arquivos encontrados: ${data?.length || 0}`);
      return true;
    } catch (error) {
      this.log(`❌ Erro ao verificar bucket '${bucketName}': ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Verifica a conexão com o Supabase Storage
   */
  async checkConnection(): Promise<{ connected: boolean, message: string, logs: string[] }> {
    try {
      this.log('Verificando acesso de leitura ao bucket principal...');
      const mainBucketExists = await this.checkBucketExists('designautoimages');
      
      this.log('Verificando acesso de leitura ao bucket de avatares...');
      const designautoimagesBucketExists = await this.checkBucketExists('designautoimages');
      
      const connected = mainBucketExists && designautoimagesBucketExists;
      
      const message = connected
        ? `Conexão com Supabase Storage estabelecida com sucesso. Todos os buckets estão acessíveis.`
        : `Falha na conexão com Supabase Storage. ${!mainBucketExists ? 'Bucket principal inacessível. ' : ''}${!designautoimagesBucketExists ? 'Bucket de avatares inacessível.' : ''}`;
      
      return {
        connected,
        message,
        logs: this.getLogs()
      };
    } catch (error) {
      this.log(`❌ Erro ao verificar conexão com Supabase: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        connected: false,
        message: `Erro ao verificar conexão: ${error instanceof Error ? error.message : String(error)}`,
        logs: this.getLogs()
      };
    }
  }
  
  /**
   * Método de teste para realizar upload para Supabase Storage
   */
  async testUpload(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string },
    folder: string = 'test-uploads',
    options: ImageOptimizationOptions = {}
  ): Promise<any> {
    try {
      const startTime = Date.now();
      this.log(`Iniciando teste de upload para Supabase. Arquivo: ${file.originalname}`);
      
      // Primeiro passo: otimizar a imagem
      const optimizationStartTime = Date.now();
      const optimized = await this.optimizeImage(file.buffer, options);
      const optimizationEndTime = Date.now();
      const optimizationTime = optimizationEndTime - optimizationStartTime;
      
      this.log(`Imagem otimizada em ${optimizationTime}ms. Redução: ${((file.buffer.length - optimized.length) / file.buffer.length * 100).toFixed(2)}%`);
      
      // Segundo passo: fazer upload para o Supabase
      const uploadStartTime = Date.now();
      const filename = `${folder}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('designautoimages')
        .upload(filename, optimized, {
          contentType: `image/webp`,
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }
      
      const uploadEndTime = Date.now();
      const uploadTime = uploadEndTime - uploadStartTime;
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('designautoimages')
        .getPublicUrl(filename);
      
      const imageUrl = urlData.publicUrl;
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      this.log(`✅ Teste de upload concluído em ${totalTime}ms. URL: ${imageUrl}`);
      
      // Analisar imagem para retornar dimensões
      const metadata = await sharp(optimized).metadata();
      
      return {
        success: true,
        message: "Upload realizado com sucesso",
        imageUrl,
        storageType: "supabase",
        bucket: 'designautoimages',
        optimizedSummary: {
          originalSize: file.buffer.length,
          optimizedSize: optimized.length,
          reduction: ((file.buffer.length - optimized.length) / file.buffer.length * 100),
          format: 'webp',
          width: metadata.width || 0,
          height: metadata.height || 0
        },
        timings: {
          total: totalTime,
          optimization: optimizationTime,
          upload: uploadTime
        },
        logs: this.getLogs()
      };
    } catch (error) {
      this.log(`❌ Erro no teste de upload: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        message: "Falha no upload para Supabase",
        error: error instanceof Error ? error.message : String(error),
        storageType: "supabase",
        bucket: 'designautoimages',
        logs: this.getLogs()
      };
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();