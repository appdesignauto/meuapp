import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Avatar storage settings
const AVATAR_BUCKET_NAME = 'avatars';

// Configurações para Cloudflare R2
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'designauto-images';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-a063592364ea4478870d95c9c4115c4a.r2.dev';

// Certifique-se de que o endpoint esteja no formato correto
const accountId = process.env.R2_ENDPOINT || '0f7a409b79bd29f7cf3970f077da05ee';
const R2_ENDPOINT = `https://${accountId.replace('https://', '').replace('.r2.dev', '')}.r2.dev`;

// Formato do nome de conta extraído do endpoint
const ACCOUNT_ID = R2_ENDPOINT.split('https://')[1].split('.r2.dev')[0];

// Log de inicialização para verificar credenciais
console.log("Detalhes das credenciais do R2:");
console.log(`- R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID?.length} caracteres`);
console.log(`- R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY?.length} caracteres`);
console.log(`- R2_ENDPOINT: ${ACCOUNT_ID}`);
console.log(`- R2_BUCKET_NAME: ${BUCKET_NAME}`);
console.log(`- R2_PUBLIC_URL: ${PUBLIC_URL}`);

console.log("Iniciando upload para R2...");
console.log(`Usando endpoint fixo do R2: ${R2_ENDPOINT}`);
console.log(`Account ID do R2: ${ACCOUNT_ID}`);

// Inicializar o cliente S3 para R2
const R2_CLIENT = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Necessário para serviços S3-compatíveis como R2
  // Configurações específicas para o node.js
  requestHandler: {
    connectionTimeout: 30000, // aumentar timeout para 30 segundos
    keepAlive: true, // manter conexão viva
  }
});

// Log para confirmar as credenciais processadas
console.log("Credenciais R2 processadas:");
console.log(`- Access Key: ${process.env.R2_ACCESS_KEY_ID?.substring(0, 4)}...${process.env.R2_ACCESS_KEY_ID?.substring(process.env.R2_ACCESS_KEY_ID.length - 4)} (length: ${process.env.R2_ACCESS_KEY_ID?.length})`);
console.log(`- Secret Key: ${process.env.R2_SECRET_ACCESS_KEY?.substring(0, 4)}...${process.env.R2_SECRET_ACCESS_KEY?.substring(process.env.R2_SECRET_ACCESS_KEY.length - 4)} (length: ${process.env.R2_SECRET_ACCESS_KEY?.length})`);
console.log(`- Endpoint: ${R2_ENDPOINT}`);
console.log(`- Bucket: ${BUCKET_NAME}`);
console.log(`- URL Pública: ${PUBLIC_URL}`);

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

class R2StorageService {
  private initialized = false;
  private logs: string[] = [];

  private log(message: string): void {
    console.log(`[R2Storage] ${message}`);
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
    
    // Limitar tamanho do log
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }

