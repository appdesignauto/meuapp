/**
 * Script para adicionar designerId às artes existentes
 * Uso: node scripts/update-arts-designer.js
 */

import { pool, db } from '../server/db.js';
import { arts, users } from '../migrations/schema.js';
import { eq } from 'drizzle-orm';

async function updateDesignerId() {
  try {
    console.log('Conectando ao banco de dados...');
    
    // Buscar o ID do usuário admin
    const [admin] = await db.query.users.findMany({
      where: eq(users.role, 'admin'),
      limit: 1
    });
    
    if (!admin) {
      console.error('Usuário admin não encontrado. Crie um usuário admin primeiro.');
      process.exit(1);
    }
    
    console.log(`Atualizando todas as artes para o designer ID: ${admin.id}`);
    
    // Atualizar todas as artes com o designerId do admin
    const result = await db
      .update(arts)
      .set({ designerId: admin.id })
      .where(eq(arts.designerId, null));
    
    console.log(`Atualização concluída! Artes atualizadas.`);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao atualizar artes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateDesignerId();