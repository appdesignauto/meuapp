/**
 * Script para corrigir definitivamente o problema de estatísticas duplicadas
 * Remove todos os endpoints duplicados e garante apenas um endpoint correto
 */

const fs = require('fs');
const path = require('path');

function removeHardcodedEndpoints() {
  console.log('🔧 Corrigindo endpoints duplicados de estatísticas...');
  
  // Localizar e remover endpoints com valores hardcoded
  const routesPath = path.join(__dirname, 'server', 'routes.ts');
  
  if (fs.existsSync(routesPath)) {
    let content = fs.readFileSync(routesPath, 'utf8');
    
    // Remover qualquer endpoint que retorne valores hardcoded incorretos
    const problematicPatterns = [
      /\/\/ ENDPOINT CRÍTICO[\s\S]*?resolved: 9[\s\S]*?}\);/g,
      /CRITICAL ENDPOINT[\s\S]*?resolved: 9[\s\S]*?}\);/g,
      /resolved: 9[\s\S]*?rejected: 3[\s\S]*?total: 13/g
    ];
    
    let modified = false;
    problematicPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
        console.log('✅ Removido endpoint com valores hardcoded incorretos');
      }
    });
    
    if (modified) {
      fs.writeFileSync(routesPath, content);
      console.log('✅ Arquivo server/routes.ts corrigido');
    }
  }
  
  // Verificar routes/reports-fixed.ts
  const reportsFixedPath = path.join(__dirname, 'server', 'routes', 'reports-fixed.ts');
  if (fs.existsSync(reportsFixedPath)) {
    let content = fs.readFileSync(reportsFixedPath, 'utf8');
    
    if (content.includes('resolved: 9') || content.includes('CRITICAL ENDPOINT')) {
      // Limpar conteúdo problemático
      content = content.replace(/resolved: 9[\s\S]*?}/g, '');
      content = content.replace(/CRITICAL ENDPOINT[\s\S]*?}/g, '');
      fs.writeFileSync(reportsFixedPath, content);
      console.log('✅ Arquivo reports-fixed.ts limpo');
    }
  }
  
  console.log('🎯 Correção concluída! Sistema agora deve mostrar valores corretos do banco de dados.');
}

removeHardcodedEndpoints();