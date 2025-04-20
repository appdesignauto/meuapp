/**
 * Script para atualizar permanentemente as variáveis de ambiente do R2 no sistema
 * Garante que o nome correto do bucket "designautoimages" seja usado em todas as partes do sistema
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Caminho para o arquivo .env, se existir
const envPath = path.resolve(process.cwd(), '.env');

// Valores corretos para o R2
const correctValues = {
  R2_BUCKET_NAME: 'designautoimages',
  R2_PUBLIC_URL: 'https://pub-a063592364ea4478870d95c9c4115c4a.r2.dev',
  R2_ENDPOINT: '32b65e21b65af0345c36f5c43fa32c54',
  R2_ACCESS_KEY_ID: '21be81ed3af893e3ba85c2',
  R2_SECRET_ACCESS_KEY: 'c3e7cc28a2ffb45471cc57a2842735b5e524a7a0d2c5ff5a4cedb8145dbd1b4d'
};

console.log('========================');
console.log('R2 ENVIRONMENT UPDATER');
console.log('========================');
console.log('Este script garante que as variáveis de ambiente do R2 estejam');
console.log('configuradas corretamente e persistentes no sistema.\n');

// Verificar valores atuais no processo
console.log('Valores atuais no ambiente:');
Object.keys(correctValues).forEach(key => {
  const value = process.env[key];
  if (key.includes('KEY') || key.includes('SECRET')) {
    // Mascarar chaves sensíveis
    console.log(`- ${key}: ${value ? value.substring(0, 4) + '...' + value.substring(value.length - 4) : 'não definido'}`);
  } else {
    console.log(`- ${key}: ${value || 'não definido'}`);
  }
});

// Atualizar variáveis no ambiente atual
console.log('\nAtualizando variáveis de ambiente no processo atual...');
Object.entries(correctValues).forEach(([key, value]) => {
  process.env[key] = value;
});

// Se o arquivo .env existir, atualizar nele também
if (fs.existsSync(envPath)) {
  console.log(`\nAtualizando arquivo .env em ${envPath}...`);
  
  try {
    // Ler conteúdo existente
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Atualizar ou adicionar cada variável
    Object.entries(correctValues).forEach(([key, value]) => {
      // Verificar se a variável já existe no arquivo
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(envContent)) {
        // Substituir valor existente
        envContent = envContent.replace(regex, `${key}=${value}`);
        console.log(`- Atualizada variável ${key}`);
      } else {
        // Adicionar nova variável no final do arquivo
        envContent += `\n${key}=${value}`;
        console.log(`- Adicionada variável ${key}`);
      }
    });
    
    // Salvar arquivo atualizado
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('Arquivo .env atualizado com sucesso!');
  } catch (error) {
    console.error(`Erro ao atualizar arquivo .env: ${error.message}`);
  }
} else {
  console.log('\nArquivo .env não encontrado, criando novo arquivo...');
  
  try {
    // Criar conteúdo do arquivo
    let envContent = '';
    Object.entries(correctValues).forEach(([key, value]) => {
      envContent += `${key}=${value}\n`;
    });
    
    // Salvar novo arquivo
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`Novo arquivo .env criado em ${envPath}`);
  } catch (error) {
    console.error(`Erro ao criar arquivo .env: ${error.message}`);
  }
}

console.log('\nVariáveis de ambiente atualizadas no processo. Reinicie o servidor para aplicar completamente as alterações.');
console.log('\nConfiguração R2 atual:');
Object.keys(correctValues).forEach(key => {
  const value = process.env[key];
  if (key.includes('KEY') || key.includes('SECRET')) {
    // Mascarar chaves sensíveis
    console.log(`- ${key}: ${value ? value.substring(0, 4) + '...' + value.substring(value.length - 4) : 'não definido'}`);
  } else {
    console.log(`- ${key}: ${value || 'não definido'}`);
  }
});