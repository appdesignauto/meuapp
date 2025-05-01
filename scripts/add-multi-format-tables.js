/**
 * Script para adicionar as tabelas de múltiplos formatos de arte
 * Uso: node scripts/add-multi-format-tables.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addMultiFormatTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Criando tabela artGroups...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "artGroups" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "categoryId" INTEGER NOT NULL,
        "designerId" INTEGER NOT NULL,
        "isVisible" BOOLEAN DEFAULT TRUE NOT NULL,
        "isPremium" BOOLEAN DEFAULT FALSE NOT NULL,
        "status" TEXT DEFAULT 'approved' NOT NULL,
        "downloadCount" INTEGER DEFAULT 0 NOT NULL,
        "viewCount" INTEGER DEFAULT 0 NOT NULL,
        "likeCount" INTEGER DEFAULT 0 NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        FOREIGN KEY ("categoryId") REFERENCES "categories"("id"),
        FOREIGN KEY ("designerId") REFERENCES "users"("id")
      )
    `);
    
    console.log('Criando tabela artVariations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "artVariations" (
        "id" SERIAL PRIMARY KEY,
        "groupId" INTEGER NOT NULL,
        "formatId" INTEGER NOT NULL,
        "imageUrl" TEXT NOT NULL,
        "editUrl" TEXT NOT NULL,
        "fileTypeId" INTEGER NOT NULL,
        "width" INTEGER,
        "height" INTEGER,
        "aspectRatio" TEXT,
        "isPrimary" BOOLEAN DEFAULT FALSE NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        FOREIGN KEY ("groupId") REFERENCES "artGroups"("id") ON DELETE CASCADE,
        FOREIGN KEY ("formatId") REFERENCES "formats"("id"),
        FOREIGN KEY ("fileTypeId") REFERENCES "fileTypes"("id")
      )
    `);
    
    console.log('Criando índices para melhorar performance de consultas...');
    // Adicionar índices para otimizar consultas comuns
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_artGroups_categoryId" ON "artGroups" ("categoryId");
      CREATE INDEX IF NOT EXISTS "idx_artGroups_designerId" ON "artGroups" ("designerId");
      CREATE INDEX IF NOT EXISTS "idx_artVariations_groupId" ON "artVariations" ("groupId");
      CREATE INDEX IF NOT EXISTS "idx_artVariations_formatId" ON "artVariations" ("formatId");
      CREATE INDEX IF NOT EXISTS "idx_artVariations_isPrimary" ON "artVariations" ("isPrimary");
    `);
    
    await client.query('COMMIT');
    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar tabelas:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar a função principal
addMultiFormatTables()
  .then(() => {
    console.log('Processo concluído com sucesso.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Falha no processo:', err);
    process.exit(1);
  });