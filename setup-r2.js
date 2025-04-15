// Script para configurar as variáveis de ambiente do R2
import fs from 'fs';
import path from 'path';

// Valores corretos capturados das imagens
const R2_ACCESS_KEY_ID = '21be81ed3af893e3ba85c2';
const R2_SECRET_ACCESS_KEY = 'c3e7cc28a2ffb45471cc57a2842735b5e524a7a0d2c5ff5a4cedb8145dbd1b4d';
const R2_ENDPOINT = '32b65e21b65af0345c36f5c43fa32c54';
const R2_BUCKET_NAME = 'designauto-images';
const R2_PUBLIC_URL = 'https://pub-a063592364ea4478870d95c9c4115c4a.r2.dev';

// Preparar as variáveis no formato de linha de comando
const envVars = {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL
};

// Imprimir os valores para verificação
console.log('Configurando variáveis de ambiente para o R2:');
Object.entries(envVars).forEach(([key, value]) => {
  if (key.includes('SECRET') || key.includes('KEY')) {
    console.log(`- ${key}: ${value.substring(0, 4)}...${value.substring(value.length - 4)} (${value.length} caracteres)`);
  } else {
    console.log(`- ${key}: ${value}`);
  }
});

// Verificar se as variáveis já estão definidas no ambiente
console.log('\nValores atuais no ambiente:');
Object.keys(envVars).forEach(key => {
  if (process.env[key]) {
    if (key.includes('SECRET') || key.includes('KEY')) {
      console.log(`- ${key}: ${process.env[key].substring(0, 4)}...${process.env[key].substring(process.env[key].length - 4)} (${process.env[key].length} caracteres)`);
    } else {
      console.log(`- ${key}: ${process.env[key]}`);
    }
  } else {
    console.log(`- ${key}: não definido`);
  }
});

// Definir as variáveis de ambiente
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

console.log('\nVariáveis de ambiente atualizadas com sucesso.');
console.log('Reinicie o servidor para aplicar as alterações.');