/**
 * Script para criar os ícones PWA padrão usando o Canvas
 * Este script cria os ícones PNG de 192x192 e 512x512 necessários para o PWA
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

console.log('Criando ícones padrão para o PWA...');

// Verifica e cria o diretório de ícones se não existir
const iconDir = './public/icons';
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
  console.log('Diretório de ícones criado:', iconDir);
}

function createIcon(size, color = '#1e40af', text = 'DA') {
  try {
    console.log(`Criando ícone ${size}x${size}...`);
    
    // Criar canvas com o tamanho desejado
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Cor de fundo
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    
    // Texto centralizado
    ctx.fillStyle = 'white';
    const fontSize = Math.floor(size * 0.4); // 40% do tamanho do ícone
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);
    
    // Salvar como PNG
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(iconDir, `icon-${size}.png`);
    
    fs.writeFileSync(filePath, buffer);
    console.log(`Ícone ${size}x${size} criado com sucesso em ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`Erro ao criar ícone ${size}x${size}:`, error);
    return false;
  }
}

// Criar os ícones nos tamanhos padrão
createIcon(192);
createIcon(512);

console.log('Processo de criação de ícones concluído!');