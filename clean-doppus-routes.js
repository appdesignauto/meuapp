/**
 * Script para limpar todas as referências da Doppus do arquivo routes.ts
 */

import fs from 'fs';

function cleanDoppusFromRoutes() {
  console.log('🧹 Limpando referências da Doppus do arquivo routes.ts...');
  
  // Ler o arquivo routes.ts
  let content = fs.readFileSync('server/routes.ts', 'utf8');
  
  // Remover todas as linhas que contêm "doppus" (case insensitive)
  const lines = content.split('\n');
  const cleanedLines = lines.filter(line => {
    const lowerLine = line.toLowerCase();
    return !lowerLine.includes('doppus');
  });
  
  // Reconstruir o conteúdo
  content = cleanedLines.join('\n');
  
  // Remover blocos órfãos que foram quebrados pela remoção
  content = content.replace(/\s+} catch \(error\) \{[^}]*\}/g, '');
  content = content.replace(/\s+\} else \{[^}]*\}/g, '');
  content = content.replace(/\s+try \{[^}]*\}/g, '');
  content = content.replace(/\s+\/\/ Extrai uma mensagem de erro amigável para o usuário[^}]*\}/g, '');
  
  // Limpar linhas vazias excessivas
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Salvar o arquivo limpo
  fs.writeFileSync('server/routes.ts', content);
  
  console.log('✅ Arquivo routes.ts limpo com sucesso!');
}

cleanDoppusFromRoutes();