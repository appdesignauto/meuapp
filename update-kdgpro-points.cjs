/**
 * Script para recalcular todos os pontos dos usuários com base nos novos valores do KDGPRO
 * 
 * Este script atualiza:
 * - Arte Aprovada: 5 pontos (antes eram 20 pontos)
 * - Curtida Recebida: 1 ponto (antes eram 5 pontos)
 * - Salvamento: 2 pontos (antes eram 10 pontos)
 * - Post em Destaque: 5 pontos extras (antes eram 50 pontos)
 * 
 * O script atualiza as faixas de nível:
 * - Membro KDG: 0-199 pontos
 * - Voluntário KDG: 200-699 pontos
 * - Cooperador KDG: 700-1499 pontos
 * - Destaque KDG: 1500-2999 pontos
 * - Referência KDG: 3000-4999 pontos
 * - Profissional: 5000+ pontos
 * 
 * Uso: node update-kdgpro-points.cjs
 */

require('dotenv').config();
const { Pool } = require('pg');

// Garantir que o DATABASE_URL seja definido
if (!process.env.DATABASE_URL) {
  console.error('Erro: DATABASE_URL não está definido nas variáveis de ambiente.');
  process.exit(1);
}

// Pool de conexão do banco de dados
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Novos valores de pontuação
const POINTS_FOR_POST = 5; // Antes 20
const POINTS_FOR_LIKE = 1; // Antes 5
const POINTS_FOR_SAVE = 2; // Antes 10
const POINTS_FOR_WEEKLY_FEATURED = 5; // Antes 50

