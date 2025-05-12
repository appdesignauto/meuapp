import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function createAppConfigTable() {
  try {
    console.log('Criando tabela app_config...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_config (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'DesignAuto',
        short_name TEXT NOT NULL DEFAULT 'DesignAuto',
        theme_color TEXT NOT NULL DEFAULT '#4F46E5',
        background_color TEXT NOT NULL DEFAULT '#FFFFFF',
        icon_192 TEXT NOT NULL DEFAULT '/icons/icon-192.png',
        icon_512 TEXT NOT NULL DEFAULT '/icons/icon-512.png',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id)
      );
    `);
    
    // Verificar se já existe algum registro
    const existingConfig = await db.execute(sql`SELECT COUNT(*) as count FROM app_config`);
    
    // Se não existir nenhum registro, criar um com valores padrão
    if (existingConfig[0].count === '0') {
      console.log('Inserindo configuração padrão...');
      await db.execute(sql`
        INSERT INTO app_config (name, short_name, theme_color, background_color)
        VALUES ('DesignAuto', 'DesignAuto', '#4F46E5', '#FFFFFF');
      `);
    }
    
    console.log('Tabela app_config criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela app_config:', error);
  } finally {
    process.exit(0);
  }
}

createAppConfigTable();
