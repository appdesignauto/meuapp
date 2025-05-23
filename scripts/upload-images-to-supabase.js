/**
 * Script para fazer upload de imagens dos assets para o Supabase Storage
 * Uso: node scripts/upload-images-to-supabase.js
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// Configuração para usar __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL da API
const API_URL = 'http://localhost:5000/api/admin/upload';
const ASSETS_DIR = path.join(__dirname, '..', 'attached_assets');

// Função auxiliar para esperar entre requisições (para não sobrecarregar o servidor)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Tipos de arquivo suportados
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

async function uploadImageToSupabase(filePath) {
  try {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Verifica se é um formato de imagem suportado
    if (!SUPPORTED_EXTENSIONS.includes(fileExt)) {
      console.log(`Pulando arquivo não suportado: ${fileName}`);
      return null;
    }
    
    console.log(`Processando: ${fileName}`);
    
    // Preparando o FormData para envio
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));
    form.append('storage', 'supabase');
    
    // Faz o upload
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao enviar ${fileName}: ${errorData.message || 'Erro desconhecido'}`);
    }
    
    const result = await response.json();
    console.log(`✅ Sucesso! ${fileName} -> ${result.storageType}`);
    console.log(`   URL: ${result.imageUrl}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Erro ao processar ${path.basename(filePath)}: ${error.message}`);
    return null;
  }
}

async function uploadAllImages() {
  try {
    const args = process.argv.slice(2);
    const specificFiles = [];
    
    // Verifica se foram passados arquivos específicos
    if (args.length > 0) {
      for (const arg of args) {
        // Se o arquivo existir, adiciona à lista
        if (fs.existsSync(arg)) {
          specificFiles.push(arg);
        }
      }
    }
    
    let filesToProcess = [];
    
    // Se tiver arquivos específicos, usa eles
    if (specificFiles.length > 0) {
      filesToProcess = specificFiles;
      console.log(`Processando ${specificFiles.length} arquivos específicos`);
    } else {
      // Caso contrário, usa o comportamento padrão
      // Lê o diretório de assets
      const files = fs.readdirSync(ASSETS_DIR);
      
      // Filtra apenas imagens
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
      });
      
      console.log(`Encontradas ${imageFiles.length} imagens para upload`);
      
      // Limite de imagens a processar de uma vez
      const MAX_IMAGES = 5;
      
      // Pega o índice inicial dos argumentos (padrão: 0)
      const startIndex = args.length > 0 ? parseInt(args[0], 10) : 0;
      
      // Se startIndex for maior que a quantidade de imagens, já terminou
      if (startIndex >= imageFiles.length) {
        console.log('Todas as imagens já foram processadas!');
        return;
      }
      
      const endIndex = Math.min(startIndex + MAX_IMAGES, imageFiles.length);
      
      console.log(`Processando lote de imagens (${startIndex} a ${endIndex - 1})`);
      
      // Prepara o caminho completo para cada arquivo
      for (let i = startIndex; i < endIndex; i++) {
        filesToProcess.push(path.join(ASSETS_DIR, imageFiles[i]));
      }
    }
    
    // Array para armazenar resultados
    const results = [];
    
    // Processa os arquivos
    for (const filePath of filesToProcess) {
      const fileName = path.basename(filePath);
      
      // Faz upload e aguarda resultado
      const result = await uploadImageToSupabase(filePath);
      
      if (result) {
        const resultItem = {
          originalFile: fileName,
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          storageType: result.storageType
        };
        results.push(resultItem);
        
        // Salva o resultado após cada upload bem-sucedido
        try {
          const logFileName = `upload-result-${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
          fs.writeFileSync(
            path.join(__dirname, logFileName),
            JSON.stringify(resultItem, null, 2)
          );
        } catch (err) {
          console.error(`Erro ao salvar log para ${fileName}: ${err.message}`);
        }
      }
      
      // Pequena pausa entre uploads para não sobrecarregar
      await sleep(500);
    }
    
    // Exibe resumo final
    console.log('\n--- RESUMO ---');
    console.log(`Total de arquivos: ${filesToProcess.length}`);
    console.log(`Processados: ${filesToProcess.length}`);
    console.log(`Sucesso: ${results.length}`);
    console.log(`Falhas: ${filesToProcess.length - results.length}`);
    
    console.log('\nTodos os arquivos foram processados!');
    
    // Salva os resultados em um arquivo JSON para referência
    const timestamp = new Date().getTime();
    const resultsFileName = `upload-results-batch-${timestamp}.json`;
    fs.writeFileSync(
      path.join(__dirname, resultsFileName), 
      JSON.stringify(results, null, 2)
    );
    console.log(`Resultados detalhados salvos em scripts/${resultsFileName}`);
  } catch (error) {
    console.error('Erro ao processar imagens:', error);
  }
}

// Executa o script
uploadAllImages();