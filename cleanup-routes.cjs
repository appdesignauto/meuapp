const fs = require('fs');

console.log('🚀 Removendo rotas duplicadas...\n');

// Remover rota duplicada do server/index.ts
const filePath = 'server/index.ts';
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remover rota duplicada
  const pattern = /\/\/ Endpoint FIXO para usuários de assinatura[\s\S]*?app\.get\('\/api\/admin\/subscription-users'[\s\S]*?}\);/g;
  const beforeCount = (content.match(/\/api\/admin\/subscription-users/g) || []).length;
  content = content.replace(pattern, '');
  const afterCount = (content.match(/\/api\/admin\/subscription-users/g) || []).length;
  
  // Limpar linhas vazias
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ server/index.ts: ${beforeCount} → ${afterCount} rotas subscription-users`);
} else {
  console.log('⚠️  server/index.ts não encontrado');
}

console.log('\n✅ Limpeza concluída!');
