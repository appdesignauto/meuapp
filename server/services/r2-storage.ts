import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Verificação de variáveis de ambiente
if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT) {
  console.warn('Aviso: Credenciais do R2 não encontradas. Funcionalidade de armazenamento pode estar limitada.');
}

class R2StorageService {
  private client: S3Client | null = null;
  private bucket: string = '';
  private endpoint: string = '';
  private publicUrl: string = '';
  private initialized: boolean = false;
  private logs: string[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Verificar se todas as credenciais necessárias estão disponíveis
      if (!process.env.R2_ACCESS_KEY_ID || 
          !process.env.R2_SECRET_ACCESS_KEY || 
          !process.env.R2_ENDPOINT || 
          !process.env.R2_BUCKET_NAME) {
        this.log('⚠️ Inicialização do R2 Storage falhou: credenciais incompletas');
        return;
      }

      // Configuração do endpoint
      const endpoint = process.env.R2_ENDPOINT;
      this.endpoint = endpoint.startsWith('http') ? endpoint : `https://${endpoint}.r2.dev`;
      
      // Configuração do cliente S3
      this.client = new S3Client({
        region: 'auto',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        }
      });

      this.bucket = process.env.R2_BUCKET_NAME;
      
      // Configuração da URL pública
      this.publicUrl = process.env.R2_PUBLIC_URL || 
                       `${this.endpoint}/${this.bucket}`;

      this.initialized = true;
      this.log(`✅ Serviço R2 Storage inicializado com sucesso`);
      this.log(`📦 Bucket: ${this.bucket}`);
      this.log(`🔗 URL pública base: ${this.publicUrl}`);
    } catch (error) {
      this.log(`❌ Erro na inicialização do R2 Storage: ${error}`);
    }
  }

  private log(message: string) {
    this.logs.push(`[R2Storage ${new Date().toISOString()}] ${message}`);
    console.log(message);
  }

  // Upload de arquivo para o R2
  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<{ success: boolean; url?: string; bucket?: string; error?: string }> {
    if (!this.initialized || !this.client) {
      return { 
        success: false, 
        error: 'R2 Storage não está inicializado' 
      };
    }

    try {
      this.log(`Iniciando upload para bucket '${this.bucket}', caminho: ${filePath}`);

      // Preparar comando para upload
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: fileBuffer,
        ContentType: contentType
      });

      // Executar upload
      await this.client.send(command);
      
      // Construir URL do arquivo
      const fileUrl = `${this.publicUrl}/${filePath}`;
      
      this.log(`✅ Upload concluído com sucesso. URL: ${fileUrl}`);
      
      return {
        success: true,
        url: fileUrl,
        bucket: this.bucket
      };
    } catch (error) {
      const errorMessage = `Erro no upload para R2: ${error}`;
      this.log(`❌ ${errorMessage}`);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  // Gerar URL assinada para acesso temporário
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    if (!this.initialized || !this.client) {
      this.log('⚠️ Tentativa de gerar URL assinada sem inicialização');
      return null;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      this.log(`❌ Erro ao gerar URL assinada: ${error}`);
      return null;
    }
  }

  // Verificar status de conexão
  async checkStatus(): Promise<{ success: boolean; status: string; error?: string }> {
    if (!this.initialized || !this.client) {
      return {
        success: false,
        status: 'not_initialized',
        error: 'R2 Storage não está inicializado'
      };
    }

    try {
      // Tentativa de listar objetos no bucket (como teste de conexão)
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: '.r2-connection-test',
        Body: Buffer.from('Connection test')
      });

      await this.client.send(command);
      
      return {
        success: true,
        status: 'connected'
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: `Erro na conexão: ${error}`
      };
    }
  }

  // Obter logs do serviço
  getLogs() {
    return this.logs;
  }

  // Obter informações do serviço
  getInfo() {
    return {
      initialized: this.initialized,
      bucket: this.bucket,
      endpoint: this.endpoint,
      publicUrl: this.publicUrl
    };
  }
}

export const r2StorageService = new R2StorageService();