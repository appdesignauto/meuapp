/**
 * Script para corrigir erros críticos de TypeScript que estão causando problemas
 * de responsividade e performance no frontend
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando correção de erros críticos do TypeScript...\n');

// Corrigir o Header.tsx
const headerPath = './client/src/components/layout/Header.tsx';
let headerContent = fs.readFileSync(headerPath, 'utf8');

console.log('1. Corrigindo configuração de cache do React Query...');
// Remover cacheTime (não existe no React Query v5)
headerContent = headerContent.replace(/cacheTime: 1000 \* 60 \* 20  \/\/ 20 minutos de cache/g, '');
headerContent = headerContent.replace(/,\s*cacheTime: [^,}]*/g, '');

// Corrigir o erro de nivelacesso undefined
console.log('2. Corrigindo tipo de nivelacesso...');
headerContent = headerContent.replace(
  /user\.nivelacesso === 'admin'/g,
  "(user?.nivelacesso === 'admin')"
);
headerContent = headerContent.replace(
  /user\.nivelacesso === 'designer_adm'/g,
  "(user?.nivelacesso === 'designer_adm')"
);
headerContent = headerContent.replace(
  /user\.nivelacesso === 'suporte'/g,
  "(user?.nivelacesso === 'suporte')"
);

fs.writeFileSync(headerPath, headerContent);
console.log('✅ Header.tsx corrigido\n');

// Corrigir use-auth.tsx
const authPath = './client/src/hooks/use-auth.tsx';
let authContent = fs.readFileSync(authPath, 'utf8');

console.log('3. Otimizando queries de autenticação...');
// Adicionar configuração de retry e timeout
authContent = authContent.replace(
  /refetchInterval: false,/g,
  `refetchInterval: false,
    retry: 1,
    retryDelay: 1000,`
);

fs.writeFileSync(authPath, authContent);
console.log('✅ use-auth.tsx otimizado\n');

// Criar script de diagnóstico de performance
const diagnosticScript = `
// Script de diagnóstico de performance para o navegador
function diagnosticarPerformance() {
  console.log('🔍 Diagnóstico de Performance - DesignAuto');
  
  // Verificar event listeners excessivos
  const allElements = document.querySelectorAll('*');
  let elementosComEventos = 0;
  
  allElements.forEach(el => {
    const events = getEventListeners ? getEventListeners(el) : {};
    if (Object.keys(events).length > 0) {
      elementosComEventos++;
    }
  });
  
  console.log('📊 Elementos com event listeners:', elementosComEventos);
  
  // Verificar requisições pendentes
  const activeRequests = performance.getEntriesByType('navigation').length + 
                         performance.getEntriesByType('resource').filter(r => 
                           r.responseEnd === 0
                         ).length;
  
  console.log('🌐 Requisições ativas:', activeRequests);
  
  // Verificar memoria
  if (performance.memory) {
    console.log('💾 Uso de memória:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
    });
  }
  
  // Verificar elementos ocultos que podem estar causando problemas
  const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');
  console.log('👻 Elementos ocultos:', hiddenElements.length);
  
  return {
    elementosComEventos,
    activeRequests,
    hiddenElements: hiddenElements.length
  };
}

// Executar diagnóstico
window.diagnosticarPerformance = diagnosticarPerformance;
console.log('✅ Execute diagnosticarPerformance() no console para análise detalhada');
`;

fs.writeFileSync('./public/diagnostic.js', diagnosticScript);
console.log('4. Script de diagnóstico criado em /public/diagnostic.js\n');

console.log('🎯 CORREÇÕES IMPLEMENTADAS:');
console.log('- ✅ Configuração de cache React Query otimizada');
console.log('- ✅ Tipos TypeScript corrigidos');
console.log('- ✅ Queries de autenticação otimizadas');
console.log('- ✅ Script de diagnóstico de performance criado');
console.log('\n📝 PRÓXIMOS PASSOS:');
console.log('- Teste os botões de login/cadastro');
console.log('- Execute diagnosticarPerformance() no console do navegador');
console.log('- Verifique se o carregamento do perfil está mais rápido');