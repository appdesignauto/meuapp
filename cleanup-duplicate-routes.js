#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para remover rotas duplicadas do sistema de assinatura
 * Remove duplicações em server/index.ts e server/routes.ts
 */

console.log('🚀 Iniciando limpeza de rotas duplicadas...\n');

// Limpar server/index.ts - remover rota duplicada
function cleanServerIndex() {
  console.log('🧹 Limpando server/index.ts...');
  
  const filePath = 'server/index.ts';
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  server/index.ts não encontrado');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remover a rota duplicada de subscription-users
  const duplicateRoutePattern = /\/\/ Endpoint FIXO para usuários de assinatura - GARANTIDO FUNCIONAMENTO[\s\S]*?app\.get\('\/api\/admin\/subscription-users'[\s\S]*?}\);/g;
  content = content.replace(duplicateRoutePattern, '');
  
  // Limpar linhas vazias excessivas
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Rota duplicada removida de server/index.ts');
}

// Verificar se ainda há duplicações
function verifyCleanup() {
  console.log('🔍 Verificando se ainda há duplicações...');
  
  const files = ['server/index.ts', 'server/routes.ts'];
  let totalDuplicates = 0;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      const subscriptionUsersCount = (content.match(/\/api\/admin\/subscription-users/g) || []).length;
      const subscriptionMetricsCount = (content.match(/\/api\/admin\/subscription-metrics/g) || []).length;
      
      console.log(`📋 ${file}:`);
      console.log(`   - subscription-users: ${subscriptionUsersCount} ocorrências`);
      console.log(`   - subscription-metrics: ${subscriptionMetricsCount} ocorrências`);
      
      if (subscriptionUsersCount > 1) totalDuplicates += subscriptionUsersCount - 1;
      if (subscriptionMetricsCount > 1) totalDuplicates += subscriptionMetricsCount - 1;
    }
  });
  
  if (totalDuplicates === 0) {
    console.log('✅ Nenhuma duplicação encontrada');
  } else {
    console.log(`⚠️  ${totalDuplicates} duplicações ainda encontradas`);
  }
  
  return totalDuplicates === 0;
}

// Executar limpeza
try {
  cleanServerIndex();
  const isClean = verifyCleanup();
  
  if (isClean) {
    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('🔄 As rotas duplicadas foram removidas');
    console.log('📊 Agora apenas as rotas em server/routes.ts devem estar ativas');
  } else {
    console.log('\n⚠️  Algumas duplicações podem ainda estar presentes');
  }
  
} catch (error) {
  console.error('❌ Erro durante a limpeza:', error);
}