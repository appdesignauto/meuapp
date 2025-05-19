/**
 * Interface para serviços de armazenamento de arquivos
 * 
 * Esta interface define o contrato para implementação de serviços
 * de armazenamento de arquivos no sistema, como Supabase Storage,
 * Cloudflare R2, etc.
 */
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
}