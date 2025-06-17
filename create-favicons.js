/**
 * Script para criar favicons em múltiplos tamanhos usando Sharp
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Tamanhos de favicon necessários
const faviconSizes = [16, 32, 48, 64, 128, 152, 180];

async function createFavicons() {
  try {
    console.log('🔧 Criando favicons a partir da imagem fornecida...');
    
    // Criar diretório para favicons se não existir
    const faviconDir = './public/favicons';
    if (!fs.existsSync(faviconDir)) {
      fs.mkdirSync(faviconDir, { recursive: true });
    }
    
    // Gerar cada tamanho
    for (const size of faviconSizes) {
      await sharp('./attached_assets/favicon_1750196836416.png')
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(faviconDir, `favicon-${size}x${size}.png`));
      
      console.log(`✅ Criado: favicon-${size}x${size}.png`);
    }
    
    // Criar favicon.ico e favicon.png principais (16x16)
    await sharp('./attached_assets/favicon_1750196836416.png')
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile('./public/favicon.png');
      
    // Copiar o 16x16 como .ico também
    await sharp('./attached_assets/favicon_1750196836416.png')
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile('./public/favicon.ico');
    
    console.log('✅ Criado: favicon.ico e favicon.png');
    console.log('🎉 Todos os favicons foram criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar favicons:', error);
  }
}

createFavicons();