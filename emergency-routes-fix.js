/**
 * Correção emergencial do arquivo routes.ts
 * Remove fragmentos de código quebrado que ficaram após a limpeza da Doppus
 */

import fs from 'fs';

console.log('🚨 Iniciando correção emergencial do routes.ts...');

// Backup do arquivo atual
fs.copyFileSync('server/routes.ts', 'server/routes.ts.corrupted');

// Ler o arquivo corrompido
let content = fs.readFileSync('server/routes.ts', 'utf8');

// Encontrar onde o arquivo fica corrompido (após as declarações iniciais)
const lines = content.split('\n');
const goodLines = [];
let foundCorruption = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Parar antes de linhas corrompidas
  if (line.includes('====') || 
      line.includes('Cannot find name') ||
      (line.includes('}') && !line.includes('{') && !line.includes('app.') && !line.includes('return') && !line.includes('console') && line.trim().length < 10)) {
    foundCorruption = true;
    console.log(`🔍 Corrupção detectada na linha ${i + 1}: ${line.substring(0, 50)}...`);
    break;
  }
  
  goodLines.push(line);
}

// Adicionar fechamento adequado do arquivo
goodLines.push('');
goodLines.push('  // Retorna o servidor HTTP configurado');
goodLines.push('  const server = createServer(app);');
goodLines.push('  return server;');
goodLines.push('}');

// Recriar o arquivo com as linhas válidas
const cleanContent = goodLines.join('\n');
fs.writeFileSync('server/routes.ts', cleanContent);

console.log(`✅ Arquivo corrigido! Removidas ${lines.length - goodLines.length} linhas corrompidas.`);
console.log('📁 Backup do arquivo original salvo em: server/routes.ts.corrupted');