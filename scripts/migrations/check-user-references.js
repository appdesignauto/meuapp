/**
 * Script para verificar quais tabelas referenciam a tabela users
 * e identificar os nomes corretos das colunas
 */

import pkg from 'pg';
const { Client } = pkg;

async function getDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  return client;
}

async function checkUserReferences() {
  const client = await getDatabase();
  
  try {
    console.log('🔍 Verificando referências à tabela users...');
    
    // Buscar todas as foreign keys que referenciam a tabela users
    const fkResult = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name='users'
    `);
    
    console.log('📋 Foreign Keys encontradas:');
    fkResult.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name} → users.${row.foreign_column_name}`);
    });
    
    // Verificar também colunas que podem referenciar users sem FK
    console.log('\n🔍 Verificando possíveis referências sem FK...');
    
    const possibleTables = ['arts', 'views', 'downloads', 'favorites', 'userFollows', 'communityPosts', 'communityComments', 'subscriptions'];
    
    for (const tableName of possibleTables) {
      try {
        const columnsResult = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
          AND (column_name ILIKE '%user%' OR column_name ILIKE '%author%' OR column_name ILIKE '%designer%')
          ORDER BY column_name
        `, [tableName]);
        
        if (columnsResult.rows.length > 0) {
          console.log(`\n📊 Tabela: ${tableName}`);
          columnsResult.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
          });
          
          // Verificar alguns registros para entender a estrutura
          const sampleResult = await client.query(`SELECT * FROM ${tableName} LIMIT 3`);
          if (sampleResult.rows.length > 0) {
            console.log(`  Exemplo de dados:`);
            sampleResult.rows.forEach((row, index) => {
              const relevantData = {};
              Object.keys(row).forEach(key => {
                if (key.toLowerCase().includes('user') || 
                    key.toLowerCase().includes('author') || 
                    key.toLowerCase().includes('designer') ||
                    key === 'id') {
                  relevantData[key] = row[key];
                }
              });
              console.log(`    [${index + 1}]`, relevantData);
            });
          }
        }
      } catch (error) {
        console.log(`  ⚠️ ${tableName}: tabela não encontrada ou erro - ${error.message}`);
      }
    }
    
    // Verificar current user IDs range
    const userStats = await client.query(`
      SELECT 
        MIN(id) as min_id,
        MAX(id) as max_id,
        COUNT(*) as total_users
      FROM users
    `);
    
    console.log('\n📊 Estatísticas atuais dos usuários:');
    console.log(`  Min ID: ${userStats.rows[0].min_id}`);
    console.log(`  Max ID: ${userStats.rows[0].max_id}`);
    console.log(`  Total: ${userStats.rows[0].total_users}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

// Executar
checkUserReferences()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha:', error);
    process.exit(1);
  });