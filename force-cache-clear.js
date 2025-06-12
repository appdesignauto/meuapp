/**
 * Script para forçar limpeza completa de cache do React Query
 * e sincronizar a visualização entre diferentes tipos de usuário
 */

// Adicionar script para executar no console do navegador
const script = `
// Forçar limpeza completa do cache do React Query
if (window.queryClient) {
  console.log('🗑️ Limpando cache do React Query...');
  window.queryClient.clear();
  window.queryClient.invalidateQueries();
  console.log('✅ Cache limpo com sucesso');
}

// Limpar localStorage e sessionStorage
console.log('🗑️ Limpando storage local...');
localStorage.clear();
sessionStorage.clear();

// Forçar reload das queries principais
if (window.queryClient) {
  console.log('🔄 Forçando reload das queries principais...');
  window.queryClient.refetchQueries({ queryKey: ['/api/arts'] });
  window.queryClient.refetchQueries({ queryKey: ['/api/user'] });
  window.queryClient.refetchQueries({ queryKey: ['/api/categories'] });
  window.queryClient.refetchQueries({ queryKey: ['/api/arts/popular'] });
}

// Aguardar e recarregar a página
setTimeout(() => {
  console.log('🔄 Recarregando página...');
  window.location.reload();
}, 2000);

console.log('✅ Processo de limpeza de cache iniciado');
`;

console.log('📋 INSTRUÇÕES PARA LIMPAR CACHE:');
console.log('');
console.log('1. Abra o console do navegador (F12)');
console.log('2. Cole e execute o seguinte código:');
console.log('');
console.log(script);
console.log('');
console.log('Ou simplesmente faça:');
console.log('- Ctrl+Shift+R (hard reload)');
console.log('- Ou limpe o cache manualmente nas ferramentas do desenvolvedor');