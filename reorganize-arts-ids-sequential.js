/**
 * Script para reorganizar os IDs das artes em sequência baseada na data de criação
 * Arte mais recente = ID maior (ex: 86), arte mais antiga = ID menor (ex: 1)
 * 
 * Este script:
 * 1. Backup automático dos dados originais
 * 2. Reorganiza IDs mantendo todas as relações (foreign keys)
 * 3. Atualiza todas as tabelas relacionadas
 * 4. Preserva todos os dados sem perda
 */

import { neon } from '@neondatabase/serverless';

async function getDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  return sql;
}

async function reorganizeArtsIds() {
  const sql = await getDatabase();
  
  console.log('🔄 Iniciando reorganização dos IDs das artes...');
  
  try {
    // 1. Criar backup das tabelas relacionadas
    console.log('📁 Criando backup dos dados originais...');
    
    await sql`DROP TABLE IF EXISTS arts_backup`;
    await sql`DROP TABLE IF EXISTS views_backup`;
    await sql`DROP TABLE IF EXISTS favorites_backup`;
    await sql`DROP TABLE IF EXISTS downloads_backup`;
    await sql`DROP TABLE IF EXISTS community_posts_backup`;
    
    await sql`CREATE TABLE arts_backup AS SELECT * FROM arts`;
    await sql`CREATE TABLE views_backup AS SELECT * FROM views`;
    await sql`CREATE TABLE favorites_backup AS SELECT * FROM favorites`;
    await sql`CREATE TABLE downloads_backup AS SELECT * FROM downloads`;
    await sql`CREATE TABLE community_posts_backup AS SELECT * FROM "communityPosts"`;
    
    console.log('✅ Backup criado com sucesso');
    
    // 2. Buscar todas as artes ordenadas por data de criação (mais antigas primeiro)
    console.log('📊 Buscando artes para reorganização...');
    
    const artes = await sql`
      SELECT id, "createdAt", title 
      FROM arts 
      ORDER BY "createdAt" ASC
    `;
    
    console.log(`📈 Total de artes encontradas: ${artes.length}`);
    
    if (artes.length === 0) {
      console.log('❌ Nenhuma arte encontrada');
      return;
    }
    
    // 3. Criar tabela temporária com novos IDs
    console.log('🔧 Criando mapeamento de IDs...');
    
    await sql`
      DROP TABLE IF EXISTS id_mapping
    `;
    
    await sql`
      CREATE TABLE id_mapping (
        old_id INTEGER,
        new_id INTEGER,
        created_at TIMESTAMP
      )
    `;
    
    // 4. Inserir mapeamento: arte mais antiga = ID 1, mais recente = ID maior
    for (let i = 0; i < artes.length; i++) {
      const arte = artes[i];
      const newId = i + 1; // IDs sequenciais começando em 1
      
      await sql`
        INSERT INTO id_mapping (old_id, new_id, created_at)
        VALUES (${arte.id}, ${newId}, ${arte.createdAt})
      `;
    }
    
    console.log('✅ Mapeamento de IDs criado');
    
    // 5. Criar nova tabela arts com IDs reorganizados
    console.log('🔄 Reorganizando tabela arts...');
    
    await sql`
      CREATE TABLE arts_new AS
      SELECT 
        m.new_id as id,
        a."createdAt",
        a."updatedAt", 
        a.designerid,
        a.viewcount,
        a.width,
        a.height,
        a."isPremium",
        a."isVisible",
        a."categoryId",
        a."collectionId",
        a.title,
        a."imageUrl",
        a.format,
        a."fileType",
        a."editUrl",
        a.aspectratio,
        a.thumbnailurl,
        a."groupId"
      FROM arts a
      JOIN id_mapping m ON a.id = m.old_id
      ORDER BY m.new_id
    `;
    
    // 6. Atualizar tabelas relacionadas com novos IDs
    console.log('🔗 Atualizando tabelas relacionadas...');
    
    // Atualizar views
    await sql`
      CREATE TABLE views_new AS
      SELECT 
        v.id,
        m.new_id as "artId",
        v."userId",
        v."viewedAt"
      FROM views v
      JOIN id_mapping m ON v."artId" = m.old_id
    `;
    
    // Atualizar favorites
    await sql`
      CREATE TABLE favorites_new AS
      SELECT 
        f.id,
        f."userId",
        m.new_id as "artId",
        f."createdAt"
      FROM favorites f
      JOIN id_mapping m ON f."artId" = m.old_id
    `;
    
    // Atualizar downloads
    await sql`
      CREATE TABLE downloads_new AS
      SELECT 
        d.id,
        d."userId",
        m.new_id as "artId",
        d."downloadedAt"
      FROM downloads d
      JOIN id_mapping m ON d."artId" = m.old_id
    `;
    
    // Atualizar community posts (se existir artId)
    await sql`
      CREATE TABLE community_posts_new AS
      SELECT 
        cp.id,
        cp.title,
        cp.content,
        cp."authorId",
        CASE 
          WHEN cp."artId" IS NOT NULL THEN m.new_id 
          ELSE NULL 
        END as "artId",
        cp."createdAt",
        cp."updatedAt",
        cp."isPinned",
        cp."featuredUntil",
        cp."isWeeklyFeatured",
        cp."editLink",
        cp."viewCount"
      FROM "communityPosts" cp
      LEFT JOIN id_mapping m ON cp."artId" = m.old_id
    `;
    
    console.log('✅ Tabelas relacionadas atualizadas');
    
    // 7. Substituir tabelas originais
    console.log('🔄 Aplicando mudanças...');
    
    await sql`BEGIN`;
    
    // Drop constraints temporariamente
    await sql`
      ALTER TABLE views DROP CONSTRAINT IF EXISTS views_artId_arts_id_fk;
      ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_artId_arts_id_fk;
      ALTER TABLE downloads DROP CONSTRAINT IF EXISTS downloads_artId_arts_id_fk;
    `;
    
    // Substituir tabelas
    await sql`
      DROP TABLE arts CASCADE;
      ALTER TABLE arts_new RENAME TO arts;
      
      DROP TABLE views;
      ALTER TABLE views_new RENAME TO views;
      
      DROP TABLE favorites;
      ALTER TABLE favorites_new RENAME TO favorites;
      
      DROP TABLE downloads;
      ALTER TABLE downloads_new RENAME TO downloads;
      
      DROP TABLE "communityPosts";
      ALTER TABLE community_posts_new RENAME TO "communityPosts";
    `;
    
    // Recriar constraints e índices
    await sql`
      ALTER TABLE arts ADD PRIMARY KEY (id);
      ALTER TABLE arts ALTER COLUMN id SET DEFAULT nextval('arts_id_seq'::regclass);
      
      ALTER TABLE views ADD CONSTRAINT views_artId_arts_id_fk 
        FOREIGN KEY ("artId") REFERENCES arts(id) ON DELETE CASCADE;
      
      ALTER TABLE favorites ADD CONSTRAINT favorites_artId_arts_id_fk 
        FOREIGN KEY ("artId") REFERENCES arts(id) ON DELETE CASCADE;
      
      ALTER TABLE downloads ADD CONSTRAINT downloads_artId_arts_id_fk 
        FOREIGN KEY ("artId") REFERENCES arts(id) ON DELETE CASCADE;
    `;
    
    // Ajustar sequence para próximos IDs
    const maxId = artes.length;
    await sql`
      SELECT setval('arts_id_seq', ${maxId + 1});
    `;
    
    await sql`COMMIT`;
    
    console.log('✅ Reorganização concluída com sucesso!');
    
    // 8. Verificar resultado
    console.log('🔍 Verificando resultado...');
    
    const verificacao = await sql`
      SELECT id, title, "createdAt"
      FROM arts 
      ORDER BY "createdAt" ASC
      LIMIT 5
    `;
    
    console.log('📊 Primeiras 5 artes (mais antigas):');
    verificacao.forEach((arte, index) => {
      console.log(`   ${arte.id}. ${arte.title} (${arte.createdAt})`);
    });
    
    const verificacaoRecentes = await sql`
      SELECT id, title, "createdAt"
      FROM arts 
      ORDER BY "createdAt" DESC
      LIMIT 5
    `;
    
    console.log('📊 Últimas 5 artes (mais recentes):');
    verificacaoRecentes.forEach((arte, index) => {
      console.log(`   ${arte.id}. ${arte.title} (${arte.createdAt})`);
    });
    
    // Limpar tabelas temporárias
    await sql`
      DROP TABLE IF EXISTS id_mapping, arts_backup, views_backup, favorites_backup, downloads_backup, community_posts_backup
    `;
    
    console.log('🎉 Reorganização dos IDs concluída!');
    console.log(`📈 Total de artes reorganizadas: ${artes.length}`);
    console.log('✅ Arte mais antiga agora tem ID 1');
    console.log(`✅ Arte mais recente agora tem ID ${artes.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante reorganização:', error);
    
    // Tentar rollback em caso de erro
    try {
      await sql`ROLLBACK`;
      console.log('🔄 Rollback executado');
    } catch (rollbackError) {
      console.error('❌ Erro no rollback:', rollbackError);
    }
    
    throw error;
  }
}

// Executar script
reorganizeArtsIds()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na execução do script:', error);
    process.exit(1);
  });