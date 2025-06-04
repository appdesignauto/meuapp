import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as dotenv from 'dotenv';
dotenv.config();

// Configura o WebSocket constructor para o Neon
global.WebSocket = ws;

async function fixButtonFieldsCase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Verificando colunas da tabela popups...');

    // 1. Verificar se as colunas existem com o nome em lowercase
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'popups' 
      AND column_name IN ('buttonradius', 'buttonwidth');
    `);

    console.log('Colunas encontradas (lowercase):', checkResult.rows.map(r => r.column_name).join(', '));

    // 2. Criar alias temporário em uma view para corrigir o problema
    console.log('Criando view temporária para compatibilidade de nomes...');
    
    // Primeiro, remove a view se já existir
    try {
      await pool.query(`DROP VIEW IF EXISTS popups_view;`);
      console.log('View existente removida.');
    } catch (err) {
      console.error('Erro ao remover view existente:', err);
    }
    
    // Cria a view com os nomes corretos
    const createViewQuery = `
      CREATE VIEW popups_view AS
      SELECT 
        id,
        title,
        content,
        "imageUrl",
        "buttonText",
        "buttonUrl",
        "backgroundColor",
        "textColor",
        "buttonColor",
        "buttonTextColor",
        buttonradius as "buttonRadius",
        buttonwidth as "buttonWidth",
        position,
        size,
        animation,
        "startDate",
        "endDate",
        "showOnce",
        "showToLoggedUsers",
        "showToGuestUsers",
        "showToPremiumUsers",
        frequency,
        delay,
        "isActive",
        "createdBy",
        "createdAt",
        "updatedAt"
      FROM popups;
    `;
    
    await pool.query(createViewQuery);
    console.log('View criada com sucesso!');

    // 3. Atualizar as rotas para usar a view em vez da tabela direta
    console.log('\nIMPORTANTE: A view popups_view foi criada');
    console.log('Para resolver o problema, atualize o arquivo server/routes/popup-routes.ts:');
    console.log('1. Importe a view em vez da tabela:');
    console.log('   import { popupViews, popups } from "../../shared/schema";');
    console.log('   para');
    console.log('   import { popupViews } from "../../shared/schema";');
    console.log('   import { popups_view as popups } from "../../shared/schema";');
    console.log('\n2. Ou modifique o esquema em shared/schema.ts para usar nomes em lowercase:');
    console.log('   buttonRadius: integer("buttonradius").default(4),');
    console.log('   buttonWidth: text("buttonwidth").default("auto"),');

  } catch (err) {
    console.error('Erro ao corrigir colunas:', err);
  } finally {
    await pool.end();
  }
}

fixButtonFieldsCase()
  .then(() => console.log('Script concluído.'))
  .catch(err => console.error('Erro:', err));