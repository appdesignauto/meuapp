/**
 * Script para combinar todos os resultados de upload em um único arquivo JSON
 * Uso: node scripts/combine-results.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para usar __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de scripts
const SCRIPTS_DIR = __dirname;
const OUTPUT_FILE = path.join(SCRIPTS_DIR, 'all-images-results.json');

// Coleta todos os arquivos individuais
async function collectAllIndividualResults() {
  // Coleta resultados dos arquivos por imagem
  const individualFiles = fs.readdirSync(SCRIPTS_DIR)
    .filter(f => f.startsWith('upload-result-') && f.endsWith('.json'));
  
  console.log(`Encontrados ${individualFiles.length} arquivos de resultados individuais`);
  
  // Coleta resultados dos arquivos por lote
  const batchFiles = fs.readdirSync(SCRIPTS_DIR)
    .filter(f => f.startsWith('upload-results-batch-') && f.endsWith('.json'));
  
  console.log(`Encontrados ${batchFiles.length} arquivos de resultados em lote`);
  
  // Armazena os resultados, usando o nome do arquivo original como chave para garantir exclusividade
  const resultsMap = new Map();
  
  // Processa arquivos individuais
  for (const file of individualFiles) {
    try {
      const fileContent = fs.readFileSync(path.join(SCRIPTS_DIR, file), 'utf8');
      const result = JSON.parse(fileContent);
      
      if (result && result.originalFile) {
        resultsMap.set(result.originalFile, result);
      }
    } catch (error) {
      console.error(`Erro ao processar ${file}: ${error.message}`);
    }
  }
  
  // Processa arquivos de lote
  for (const file of batchFiles) {
    try {
      const fileContent = fs.readFileSync(path.join(SCRIPTS_DIR, file), 'utf8');
      const results = JSON.parse(fileContent);
      
      if (Array.isArray(results)) {
        for (const result of results) {
          if (result && result.originalFile) {
            resultsMap.set(result.originalFile, result);
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao processar ${file}: ${error.message}`);
    }
  }
  
  // Converte para array
  const allResults = Array.from(resultsMap.values());
  
  console.log(`Total de ${allResults.length} imagens processadas com sucesso`);
  
  // Salva em um único arquivo
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(allResults, null, 2)
  );
  
  console.log(`Resultados combinados salvos em ${OUTPUT_FILE}`);
  
  // Exibe estatísticas
  console.log('\n--- ESTATÍSTICAS ---');
  console.log(`Total de imagens: ${allResults.length}`);
  
  // Conta por tipo de armazenamento
  const storageTypes = {};
  for (const result of allResults) {
    const type = result.storageType || 'unknown';
    storageTypes[type] = (storageTypes[type] || 0) + 1;
  }
  
  for (const [type, count] of Object.entries(storageTypes)) {
    console.log(`Armazenamento ${type}: ${count} imagens`);
  }
}

// Executa
collectAllIndividualResults();