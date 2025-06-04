/**
 * Script para reorganizar os IDs da tabela users de forma segura
 * Mantém todas as relações e referências intactas
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

async function reorganizeUserIds() {
  const client = await getDatabase();
  
  try {
    console.log('🔄 Iniciando reorganização dos IDs da tabela users...');
    
    // 1. Primeiro, vamos ver quantos usuários temos
    const countResult = await client.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(countResult.rows[0].total);
    console.log(`📊 Total de usuários encontrados: ${totalUsers}`);
    
    // 2. Verificar o maior ID atual
    const maxIdResult = await client.query('SELECT MAX(id) as max_id FROM users');
    const maxId = parseInt(maxIdResult.rows[0].max_id);
    console.log(`📈 Maior ID atual: ${maxId}`);
    
    if (maxId <= totalUsers + 10) {
      console.log('✅ Os IDs já estão bem organizados. Não é necessário reorganizar.');
      return;
    }
    
    console.log('🚀 Iniciando processo de reorganização...');
    
    // 3. Iniciar transação
    await client.query('BEGIN');
    
    // 4. Criar tabela temporária com estrutura idêntica
    await client.query(`
      CREATE TEMP TABLE users_temp AS 
      SELECT * FROM users 
      ORDER BY criadoem ASC
    `);
    console.log('📋 Tabela temporária criada');
    
    // 5. Adicionar coluna para novo ID
    await client.query('ALTER TABLE users_temp ADD COLUMN new_id SERIAL');
    console.log('🆔 Nova coluna de ID adicionada');
    
    // 6. Obter mapeamento de IDs antigos para novos
    const mappingResult = await client.query(`
      SELECT id as old_id, new_id 
      FROM users_temp 
      ORDER BY new_id
    `);
    
    console.log('📋 Mapeamento de IDs criado:');
    mappingResult.rows.forEach(row => {
      console.log(`  ${row.old_id} → ${row.new_id}`);
    });
    
    // 7. Atualizar todas as tabelas que referenciam users
    console.log('🔗 Atualizando referências em outras tabelas...');
    
    // Tabelas que referenciam user_id
    const referenceTables = [
      { table: 'arts', column: 'designerid' },
      { table: 'views', column: 'userId' },
      { table: 'downloads', column: 'userId' },
      { table: 'favorites', column: 'userId' },
      { table: 'userFollows', column: 'followerId' },
      { table: 'userFollows', column: 'followedId' },
      { table: 'communityPosts', column: 'authorId' },
      { table: 'communityComments', column: 'authorId' },
      { table: 'subscriptions', column: 'userId' }
    ];
    
    for (const ref of referenceTables) {
      try {
        // Verificar se a tabela e coluna existem
        const tableCheck = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_name = '${ref.table}' 
          AND column_name = '${ref.column}'
        `);
        
        if (parseInt(tableCheck.rows[0].count) > 0) {
          const updateQuery = `
            UPDATE ${ref.table} 
            SET ${ref.column} = users_temp.new_id 
            FROM users_temp 
            WHERE ${ref.table}.${ref.column} = users_temp.id
          `;
          const updateResult = await client.query(updateQuery);
          console.log(`  ✅ ${ref.table}.${ref.column}: ${updateResult.rowCount} registros atualizados`);
        } else {
          console.log(`  ⚠️ ${ref.table}.${ref.column}: tabela/coluna não encontrada`);
        }
      } catch (error) {
        console.log(`  ⚠️ ${ref.table}.${ref.column}: erro ao atualizar - ${error.message}`);
      }
    }
    
    // 8. Limpar tabela users original
    await client.query('DELETE FROM users');
    console.log('🗑️ Tabela users limpa');
    
    // 9. Inserir dados reorganizados
    await client.query(`
      INSERT INTO users (
        id, username, email, name, profileimageurl, bio, nivelacesso, 
        origemassinatura, tipoplano, dataassinatura, dataexpiracao, 
        acessovitalicio, observacaoadmin, isactive, ultimologin, 
        criadoem, atualizadoem, website, location, phone, supabaseId,
        resetpasswordtoken, resetpasswordexpires, lastresetrequest,
        emailconfirmed, password
      )
      SELECT 
        new_id, username, email, name, profileimageurl, bio, nivelacesso,
        origemassinatura, tipoplano, dataassinatura, dataexpiracao,
        acessovitalicio, observacaoadmin, isactive, ultimologin,
        criadoem, atualizadoem, website, location, phone, supabaseId,
        resetpasswordtoken, resetpasswordexpires, lastresetrequest,
        emailconfirmed, password
      FROM users_temp 
      ORDER BY new_id
    `);
    console.log('📥 Dados reorganizados inseridos');
    
    // 10. Ajustar a sequência para o próximo ID
    const nextId = totalUsers + 1;
    await client.query(`SELECT setval('users_id_seq', ${nextId}, false)`);
    console.log(`🔢 Sequência ajustada para próximo ID: ${nextId}`);
    
    // 11. Verificar integridade
    const finalCountResult = await client.query('SELECT COUNT(*) as total FROM users');
    const finalCount = parseInt(finalCountResult.rows[0].total);
    
    if (finalCount !== totalUsers) {
      throw new Error(`Erro de integridade! Esperado: ${totalUsers}, Encontrado: ${finalCount}`);
    }
    
    // 12. Confirmar transação
    await client.query('COMMIT');
    
    console.log('✅ Reorganização concluída com sucesso!');
    console.log(`📊 Usuários reorganizados: ${finalCount}`);
    console.log(`🆔 IDs agora vão de 1 a ${finalCount}`);
    
    // 13. Mostrar alguns exemplos do resultado
    const sampleResult = await client.query(`
      SELECT id, username, email, criadoem 
      FROM users 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log('📋 Primeiros 5 usuários após reorganização:');
    sampleResult.rows.forEach(user => {
      console.log(`  ID: ${user.id} | ${user.username} | ${user.email}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante reorganização:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  reorganizeUserIds()
    .then(() => {
      console.log('🎉 Script concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha no script:', error);
      process.exit(1);
    });
}

export { reorganizeUserIds };