  public getLogs(): string[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  constructor() {
    this.log('Serviço R2 inicializado');
  }

  /**
   * Verifica se o bucket existe e está acessível
   */
  async checkBucketExists(bucketName = BUCKET_NAME): Promise<boolean> {
    try {
      this.log(`Verificando existência do bucket: ${bucketName}`);
      
      try {
        // Primeiro método: verificar com ListBucketsCommand
        const { Buckets } = await R2_CLIENT.send(new ListBucketsCommand({}));
        
        const bucketExists = Buckets?.some(bucket => bucket.Name === bucketName) || false;
        
        if (bucketExists) {
          this.log(`✅ Bucket '${bucketName}' encontrado via ListBucketsCommand`);
          return true;
        }
      } catch (listError) {
        this.log(`⚠️ Erro ao listar buckets: ${listError instanceof Error ? listError.message : String(listError)}`);
        
        // Se falhar, tentamos outro método
        try {
          // Segundo método: tentar listar objetos do bucket (método alternativo)
          this.log(`Tentando método alternativo: ListObjectsV2Command para bucket ${bucketName}`);
          
          const command = new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 1 // Apenas para verificar existência
          });
          
          await R2_CLIENT.send(command);
          
          this.log(`✅ Bucket '${bucketName}' encontrado via ListObjectsV2Command`);
          return true;
        } catch (listObjError: any) {
          // Se receber NoSuchBucket, confirma que o bucket não existe
          if (listObjError.name === 'NoSuchBucket') {
            this.log(`❌ Bucket '${bucketName}' não existe`);
            return false;
          }
          
          // Se receber qualquer outro erro (como acesso negado), pode indicar que o bucket existe
          this.log(`⚠️ Erro ao listar objetos, mas bucket pode existir: ${listObjError instanceof Error ? listObjError.message : String(listObjError)}`);
          
          // Vamos assumir que o bucket existe se não for um erro específico de "não existe"
          if (listObjError.$metadata?.httpStatusCode === 403) {
            this.log(`✅ Bucket provavelmente existe, mas acesso foi negado (403)`);
            return true;
          }
        }
      }
      
      this.log(`❌ Não foi possível confirmar existência do bucket '${bucketName}'`);
      return false;
    } catch (error) {
      this.log(`❌ Erro ao verificar bucket: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Lista os objetos em um bucket
   */
  async listObjects(bucketName = BUCKET_NAME, prefix = ''): Promise<{ success: boolean, objects?: any[], error?: string }> {
    try {
      this.log(`Listando objetos no bucket: ${bucketName}, prefix: ${prefix || 'raiz'}`);
      
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix
      });
      
      const response = await R2_CLIENT.send(command);
      
      this.log(`✅ Listagem concluída, encontrados ${response.Contents?.length || 0} objetos`);
      
      return {
        success: true,
        objects: response.Contents
      };
    } catch (error) {
      this.log(`❌ Erro ao listar objetos: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Otimiza uma imagem para upload
   */
  async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<{ buffer: Buffer, width: number, height: number, format: string, originalSize: number, optimizedSize: number }> {
    const startTime = Date.now();
    this.log(`Iniciando otimização de imagem (${buffer.length} bytes)`);
    
    // Analisar informações da imagem original
    const originalSize = buffer.length;
    const metadata = await sharp(buffer).metadata();
    
    // Configurações padrão de otimização
    const width = options.width || metadata.width;
    const height = options.height || metadata.height;
    const format = options.format || 'webp';
    const quality = options.quality || 80;
    
    this.log(`Configurações de otimização: ${width}x${height}, formato: ${format}, qualidade: ${quality}`);
    
    // Processar a imagem
    let optimizedBuffer: Buffer;
    
    if (format === 'webp') {
      optimizedBuffer = await sharp(buffer)
        .resize(width, height)
        .webp({ quality })
        .toBuffer();
    } else if (format === 'jpeg') {
      optimizedBuffer = await sharp(buffer)
        .resize(width, height)
        .jpeg({ quality })
        .toBuffer();
    } else {
      optimizedBuffer = await sharp(buffer)
        .resize(width, height)
        .png({ quality })
        .toBuffer();
    }
    
    const optimizedSize = optimizedBuffer.length;
    const reduction = ((originalSize - optimizedSize) / originalSize) * 100;
    
    const endTime = Date.now();
    this.log(`✅ Otimização concluída em ${endTime - startTime}ms. Redução: ${reduction.toFixed(2)}%`);
    
    return {
      buffer: optimizedBuffer,
      width: width || metadata.width || 0,
      height: height || metadata.height || 0,
      format,
      originalSize,
      optimizedSize
    };
  }

  /**
   * Gera um nome de arquivo único
   */
  private generateFilename(originalFilename: string, isThumb = false): string {
    const uuid = uuidv4();
    const extension = path.extname(originalFilename) || '.jpg';
    const prefix = isThumb ? 'thumb_' : '';
    return `${prefix}${uuid}${extension}`;
  }

  /**
   * Faz upload de uma imagem para o R2
   */
  async uploadImage(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string },
    folder = 'images',
    options: ImageOptimizationOptions = {}
  ): Promise<{ success: boolean; imageUrl?: string; error?: string; timing?: number }> {
    const startTime = Date.now();
    try {
      this.log(`Iniciando upload para R2 - Arquivo: ${file.originalname}, Tamanho: ${file.buffer.length} bytes`);
      
      // Verificar se o bucket existe
      const bucketExists = await this.checkBucketExists();
      if (!bucketExists) {
        this.log('❌ Bucket não existe ou não está acessível');
        return {
          success: false,
          error: 'Bucket não existe ou não está acessível',
          timing: Date.now() - startTime
        };
      }
      
      // Otimizar a imagem
      const optimizationStartTime = Date.now();
      const optimized = await this.optimizeImage(file.buffer, options);
      const optimizationTime = Date.now() - optimizationStartTime;
      
      // Gerar nome de arquivo único
      const filename = this.generateFilename(file.originalname);
      const key = folder ? `${folder}/${filename}` : filename;
      
      // Upload para R2
      const uploadStartTime = Date.now();
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: optimized.buffer,
        ContentType: `image/${optimized.format}`
      });
      
      await R2_CLIENT.send(command);
      const uploadTime = Date.now() - uploadStartTime;
      
      // Construir URL pública
      const imageUrl = `${PUBLIC_URL}/${key}`;
      
      const endTime = Date.now();
      this.log(`✅ Upload concluído em ${endTime - startTime}ms: ${imageUrl}`);
      
      return {
        success: true,
        imageUrl,
        timing: endTime - startTime
      };
    } catch (error) {
      const endTime = Date.now();
      this.log(`❌ Erro no upload: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timing: endTime - startTime
      };
    }
  }

  /**
   * Faz upload de um avatar de usuário para o R2
   */
  async uploadAvatar(
    userId: number,
    buffer: Buffer,
    mimetype: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      this.log(`Iniciando upload de avatar para usuário ${userId}`);
      
      // Verificar se o bucket de avatares existe
      const bucketExists = await this.checkBucketExists(AVATAR_BUCKET_NAME);
      if (!bucketExists) {
        this.log('❌ Bucket de avatares não existe ou não está acessível');
        return {
          success: false,
          error: 'Bucket de avatares não existe ou não está acessível'
        };
      }
      
      // Processar a imagem para garantir tamanho adequado para avatar
      let optimizedBuffer: Buffer;
      try {
        // Redimensionar para um tamanho adequado para avatar (200x200)
        optimizedBuffer = await sharp(buffer)
          .resize(200, 200, { fit: 'cover' })
          .toFormat('webp')
          .toBuffer();
        
        this.log(`Avatar processado: ${buffer.length} bytes -> ${optimizedBuffer.length} bytes`);
      } catch (sharpError) {
        this.log(`❌ Erro ao processar imagem de avatar: ${sharpError instanceof Error ? sharpError.message : String(sharpError)}`);
        
        // Em caso de erro no processamento, usar o buffer original
        optimizedBuffer = buffer;
        this.log('Usando imagem original sem processamento');
      }
      
      // Definir nome de arquivo e chave no bucket
      const key = `avatar-${userId}.webp`;
      
      // Upload para R2
      const command = new PutObjectCommand({
        Bucket: AVATAR_BUCKET_NAME,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/webp'
      });
      
      await R2_CLIENT.send(command);
      
      // Construir URL pública
      const avatarUrl = `${PUBLIC_URL}/${AVATAR_BUCKET_NAME}/${key}`;
      
      this.log(`✅ Upload de avatar concluído: ${avatarUrl}`);
      
      return {
        success: true,
        url: avatarUrl
      };
    } catch (error) {
      this.log(`❌ Erro no upload de avatar: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Exclui uma imagem do R2
   */
  async deleteImage(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.log(`Iniciando exclusão de imagem: ${url}`);
      
      // Extrair a chave do objeto da URL
      const key = url.replace(`${PUBLIC_URL}/`, '');
      
      if (!key || key === url) {
        this.log('❌ URL inválida, não foi possível extrair a chave do objeto');
        return {
          success: false,
          error: 'URL inválida, não foi possível extrair a chave do objeto'
        };
      }
      
      // Excluir o objeto
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      
      await R2_CLIENT.send(command);
      
      this.log(`✅ Imagem excluída com sucesso: ${key}`);
      
      return {
        success: true
      };
    } catch (error) {
      this.log(`❌ Erro ao excluir imagem: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Verifica a conexão com o R2
   */
  async checkConnection(): Promise<{ connected: boolean; message: string; logs: string[] }> {
    try {
      this.log('Iniciando verificação de conexão com R2');
      
      // Verificar credenciais
      if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        this.log('❌ Credenciais R2 não configuradas');
        return {
          connected: false,
          message: 'Credenciais R2 não configuradas',
          logs: this.getLogs()
        };
      }
      
      // Verificar bucket
      const bucketExists = await this.checkBucketExists();
      
      if (!bucketExists) {
        this.log('❌ Bucket não existe ou não está acessível');
        return {
          connected: false,
          message: 'Bucket não existe ou não está acessível',
          logs: this.getLogs()
        };
      }
      
      // Listar objetos para verificar acesso
      const { success, objects, error } = await this.listObjects(BUCKET_NAME);
      
      if (!success) {
        this.log(`❌ Erro ao listar objetos: ${error}`);
        return {
          connected: false,
          message: `Erro ao listar objetos: ${error}`,
          logs: this.getLogs()
        };
      }
      
      this.log(`✅ Conexão R2 estabelecida com sucesso. ${objects?.length || 0} objetos encontrados.`);
      
      return {
        connected: true,
        message: `Conexão estabelecida com sucesso. ${objects?.length || 0} objetos encontrados.`,
        logs: this.getLogs()
      };
    } catch (error) {
      this.log(`❌ Erro ao verificar conexão R2: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        connected: false,
        message: `Erro ao verificar conexão R2: ${error instanceof Error ? error.message : String(error)}`,
        logs: this.getLogs()
      };
    }
  }

  /**
   * Método de teste para realizar upload para R2
   */
  async testUpload(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<any> {
    try {
      const startTime = Date.now();
      this.log(`Iniciando teste de upload. Arquivo: ${file.originalname}, Tamanho: ${file.size} bytes`);
      
      // Primeiro passo: otimizar a imagem
      const optimizationStartTime = Date.now();
      const optimized = await this.optimizeImage(file.buffer, options);
      const optimizationEndTime = Date.now();
      const optimizationTime = optimizationEndTime - optimizationStartTime;
      
      this.log(`Imagem otimizada em ${optimizationTime}ms. Original: ${optimized.originalSize} bytes, Otimizado: ${optimized.optimizedSize} bytes`);
      
      // Segundo passo: fazer upload para o R2
      const uploadStartTime = Date.now();
      const filename = this.generateFilename(file.originalname);
      const key = `test/${filename}`;
      
      try {
        // Método padrão - tentar usando a SDK oficial do S3
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: optimized.buffer,
          ContentType: `image/${optimized.format}`
        });
        
        await R2_CLIENT.send(command);
        const uploadEndTime = Date.now();
        const uploadTime = uploadEndTime - uploadStartTime;
        
        this.log(`Upload realizado em ${uploadTime}ms. Arquivo: ${key}`);
        
        // Construir URL pública
        const imageUrl = `${PUBLIC_URL}/${key}`;
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        this.log(`✅ Teste de upload concluído em ${totalTime}ms. URL: ${imageUrl}`);
        
        return {
          success: true,
          message: "Upload realizado com sucesso",
          imageUrl,
          method: "standard_s3_sdk",
          optimizedSummary: {
            originalSize: optimized.originalSize,
            optimizedSize: optimized.optimizedSize,
            reduction: ((optimized.originalSize - optimized.optimizedSize) / optimized.originalSize) * 100,
            format: optimized.format,
            width: optimized.width,
            height: optimized.height
          },
          timings: {
            total: totalTime,
            optimization: optimizationTime,
            upload: uploadTime
          }
        };
      } catch (uploadError) {
        // Se falhar, tenta o método alternativo
        this.log(`⚠️ Erro no método padrão de upload: ${uploadError.message}. Tentando método alternativo...`);
        return this.testUploadSimulated(file, optimized);
      }
    } catch (error) {
      this.log(`❌ Erro no teste de upload: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        message: "Falha no upload",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Método que simula um upload bem-sucedido (fallback para testes)
   * Este método é usado apenas para permitir o desenvolvimento
   * mesmo quando há problemas de conectividade com o R2
   */
  async testUploadSimulated(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string },
    options: ImageOptimizationOptions = {}
  ): Promise<any> {
    try {
      const startTime = Date.now();
      this.log(`Iniciando simulação de upload para R2 (método fallback)`);
      
      // Se não temos informações de otimização, vamos criar algo padrão
      const originalSize = file.buffer.length;
      const optimized = {
        originalSize,
        optimizedSize: Math.round(originalSize * 0.7), // simulação de redução de 30%
        format: options.format || 'webp',
        width: options.width || 800,
        height: options.height || 600
      };
      
      // Gerar nome de arquivo único para a simulação
      const filename = this.generateFilename(file.originalname);
      const key = `simulated/${filename}`;
      
      // URL de simulação 
      const simulatedUrl = `${PUBLIC_URL}/${key}`;
      
      const endTime = Date.now();
      const simulatedUploadTime = 250; // tempo simulado de upload
      
      this.log(`⚠️ SIMULAÇÃO: Upload simulado para fins de desenvolvimento`);
      this.log(`⚠️ SIMULAÇÃO: URL gerada: ${simulatedUrl} (não contém arquivo real)`);
      
      return {
        success: true,
        message: "Upload simulado realizado com sucesso (FALLBACK)",
        imageUrl: simulatedUrl,
        method: "simulated_fallback",
        simulated: true,
        warning: "Este upload é apenas uma simulação para desenvolvimento. O arquivo não foi realmente enviado.",
        optimizedSummary: {
          originalSize: optimized.originalSize,
          optimizedSize: optimized.optimizedSize,
          reduction: ((optimized.originalSize - optimized.optimizedSize) / optimized.originalSize) * 100,
          format: optimized.format,
          width: optimized.width,
          height: optimized.height
        },
        timings: {
          total: endTime - startTime,
          optimization: 0, // já foi feita antes
          upload: simulatedUploadTime
        }
      };
    } catch (error) {
      this.log(`❌ Erro na simulação de upload: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        message: "Falha na simulação de upload",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Método de teste para upload direto (sem otimização)
   * Similar ao testUploadDirectNoSharp do Supabase
   */
  async testUploadDirect(
    file: Express.Multer.File
  ): Promise<any> {
    this.clearLogs();
    this.log(`⚠️ Iniciando teste de upload DIRETO para R2 (sem processamento de imagem)...`);
    
    if (!file) {
      this.log('Erro: Nenhum arquivo fornecido');
      return { success: false, error: 'Nenhum arquivo fornecido', logs: this.getLogs() };
    }
    
    const startTime = Date.now();
    
    try {
      // Verificar se o bucket existe
      this.log(`Verificando existência do bucket: ${BUCKET_NAME}`);
      const bucketExists = await this.checkBucketExists();
      
      if (!bucketExists) {
        this.log(`❌ Bucket '${BUCKET_NAME}' não existe ou não está acessível`);
        // Cair no fallback simulado
        return this.testUploadSimulated(file);
      }
      
      // Detalhes do arquivo
      this.log(`Arquivo: ${file.originalname} (${file.size} bytes)`);
      this.log(`Tipo MIME: ${file.mimetype}`);
      
      // Gerar um nome de arquivo único
      const uniqueId = uuidv4();
      const extension = path.extname(file.originalname) || '.png';
      const filename = `test-direct/${uniqueId}${extension}`;
      
      this.log(`Preparando upload para chave: ${filename}`);
      
      // Criar comando de upload
      const uploadStartTime = Date.now();
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype
      });
      
      // Enviar o arquivo para o R2
      await R2_CLIENT.send(command);
      const uploadTime = Date.now() - uploadStartTime;
      
      // Construir URL pública
      const imageUrl = `${PUBLIC_URL}/${filename}`;
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      this.log(`✅ Upload direto concluído em ${totalTime}ms. URL: ${imageUrl}`);
      
      return {
        success: true,
        imageUrl,
        message: "Upload direto realizado com sucesso",
        method: "direct_s3_sdk",
        timings: {
          total: totalTime,
          upload: uploadTime
        },
        logs: this.getLogs()
      };
    } catch (error) {
      const endTime = Date.now();
      this.log(`❌ Erro no upload direto: ${error instanceof Error ? error.message : String(error)}`);
      
      // Tentativa de upload simulado como fallback
      this.log(`Tentando método alternativo (simulado) devido ao erro...`);
      return this.testUploadSimulated(file);
    }
  }
}

export const r2StorageService = new R2StorageService();