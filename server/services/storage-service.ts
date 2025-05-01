import { supabaseStorageService } from './supabase-storage';
import { r2StorageService } from './r2-storage';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// Interface para resultado de upload
interface UploadResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  storageType?: string;
  error?: string;
}

// Função para upload de arquivos usando diferentes serviços em cascata
export async function uploadToStorage(
  file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string }
): Promise<UploadResult> {
  try {
    console.log("Iniciando upload centralizado com estratégia em cascata...");

    // 1. Tenta Supabase primeiro (principal)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        console.log("Tentando upload via Supabase...");
        
        // Adaptamos para usar o método uploadFile que é mais compatível
        const result = await supabaseStorageService.uploadFile(
          'designauto-images',
          file.originalname,
          file.buffer,
          file.mimetype
        );
        
        if (result.success) {
          console.log("Upload via Supabase realizado com sucesso");
          return {
            success: true,
            imageUrl: result.url,
            thumbnailUrl: result.url, // Mesmo URL para thumbnail
            storageType: "supabase"
          };
        } else {
          console.warn("Upload via Supabase falhou, tentando próximo serviço...", result.error);
        }
      } catch (supabaseError) {
        console.error("Erro ao utilizar Supabase:", supabaseError);
      }
    }

    // 2. Tenta R2 em segundo lugar
    if (
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_ENDPOINT
    ) {
      try {
        console.log("Tentando upload via R2...");
        const result = await r2StorageService.uploadFile(
          process.env.R2_BUCKET_NAME || 'designautoimages',
          file.originalname,
          file.buffer,
          file.mimetype
        );

        if (result.success) {
          console.log("Upload via R2 realizado com sucesso");
          return {
            success: true,
            imageUrl: result.url,
            thumbnailUrl: result.url, // Mesmo URL para thumbnail
            storageType: "r2"
          };
        } else {
          console.warn("Upload via R2 falhou, tentando armazenamento local...", result.error);
        }
      } catch (r2Error) {
        console.error("Erro ao utilizar R2:", r2Error);
      }
    }

    // 3. Fallback final: armazenamento local
    console.log("Utilizando armazenamento local como fallback final...");
    const localResult = await localUpload(file);
    
    if (localResult.success) {
      console.log("Upload local realizado com sucesso");
      return {
        success: true,
        imageUrl: localResult.imageUrl,
        thumbnailUrl: localResult.thumbnailUrl || localResult.imageUrl,
        storageType: "local"
      };
    } else {
      throw new Error("Todos os métodos de armazenamento falharam");
    }
  } catch (error) {
    console.error("Erro fatal no serviço de armazenamento centralizado:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido no upload"
    };
  }
}

// Função para upload local
async function localUpload(
  file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string }
): Promise<UploadResult> {
  try {
    // Criar estrutura de diretórios
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const designautoImagesDir = path.join(uploadsDir, 'designautoimages');

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    if (!fs.existsSync(designautoImagesDir)) {
      fs.mkdirSync(designautoImagesDir);
    }

    // Gerar nome único
    const uuid = randomUUID();
    const fileExtension = '.webp'; // Sempre usamos WebP para otimização
    const filename = `${uuid}${fileExtension}`;
    const filepath = path.join(designautoImagesDir, filename);

    // Otimizar imagem
    const optimizedBuffer = await sharp(file.buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Salvar arquivo
    fs.writeFileSync(filepath, optimizedBuffer);

    // URL relativa para o frontend
    const relativeUrl = `/uploads/designautoimages/${filename}`;

    return {
      success: true,
      imageUrl: relativeUrl,
      thumbnailUrl: relativeUrl,
      storageType: "local"
    };
  } catch (error) {
    console.error("Erro no upload local:", error);
    return {
      success: false,
      error: error.message || "Erro no upload local"
    };
  }
}