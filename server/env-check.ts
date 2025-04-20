// Arquivo para verificar e corrigir as variáveis de ambiente na inicialização do servidor

// Aviso de migração do R2 para Supabase Storage
export function validateR2Environment() {
  console.log('[ENV] ⚠️ AVISO: O serviço R2 foi desativado. Todas as operações agora usam exclusivamente Supabase Storage.');
  
  // Definir valores apenas para manter compatibilidade com código legado
  process.env.R2_BUCKET_NAME = 'designautoimages';
  process.env.R2_PUBLIC_URL = 'https://pub-484b1f980bd24bb893017d5185fbfa93.r2.dev';
  process.env.R2_ENDPOINT = '32b65e21b65af0345c36f5c43fa32c54';
  process.env.R2_ACCESS_KEY_ID = '21be81ed3af893e3ba85c2';
  process.env.R2_SECRET_ACCESS_KEY = 'c3e7cc28a2ffb45471cc57a2842735b5e524a7a0d2c5ff5a4cedb8145dbd1b4d';

  // Exibir a configuração apenas para registro
  console.log('[ENV] Variáveis de ambiente do R2 mantidas apenas para compatibilidade:');
  console.log(`- R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME}`);
  console.log(`- R2_ENDPOINT: ${process.env.R2_ENDPOINT.substring(0, 6)}... (abreviado)`);
  console.log(`- R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID?.substring(0, 4)}... (abreviado)`);
  console.log(`- R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY?.substring(0, 4)}... (abreviado)`);
  console.log(`- R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL.substring(0, 20)}... (abreviado)`);
  console.log('[ENV] ✅ Todas as operações de armazenamento foram migradas para Supabase Storage.');
}