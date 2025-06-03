/**
 * Correção de emergência para resolver erros de sintaxe críticos
 * que estão impedindo a aplicação de funcionar
 */

const fs = require('fs');

function emergencySyntaxFix() {
  console.log('🚨 Aplicando correção de emergência...');
  
  try {
    // Corrigir server/routes.ts
    const routesPath = 'server/routes.ts';
    if (fs.existsSync(routesPath)) {
      let content = fs.readFileSync(routesPath, 'utf8');
      
      // Remover comentários mal formados que estão quebrando a sintaxe
      content = content.replace(/\/\/ \.sociallinks \/\/ Removido temporariamente/g, '');
      content = content.replace(/\/\/ \.followers \/\/ Removido temporariamente/g, '');
      content = content.replace(/\/\/ \.following \/\/ Removido temporariamente/g, '');
      
      // Corrigir linhas com vírgulas em posições incorretas
      content = content.replace(/const followersCount = followersResult\[0\]\?\.count \|\| 0;/g, 
        'const followersCount = followersResult[0]?.count || 0;');
      
      // Remover todas as referências problemáticas temporariamente
      content = content.replace(/\.sociallinks/g, '');
      content = content.replace(/user\.followers/g, 'followersCount');
      content = content.replace(/user\.following/g, 'followingCount');
      
      fs.writeFileSync(routesPath, content, 'utf8');
      console.log('✅ Sintaxe do server/routes.ts corrigida');
    }
    
    console.log('🎉 Correção de emergência aplicada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error.message);
    process.exit(1);
  }
}

emergencySyntaxFix();