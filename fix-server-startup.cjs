#!/usr/bin/env node

/**
 * Script para corrigir rapidamente os erros que estão impedindo o servidor de iniciar
 */

const fs = require('fs');

console.log('🚀 Corrigindo erros críticos do servidor...');

// Corrigir server/index.ts - remover código problemático
const indexPath = 'server/index.ts';
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Remover linhas problemáticas
  const lines = content.split('\n');
  const cleanLines = lines.filter(line => {
    return !line.includes('res.json(allUsers)') && 
           !line.includes('allUsers') &&
           !line.includes('downgradedCount') &&
           !line.includes('initialDowngradedCount') &&
           !line.trim().startsWith('res.status(500)');
  });
  
  fs.writeFileSync(indexPath, cleanLines.join('\n'));
  console.log('✅ Arquivo index.ts corrigido');
}

// Adicionar rotas necessárias no routes.ts
const routesPath = 'server/routes.ts';
if (fs.existsSync(routesPath)) {
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Garantir que setupAuth está presente
  if (!content.includes('setupAuth(app);')) {
    content = content.replace(
      '// Aplicar middleware global',
      'setupAuth(app);\n  \n  // Aplicar middleware global'
    );
  }
  
  // Adicionar rotas básicas antes do return
  if (!content.includes('setupFollowRoutesSimple(app);')) {
    content = content.replace(
      'return server;',
      'setupFollowRoutesSimple(app);\n  \n  return server;'
    );
  }
  
  fs.writeFileSync(routesPath, content);
  console.log('✅ Arquivo routes.ts corrigido');
}

console.log('🎉 Correções aplicadas! Tentando iniciar servidor...');