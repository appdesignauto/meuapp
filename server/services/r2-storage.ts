import { S3Client, PutObjectCommand, HeadBucketCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as sharp from 'sharp';
import * as path from 'path';

const REGION = 'auto';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'designauto';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
const ENDPOINT = process.env.R2_ENDPOINT || '';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';

// Interface para opções de otimização de imagem
interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export class R2StorageService {
  private client: S3Client | null = null;
  private connected: boolean = false;
  private connectionError: string | null = null;
  private logs: string[] = [];

  constructor() {
    this.initializeClient();
  }

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    this.logs.push(logMessage);
    console.log(`[R2] ${message}`);
  }

  // Obter todos os logs armazenados
  public getLogs(): string[] {
    return [...this.logs];
  }

  // Limpar logs
  public clearLogs() {
    this.logs = [];
  }

  // Inicializar o cliente R2
  private async initializeClient() {
    try {
      this.log('Inicializando cliente R2...');

      // Validar credenciais
      if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
        this.connectionError = 'Credenciais R2 não configuradas (R2_ACCESS_KEY_ID e/ou R2_SECRET_ACCESS_KEY)';
        this.log(`Erro: ${this.connectionError}`);
        this.connected = false;
        return;
      }

      if (!ENDPOINT) {
        this.connectionError = 'Endpoint R2 não configurado (R2_ENDPOINT)';
        this.log(`Erro: ${this.connectionError}`);
        this.connected = false;
        return;
      }

      // Criando o cliente R2
      const endpointUrl = ENDPOINT.startsWith('http') 
        ? ENDPOINT 
        : `https://${ENDPOINT}`;

      this.client = new S3Client({
        region: REGION,
        endpoint: endpointUrl,
        credentials: {
          accessKeyId: ACCESS_KEY_ID,
          secretAccessKey: SECRET_ACCESS_KEY,
        },
      });

      this.log(`Cliente R2 configurado com endpoint: ${endpointUrl}`);
      this.log(`Bucket configurado: ${BUCKET_NAME}`);
      
      // Verificar se o bucket existe
      try {
        this.log('Verificando acesso ao bucket...');
        const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
        await this.client.send(command);
        
        this.log('✓ Bucket existe e está acessível');
        this.connected = true;
        this.connectionError = null;
      } catch (error: any) {
        this.connectionError = `Erro ao acessar bucket: ${error.message || 'Erro desconhecido'}`;
        this.log(`Erro: ${this.connectionError}`);
        this.connected = false;
      }
    } catch (error: any) {
      this.connectionError = `Erro ao inicializar cliente R2: ${error.message || 'Erro desconhecido'}`;
      this.log(`Erro: ${this.connectionError}`);
      this.connected = false;
    }
  }

  // Verificar conexão com o R2
  public async checkConnection(): Promise<{ connected: boolean, message: string, logs: string[] }> {
    this.clearLogs();
    this.log('Verificando conexão com Cloudflare R2...');

    if (!this.client) {
      await this.initializeClient();
    }

    if (!this.connected) {
      this.log(`Conexão com R2 falhou: ${this.connectionError || 'Erro desconhecido'}`);
      return { 
        connected: false, 
        message: this.connectionError || 'Não foi possível estabelecer conexão com o R2', 
        logs: this.getLogs() 
      };
    }

    try {
      // Listar objetos para testar conexão
      this.log('Testando conexão listando objetos...');
      const command = new ListObjectsCommand({ 
        Bucket: BUCKET_NAME,
        MaxKeys: 1
      });
      
      const response = await this.client.send(command);
      
      const count = response.Contents?.length || 0;
      this.log(`✓ Conexão com R2 estabelecida com sucesso! Objetos encontrados: ${count}`);
      
      return { 
        connected: true, 
        message: `Conexão estabelecida. Objetos no bucket: ${count}`, 
        logs: this.getLogs() 
      };
    } catch (error: any) {
      const errorMessage = `Erro ao listar objetos no bucket: ${error.message || 'Erro desconhecido'}`;
      this.log(`Erro: ${errorMessage}`);
      
      return { 
        connected: false, 
        message: errorMessage, 
        logs: this.getLogs() 
      };
    }
  }

  // Otimiza uma imagem antes de fazer upload
  private async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<Buffer> {
    const {
      width,
      height,
      quality = 80,
      format = "webp",
    } = options;

    this.log(`Otimizando imagem... ${width ? `Width: ${width}px, ` : ''}${height ? `Height: ${height}px, ` : ''}Quality: ${quality}, Format: ${format}`);

    // Configura o processamento com sharp
    let sharpInstance = sharp.default(buffer);
    
    // Redimensiona se width ou height forem fornecidos
    if (width || height) {
      sharpInstance = sharpInstance.resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Converte e otimiza para o formato selecionado
    try {
      let outputBuffer: Buffer;
      
      if (format === "webp") {
        outputBuffer = await sharpInstance.webp({ quality }).toBuffer();
      } else if (format === "jpeg") {
        outputBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
      } else {
        outputBuffer = await sharpInstance.png({ quality }).toBuffer();
      }
      
      this.log(`Imagem otimizada: ${buffer.length} bytes -> ${outputBuffer.length} bytes (${(outputBuffer.length / 1024).toFixed(2)} KB)`);
      return outputBuffer;
    } catch (error: any) {
      this.log(`Erro ao otimizar imagem: ${error.message}`);
      throw error;
    }
  }

  // Testar upload para o R2
  public async testUpload(
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
    this.log('Iniciando teste de upload para Cloudflare R2...');
    
    if (!file) {
      this.log('Erro: Nenhum arquivo fornecido');
      return { success: false, error: 'Nenhum arquivo fornecido', logs: this.getLogs() };
    }
    
    if (!this.client || !this.connected) {
      await this.initializeClient();
      
      if (!this.connected) {
        this.log(`Erro: Cliente R2 não inicializado: ${this.connectionError}`);
        return { 
          success: false, 
          error: this.connectionError || 'Não foi possível estabelecer conexão com o R2', 
          logs: this.getLogs() 
        };
      }
    }
    
    try {
      this.log(`Processando arquivo: ${file.originalname} (${file.size} bytes)`);
      this.log(`Tipo MIME: ${file.mimetype}`);
      
      // Otimizar a imagem
      const optimizedBuffer = await this.optimizeImage(file.buffer, {
        ...options,
        width: options.width || 800,
        quality: options.quality || 80,
      });
      
      // Gerar nome de arquivo único
      const uniqueId = randomUUID();
      const extension = options.format === 'webp' ? '.webp' : 
                        options.format === 'jpeg' ? '.jpg' : 
                        options.format === 'png' ? '.png' : 
                        path.extname(file.originalname) || '.jpg';
                        
      const filename = `test_uploads/${uniqueId}${extension}`;
      
      // Determinar o tipo de conteúdo
      const contentType = options.format === 'webp' ? 'image/webp' : 
                          options.format === 'jpeg' ? 'image/jpeg' : 
                          options.format === 'png' ? 'image/png' : 
                          file.mimetype;
      
      this.log(`Enviando arquivo para R2 com nome: ${filename}`);
      this.log(`Tipo de conteúdo: ${contentType}`);
      
      // Enviar para o R2
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: optimizedBuffer,
        ContentType: contentType,
      });
      
      await this.client.send(command);
      
      // Construir URL pública
      let imageUrl: string;
      
      if (PUBLIC_URL) {
        // Usando a URL pública configurada
        const baseUrl = PUBLIC_URL.endsWith('/') ? PUBLIC_URL : `${PUBLIC_URL}/`;
        imageUrl = `${baseUrl}${filename}`;
      } else {
        // URL direta do R2 (provavelmente precisará de autenticação)
        imageUrl = `https://${BUCKET_NAME}.${ENDPOINT}/${filename}`;
      }
      
      this.log(`✓ Upload para R2 bem-sucedido!`);
      this.log(`URL da imagem: ${imageUrl}`);
      
      return {
        success: true,
        imageUrl,
        storageType: 'r2',
        bucket: BUCKET_NAME,
        logs: this.getLogs()
      };
    } catch (error: any) {
      const errorMessage = `Erro no upload para R2: ${error.message || 'Erro desconhecido'}`;
      this.log(`Erro: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        logs: this.getLogs()
      };
    }
  }
}

export const r2StorageService = new R2StorageService();