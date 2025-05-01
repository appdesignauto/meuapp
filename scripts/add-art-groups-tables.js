/**
 * Script para adicionar as tabelas de grupos de arte e variações
 * Uso: node scripts/add-art-groups-tables.js
 */

import 'dotenv/config';
import { Pool } from 'pg';

async function addArtGroupsTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Iniciando criação das tabelas de grupos de arte e variações...');

    // Criar tabela de grupos de arte
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "artGroups" (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        isPremium BOOLEAN DEFAULT false,
        designerId INTEGER REFERENCES users(id),
        categoryId INTEGER REFERENCES categories(id),
        isVisible BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'active',
        downloadCount INTEGER DEFAULT 0,
        viewCount INTEGER DEFAULT 0,
        likeCount INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela artGroups criada com sucesso!');

    // Criar tabela de variações de arte
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "artVariations" (
        id SERIAL PRIMARY KEY,
        groupId INTEGER REFERENCES "artGroups"(id) ON DELETE CASCADE,
        artId INTEGER REFERENCES arts(id) ON DELETE CASCADE,
        formatId INTEGER REFERENCES formats(id),
        fileTypeId INTEGER REFERENCES "fileTypes"(id),
        imageUrl TEXT NOT NULL,
        editUrl TEXT,
        width INTEGER,
        height INTEGER,
        aspectRatio VARCHAR(20),
        isPrimary BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela artVariations criada com sucesso!');

    // Adicionar índices para melhorar a performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_artgroups_designerid ON "artGroups"(designerId);
      CREATE INDEX IF NOT EXISTS idx_artgroups_categoryid ON "artGroups"(categoryId);
      CREATE INDEX IF NOT EXISTS idx_artgroups_ispremium ON "artGroups"(isPremium);
      CREATE INDEX IF NOT EXISTS idx_artgroups_isvisible ON "artGroups"(isVisible);
      CREATE INDEX IF NOT EXISTS idx_artvariations_groupid ON "artVariations"(groupId);
      CREATE INDEX IF NOT EXISTS idx_artvariations_artid ON "artVariations"(artId);
      CREATE INDEX IF NOT EXISTS idx_artvariations_formatid ON "artVariations"(formatId);
      CREATE INDEX IF NOT EXISTS idx_artvariations_filetypeid ON "artVariations"(fileTypeId);
      CREATE INDEX IF NOT EXISTS idx_artvariations_isprimary ON "artVariations"(isPrimary);
    `);
    console.log('✅ Índices criados com sucesso!');

    console.log('✅ Tabelas de grupos de arte e variações criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar a função principal
addArtGroupsTables()
  .then(() => console.log('✅ Script concluído com sucesso!'))
  .catch(error => console.error('❌ Erro ao executar script:', error))
  .finally(() => process.exit());