// Função principal para atualizar pontos
async function updateKdgproPoints() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando atualização do sistema de pontos KDGPRO...');
    
    // 1. Atualizar as configurações
    console.log('Atualizando configurações de pontuação...');
    await client.query(
      `UPDATE "communitySettings" 
       SET "pointsForPost" = $1, 
           "pointsForLike" = $2, 
           "pointsForSave" = $3, 
           "pointsForWeeklyFeatured" = $4, 
           "updatedAt" = $5 
       WHERE "id" = 1`,
      [POINTS_FOR_POST, POINTS_FOR_LIKE, POINTS_FOR_SAVE, POINTS_FOR_WEEKLY_FEATURED, new Date()]
    );
    
    // 2. Atualizar pontos na tabela communityPoints
    console.log('Atualizando registros de pontos...');
    
    // 2.1 Atualizar pontos para posts
    await client.query(
      `UPDATE "communityPoints" SET "points" = $1 WHERE "reason" = 'post'`,
      [POINTS_FOR_POST]
    );
    
    // 2.2 Atualizar pontos para curtidas
    await client.query(
      `UPDATE "communityPoints" SET "points" = $1 WHERE "reason" = 'like'`,
      [POINTS_FOR_LIKE]
    );
    
    // 2.3 Atualizar pontos para salvamentos
    await client.query(
      `UPDATE "communityPoints" SET "points" = $1 WHERE "reason" = 'save'`,
      [POINTS_FOR_SAVE]
    );
    
    // 2.4 Atualizar pontos para posts em destaque
    await client.query(
      `UPDATE "communityPoints" SET "points" = $1 WHERE "reason" = 'weekly_featured'`,
      [POINTS_FOR_WEEKLY_FEATURED]
    );
    
    // 3. Limpar tabela de leaderboard para recalcular
    console.log('Limpando dados de leaderboard para recalcular...');
    await client.query(`DELETE FROM "communityLeaderboard"`);
    
    // 4. Recalcular o leaderboard para todos os períodos
    console.log('Recalculando o leaderboard...');
    const periods = [
      // Formato: all_time, YYYY (ano), YYYY-MM (ano-mês), YYYY-WW (ano-semana)
      'all_time',
      new Date().getFullYear().toString(), // Ano atual
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, // Mês atual
    ];
    
    // Adicionar semana atual (formato YYYY-WW)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    periods.push(`${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`);
    
    // Recalcular para cada período
    for (const period of periods) {
      console.log(`Recalculando leaderboard para período: ${period}`);
      
      // Buscar todos os usuários com pontos no período
      let whereClause = '';
      const whereParams = [];
      
      if (period === 'all_time') {
        whereClause = 'TRUE';
      } else if (period.length === 4) {
        whereClause = '"period" LIKE $1';
        whereParams.push(`${period}-%`);
      } else {
        whereClause = '"period" = $1';
        whereParams.push(period);
      }
      
      const usersResult = await client.query(
        `SELECT DISTINCT "userId" FROM "communityPoints" WHERE ${whereClause}`,
        whereParams
      );
      
      console.log(`Encontrados ${usersResult.rows.length} usuários para o período ${period}`);
      
      for (const user of usersResult.rows) {
        const userId = user.userid; // Nota: PostgreSQL retorna nomes de colunas em minúsculas
        
        // Buscar pontos para o usuário no período
        let periodWhereClause = '';
        const periodParams = [userId];
        
        if (period === 'all_time') {
          periodWhereClause = '"userId" = $1';
        } else if (period.length === 4) {
          periodWhereClause = '"userId" = $1 AND "period" LIKE $2';
          periodParams.push(`${period}-%`);
        } else {
          periodWhereClause = '"userId" = $1 AND "period" = $2';
          periodParams.push(period);
        }
        
        const result = await client.query(
          `SELECT 
            SUM("points") as "totalPoints",
            COUNT(CASE WHEN "reason" = 'post' THEN 1 END) as "postCount",
            COUNT(CASE WHEN "reason" = 'like' THEN 1 END) as "likesReceived",
            COUNT(CASE WHEN "reason" = 'save' THEN 1 END) as "savesReceived",
            COUNT(CASE WHEN "reason" = 'weekly_featured' THEN 1 END) as "featuredCount"
          FROM "communityPoints"
          WHERE ${periodWhereClause}`,
          periodParams
        );
        
        if (result.rows.length > 0) {
          const stats = result.rows[0];
          const totalPoints = Number(stats.totalpoints) || 0; // Minúsculas no PostgreSQL
          
          // Determinar nível com base em pontos (novas faixas)
          let level = 'Membro KDG';
          if (totalPoints >= 5000) level = 'Profissional';
          else if (totalPoints >= 3000) level = 'Referência KDG';
          else if (totalPoints >= 1500) level = 'Destaque KDG';
          else if (totalPoints >= 700) level = 'Cooperador KDG';
          else if (totalPoints >= 200) level = 'Voluntário KDG';
          
          // Inserir no leaderboard
          await client.query(
            `INSERT INTO "communityLeaderboard" (
              "userId", "totalPoints", "postCount", "likesReceived", 
              "savesReceived", "featuredCount", "period", "level", 
              "rank", "lastUpdated"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              userId,
              totalPoints,
              Number(stats.postcount) || 0,
              Number(stats.likesreceived) || 0,
              Number(stats.savesreceived) || 0,
              Number(stats.featuredcount) || 0,
              period,
              level,
              0, // Rank será atualizado depois
              new Date()
            ]
          );
        }
      }
      
      // Atualizar posições (ranks) no leaderboard
      await client.query(`
        WITH ranked_users AS (
          SELECT 
            "id",
            "userId",
            "totalPoints",
            ROW_NUMBER() OVER (ORDER BY "totalPoints" DESC, "lastUpdated" ASC) as row_num
          FROM "communityLeaderboard"
          WHERE "period" = $1
        )
        UPDATE "communityLeaderboard" cl
        SET "rank" = ru.row_num
        FROM ranked_users ru
        WHERE cl."id" = ru."id"
        AND cl."period" = $1
      `, [period]);
      
      console.log(`Ranking atualizado para o período: ${period}`);
    }
    
    console.log('Atualização de pontos KDGPRO concluída com sucesso!');
    console.log('Novos valores: Post=5, Like=1, Save=2, Destaque=5');
    console.log('Novas faixas de níveis:');
    console.log('- Membro KDG: 0-199 pontos');
    console.log('- Voluntário KDG: 200-699 pontos');
    console.log('- Cooperador KDG: 700-1499 pontos');
    console.log('- Destaque KDG: 1500-2999 pontos');
    console.log('- Referência KDG: 3000-4999 pontos');
    console.log('- Profissional: 5000+ pontos');
    
  } catch (error) {
    console.error('Erro durante a atualização de pontos KDGPRO:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar função principal
updateKdgproPoints().catch(console.error);