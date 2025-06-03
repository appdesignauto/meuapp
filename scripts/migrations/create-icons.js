import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createIcon(size) {
  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  const radius = size * 0.125; // Rounded corners
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // Draw text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.28}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('D.A', size / 2, size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'public', 'icons', `icon-${size}.png`), buffer);
  console.log(`Created icon-${size}.png`);
}

// Create icons for required sizes
createIcon(192);
createIcon(512);

console.log('Icons created successfully');