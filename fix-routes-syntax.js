/**
 * Script para corrigir erros de sintaxe no arquivo routes.ts
 * causados pela remoção das configurações da Doppus
 */

import fs from 'fs';

function fixRoutesSyntax() {
  console.log('🔧 Corrigindo erros de sintaxe no routes.ts...');
  
  let content = fs.readFileSync('server/routes.ts', 'utf8');
  
  // Remover linhas problemáticas que ficaram após a limpeza da Doppus
  const lines = content.split('\n');
  const fixedLines = [];
  
  let skipMode = false;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pular linhas que contêm sintaxe quebrada
    if (line.includes('====') || 
        line.includes('} catch (error) {') && !line.includes('try {') ||
        line.includes('} else {') && !line.includes('if (')) {
      skipMode = true;
      continue;
    }
    
    // Adicionar linha se não estiver em modo skip
    if (!skipMode) {
      fixedLines.push(line);
    }
    
    // Sair do modo skip quando encontrar uma estrutura válida
    if (skipMode && (line.includes('app.') || line.includes('export') || line.includes('function'))) {
      skipMode = false;
      fixedLines.push(line);
    }
  }
  
  // Reconstruir conteúdo
  content = fixedLines.join('\n');
  
  // Limpar múltiplas linhas vazias
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Salvar arquivo corrigido
  fs.writeFileSync('server/routes.ts', content);
  
  console.log('✅ Erros de sintaxe corrigidos!');
}

fixRoutesSyntax();