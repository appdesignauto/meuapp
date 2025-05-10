import express, { Request, Response, Router } from 'express';
import { SupabaseStorageService } from '../services/supabase-storage-service';
import { isAdmin } from '../middleware';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const storageService = new SupabaseStorageService();

// Rota para testar a configuração Supabase e tentar fazer upload
router.get('/api/admin/test-storage-service', isAdmin, async (req: Request, res: Response) => {
  try {
    // Log da configuração (sem expor chaves)
    const serviceRoleConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKeyConfigured = !!process.env.SUPABASE_ANON_KEY;
    const supabaseUrlConfigured = !!process.env.SUPABASE_URL;
    
    // Criar uma entrada de log com as informações de configuração
    const configInfo = {
      serviceRoleConfigured,
      anonKeyConfigured,
      supabaseUrlConfigured,
      message: `Configuração do Supabase: Service Role (${serviceRoleConfigured ? 'Configurada' : 'Não configurada'}), Anon Key (${anonKeyConfigured ? 'Configurada' : 'Não configurada'}), URL (${supabaseUrlConfigured ? 'Configurada' : 'Não configurada'})`
    };

    // Realizar um teste de listagem de buckets
    let bucketsResult;
    try {
      bucketsResult = await storageService.getBucketsList();
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
    
    // Criar uma imagem de teste simples (círculo colorido)
    const testFileId = uuidv4();
    const testImagePath = path.join(testImageDir, `${testFileId}.png`);

    try {
      // Criando uma imagem simples com um círculo colorido
      await createTestImage(testImagePath);
      
      // Agora tentar fazer upload desta imagem de teste
      const uploadResult = await storageService.uploadFile({
        bucketName: 'designautoimages',
        filePath: `test-uploads/test-${testFileId}.png`,
        localFilePath: testImagePath,
        contentType: 'image/png',
        metadata: {
          testUpload: 'true',
          timestamp: new Date().toISOString()
        }
      });
      
      // Tentar limpar a imagem de teste após o upload
      try {
        fs.unlinkSync(testImagePath);
      } catch (cleanupError) {
        console.error('Erro ao limpar arquivo de teste:', cleanupError);
      }
      
      // Retornar resultados combinados
      res.json({
        config: configInfo,
        buckets: bucketsResult,
        uploadTest: uploadResult
      });
      
    } catch (imageError) {
      res.status(500).json({
        config: configInfo,
        buckets: bucketsResult,
        error: `Erro ao criar imagem de teste: ${imageError instanceof Error ? imageError.message : String(imageError)}`
      });
    }
    
  } catch (error) {
    console.error('Erro no teste de storage:', error);
    res.status(500).json({ 
      error: 'Erro ao testar serviço de storage',
      details: error instanceof Error ? error.message : String(error)
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

// Adicionar método para listar buckets no SupabaseStorageService
SupabaseStorageService.prototype.getBucketsList = async function() {
  try {
    this.clearLogs();
    this.log('Listando buckets disponíveis');
    
    const { data: buckets, error } = await this.supabase.storage.listBuckets();
    
    if (error) {
      this.log(`Erro ao listar buckets: ${error.message}`);
      return {
        success: false,
        error: `Erro ao listar buckets: ${error.message}`,
        logs: this.logs
      };
    }
    
    this.log(`Buckets encontrados: ${buckets.length}`);
    const bucketsList = buckets.map(b => b.name);
    this.log(`Nomes: ${bucketsList.join(', ')}`);
    
    return {
      success: true,
      buckets: bucketsList,
      logs: this.logs
    };
  } catch (error) {
    this.log(`Erro ao listar buckets: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: `Erro ao listar buckets: ${error instanceof Error ? error.message : String(error)}`,
      logs: this.logs
    };
  }
};

export default router;