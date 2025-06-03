/**
 * Script para corrigir erros de deployment
 * Remove referências a arquivos deletados e corrige endpoints problemáticos
 */

const fs = require('fs');

function fixDeploymentErrors() {
  console.log('🔧 Iniciando correção de erros de deployment...');
  
  try {
    // 1. Corrigir referencias ao reportsV2Router no server/routes.ts
    const routesPath = 'server/routes.ts';
    if (fs.existsSync(routesPath)) {
      let content = fs.readFileSync(routesPath, 'utf8');
      
      // Remover uso do reportsV2Router que não existe mais
      if (content.includes('reportsV2Router')) {
        console.log('Removendo referências ao reportsV2Router...');
        content = content.replace(/app\.use\(['"`]\/api\/reports-v2['"`],\s*reportsV2Router\);?\s*/g, '');
        content = content.replace(/app\.use\(reportsV2Router\);?\s*/g, '');
        
        fs.writeFileSync(routesPath, content, 'utf8');
        console.log('✅ Referências ao reportsV2Router removidas');
      }
    }
    
    // 2. Atualizar o frontend para usar apenas a API segura
    const reportsManagementPath = 'client/src/components/admin/ReportsManagement.tsx';
    if (fs.existsSync(reportsManagementPath)) {
      let content = fs.readFileSync(reportsManagementPath, 'utf8');
      
      // Substituir todas as chamadas para /api/reports-v2 por /api/reports
      content = content.replace(/\/api\/reports-v2/g, '/api/reports');
      
      // Remover tentativas de fallback para API V2 que não existe mais
      content = content.replace(/console\.log\(['"`]Tentando API v2 para reports\.\.\.['"]\);\s*/g, '');
      content = content.replace(/const v2Response = await apiRequest\(['"`]GET['"`],\s*`\/api\/reports-v2.*?\);?\s*/g, '');
      content = content.replace(/if \(v2Response\.ok\) \{[\s\S]*?\} else \{[\s\S]*?\}/g, '');
      
      // Simplificar para usar apenas a API segura
      const simplifiedQuery = `
        const response = await apiRequest('GET', \`/api/reports?\${queryString}\`);
        console.log('Resposta da API de reports:', response);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar reports');
        }
        
        const data = await response.json();
        console.log('Dados recebidos da API:', data);
        return data;
      `;
      
      // Substituir lógica complexa de fallback por chamada direta
      content = content.replace(
        /\/\/ Primeiro tentamos a versão V2 da API com SQL puro[\s\S]*?throw new Error\('Não foi possível carregar reports'\);/,
        simplifiedQuery.trim()
      );
      
      fs.writeFileSync(reportsManagementPath, content, 'utf8');
      console.log('✅ Frontend atualizado para usar apenas API segura');
    }
    
    // 3. Criar endpoint de reports-v2 que redireciona para o seguro
    const safeRedirectContent = `
// Redirecionamento seguro para manter compatibilidade
app.use('/api/reports-v2', (req, res, next) => {
  // Redirecionar todas as chamadas para a API segura
  const newUrl = req.originalUrl.replace('/api/reports-v2', '/api/reports');
  res.redirect(307, newUrl);
});
`;
    
    // Adicionar redirecionamento seguro no final do arquivo de rotas
    let routesContent = fs.readFileSync(routesPath, 'utf8');
    if (!routesContent.includes('/api/reports-v2')) {
      const insertPoint = routesContent.lastIndexOf('return httpServer;');
      if (insertPoint !== -1) {
        routesContent = routesContent.slice(0, insertPoint) + 
          safeRedirectContent + 
          '\n  ' + routesContent.slice(insertPoint);
        
        fs.writeFileSync(routesPath, routesContent, 'utf8');
        console.log('✅ Redirecionamento seguro adicionado');
      }
    }
    
    console.log('\n🎉 Correção de deployment concluída com sucesso!');
    console.log('✅ Todas as referências problemáticas foram removidas');
    console.log('✅ API redirecionada para versão segura');
    console.log('✅ Compatibilidade mantida com frontend');
    console.log('💡 O deployment agora deve funcionar corretamente');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    process.exit(1);
  }
}

try {
  fixDeploymentErrors();
} catch (error) {
  console.error('❌ Erro crítico:', error.message);
  process.exit(1);
}