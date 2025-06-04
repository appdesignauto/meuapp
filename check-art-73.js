// Verificação simples de arte 73 e URLs de imagens
// Para verificar se as URLs de imagens estão sendo convertidas corretamente
const https = require('https');

const ART_ID = 73;
const DOMAIN = 'e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev';

// Função para verificar se uma URL é uma URL de proxy
function isProxiedUrl(url) {
  return url && url.startsWith('/imgs/');
}

// Função para verificar se uma URL é uma URL do Supabase
function isSupabaseUrl(url) {
  return url && url.includes('dcodfuzoxmddmpvowhap.supabase.co');
}

// Fazer uma requisição para o endpoint que retorna detalhes da arte
function getArtDetails(id) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: `/api/arts/${id}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Falha ao analisar JSON: ${e.message}, Dados: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Erro na requisição: ${e.message}`));
    });

    req.end();
  });
}

// Função principal para executar o teste
async function run() {
  try {
    console.log(`\n===== VERIFICANDO PROXY DE IMAGENS PARA ARTE ID ${ART_ID} =====\n`);
    const art = await getArtDetails(ART_ID);

    if (!art) {
      console.error('Erro: Não foi possível obter detalhes da arte.');
      return;
    }

    console.log('DETALHES DA ARTE:');
    console.log(`ID: ${art.id}`);
    console.log(`Título: ${art.title}`);
    console.log(`Categoria: ${art.categoryId}`);
    console.log(`Formato: ${art.format}`);
    console.log('------------------------------');

    // Verificar URLs de imagens
    console.log('\nURLs DE IMAGENS:');
    
    // Verificar a URL da imagem principal
    const imageUrl = art.imageUrl || '';
    console.log(`Image URL: ${imageUrl}`);
    console.log(`- É URL de proxy? ${isProxiedUrl(imageUrl) ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`- É URL do Supabase? ${isSupabaseUrl(imageUrl) ? 'SIM ❌' : 'NÃO ✅'}`);
    
    // Verificar a URL da miniatura
    const thumbnailUrl = art.thumbnailUrl || '';
    console.log(`\nThumbnail URL: ${thumbnailUrl}`);
    console.log(`- É URL de proxy? ${isProxiedUrl(thumbnailUrl) ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`- É URL do Supabase? ${isSupabaseUrl(thumbnailUrl) ? 'SIM ❌' : 'NÃO ✅'}`);
    
    // Resumo
    console.log('\n===== RESUMO =====');
    const imageProxied = isProxiedUrl(imageUrl);
    const thumbnailProxied = isProxiedUrl(thumbnailUrl);
    
    if (imageProxied && thumbnailProxied) {
      console.log('✅ SUCESSO: Todas as URLs de imagens estão usando o proxy!');
    } else if (!imageProxied && !thumbnailProxied) {
      console.log('❌ FALHA: Nenhuma URL de imagem está usando o proxy!');
    } else {
      console.log('⚠️ PARCIAL: Algumas URLs de imagens estão usando o proxy, outras não.');
    }
    
    // Verificar se as URLs do Supabase ainda estão presentes
    if (isSupabaseUrl(imageUrl) || isSupabaseUrl(thumbnailUrl)) {
      console.log('\n⚠️ ATENÇÃO: Ainda existem URLs do Supabase nos dados!');
      console.log('O middleware de conversão de URLs pode não estar funcionando corretamente.');
    } else {
      console.log('\n✅ As URLs do Supabase foram completamente substituídas pelos caminhos do proxy.');
    }
    
  } catch (error) {
    console.error('Erro ao executar verificação:', error);
  }
}

// Executar o teste
run();