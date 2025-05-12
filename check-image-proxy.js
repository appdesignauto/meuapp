/** 
 * Script para verificar o proxy de URL de imagens
 */

import('node-fetch').then(async fetchModule => {
  const fetch = fetchModule.default;
  
  const ART_ID = 73;
  const BASE_URL = 'https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev';
  
  console.log('Verificando o proxy de URL de imagens para a arte ID:', ART_ID);
  
  try {
    // Buscar os detalhes da arte
    const response = await fetch(`${BASE_URL}/api/arts/${ART_ID}`);
    const art = await response.json();
    
    console.log('\nDetalhes da arte:');
    console.log('ID:', art.id);
    console.log('Título:', art.title);
    
    // Verificar as URLs de imagens
    console.log('\nURLs de imagens:');
    
    // Verificar URL principal da imagem
    const imageUrl = art.imageUrl || '';
    console.log('URL da imagem:', imageUrl);
    console.log('É URL de proxy:', imageUrl.startsWith('/imgs/') ? 'SIM ✅' : 'NÃO ❌');
    console.log('Contém domínio Supabase:', imageUrl.includes('dcodfuzoxmddmpvowhap.supabase.co') ? 'SIM ❌' : 'NÃO ✅');
    
    // Verificar URL da miniatura
    const thumbnailUrl = art.thumbnailUrl || '';
    console.log('\nURL da miniatura:', thumbnailUrl);
    console.log('É URL de proxy:', thumbnailUrl.startsWith('/imgs/') ? 'SIM ✅' : 'NÃO ❌');
    console.log('Contém domínio Supabase:', thumbnailUrl.includes('dcodfuzoxmddmpvowhap.supabase.co') ? 'SIM ❌' : 'NÃO ✅');
    
    // Verificar resultado geral
    console.log('\nResultado geral:');
    if (imageUrl.startsWith('/imgs/') && thumbnailUrl.startsWith('/imgs/')) {
      console.log('✅ SUCESSO: O proxy de URL de imagens está funcionando corretamente!');
    } else {
      console.log('❌ FALHA: O proxy de URL de imagens não está funcionando corretamente.');
    }
    
  } catch (error) {
    console.error('Erro ao verificar o proxy de URL de imagens:', error);
  }
});