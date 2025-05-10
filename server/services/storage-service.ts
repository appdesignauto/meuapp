/**
 * Interface para serviços de armazenamento de arquivos
 * 
 * Esta interface define o contrato para implementação de serviços
 * de armazenamento de arquivos no sistema, como Supabase Storage,
 * Cloudflare R2, etc.
 */
import { Express } from 'express';

export interface StorageService {
  /**
   * Realiza o upload de um arquivo para o serviço de armazenamento
   * 
   * @param params Parâmetros para o upload do arquivo
   * @returns Resultado da operação de upload com informações relevantes
   */
  uploadFile(params: {
    bucketName: string;
    filePath: string;
    localFilePath: string;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
    storageType?: string;
    bucket?: string;
    logs: string[];
  }>;
  
  /**
   * Obtém a lista de buckets disponíveis no serviço de armazenamento
   * Usado principalmente para diagnóstico e verificação da conexão
   */
  getBucketsList(): Promise<any>;
  
  /**
   * Realiza um teste de upload direto sem processamento de imagem
   * Usado para testes de diagnóstico da conexão com o serviço
   */
  testUploadDirectNoSharp(file: Express.Multer.File | {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
    storageType?: string;
    bucket?: string;
    logs: string[];
  }>;
}