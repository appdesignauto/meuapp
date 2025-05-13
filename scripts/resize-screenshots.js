/**
 * Script para redimensionar as screenshots do PWA para os tamanhos exatos exigidos pelo Chrome
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, '../public/screenshots');

// Garantir que o diretório de screenshots existe
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Redimensionar a screenshot para desktop (1280x720)
async function resizeDesktopScreenshot() {
  const sourcePath = path.join(screenshotsDir, 'home.png');
  const targetPath = path.join(screenshotsDir, 'home-resized.png');
  
  try {
    if (!fs.existsSync(sourcePath)) {
      console.error(`Arquivo de origem não encontrado: ${sourcePath}`);
      return;
    }
    
    await sharp(sourcePath)
      .resize(1280, 720, { fit: 'fill' })
      .toFile(targetPath);
    
    // Substituir o arquivo original pelo redimensionado
    fs.unlinkSync(sourcePath);
    fs.renameSync(targetPath, sourcePath);
    
    console.log(`Screenshot desktop redimensionado para 1280x720: ${sourcePath}`);
  } catch (error) {
    console.error('Erro ao redimensionar screenshot desktop:', error);
  }
}

// Redimensionar a screenshot para mobile (540x1080)
async function resizeMobileScreenshot() {
  const sourcePath = path.join(screenshotsDir, 'mobile.png');
  const targetPath = path.join(screenshotsDir, 'mobile-resized.png');
  
  try {
    if (!fs.existsSync(sourcePath)) {
      console.error(`Arquivo de origem não encontrado: ${sourcePath}`);
      return;
    }
    
    await sharp(sourcePath)
      .resize(540, 1080, { fit: 'fill' })
      .toFile(targetPath);
    
    // Substituir o arquivo original pelo redimensionado
    fs.unlinkSync(sourcePath);
    fs.renameSync(targetPath, sourcePath);
    
    console.log(`Screenshot mobile redimensionado para 540x1080: ${sourcePath}`);
  } catch (error) {
    console.error('Erro ao redimensionar screenshot mobile:', error);
  }
}

// Executar os redimensionamentos
(async () => {
  try {
    await resizeDesktopScreenshot();
    await resizeMobileScreenshot();
    console.log('Redimensionamento de screenshots concluído com sucesso');
  } catch (error) {
    console.error('Erro durante o redimensionamento:', error);
  }
})();