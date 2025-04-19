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

      // Verificamos primeiro se podemos acessar o bucket 'avatars'
      // Mesmo sem poder listá-lo na API
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

      // Gera nome de arquivo único
      const uuid = randomUUID();
      const avatarPath = `${uuid}.webp`;
      const mainBucketPath = `avatars/${uuid}.webp`; // Caminho para o bucket principal
      console.log(`Nome de arquivo para upload: ${avatarPath}`);

      let uploadSuccess = false;
      let publicUrl = '';
      
      // Primeiro tenta no bucket 'avatars' se conseguir acessá-lo
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
            
            console.log(`URL pública gerada (bucket avatars): ${publicUrl}`);
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
   * Método de upload de emergência para usuários com problemas persistentes
   * Tenta múltiplas estratégias e oferece um fallback local garantido
   */
  async emergencyAvatarUpload(
    file: Express.Multer.File,
    username: string,
    options: ImageOptimizationOptions = {}
  ): Promise<{ imageUrl: string; storageType: string; strategy: string }> {
    if (!file) {
      throw new Error("Nenhum arquivo foi fornecido para upload de emergência");
    }

    console.log("🚨 INICIANDO PROTOCOLO DE UPLOAD DE EMERGÊNCIA 🚨");
    console.log(`Usuário: ${username}`);
    console.log(`Arquivo: ${file.originalname} (${file.size} bytes)`);
    console.log("Tentando estratégias alternativas de upload...");
    
    const strategies = [
      { name: 'avatar_bucket', description: 'Upload para bucket específico de avatares' },
      { name: 'main_bucket_avatar_path', description: 'Upload para pasta /avatars no bucket principal' },
      { name: 'main_bucket_root', description: 'Upload direto para raiz do bucket principal' },
      { name: 'local_emergency', description: 'Upload para sistema de arquivos local' }
    ];
    
    // Tentar cada estratégia em ordem
    for (const strategy of strategies) {
      try {
        console.log(`\n>> TENTANDO ESTRATÉGIA: ${strategy.name} - ${strategy.description}`);
        
        let result;
        
        if (strategy.name === 'avatar_bucket') {
          // Estratégia 1: Bucket de avatares específico
          console.log("Preparando upload para bucket de avatares...");
          
          // Verificar se temos acesso ao bucket
          try {
            const { data } = await this.getBucket(AVATARS_BUCKET);
            console.log(`Acesso ao bucket '${AVATARS_BUCKET}' confirmado.`);
          } catch (accessError) {
            console.error(`Sem acesso ao bucket de avatares:`, accessError);
            throw new Error("Sem acesso ao bucket de avatares");
          }
          
          // Processar imagem
          const optimizedBuffer = await this.optimizeImage(file.buffer, {
            width: options.width || 400,
            height: options.height || 400,
            quality: options.quality || 85,
            format: "webp"
          });
          
          // Gerar nome único
          const uniqueId = randomUUID();
          const avatarPath = `emergency_${username}_${uniqueId}.webp`;
          
          // Fazer upload
          const { data, error } = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(avatarPath, optimizedBuffer, {
              contentType: 'image/webp',
              upsert: true
            });
            
          if (error) throw error;
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from(AVATARS_BUCKET)
            .getPublicUrl(avatarPath);
            
          result = {
            imageUrl: urlData.publicUrl,
            storageType: 'supabase_avatar_emergency',
            strategy: 'avatar_bucket'
          };
        } 
        else if (strategy.name === 'main_bucket_avatar_path') {
          // Estratégia 2: Pasta avatars no bucket principal
          console.log("Preparando upload para pasta avatars no bucket principal...");
          
          // Verificar acesso
          try {
            const { data } = await this.getBucket(BUCKET_NAME);
            console.log(`Acesso ao bucket principal '${BUCKET_NAME}' confirmado.`);
          } catch (accessError) {
            console.error(`Sem acesso ao bucket principal:`, accessError);
            throw new Error("Sem acesso ao bucket principal");
          }
          
          // Processar imagem
          const optimizedBuffer = await this.optimizeImage(file.buffer, {
            width: options.width || 400,
            height: options.height || 400,
            quality: options.quality || 85,
            format: "webp"
          });
          
          // Gerar nome único
          const uniqueId = randomUUID();
          const avatarPath = `avatars/emergency_${username}_${uniqueId}.webp`;
          
          // Fazer upload
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(avatarPath, optimizedBuffer, {
              contentType: 'image/webp',
              upsert: true
            });
            
          if (error) throw error;
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(avatarPath);
            
          result = {
            imageUrl: urlData.publicUrl,
            storageType: 'supabase_main_bucket_avatars_path',
            strategy: 'main_bucket_avatar_path'
          };
        }
        else if (strategy.name === 'main_bucket_root') {
          // Estratégia 3: Raiz do bucket principal
          console.log("Preparando upload direto para raiz do bucket principal...");
          
          // Usar upload direto sem otimização
          // Apenas formatar o nome do arquivo
          const uniqueId = randomUUID();
          const filePath = `emergency_avatar_root_${username}_${uniqueId}`;
          
          // Fazer upload
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: true
            });
            
          if (error) throw error;
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
            
          result = {
            imageUrl: urlData.publicUrl,
            storageType: 'supabase_main_bucket_root',
            strategy: 'main_bucket_root'
          };
        }
        else {
          // Estratégia 4: Armazenamento local (fallback garantido)
          console.log("Usando armazenamento local emergencial...");
          
          // Diretório específico para emergências
          const emergencyDir = path.join(process.cwd(), 'public', 'uploads', 'emergency');
          
          // Garantir que os diretórios existem
          try {
            if (!fs.existsSync('public')) {
              fs.mkdirSync('public', { recursive: true });
            }
            if (!fs.existsSync(path.join('public', 'uploads'))) {
              fs.mkdirSync(path.join('public', 'uploads'), { recursive: true });
            }
            if (!fs.existsSync(emergencyDir)) {
              fs.mkdirSync(emergencyDir, { recursive: true });
            }
          } catch (dirError) {
            console.error("Erro ao criar diretórios:", dirError);
            throw new Error("Não foi possível criar diretórios para armazenamento local");
          }
          
          // Processar imagem localmente
          let processedBuffer;
          try {
            processedBuffer = await sharp(file.buffer)
              .resize({
                width: options.width || 400,
                height: options.height || 400,
                fit: 'cover'
              })
              .webp({ quality: options.quality || 85 })
              .toBuffer();
          } catch (sharpError) {
            console.error("Erro ao processar imagem com sharp:", sharpError);
            // Usar buffer original se falhar o processamento
            processedBuffer = file.buffer;
          }
          
          // Gerar nome de arquivo único
          const timestamp = Date.now();
          const filename = `emergency_${username}_${timestamp}.webp`;
          const filePath = path.join(emergencyDir, filename);
          
          // Salvar arquivo
          fs.writeFileSync(filePath, processedBuffer);
          
          // URL relativa para acesso
          const publicUrl = `/uploads/emergency/${filename}`;
          
          result = {
            imageUrl: publicUrl,
            storageType: 'local_emergency',
            strategy: 'local_emergency'
          };
        }
        
        console.log(`✓ UPLOAD BEM-SUCEDIDO COM ESTRATÉGIA: ${strategy.name}`);
        console.log(`URL gerada: ${result.imageUrl}`);
        console.log(`Tipo de armazenamento: ${result.storageType}`);
        
        return result;
      } catch (error) {
        console.error(`❌ FALHA NA ESTRATÉGIA ${strategy.name}:`, error);
      }
    }
    
    // Se todas as estratégias falharem, retornar um avatar padrão como último recurso
    console.error("⚠️ TODAS AS ESTRATÉGIAS DE UPLOAD FALHARAM!");
    
    // Usar um avatar padrão com timestamp para evitar problemas de cache
    const timestamp = Date.now();
    return {
      imageUrl: `https://placehold.co/400x400/555588/ffffff?text=U:${username}&date=${timestamp}`,
      storageType: 'external_fallback',
      strategy: 'placeholder'
    };
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