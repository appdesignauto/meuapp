/**
 * Script para corrigir os nomes de campos no arquivo doppus-service.ts
 * Substitui todas as ocorrências de 'updatedat' por 'atualizadoem'
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server/services/doppus-service.ts');

try {
  // Ler o arquivo
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Substituir todas as ocorrências de updatedat por atualizadoem
  const updatedContent = content.replace(/updatedat: new Date\(\)/g, 'atualizadoem: new Date()');
  
  // Escrever o conteúdo atualizado de volta ao arquivo
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  
  console.log('✅ Arquivo doppus-service.ts atualizado com sucesso!');
  console.log('Campos updatedat substituídos por atualizadoem');
} catch (error) {
  console.error('❌ Erro ao atualizar o arquivo:', error.message);
}