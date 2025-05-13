/**
 * Script para criar screenshots para o PWA usando Canvas
 * Este script cria capturas de tela para desktop e mobile para melhorar
 * a interface de instalação do PWA
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const screenshotsDir = path.join(__dirname, '../public/screenshots');

// Assegurar que o diretório existe
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log(`Diretório ${screenshotsDir} criado`);
}

// Criar screenshot para desktop (1280x720)
function createDesktopScreenshot() {
  console.log('Criando screenshot para desktop (1280x720)...');
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');

  // Fundo com gradiente azul
  const gradient = ctx.createLinearGradient(0, 0, 0, 720);
  gradient.addColorStop(0, '#1e40af');
  gradient.addColorStop(1, '#3b82f6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1280, 720);

  // Área central do conteúdo com fundo mais claro
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(20, 80, 1240, 620);

  // Cabeçalho
  ctx.fillStyle = 'white';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Design Auto', 640, 50);

  // Título principal
  ctx.font = 'bold 48px Arial';
  ctx.fillText('A MAIOR PLATAFORMA DE', 640, 200);
  ctx.fillStyle = '#60a5fa';
  ctx.fillText('ARTES AUTOMOTIVAS', 640, 260);

  // Simulação de grid de artes (retângulos coloridos)
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Designs recentes', 640, 340);

  // Simulação de 4 cards de arte em uma linha
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
  const cardWidth = 250;
  const cardHeight = 150;
  const startX = (1280 - (cardWidth * 4 + 30 * 3)) / 2;
  const startY = 380;

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(startX + i * (cardWidth + 30), startY, cardWidth, cardHeight);
    
    // Adicionar um ícone fictício
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(startX + i * (cardWidth + 30) + cardWidth/2, startY + cardHeight/2, 30, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Salvar a imagem
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(screenshotsDir, 'home.png'), buffer);
  console.log(`Screenshot desktop salvo como ${path.join(screenshotsDir, 'home.png')}`);
}

// Criar screenshot para mobile (540x1080)
function createMobileScreenshot() {
  console.log('Criando screenshot para mobile (540x1080)...');
  const canvas = createCanvas(540, 1080);
  const ctx = canvas.getContext('2d');

  // Fundo com gradiente azul
  const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
  gradient.addColorStop(0, '#1e40af');
  gradient.addColorStop(1, '#3b82f6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 540, 1080);

  // Área central do conteúdo com fundo mais claro
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(20, 80, 500, 980);

  // Cabeçalho
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Design Auto', 270, 50);

  // Título principal
  ctx.font = 'bold 32px Arial';
  ctx.fillText('A MAIOR PLATAFORMA', 270, 150);
  ctx.fillText('DE', 270, 190);
  ctx.fillStyle = '#60a5fa';
  ctx.fillText('ARTES AUTOMOTIVAS', 270, 230);

  // Simulação de grid de artes (retângulos coloridos em 2x2)
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Designs recentes', 270, 300);

  // Simulação de 4 cards de arte em grade 2x2
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
  const cardWidth = 220;
  const cardHeight = 180;
  const startX = (540 - (cardWidth * 2 + 20)) / 2;
  const startY = 340;

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const index = row * 2 + col;
      ctx.fillStyle = colors[index];
      ctx.fillRect(
        startX + col * (cardWidth + 20), 
        startY + row * (cardHeight + 20), 
        cardWidth, 
        cardHeight
      );
      
      // Adicionar um ícone fictício
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(
        startX + col * (cardWidth + 20) + cardWidth/2, 
        startY + row * (cardHeight + 20) + cardHeight/2, 
        25, 
        0, 
        2 * Math.PI
      );
      ctx.fill();
    }
  }

  // Simulação de botões de navegação
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(50, 800, 440, 60);
  ctx.fillStyle = 'white';
  ctx.font = '18px Arial';
  ctx.fillText('Pesquisar artes', 270, 835);

  ctx.fillStyle = '#1e40af';
  ctx.fillRect(50, 880, 440, 60);
  ctx.fillStyle = 'white';
  ctx.fillText('Ver categorias', 270, 915);

  // Salvar a imagem
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(screenshotsDir, 'mobile.png'), buffer);
  console.log(`Screenshot mobile salvo como ${path.join(screenshotsDir, 'mobile.png')}`);
}

// Executar as funções de criação
try {
  createDesktopScreenshot();
  createMobileScreenshot();
  console.log('Capturas de tela para PWA criadas com sucesso!');
} catch (error) {
  console.error('Erro ao criar capturas de tela:', error);
}