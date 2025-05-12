// Script para testar o proxy de imagens e a conversão de URLs
const fetch = require('node-fetch');

async function testImageProxy() {
  try {
    // URL da API de arte específica
    const artId = 73;
    const response = await fetch(`https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev/api/arts/${artId}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao acessar a API: ${response.status} ${response.statusText}`);
    }
    
    const art = await response.json();
    
    console.log('=== Teste de Proxy de Imagens ===');
    console.log('Arte ID:', art.id);
    console.log('Título:', art.title);
    console.log('URL da Imagem:', art.imageUrl);
    console.log('URL da Miniatura:', art.thumbnailUrl);
    
    // Verificar se as URLs usam o formato de proxy '/imgs/'
    const isImageUrlProxied = art.imageUrl && art.imageUrl.startsWith('/imgs/');
    const isThumbnailUrlProxied = art.thumbnailUrl && art.thumbnailUrl.startsWith('/imgs/');
    
    console.log('\n=== Resultados ===');
    console.log('A URL da imagem usa o proxy?', isImageUrlProxied ? 'SIM' : 'NÃO');
    console.log('A URL da miniatura usa o proxy?', isThumbnailUrlProxied ? 'SIM' : 'NÃO');
    
    if (!isImageUrlProxied || !isThumbnailUrlProxied) {
      console.log('\n⚠️  ATENÇÃO: Uma ou mais URLs não estão usando o formato de proxy (/imgs/)');
      console.log('URLs devem começar com "/imgs/" em vez de conter "dcodfuzoxmddmpvowhap.supabase.co"');
    } else {
      console.log('\n✅ SUCESSO: Todas as URLs de imagem estão usando o formato de proxy');
    }
  } catch (error) {
    console.error('Erro ao testar o proxy de imagens:', error);
  }
}

// Executar o teste
testImageProxy();