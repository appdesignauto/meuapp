/**
 * Script para atualizar os ícones PWA com as novas imagens fornecidas
 * Converte e otimiza as imagens usando Sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updatePwaIcons() {
  try {
    console.log('🔄 Iniciando atualização dos ícones PWA...');
    
    // Caminhos das imagens originais
    const icon192Path = path.join(__dirname, 'attached_assets', 'logo pwa 192_1750200649203.png');
    const icon512Path = path.join(__dirname, 'attached_assets', 'logo pwa 512_1750200649203.png');
    
    // Diretório de destino
    const publicDir = path.join(__dirname, 'public');
    const iconsDir = path.join(publicDir, 'icons');
    
    // Criar diretório se não existir
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    
    // Verificar se os arquivos existem
    if (!fs.existsSync(icon192Path)) {
      throw new Error(`Arquivo não encontrado: ${icon192Path}`);
    }
    if (!fs.existsSync(icon512Path)) {
      throw new Error(`Arquivo não encontrado: ${icon512Path}`);
    }
    
    const timestamp = Date.now();
    
    // Processar ícone 192x192
    console.log('📱 Processando ícone 192x192...');
    await sharp(icon192Path)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 90, compressionLevel: 6 })
      .toFile(path.join(iconsDir, `icon-192-${timestamp}.png`));
    
    // Processar ícone 512x512
    console.log('📱 Processando ícone 512x512...');
    await sharp(icon512Path)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 90, compressionLevel: 6 })
      .toFile(path.join(iconsDir, `icon-512-${timestamp}.png`));
    
    // Criar também ícones maskable (com padding)
    console.log('🎭 Criando ícones maskable...');
    await sharp(icon192Path)
      .resize(154, 154) // 192 * 0.8 = 154 (safe area para maskable)
      .extend({
        top: 19,
        bottom: 19,
        left: 19,
        right: 19,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 90, compressionLevel: 6 })
      .toFile(path.join(iconsDir, `icon-192-maskable-${timestamp}.png`));
    
    await sharp(icon512Path)
      .resize(410, 410) // 512 * 0.8 = 410 (safe area para maskable)
      .extend({
        top: 51,
        bottom: 51,
        left: 51,
        right: 51,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png({ quality: 90, compressionLevel: 6 })
      .toFile(path.join(iconsDir, `icon-512-maskable-${timestamp}.png`));
    
    console.log('✅ Ícones PWA atualizados com sucesso!');
    console.log(`📁 Arquivos criados em: ${iconsDir}`);
    console.log(`🕒 Timestamp: ${timestamp}`);
    
    return {
      icon192: `/icons/icon-192-${timestamp}.png`,
      icon512: `/icons/icon-512-${timestamp}.png`,
      icon192Maskable: `/icons/icon-192-maskable-${timestamp}.png`,
      icon512Maskable: `/icons/icon-512-maskable-${timestamp}.png`,
      timestamp
    };
    
  } catch (error) {
    console.error('❌ Erro ao atualizar ícones PWA:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePwaIcons()
    .then((result) => {
      console.log('🎉 Atualização concluída:', result);
    })
    .catch((error) => {
      console.error('💥 Falha na atualização:', error);
      process.exit(1);
    });
}

export { updatePwaIcons };