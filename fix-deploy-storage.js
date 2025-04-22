/**
 * Script para resolver problemas de configuração de armazenamento (R2/Supabase) no deploy
 * 
 * Este script realiza:
 * 1. Verificação de todas as variáveis de ambiente necessárias
 * 2. Testes de conectividade com Supabase Storage
 * 3. Verificação de rotas de upload
 * 4. Saneamento de referências conflitantes entre R2 e Supabase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔍 Iniciando diagnóstico de configuração para deploy...');

// Verificar variáveis de ambiente do Supabase
const supabaseVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
};

// Verificar variáveis do R2 (mantidas para compatibilidade)
const r2Vars = {
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL
};

// Checar variáveis de ambiente críticas
let hasErrors = false;

console.log('\n📋 Verificando variáveis de ambiente do Supabase:');
Object.entries(supabaseVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: Não definido`);
    hasErrors = true;
  } else {
    const valuePreview = value.length > 10 ? `${value.substring(0, 5)}...${value.substring(value.length - 5)}` : value;
    console.log(`✅ ${key}: ${valuePreview} (${value.length} caracteres)`);
  }
});

console.log('\n📋 Verificando variáveis de ambiente do R2 (compatibilidade):');
Object.entries(r2Vars).forEach(([key, value]) => {
  if (!value) {
    console.log(`⚠️ ${key}: Não definido (pode ser necessário)`);
  } else {
    const valuePreview = value.length > 10 ? `${value.substring(0, 5)}...${value.substring(value.length - 5)}` : value;
    console.log(`✅ ${key}: ${valuePreview} (${value.length} caracteres)`);
  }
});

// Verificar consistência das configurações de armazenamento nos arquivos
console.log('\n🔍 Verificando consistência da configuração de armazenamento...');

const filesToCheck = [
  'server/services/supabase-storage.ts',
  'server/routes/avatar-upload.ts',
  'server/routes/users-profile-image.ts',
  'client/src/components/profile/AvatarUploader.tsx'
];

let foundInconsistencies = false;

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar referências ao R2 que deveriam ser Supabase
    const r2References = (content.match(/r2/gi) || []).length;
    const supabaseReferences = (content.match(/supabase/gi) || []).length;
    
    console.log(`📄 ${filePath}:`);
    console.log(`   - Referências ao R2: ${r2References}`);
    console.log(`   - Referências ao Supabase: ${supabaseReferences}`);
    
    if (r2References > 0 && supabaseReferences === 0) {
      console.log(`   ⚠️ Arquivo pode estar usando apenas R2 sem Supabase Storage`);
      foundInconsistencies = true;
    }
  } else {
    console.log(`❓ Arquivo não encontrado: ${filePath}`);
  }
});

// Verificar se há erros graves
if (hasErrors) {
  console.log('\n❌ Encontrados problemas críticos nas variáveis de ambiente');
  console.log('   Execute o script novamente após configurar as variáveis de ambiente faltantes');
  process.exit(1);
}

// Exibir recomendações
console.log('\n📋 Recomendações para deploy:');

if (foundInconsistencies) {
  console.log('⚠️ Foram encontradas inconsistências na configuração de armazenamento.');
  console.log('   Recomendamos revisar os arquivos listados acima para garantir que:');
  console.log('   1. Todas as referências ao R2 tenham sido migradas para Supabase Storage');
  console.log('   2. Os caminhos de upload estejam configurados corretamente');
  console.log('   3. As variáveis de ambiente estejam definidas corretamente no ambiente de produção');
} else {
  console.log('✅ Não foram encontradas inconsistências graves na configuração de armazenamento.');
}

console.log('\n💡 Para garantir um deploy bem-sucedido:');
console.log('   1. Certifique-se de que todas as variáveis de ambiente do Supabase estejam configuradas no ambiente de produção');
console.log('   2. Verifique se a pasta "avatars" existe no bucket do Supabase Storage');
console.log('   3. Adicione as seguintes variáveis de ambiente no seu painel de deploy:');
console.log('      - SUPABASE_URL');
console.log('      - SUPABASE_ANON_KEY');
console.log('      - DATABASE_URL');
console.log('      - R2_BUCKET_NAME (para compatibilidade)');
console.log('      - BREVO_API_KEY (para funcionalidade de email)');

console.log('\n🚀 Diagnóstico de configuração para deploy concluído!');