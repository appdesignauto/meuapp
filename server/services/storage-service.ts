import { supabaseStorageService } from './supabase-storage';
import { r2StorageService } from './r2-storage';
import path from 'path';
import fs from 'fs';

// Tipo de arquivo para upload
interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

// Resultado do upload
interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  storageType?: string;
  bucket?: string;
  logs: string[];
}

// Função principal para fazer upload de arquivos para o armazenamento
export async function uploadToStorage(file: UploadFile): Promise<UploadResult> {
  const logs: string[] = [];
  logs.push(`Iniciando upload de arquivo: ${file.originalname} (${file.mimetype})`);
  
  try {
    // Tentar fazer upload para o Supabase Storage primeiro
    logs.push('Tentando upload para Supabase Storage...');
    
    const supabaseResult = await supabaseStorageService.uploadFile(
      'designautoimages',
      file.originalname,
      file.buffer,
      file.mimetype
    );
    
    if (supabaseResult.success) {
      logs.push('Upload para Supabase Storage concluído com sucesso');
      return {
        success: true,
        imageUrl: supabaseResult.url,
        storageType: 'supabase',
        bucket: 'designautoimages',
        logs
      };
    }
    
    logs.push(`Falha no upload para Supabase: ${supabaseResult.error}`);
    
    // Se o Supabase falhar, tentar o R2
    logs.push('Tentando upload para Cloudflare R2...');
    
    const r2Result = await r2StorageService.uploadFile(
      file.originalname,
      file.buffer,
      file.mimetype
    );
    
    if (r2Result.success) {
      logs.push('Upload para Cloudflare R2 concluído com sucesso');
      return {
        success: true,
        imageUrl: r2Result.url,
        storageType: 'r2',
        bucket: r2Result.bucket,
        logs
      };
    }
    
    logs.push(`Falha no upload para R2: ${r2Result.error}`);
    
    // Se ambos falharem, tenta fazer upload local
    logs.push('Tentando upload para armazenamento local...');
    
    // Garantir que o diretório de uploads existe
    const uploadDir = path.resolve('./public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Salvar arquivo localmente
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    const filePath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filePath, file.buffer);
    
    const publicUrl = `/uploads/${filename}`;
    logs.push(`Upload local concluído com sucesso: ${publicUrl}`);
    
    return {
      success: true,
      imageUrl: publicUrl,
      storageType: 'local',
      logs
    };
    
  } catch (error) {
    logs.push(`Erro geral no processo de upload: ${error}`);
    return {
      success: false,
      error: `Falha em todos os métodos de upload: ${error}`,
      logs
    };
  }
}