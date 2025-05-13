import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório de ícones se não existir
const iconDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Função para criar ícone quadrado com cor de fundo e texto
function createIcon(size, color = '#1e40af', text = 'DA') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Preencher fundo
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Adicionar texto (iniciais)
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);
  
  // Salvar como PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconDir, `icon-${size}.png`), buffer);
  console.log(`Ícone ${size}x${size} criado com sucesso`);
}

// Criar ícones com tamanhos requeridos para PWA
createIcon(192);
createIcon(512);
