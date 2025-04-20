// Script para atualizar o nome do bucket R2
import fs from 'fs';
import path from 'path';

// Atualizar para o nome correto do bucket
const R2_BUCKET_NAME = 'designautoimages';

// Imprimir os valores atuais
console.log('Valor atual da variável R2_BUCKET_NAME no ambiente:');
console.log(`- R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME || 'não definido'}`);

// Atualizar a variável de ambiente
process.env.R2_BUCKET_NAME = R2_BUCKET_NAME;

console.log('\nVariável de ambiente atualizada com sucesso:');
console.log(`- R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME}`);

console.log('\nReinicie o servidor para aplicar as alterações.');