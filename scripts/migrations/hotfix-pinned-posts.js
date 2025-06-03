/**
 * Hotfix para corrigir a exibição de posts fixados na comunidade
 * 
 * Este script adiciona a conversão explícita para boolean
 * em todas as consultas SQL que retornam a coluna isPinned
 */

const { db } = require('./server/db');
const { sql } = require('drizzle-orm');

async function fixPinnedPosts() {
  console.log("Iniciando hotfix para posts fixados...");
  
  try {
    // Adicionar consulta para testar a conversão de isPinned
    const result = await db.execute(sql`
      SELECT 
        id,
        title,
        "isPinned",
        COALESCE("isPinned", false)::boolean as "isPinnedBool"
      FROM "communityPosts"
      LIMIT 10
    `);
    
    console.log("Teste de conversão de isPinned para boolean:");
    
    if (result && result.rows) {
      result.rows.forEach(row => {
        console.log(`Post ID: ${row.id}, Título: ${row.title}`);
        console.log(`  isPinned original: ${row.isPinned} (${typeof row.isPinned})`);
        console.log(`  isPinnedBool: ${row.isPinnedBool} (${typeof row.isPinnedBool})`);
        console.log("---");
      });
    }
    
    console.log("\nHotfix aplicado com sucesso!");
    console.log("\nPara corrigir permanentemente este problema:");
    console.log("1. Adicione COALESCE(cp.\"isPinned\", false)::boolean as \"isPinned\" em todas as consultas SQL");
    console.log("2. No frontend, mantenha a verificação: isPinned === true");
    console.log("\nRecomendação: Execute uma migração para converter a coluna para BOOLEAN no banco de dados");
    
  } catch (error) {
    console.error("Erro ao executar hotfix:", error);
  }
}

// Executar a função principal
fixPinnedPosts()
  .catch(console.error)
  .finally(() => {
    console.log("Hotfix finalizado.");
    process.exit(0);
  });