import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { StorageService } from '../services/storage-service';
import { SupabaseStorageService } from '../services/supabase-storage-service';
import { isAdmin } from '../middlewares/auth';

// Criar instância do serviço de armazenamento diretamente para teste
const storageService = new SupabaseStorageService();

const router = Router();

// Rota para testar o serviço de storage
router.get('/api/admin/test-storage-service', isAdmin, async (req: Request, res: Response) => {
  try {
    // Verificar configuração do Supabase
    const serviceRoleConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKeyConfigured = !!process.env.SUPABASE_ANON_KEY;
    const supabaseUrlConfigured = !!process.env.SUPABASE_URL;
    
    const configStatus = {
      serviceRoleConfigured,
      anonKeyConfigured,
      supabaseUrlConfigured,
      message: `Configuração do Supabase: Service Role (${serviceRoleConfigured ? 'Configurada' : 'Não configurada'}), Anon Key (${anonKeyConfigured ? 'Configurada' : 'Não configurada'}), URL (${supabaseUrlConfigured ? 'Configurada' : 'Não configurada'})`
    };

    // Testar a conexão tentando fazer um simples upload
    let bucketsResult;
    try {
      bucketsResult = await (storageService as SupabaseStorageService).getBucketsList();
    } catch (error) {
      bucketsResult = { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }

    // Caminho para gerar imagem de teste
    const testImageDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(testImageDir)) {
      fs.mkdirSync(testImageDir, { recursive: true });
    }
    const testImagePath = path.join(testImageDir, 'test-circle-image.png');
    
    // Criar uma imagem de teste simples
    await createTestImage(testImagePath);
    
    // Testar upload de imagem
    let uploadResult;
    try {
      // Ler o arquivo criado
      const testImageBuffer = fs.readFileSync(testImagePath);
      const testFile = {
        buffer: testImageBuffer,
        originalname: 'test-circle-image.png',
        mimetype: 'image/png'
      };
      
      // Tentar fazer upload
      uploadResult = await (storageService as SupabaseStorageService).testUploadDirectNoSharp(testFile);
    } catch (error) {
      uploadResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Retornar resultados dos testes
    res.json({
      configStatus,
      bucketsResult,
      uploadResult
    });
    
  } catch (error) {
    console.error('Erro ao testar serviço de storage:', error);
    res.status(500).json({
      message: 'Erro ao testar serviço de storage',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Função para criar uma imagem de teste simples com um círculo colorido
async function createTestImage(outputPath: string): Promise<void> {
  // Usar forma simples de criação de arquivo
  const fs = require('fs');
  
  // Conteúdo base64 de uma pequena imagem PNG com um círculo
  const base64Image = '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';
  
  // Converter a base64 para buffer e salvar
  const imageBuffer = Buffer.from(base64Image, 'base64');
  fs.writeFileSync(outputPath, imageBuffer);
}

export default router;