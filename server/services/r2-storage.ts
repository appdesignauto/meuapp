import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

// Configuração de credenciais para R2
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'designautoimages';

/**
 * Serviço para interação com Cloudflare R2 Storage
 */
class R2StorageService {
  private client: S3Client | null = null;
  private initialized = false;

  constructor() {
    this.initClient();
  }

  /**
   * Inicializa o cliente R2
   */
  private initClient(): void {
    if (this.initialized) return;

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
      console.warn('R2 não configurado corretamente. Verifique as variáveis de ambiente.');
      return;
    }

    try {
      this.client = new S3Client({
        region: 'auto',
        endpoint: R2_ENDPOINT,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY
        }
      });
      this.initialized = true;
      console.log('Cliente R2 inicializado com sucesso.');
    } catch (error) {
      console.error('Erro ao inicializar cliente R2:', error);
      this.client = null;
    }
  }

  /**
   * Faz upload de um arquivo para o R2
   */
  public async uploadFile(
    bucketName: string = R2_BUCKET_NAME,
    filename: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.client) {
      this.initClient();
      if (!this.client) {
        return {
          success: false,
          error: 'Cliente R2 não inicializado. Verifique as credenciais.'
        };
      }
    }

    try {
      // Gerar nome único para o arquivo
      const extension = path.extname(filename) || '.webp';
      const uuid = randomUUID();
      const timestamp = Date.now();
      const key = `uploads/${timestamp}_${uuid}${extension}`;

      // Configurar o comando de upload
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
      });

      // Executar o upload
      await this.client.send(putCommand);

      // URL pública
      const publicUrl = `${process.env.R2_PUBLIC_URL || R2_ENDPOINT}/${bucketName}/${key}`;

      return {
        success: true,
        url: publicUrl
      };
    } catch (error: any) {
      console.error('Erro no upload para R2:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido no upload para R2'
      };
    }
  }

  /**
   * Remove um arquivo do R2
   */
  public async deleteFile(url: string): Promise<boolean> {
    if (!this.client) {
      this.initClient();
      if (!this.client) {
        return false;
      }
    }

    try {
      // Extrair key da URL
      const urlObj = new URL(url);
      const key = urlObj.pathname.split('/').slice(2).join('/');

      // Configurar comando de deleção
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
      });

      // Executar deleção
      await this.client.send(deleteCommand);
      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo do R2:', error);
      return false;
    }
  }
}

export const r2StorageService = new R2StorageService();