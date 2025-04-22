import sharp from "sharp";
import * as path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { storageService } from './storage';
import { supabase, BUCKET_NAME, AVATARS_BUCKET } from '../config/supabase';
import { StorageError } from '@supabase/storage-js';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

interface BucketInfo {
  name: string;
  files: string[];
}

interface UploadResult {
  imageUrl: string;
  storageType: 'supabase';
}

export class SupabaseStorageService {
  private initialized = false;
  private emergencyUploadAttempts: Record<string, number> = {};
  private logs: string[] = [];
  private buckets: Record<string, BucketInfo> = {};
  
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    this.logs.push(logMessage);
    console.log(`[Supabase] ${message}`);
  }

  private clearLogs(): void {
    this.logs = [];
  }

  private getLogs(): readonly string[] {
    return [...this.logs];
  }

  constructor() {
    this.initBucket().catch((err: Error) => {
      this.log(`Erro ao inicializar bucket do Supabase: ${err.message}`);
    });
  }

  /**
   * Inicializa o bucket do Supabase
   */
  async initBucket(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log("=== INICIALIZANDO SUPABASE STORAGE ===");
      
      // Verificar acesso ao bucket principal
      const { data: mainFiles, error: mainError } = await supabase.storage
        .from(BUCKET_NAME)
        .list();
      
      if (mainError) {
        throw new Error(`Erro ao acessar bucket principal: ${mainError.message}`);
      }

      // Verificar acesso ao bucket de avatares
      const { data: avatarFiles, error: avatarError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .list();
      
      if (avatarError) {
        throw new Error(`Erro ao acessar bucket de avatares: ${avatarError.message}`);
      }

      this.initialized = true;
      console.log("✅ Supabase Storage inicializado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao inicializar Supabase Storage:", error);
      throw error;
    }
  }

  /**
   * Otimiza uma imagem usando sharp
   */
  private async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<Buffer> {
    const { width, height, quality = 85, format = 'webp' } = options;

    let sharpInstance = sharp(buffer);

    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'cover',
        withoutEnlargement: true
      });
    }

    return await sharpInstance[format]({ quality }).toBuffer();
  }

  /**
   * Faz upload de um avatar
   */
  async uploadAvatar(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {},
    userId: number | string
  ): Promise<UploadResult> {
    try {
      if (!this.initialized) {
        await this.initBucket();
      }

      const optimizedBuffer = await this.optimizeImage(file.buffer, {
        width: 400,
        height: 400,
        quality: 85,
        format: 'webp',
        ...options
      });

      const timestamp = Date.now();
      const filename = `user_${userId}/avatar_${timestamp}.webp`;

      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(filename, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Erro no upload para Supabase: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(filename);

      if (!urlData?.publicUrl) {
        throw new Error('URL pública não disponível após upload');
      }

      return {
        imageUrl: urlData.publicUrl,
        storageType: 'supabase'
      };
    } catch (error) {
      this.log(`Erro no upload de avatar: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Retorna informações sobre um bucket específico
   */
  async getBucket(bucketName: string): Promise<BucketInfo> {
    if (!this.initialized) {
      await this.initBucket();
    }

    if (!this.buckets[bucketName]) {
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list();

      if (error) {
        throw new Error(`Erro ao acessar bucket ${bucketName}: ${error.message}`);
      }

      this.buckets[bucketName] = {
        name: bucketName,
        files: files.map(f => f.name)
      };
    }

    return this.buckets[bucketName];
  }
}

export const supabaseStorageService = new SupabaseStorageService();