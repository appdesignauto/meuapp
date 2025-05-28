#!/usr/bin/env node

/**
 * Correção rápida para dados do dashboard de assinatura
 * Problema: Mostra 0 usuários com assinatura quando deveria mostrar os dados reais
 */

const fs = require('fs');

// Função para corrigir as rotas em server/routes.ts
function fixSubscriptionRoutes() {
  console.log('🔧 Corrigindo rotas de assinatura...\n');
  
  const routesPath = 'server/routes.ts';
  
  if (!fs.existsSync(routesPath)) {
    console.log('❌ Arquivo server/routes.ts não encontrado');
    return false;
  }
  
  // Backup do arquivo atual
  const backupPath = `${routesPath}.backup-${Date.now()}`;
  fs.copyFileSync(routesPath, backupPath);
  console.log(`📦 Backup criado: ${backupPath}`);
  
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Substituir as rotas de assinatura por versões corrigidas
  const newSubscriptionRoutes = `
// =================================
// SUBSCRIPTION ROUTES - CORRIGIDAS
// =================================

// Listar usuários com assinatura (QUERY CORRIGIDA)
app.get('/api/admin/subscription-users', isAdmin, async (req, res) => {
  try {
    console.log('🔍 Buscando usuários com assinatura...');
    
    // PRIMEIRO: Verificar que tipos de status existem no banco
    const allUsers = await storage.db.select().from(storage.users);
    
    console.log(\`📊 Total de usuários no banco: \${allUsers.length}\`);
    
    // Filtrar usuários que têm indicação de assinatura
    const subscribedUsers = allUsers.filter(user => {
      return (
        user.nivelacesso && 
        ['premium', 'designer', 'designer_adm'].includes(user.nivelacesso)
      ) || (
        user.acessovitalicio === true
      ) || (
        user.tipoplano && 
        user.tipoplano.trim() !== ''
      );
    });
    
    console.log(\`✅ Usuários com assinatura encontrados: \${subscribedUsers.length}\`);
    
    // Log para debug
    if (subscribedUsers.length > 0) {
      console.log('📋 Exemplos de status encontrados:');
      subscribedUsers.slice(0, 3).forEach(user => {
        console.log(\`   - \${user.email}: nivel="\${user.nivelacesso}", plano="\${user.tipoplano}", vitalicio=\${user.acessovitalicio}\`);
      });
    }
    
    res.json(subscribedUsers);
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      debug: error.message
    });
  }
});

// Métricas de assinatura (CÁLCULOS CORRIGIDOS)
app.get('/api/admin/subscription-metrics', isAdmin, async (req, res) => {
  try {
    console.log('📊 Calculando métricas de assinatura...');
    
    // Buscar todos os usuários
    const allUsers = await storage.db.select().from(storage.users);
    
    // Calcular métricas baseado nos dados reais
    const totalUsers = allUsers.length;
    
    const subscribedUsers = allUsers.filter(user => {
      return (
        user.nivelacesso && 
        ['premium', 'designer', 'designer_adm'].includes(user.nivelacesso)
      ) || (
        user.acessovitalicio === true
      ) || (
        user.tipoplano && 
        user.tipoplano.trim() !== ''
      );
    });
    
    const activeSubscriptions = subscribedUsers.length;
    
    // Usuários free
    const freeUsers = allUsers.filter(user => 
      user.nivelacesso === 'free' && !user.acessovitalicio
    ).length;
    
    // Usuários recentes (últimos 7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = allUsers.filter(user => 
      new Date(user.criadoem) >= sevenDaysAgo
    ).length;
    
    // Calcular conversão
    const conversionRate = totalUsers > 0 ? 
      Math.round((activeSubscriptions / totalUsers) * 100) : 0;
    
    const metrics = {
      totalUsers: totalUsers,
      premiumUsers: activeSubscriptions,
      freeUsers: freeUsers,
      conversionRate: \`\${conversionRate}%\`,
      recentSignups: recentSignups
    };
    
    console.log('📈 Métricas calculadas:', metrics);
    
    res.json({
      overview: metrics
    });
    
  } catch (error) {
    console.error('❌ Erro ao calcular métricas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar métricas',
      debug: error.message
    });
  }
});
`;

  // Encontrar e substituir as rotas existentes
  const routePatterns = [
    /app\.get\(['"]\/api\/admin\/subscription-users['"][\s\S]*?}\);/g,
    /app\.get\(['"]\/api\/admin\/subscription-metrics['"][\s\S]*?}\);/g
  ];
  
  routePatterns.forEach(pattern => {
    content = content.replace(pattern, '');
  });
  
  // Adicionar novas rotas antes da exportação
  const exportIndex = content.lastIndexOf('export');
  if (exportIndex !== -1) {
    content = content.slice(0, exportIndex) + newSubscriptionRoutes + '\n\n' + content.slice(exportIndex);
  } else {
    content += newSubscriptionRoutes;
  }
  
  // Limpar espaços excessivos
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  fs.writeFileSync(routesPath, content);
  console.log('✅ Rotas de assinatura corrigidas');
  
  return true;
}

// Função para criar script de teste rápido
function createQuickTest() {
  const testScript = `
const { neon } = require('@neondatabase/serverless');

async function quickTest() {
  try {
    console.log('🧪 TESTE RÁPIDO DOS DADOS\\n');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // 1. Total de usuários
    const totalResult = await sql\`SELECT COUNT(*) as count FROM users\`;
    console.log(\`📊 Total de usuários: \${totalResult[0].count}\`);
    
    // 2. Usuários por nível de acesso
    const levelResults = await sql\`
      SELECT nivelacesso, COUNT(*) as count 
      FROM users 
      WHERE nivelacesso IS NOT NULL 
      GROUP BY nivelacesso
    \`;
    
    console.log('\\n📋 Usuários por nível:');
    levelResults.forEach(result => {
      console.log(\`   - \${result.nivelacesso}: \${result.count}\`);
    });
    
    // 3. Usuários com acesso vitalício
    const vitalicios = await sql\`SELECT COUNT(*) as count FROM users WHERE acessovitalicio = true\`;
    console.log(\`\\n🎯 Usuários vitalícios: \${vitalicios[0].count}\`);
    
    // 4. Exemplos de usuários
    const examples = await sql\`
      SELECT email, nivelacesso, tipoplano, acessovitalicio 
      FROM users 
      LIMIT 5
    \`;
    
    console.log('\\n👥 Exemplos de usuários:');
    examples.forEach((user, i) => {
      console.log(\`   \${i+1}. \${user.email}\`);
      console.log(\`      Nível: "\${user.nivelacesso || 'null'}"\`);
      console.log(\`      Plano: "\${user.tipoplano || 'null'}"\`);
      console.log(\`      Vitalício: \${user.acessovitalicio}\`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

quickTest();
`;

  fs.writeFileSync('quick-test-data.js', testScript);
  console.log('📝 Script de teste criado: quick-test-data.js');
}

// Função principal
async function main() {
  console.log('🚀 CORREÇÃO RÁPIDA - DADOS DO DASHBOARD\n');
  console.log('Problema: Dashboard mostra 0 usuários com assinatura\n');
  console.log('Solução: Corrigir queries para buscar dados reais do banco\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // 1. Corrigir rotas
    const success = fixSubscriptionRoutes();
    
    if (success) {
      // 2. Criar teste rápido
      createQuickTest();
      
      console.log('\n🎯 CORREÇÃO APLICADA COM SUCESSO!\n');
      console.log('📋 O que foi corrigido:');
      console.log('✅ Query de usuários agora busca TODOS os status válidos');
      console.log('✅ Métricas calculadas baseadas em dados reais');
      console.log('✅ Logs de debug adicionados para identificar problemas');
      console.log('✅ Backup do arquivo original criado');
      
      console.log('\n🚀 PRÓXIMOS PASSOS:');
      console.log('1. Reiniciar o servidor automaticamente');
      console.log('2. Testar dados: node quick-test-data.js');
      console.log('3. Verificar dashboard: /admin');
      console.log('4. Checar logs do servidor para debug');
      
      console.log('\n💡 A correção agora:');
      console.log('- Busca TODOS os usuários do banco');
      console.log('- Filtra os que têm indicação de assinatura');
      console.log('- Calcula métricas baseadas nos dados reais');
      console.log('- Adiciona logs detalhados para debug');
      
    } else {
      console.log('❌ Falha na correção. Verifique se o arquivo server/routes.ts existe.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
if (require.main === module) {
  main();
}

module.exports = { fixSubscriptionRoutes, createQuickTest };