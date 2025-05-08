import { createClient } from '@supabase/supabase-js';
import { randomUUID } from "crypto";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { SupabaseStorageService } from './supabase-storage';

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Credenciais do Supabase não configuradas corretamente.");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Nome do bucket para armazenamento de imagens
const BUCKET_NAME = 'designauto-images';
const COMMUNITY_FOLDER = 'community-posts';

class CommunityStorageService {
  private supabaseStorage: SupabaseStorageService;
  
  constructor() {
    this.supabaseStorage = new SupabaseStorageService();
  }
  
  /**
   * Faz upload de imagem para o Supabase especificamente para posts da comunidade
   * @param file Arquivo de imagem (Multer)
   * @param userId ID do usuário que está criando o post
   * @returns Objeto com a URL pública da imagem
   */
  async uploadCommunityImage(
    file: Express.Multer.File,
    userId: number
  ): Promise<{ imageUrl: string; success: boolean; storageType: string }> {
    try {
      console.log(`[Community Storage] Iniciando upload de imagem da comunidade para usuário ID: ${userId}`);
      
      // Otimizar a imagem
      const optimizedBuffer = await this.optimizeImage(file.buffer);
      
      // Gerar nome do arquivo único com pasta específica para comunidade
      const uuid = randomUUID();
      const timestamp = Date.now();
      const imagePath = `${COMMUNITY_FOLDER}/user_${userId}/${timestamp}_${uuid}.webp`;
      
      console.log(`[Community Storage] Caminho da imagem no Supabase: ${imagePath}`);
      
      // Upload da imagem para o Supabase
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(imagePath, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: false
        });
      
      if (uploadError) {
        console.error(`[Community Storage] ERRO no upload da imagem: ${uploadError.message}`);
        
        // Implementar fallback para armazenamento local
        return await this.saveToDiskFallback(file, userId);
      }
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(imagePath);
      
      console.log(`[Community Storage] URL pública da imagem: ${urlData.publicUrl}`);
      
      return {
        imageUrl: urlData.publicUrl,
        success: true,
        storageType: "supabase"
      };
    } catch (error) {
      console.error("[Community Storage] Erro ao fazer upload para Supabase:", error);
      
      // Em caso de erro, fazer fallback para armazenamento local
      return await this.saveToDiskFallback(file, userId);
    }
  }
  
  /**
   * Fallback para armazenamento local caso o Supabase falhe
   */
  private async saveToDiskFallback(
    file: Express.Multer.File,
    userId: number
  ): Promise<{ imageUrl: string; success: boolean; storageType: string }> {
    try {
      console.log("[Community Storage] Usando fallback para armazenamento local");
      
      // Criar diretório de uploads da comunidade se não existir
      const uploadDir = 'public/uploads/community';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Criar subdiretório específico para o usuário
      const userDir = `${uploadDir}/user_${userId}`;
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      
      // Gerar nome de arquivo único
      const uuid = randomUUID();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${uuid}.webp`;
      const filePath = path.join(userDir, fileName);
      
      // Otimizar e salvar imagem
      const optimizedBuffer = await this.optimizeImage(file.buffer);
      fs.writeFileSync(filePath, optimizedBuffer);
      
      // Caminho público para acessar a imagem
      const publicPath = `/uploads/community/user_${userId}/${fileName}`;
      console.log(`[Community Storage] Imagem salva localmente: ${publicPath}`);
      
      return {
        imageUrl: publicPath,
        success: true,
        storageType: "local"
      };
    } catch (error) {
      console.error("[Community Storage] Erro no fallback local:", error);
      throw new Error("Falha ao fazer upload da imagem");
    }
  }
  
  /**
   * Otimiza uma imagem para upload
   */
  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(1500, 1500, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (error) {
      console.error('[Community Storage] Falha ao otimizar imagem:', error);
      // Em caso de falha na otimização, retorna o buffer original
      return buffer;
    }
  }
}

export const communityStorageService = new CommunityStorageService();