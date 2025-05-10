import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { StorageService } from './storage-service';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('SUPABASE_URL e SUPABASE_ANON_KEY são necessários para o serviço de armazenamento Supabase');
}

export class SupabaseStorageService implements StorageService {
  private supabase;
  private logs: string[] = [];
  
  constructor() {
    // Usando a chave SERVICE_ROLE para maior permissão de acesso aos buckets
    // Para poder fazer upload sem problemas de RLS (Row Level Security)
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    this.clearLogs();
    console.log("SupabaseStorageService inicializado com SERVICE_ROLE_KEY para bypass de RLS");
  }
  
  clearLogs() {
    this.logs = [];
  }
  
  log(message: string) {
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(`[SupabaseStorage] ${message}`);
  }
  
  async uploadFile(params: {
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
  }> {
    try {
      const { bucketName, filePath, localFilePath, contentType, metadata } = params;
      
      this.log(`Iniciando upload para bucket: ${bucketName}, arquivo: ${filePath}`);
      
      // Assumimos que o bucket já existe (não tentaremos criá-lo)
      this.log(`Utilizando bucket existente: ${bucketName}`);
      
      // Ler o arquivo
      const fileContent = fs.readFileSync(localFilePath);
      
      // Upload para o Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, fileContent, {
          contentType,
          upsert: true,
          cacheControl: '3600',
          ...(metadata && { metadata })
        });
      
      if (error) {
        this.log(`Erro no upload para Supabase: ${error.message}`);
        return {
          success: false,
          error: `Erro no upload para Supabase: ${error.message}`,
          storageType: 'supabase',
          bucket: bucketName,
          logs: this.logs
        };
      }
      
      // Obter URL pública do arquivo
      const { data: publicUrlData } = await this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      const imageUrl = publicUrlData.publicUrl;
      
      this.log(`Upload concluído com sucesso. URL: ${imageUrl}`);
      
      return {
        success: true,
        imageUrl,
        storageType: 'supabase',
        bucket: bucketName,
        logs: this.logs
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Erro no serviço Supabase: ${errorMessage}`);
      
      return {
        success: false,
        error: `Erro no serviço Supabase: ${errorMessage}`,
        storageType: 'supabase',
        logs: this.logs
      };
    }
  }
  
  // Método usado pelo upload direto para testes
  async testUploadDirectNoSharp(file: Express.Multer.File): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
    storageType?: string;
    bucket?: string;
    logs: string[];
  }> {
    try {
      const bucketName = 'designautoimages';
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExtension}`;
      const filePath = `ferramentas/tools/${uniqueFilename}`;
      
      this.log(`Iniciando upload direto para bucket: ${bucketName}, arquivo: ${filePath}`);
      
      // Verificar se o bucket existe
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        this.log(`O bucket ${bucketName} não existe. Tentando criar...`);
        const { error: createError } = await this.supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createError) {
          this.log(`Erro ao criar bucket: ${createError.message}`);
          return {
            success: false,
            error: `Erro ao criar bucket: ${createError.message}`,
            storageType: 'supabase_direct',
            logs: this.logs
          };
        }
        
        this.log(`Bucket ${bucketName} criado com sucesso`);
      }
      
      // Upload para o Supabase Storage diretamente (sem processamento Sharp)
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
          cacheControl: '3600'
        });
      
      if (error) {
        this.log(`Erro no upload direto para Supabase: ${error.message}`);
        return {
          success: false,
          error: `Erro no upload direto para Supabase: ${error.message}`,
          storageType: 'supabase_direct',
          bucket: bucketName,
          logs: this.logs
        };
      }
      
      // Obter URL pública do arquivo
      const { data: publicUrlData } = await this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      const imageUrl = publicUrlData.publicUrl;
      
      this.log(`Upload direto concluído com sucesso. URL: ${imageUrl}`);
      
      return {
        success: true,
        imageUrl,
        storageType: 'supabase_direct',
        bucket: bucketName,
        logs: this.logs
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Erro no serviço Supabase (upload direto): ${errorMessage}`);
      
      return {
        success: false,
        error: `Erro no serviço Supabase (upload direto): ${errorMessage}`,
        storageType: 'supabase_direct',
        logs: this.logs
      };
    }
  }
  
  async getBucket(bucketName: string) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .list();
        
      if (error) {
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { data: null, error: errorMessage };
    }
  }
}