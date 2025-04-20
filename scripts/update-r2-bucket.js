/**
 * Script para atualizar todas as referências ao nome do bucket R2 no código-fonte
 * Substitui "designautoimages" por "designautoimages" em todos os arquivos relevantes
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Diretórios a serem verificados
const directories = [
  'server',
  'client',
  'shared',
  'scripts'
];

// Extensões de arquivo a serem verificadas
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Termos a serem substituídos
const replacements = [
  { from: 'designautoimages', to: 'designautoimages' },
  { from: 'designautoimages', to: 'designautoimages' }, // Padronizar o bucket de avatares
];

async function scanDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.includes('node_modules')) {
      // Se for um diretório, escanear recursivamente
      await scanDirectory(fullPath);
    } else if (entry.isFile()) {
      // Verificar se é uma extensão relevante
      const ext = path.extname(entry.name).toLowerCase();
      if (fileExtensions.includes(ext)) {
        await processFile(fullPath);
      }
    }
  }
}

async function processFile(filePath) {
  try {
    // Ler o conteúdo do arquivo
    const content = await readFile(filePath, 'utf8');
    let newContent = content;
    let changed = false;
    
    // Aplicar substituições
    for (const { from, to } of replacements) {
      if (content.includes(from)) {
        newContent = newContent.split(from).join(to);
        changed = true;
      }
    }
    
    // Se houver alterações, salvar o arquivo
    if (changed) {
      await writeFile(filePath, newContent, 'utf8');
      console.log(`✓ Atualizado: ${filePath}`);
    }
  } catch (error) {
    console.error(`Erro ao processar arquivo ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('====================================');
  console.log('ATUALIZADOR DE NOMES DE BUCKET R2');
  console.log('====================================');
  console.log('Este script substitui todas as referências ao nome antigo do bucket');
  console.log('designautoimages -> designautoimages\n');
  
  let filesProcessed = 0;
  let filesUpdated = 0;
  
  for (const dir of directories) {
    const dirPath = path.resolve(process.cwd(), dir);
    
    try {
      const dirStat = await stat(dirPath);
      if (dirStat.isDirectory()) {
        console.log(`Escaneando diretório: ${dir}`);
        await scanDirectory(dirPath);
        console.log(`Diretório ${dir} processado com sucesso\n`);
      }
    } catch (error) {
      console.error(`Erro ao acessar diretório ${dir}:`, error.message);
    }
  }
  
  console.log('\nProcesso concluído!');
  console.log('====================================');
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});