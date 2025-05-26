/**
 * Script para corrigir erros críticos de TypeScript no projeto
 * Este script corrige problemas de propriedades incorretas e tipos
 */

const fs = require('fs');
const path = require('path');

function fixTypeScriptErrors() {
  console.log('🔧 Iniciando correção de erros críticos de TypeScript...');
  
  const serverRoutesPath = 'server/routes.ts';
  
  if (!fs.existsSync(serverRoutesPath)) {
    console.error('❌ Arquivo server/routes.ts não encontrado');
    return;
  }
  
  let content = fs.readFileSync(serverRoutesPath, 'utf8');
  let changes = 0;
  
  // Corrigir art.categoryIdId -> art.categoryId
  const categoryIdFixes = content.match(/art\.categoryIdId/g) || [];
  content = content.replace(/art\.categoryIdId/g, 'art.categoryId');
  changes += categoryIdFixes.length;
  
  // Corrigir art.designeridid -> art.designerid
  const designerIdFixes = content.match(/art\.designeridid/g) || [];
  content = content.replace(/art\.designeridid/g, 'art.designerid');
  changes += designerIdFixes.length;
  
  // Corrigir art.viewCount -> art.viewcount (manter consistência com schema)
  const viewCountFixes = content.match(/art\.viewCount/g) || [];
  content = content.replace(/art\.viewCount/g, 'art.viewcount');
  changes += viewCountFixes.length;
  
  // Corrigir art.designerId -> art.designerid
  const designerIdCapsFixes = content.match(/art\.designerId/g) || [];
  content = content.replace(/art\.designerId/g, 'art.designerid');
  changes += designerIdCapsFixes.length;
  
  // Salvar arquivo corrigido
  fs.writeFileSync(serverRoutesPath, content, 'utf8');
  
  console.log(`✅ Correções aplicadas: ${changes} problemas de propriedades corrigidos`);
  console.log('📁 Arquivo atualizado: server/routes.ts');
  
  return changes;
}

function main() {
  try {
    const totalFixes = fixTypeScriptErrors();
    
    if (totalFixes > 0) {
      console.log(`\n🎉 Sucesso! ${totalFixes} erros críticos de TypeScript foram corrigidos.`);
      console.log('💡 Recomendação: Reinicie o servidor para aplicar as correções.');
    } else {
      console.log('\n✨ Nenhum erro crítico encontrado para correção.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    process.exit(1);
  }
}

main();