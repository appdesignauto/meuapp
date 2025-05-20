/**
 * Script para redimensionar o screenshot desktop para 1280x720
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

// Executar o redimensionamento
(async () => {
  try {
    await resizeDesktopScreenshot();
    console.log('Redimensionamento do screenshot concluído com sucesso');
  } catch (error) {
    console.error('Erro durante o redimensionamento:', error);
  }
})();