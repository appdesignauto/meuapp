/**
 * Script para migrar artes existentes para o novo modelo de múltiplos formatos
 * Uso: node scripts/migrate-arts-to-groups.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateArtsToGroups() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Obter todas as artes existentes
    console.log('Buscando artes existentes...');
    const { rows: arts } = await client.query(`
      SELECT * FROM "arts" ORDER BY "id"
    `);
    
    console.log(`Encontradas ${arts.length} artes para migrar.`);
    
    // 2. Mapear formatos para IDs
    const { rows: formats } = await client.query(`SELECT * FROM "formats"`);
    const formatMap = {};
    formats.forEach(format => {
      formatMap[format.name.toLowerCase()] = format.id;
    });
    
    // Formato padrão (Feed) caso não seja encontrado
    const defaultFormatId = formats.find(f => f.name.toLowerCase() === 'feed')?.id || 1;
    
    // 3. Mapear fileTypes para IDs
    const { rows: fileTypes } = await client.query(`SELECT * FROM "fileTypes"`);
    const fileTypeMap = {};
    fileTypes.forEach(type => {
      fileTypeMap[type.name.toLowerCase()] = type.id;
    });
    
    // FileType padrão (Canva) caso não seja encontrado
    const defaultFileTypeId = fileTypes.find(f => f.name.toLowerCase() === 'canva')?.id || 1;
    
    // 4. Migrar cada arte para o novo modelo
    console.log('Migrando artes para o novo modelo...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const art of arts) {
      try {
        // Criar grupo para a arte
        const { rows: [newGroup] } = await client.query(`
          INSERT INTO "artGroups" (
            "title", "categoryId", "designerId", "isVisible", "isPremium",
            "status", "downloadCount", "viewCount", "likeCount", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING "id"
        `, [
          art.title,
          art.categoryId,
          art.designerid || null,
          art.status !== 'rejected', // isVisible baseado no status
          art.isPremium,
          art.status,
          art.downloadCount,
          art.viewCount,
          art.likeCount,
          art.createdAt,
          art.updatedAt
        ]);
        
        // Determinar o formato e tipo de arquivo
        let formatId = defaultFormatId;
        if (art.format) {
          // Tentar encontrar o formato pelo nome
          const formatName = art.format.toLowerCase();
          formatId = formatMap[formatName] || defaultFormatId;
        }
        
        let fileTypeId = defaultFileTypeId;
        if (art.fileType) {
          // Tentar encontrar o tipo de arquivo pelo nome
          const fileTypeName = art.fileType.toLowerCase();
          fileTypeId = fileTypeMap[fileTypeName] || defaultFileTypeId;
        }
        
        // Extrair dimensões e ratio do nome da arte ou valores padrão
        let width = null;
        let height = null;
        let aspectRatio = null;
        
        if (art.width && art.height) {
          width = art.width;
          height = art.height;
          aspectRatio = `${width}/${height}`;
        } else if (art.aspectratio) {
          aspectRatio = art.aspectratio;
          // Tentar extrair width/height do aspectRatio
          const parts = aspectRatio.split('/');
          if (parts.length === 2) {
            width = parseInt(parts[0]);
            height = parseInt(parts[1]);
          }
        }
        
        // Criar a variação para esta arte (sempre como primária)
        await client.query(`
          INSERT INTO "artVariations" (
            "groupId", "formatId", "imageUrl", "editUrl", "fileTypeId",
            "width", "height", "aspectRatio", "isPrimary", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          newGroup.id,
          formatId,
          art.imageUrl,
          art.editUrl,
          fileTypeId,
          width,
          height,
          aspectRatio,
          true, // Sempre marca como primária pois é a única variação
          art.createdAt,
          art.updatedAt
        ]);
        
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`Progresso: ${successCount}/${arts.length} artes migradas`);
        }
      } catch (error) {
        console.error(`Erro ao migrar arte ID ${art.id}:`, error.message);
        errorCount++;
      }
    }
    
    await client.query('COMMIT');
    console.log(`
      Migração concluída:
      - Total de artes: ${arts.length}
      - Sucessos: ${successCount}
      - Erros: ${errorCount}
    `);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro durante a migração:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar a função principal
migrateArtsToGroups()
  .then(() => {
    console.log('Processo de migração concluído.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Falha no processo de migração:', err);
    process.exit(1);
  });