/**
 * Script para atualizar o banco de dados com os novos ícones PWA
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appConfig } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function updatePwaDatabase() {
  try {
    console.log('Atualizando configuração PWA no banco de dados...');
    
    const timestamp = 1750200707375;
    const newIconPaths = {
      icon_192: `/icons/icon-192-${timestamp}.png`,
      icon_512: `/icons/icon-512-${timestamp}.png`
    };
    
    // Buscar configuração existente
    const existingConfig = await db.select().from(appConfig).limit(1);
    
    if (existingConfig.length > 0) {
      // Atualizar configuração existente
      await db.update(appConfig)
        .set({
          icon_192: newIconPaths.icon_192,
          icon_512: newIconPaths.icon_512,
          updated_at: new Date()
        })
        .where(eq(appConfig.id, existingConfig[0].id));
      
      console.log('Configuração PWA atualizada:', newIconPaths);
    } else {
      // Criar nova configuração
      await db.insert(appConfig).values({
        name: 'DesignAuto',
        short_name: 'DesignAuto',
        description: 'Plataforma de artes automobilísticas editáveis para profissionais de vendas.',
        theme_color: '#1e3b61',
        background_color: '#ffffff',
        icon_192: newIconPaths.icon_192,
        icon_512: newIconPaths.icon_512,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('Nova configuração PWA criada:', newIconPaths);
    }
    
    await client.end();
    console.log('Banco de dados atualizado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao atualizar banco de dados:', error);
    await client.end();
    throw error;
  }
}

updatePwaDatabase();