const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

// Converte SVG para PNG nas duas resoluções para uso em manifest.json
async function convertIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    try {
      const svgPath = path.join('public', 'icons', `icon-${size}.svg`);
      const pngPath = path.join('public', 'icons', `icon-${size}.png`);
      
      console.log(`Convertendo ${svgPath} para ${pngPath}`);
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
        
      console.log(`Ícone ${pngPath} criado com sucesso!`);
    } catch (err) {
      console.error(`Erro ao converter ícone ${size}:`, err);
    }
  }
}

convertIcons();
