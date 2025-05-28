#!/usr/bin/env node

/**
 * Script para finalizar a remoção completa do sistema de assinaturas
 * e corrigir erros de sintaxe no arquivo routes.ts
 */

import fs from 'fs';

console.log('🧹 Finalizando remoção do sistema de assinaturas...');

// Corrigir server/routes.ts
const routesPath = 'server/routes.ts';
if (fs.existsSync(routesPath)) {
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Encontrar a linha onde começam os problemas e remover tudo após ela
  const lines = content.split('\n');
  const cleanLines = [];
  let foundProblem = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Parar quando encontrar código problemático
    if (line.includes('// All subscription endpoints and metrics have been removed') ||
        line.includes('const countQuery =') ||
        line.includes('ORDER BY criadoem DESC')) {
      foundProblem = true;
      cleanLines.push('  // All subscription endpoints and metrics have been removed');
      break;
    }
    
    cleanLines.push(line);
  }
  
  // Adicionar fechamento apropriado do arquivo
  cleanLines.push('');
  cleanLines.push('  return server;');
  cleanLines.push('}');
  
  const cleanContent = cleanLines.join('\n');
  fs.writeFileSync(routesPath, cleanContent);
  console.log('✅ Arquivo routes.ts limpo com sucesso');
}

// Corrigir server/index.ts - remover referências ao SubscriptionService
const indexPath = 'server/index.ts';
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Remover todas as referências ao SubscriptionService
  content = content.replace(/SubscriptionService\.[^;]+;?/g, '// Subscription system removed');
  content = content.replace(/await SubscriptionService\.[^;]+;?/g, '// Subscription system removed');
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Arquivo index.ts limpo com sucesso');
}

console.log('🎉 Remoção do sistema de assinaturas finalizada!');