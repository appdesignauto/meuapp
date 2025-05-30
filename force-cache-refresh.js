/**
 * Script para forçar atualização de cache em todos os navegadores
 * Este script adiciona headers no-cache e atualiza o parâmetro de versão
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function forceGlobalCacheRefresh() {
  const timestamp = Date.now();
  const versionString = `v=${timestamp}`;
  
  console.log('🔄 Forçando atualização de cache global...');
  
  // 1. Atualizar o index.html com nova versão
  const indexPath = path.join(__dirname, 'client', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Substituir qualquer parâmetro de versão existente
    indexContent = indexContent.replace(
      /src="\/src\/main\.tsx\?v=\d+"/g,
      `src="/src/main.tsx?${versionString}"`
    );
    
    // Se não há parâmetro de versão, adicionar
    if (!indexContent.includes('?v=')) {
      indexContent = indexContent.replace(
        'src="/src/main.tsx"',
        `src="/src/main.tsx?${versionString}"`
      );
    }
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Index.html atualizado com nova versão:', versionString);
  }
  
  // 2. Criar/atualizar headers de no-cache
  const serverPath = path.join(__dirname, 'server', 'index.ts');
  
  if (fs.existsSync(serverPath)) {
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Adicionar middleware de no-cache se não existir
    if (!serverContent.includes('no-cache')) {
      const middlewareCode = `
// Middleware para forçar atualização de cache
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString()
  });
  next();
});
`;
      
      // Inserir após as importações
      const importRegex = /(import.*?;[\s\S]*?)\n\n/;
      serverContent = serverContent.replace(importRegex, `$1\n${middlewareCode}\n`);
      
      fs.writeFileSync(serverPath, serverContent);
      console.log('✅ Headers de no-cache adicionados ao servidor');
    }
  }
  
  console.log('🎯 Cache global forçado a atualizar!');
  console.log('📱 Usuários precisarão fazer refresh (Ctrl+F5 ou Cmd+Shift+R)');
  console.log('🌐 Navegadores irão baixar a versão mais recente');
}

// Executar o script
forceGlobalCacheRefresh();