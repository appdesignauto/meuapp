/**
 * Script corrigido para reorganizar os IDs da tabela users de forma segura
 * Baseado na análise real das foreign keys do banco
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
    
    // 1. Verificar situação atual
    const countResult = await client.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(countResult.rows[0].total);
    console.log(`📊 Total de usuários encontrados: ${totalUsers}`);
    
    const maxIdResult = await client.query('SELECT MAX(id) as max_id FROM users');
    const maxId = parseInt(maxIdResult.rows[0].max_id);
    console.log(`📈 Maior ID atual: ${maxId}`);
    
    if (maxId <= totalUsers + 5) {
      console.log('✅ Os IDs já estão bem organizados. Não é necessário reorganizar.');
      return;
    }
    
    console.log('🚀 Iniciando processo de reorganização...');
    
    // 2. Iniciar transação
    await client.query('BEGIN');
    
    // 3. Criar tabela temporária com novos IDs sequenciais
    await client.query(`
      CREATE TEMP TABLE users_temp AS 
      SELECT *, ROW_NUMBER() OVER (ORDER BY criadoem ASC) as new_id
      FROM users 
      ORDER BY criadoem ASC
    `);
    console.log('📋 Tabela temporária criada com novos IDs sequenciais');
    
    // 4. Obter mapeamento
    const mappingResult = await client.query(`
      SELECT id as old_id, new_id 
      FROM users_temp 
      ORDER BY new_id
    `);
    
    console.log('📋 Mapeamento de IDs criado:');
    mappingResult.rows.forEach(row => {
      console.log(`  ${row.old_id} → ${row.new_id}`);
    });
    
    // 5. Atualizar todas as referências baseadas nas foreign keys reais
    console.log('🔗 Atualizando referências em outras tabelas...');
    
    const referenceUpdates = [
      // Tabelas principais
      { table: 'arts', column: 'designerid' },
      { table: 'views', column: 'userId' },
      { table: 'downloads', column: 'userId' },
      { table: 'favorites', column: 'userId' },
      { table: 'subscriptions', column: 'userId' },
      { table: 'userFollows', column: 'followerId' },
      { table: 'userFollows', column: 'followingId' },
      
      // Tabelas de comunidade (verificar se existem)
      { table: 'communityPosts', column: 'userId' },
      { table: 'communityComments', column: 'userId' },
      { table: 'communityLikes', column: 'userId' },
      { table: 'communitySaves', column: 'userId' },
      { table: 'communityPoints', column: 'userId' },
      { table: 'communityLeaderboard', column: 'userId' },
      { table: 'communityCommentLikes', column: 'userId' },
      
      // Outras referências encontradas
      { table: 'designerStats', column: 'userId' },
      { table: 'userPreferences', column: 'userId' },
      { table: 'userStats', column: 'userId' },
      { table: 'userPermissions', column: 'userId' },
      { table: 'userPermissions', column: 'grantedBy' },
      { table: 'siteSettings', column: 'updatedBy' },
      { table: 'emailVerificationCodes', column: 'userId' },
      { table: 'shares', column: 'userId' },
      { table: 'artGroups', column: 'designerid' },
      { table: 'courseModules', column: 'createdBy' },
      { table: 'courseLessons', column: 'createdBy' },
      { table: 'courseProgress', column: 'userId' },
      { table: 'courseRatings', column: 'userId' },
      { table: 'videoComments', column: 'userId' },
      { table: 'courses', column: 'createdBy' },
      { table: 'courseSettings', column: 'updatedBy' },
      { table: 'lessonViews', column: 'userId' },
      { table: 'lessonNotes', column: 'userId' },
      { table: 'popups', column: 'createdBy' },
      { table: 'popupViews', column: 'userId' },
      { table: 'communitySettings', column: 'updatedBy' },
      { table: 'userfollows', column: 'followerid' },
      { table: 'userfollows', column: 'followingid' },
      { table: 'reports', column: 'userId' },
      { table: 'reports', column: 'respondedBy' },
      { table: 'app_config', column: 'created_by' },
      { table: 'app_config', column: 'updated_by' },
      { table: 'subscriptions', column: 'modifiedby' }
    ];
    
    let totalUpdated = 0;
    
    for (const ref of referenceUpdates) {
      try {
        // Verificar se a tabela e coluna existem
        const tableCheck = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_name = $1 
          AND column_name = $2
        `, [ref.table, ref.column]);
        
        if (parseInt(tableCheck.rows[0].count) > 0) {
          const updateQuery = `
            UPDATE ${ref.table} 
            SET ${ref.column} = users_temp.new_id 
            FROM users_temp 
            WHERE ${ref.table}.${ref.column} = users_temp.id
          `;
          const updateResult = await client.query(updateQuery);
          console.log(`  ✅ ${ref.table}.${ref.column}: ${updateResult.rowCount} registros atualizados`);
          totalUpdated += updateResult.rowCount;
        } else {
          console.log(`  ⚠️ ${ref.table}.${ref.column}: não encontrada`);
        }
      } catch (error) {
        console.log(`  ❌ ${ref.table}.${ref.column}: erro - ${error.message}`);
        // Se houve erro, fazer rollback
        throw error;
      }
    }
    
    console.log(`📊 Total de referências atualizadas: ${totalUpdated}`);
    
    // 6. Limpar e reorganizar tabela users
    await client.query('DELETE FROM users');
    console.log('🗑️ Tabela users limpa');
    
    // 7. Inserir dados reorganizados (incluir todas as colunas)
    await client.query(`
      INSERT INTO users (
        id, username, email, password, name, profileimageurl, bio, 
        nivelacesso, origemassinatura, tipoplano, dataassinatura, 
        dataexpiracao, acessovitalicio, observacaoadmin, isactive, 
        ultimologin, criadoem, atualizadoem, website, location, 
        phone, supabaseId, resetpasswordtoken, resetpasswordexpires, 
        lastresetrequest, emailconfirmed
      )
      SELECT 
        new_id, username, email, password, name, profileimageurl, bio,
        nivelacesso, origemassinatura, tipoplano, dataassinatura,
        dataexpiracao, acessovitalicio, observacaoadmin, isactive,
        ultimologin, criadoem, atualizadoem, website, location,
        phone, supabaseId, resetpasswordtoken, resetpasswordexpires,
        lastresetrequest, emailconfirmed
      FROM users_temp 
      ORDER BY new_id
    `);
    console.log('📥 Dados reorganizados inseridos');
    
    // 8. Ajustar a sequência
    const nextId = totalUsers + 1;
    await client.query(`SELECT setval('users_id_seq', ${nextId}, false)`);
    console.log(`🔢 Sequência ajustada para próximo ID: ${nextId}`);
    
    // 9. Verificar integridade
    const finalCountResult = await client.query('SELECT COUNT(*) as total FROM users');
    const finalCount = parseInt(finalCountResult.rows[0].total);
    
    if (finalCount !== totalUsers) {
      throw new Error(`Erro de integridade! Esperado: ${totalUsers}, Encontrado: ${finalCount}`);
    }
    
    // 10. Confirmar transação
    await client.query('COMMIT');
    
    console.log('✅ Reorganização concluída com sucesso!');
    console.log(`📊 Usuários reorganizados: ${finalCount}`);
    console.log(`🆔 IDs agora vão de 1 a ${finalCount}`);
    console.log(`📈 Referências atualizadas: ${totalUpdated}`);
    
    // 11. Mostrar resultado final
    const sampleResult = await client.query(`
      SELECT id, username, email, criadoem 
      FROM users 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('📋 Usuários após reorganização:');
    sampleResult.rows.forEach(user => {
      const date = new Date(user.criadoem).toLocaleDateString('pt-BR');
      console.log(`  ID: ${user.id} | ${user.username} | ${user.email} | ${date}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante reorganização:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar
if (import.meta.url === `file://${process.argv[1]}`) {
  reorganizeUserIds()
    .then(() => {
      console.log('🎉 Script concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha no script:', error.message);
      process.exit(1);
    });
}

export { reorganizeUserIds };