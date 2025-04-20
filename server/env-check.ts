// Arquivo para verificar e corrigir as variáveis de ambiente na inicialização do servidor

// Validação e correção da configuração R2
export function validateR2Environment() {
  // Validar e corrigir o nome do bucket
  if (process.env.R2_BUCKET_NAME !== 'designautoimages') {
    console.log(`[ENV] Corrigindo R2_BUCKET_NAME de '${process.env.R2_BUCKET_NAME}' para 'designautoimages'`);
    process.env.R2_BUCKET_NAME = 'designautoimages';
  }

  // Validar e corrigir a URL pública
  const correctPublicUrl = 'https://pub-484b1f980bd24bb893017d5185fbfa93.r2.dev';
  if (process.env.R2_PUBLIC_URL !== correctPublicUrl) {
    console.log(`[ENV] Corrigindo R2_PUBLIC_URL para o valor correto`);
    process.env.R2_PUBLIC_URL = correctPublicUrl;
  }

  // Validar e corrigir o endpoint
  const correctEndpoint = '32b65e21b65af0345c36f5c43fa32c54';
  if (process.env.R2_ENDPOINT !== correctEndpoint) {
    console.log(`[ENV] Corrigindo R2_ENDPOINT para o valor correto`);
    process.env.R2_ENDPOINT = correctEndpoint;
  }

  // Validar a chave de acesso
  const correctAccessKey = '21be81ed3af893e3ba85c2';
  if (process.env.R2_ACCESS_KEY_ID !== correctAccessKey) {
    console.log(`[ENV] Corrigindo R2_ACCESS_KEY_ID para o valor correto`);
    process.env.R2_ACCESS_KEY_ID = correctAccessKey;
  }

  // Validar a chave secreta
  const correctSecretKey = 'c3e7cc28a2ffb45471cc57a2842735b5e524a7a0d2c5ff5a4cedb8145dbd1b4d';
  if (process.env.R2_SECRET_ACCESS_KEY !== correctSecretKey) {
    console.log(`[ENV] Corrigindo R2_SECRET_ACCESS_KEY para o valor correto`);
    process.env.R2_SECRET_ACCESS_KEY = correctSecretKey;
  }

  // Exibir a configuração final
  console.log('[ENV] Configuração R2 verificada e corrigida:');
  console.log(`- R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME}`);
  console.log(`- R2_ENDPOINT: ${process.env.R2_ENDPOINT}`);
  console.log(`- R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID?.substring(0, 4)}...${
    process.env.R2_ACCESS_KEY_ID?.substring(process.env.R2_ACCESS_KEY_ID.length - 4)
  }`);
  console.log(`- R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY?.substring(0, 4)}...${
    process.env.R2_SECRET_ACCESS_KEY?.substring(process.env.R2_SECRET_ACCESS_KEY.length - 4)
  }`);
  console.log(`- R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL}`);
}