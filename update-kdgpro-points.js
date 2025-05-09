/**
 * Script para recalcular todos os pontos dos usuários com base nos novos valores do KDGPRO
 * 
 * Este script atualiza:
 * - Arte Aprovada: 5 pontos (antes eram 20 pontos)
 * - Curtida Recebida: 1 ponto (antes eram 5 pontos)
 * - Salvamento: 2 pontos (antes eram 10 pontos)
 * - Post em Destaque: 5 pontos extras (antes eram 50 pontos)
 * 
 * O script mantém as faixas de nível:
 * - Iniciante KDG: 0-500 pontos
 * - Colaborador KDG: 501-2000 pontos
 * - Destaque KDG: 2001-5000 pontos
 * - Elite KDG: 5001-10000 pontos
 * - Lenda KDG: 10001+ pontos
 * 
 * Uso: node update-kdgpro-points.js
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, sql } from 'drizzle-orm';
import * as schema from './shared/schema.js';
import { fileURLToPath } from 'url';
import path from 'path';
import ws from 'ws';

// Configuração do Neon com WebSocket
if (typeof neonConfig !== 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Garantir que o DATABASE_URL seja definido
if (!process.env.DATABASE_URL) {
  console.error('Erro: DATABASE_URL não está definido nas variáveis de ambiente.');
  process.exit(1);
}

// Pool de conexão do banco de dados
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Novos valores de pontuação
const POINTS_FOR_POST = 5; // Antes 20
const POINTS_FOR_LIKE = 1; // Antes 5
const POINTS_FOR_SAVE = 2; // Antes 10
const POINTS_FOR_WEEKLY_FEATURED = 5; // Antes 50

// Função principal para atualizar pontos
async function updateKdgproPoints() {
  try {
    console.log('Iniciando atualização do sistema de pontos KDGPRO...');
    
    // 1. Atualizar as configurações
    console.log('Atualizando configurações de pontuação...');
    await db.update(schema.communitySettings)
      .set({
        pointsForPost: POINTS_FOR_POST,
        pointsForLike: POINTS_FOR_LIKE,
        pointsForSave: POINTS_FOR_SAVE,
        pointsForWeeklyFeatured: POINTS_FOR_WEEKLY_FEATURED,
        updatedAt: new Date()
      })
      .where(eq(schema.communitySettings.id, 1));
    
    // 2. Atualizar pontos na tabela communityPoints
    console.log('Atualizando registros de pontos...');
    
    // 2.1 Atualizar pontos para posts
    await db.execute(sql`
      UPDATE "communityPoints"
      SET "points" = ${POINTS_FOR_POST}
      WHERE "reason" = 'post'
    `);
    
    // 2.2 Atualizar pontos para curtidas
    await db.execute(sql`
      UPDATE "communityPoints"
      SET "points" = ${POINTS_FOR_LIKE}
      WHERE "reason" = 'like'
    `);
    
    // 2.3 Atualizar pontos para salvamentos
    await db.execute(sql`
      UPDATE "communityPoints"
      SET "points" = ${POINTS_FOR_SAVE}
      WHERE "reason" = 'save'
    `);
    
    // 2.4 Atualizar pontos para posts em destaque
    await db.execute(sql`
      UPDATE "communityPoints"
      SET "points" = ${POINTS_FOR_WEEKLY_FEATURED}
      WHERE "reason" = 'weekly_featured'
    `);
    
    // 3. Limpar tabela de leaderboard para recalcular
    console.log('Limpando dados de leaderboard para recalcular...');
    await db.delete(schema.communityLeaderboard);
    
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
      const users = await db.execute(sql`
        SELECT DISTINCT "userId" FROM "communityPoints"
        WHERE ${period === 'all_time' ? sql`TRUE` : 
              period.length === 4 ? sql`"period" LIKE ${period + '-%'}` :
              sql`"period" = ${period}`}
      `);
      
      for (const user of users) {
        const userId = user.userId;
        
        // Calcular pontos totais para o usuário no período
        const result = await db.execute(sql`
          SELECT 
            SUM("points") as "totalPoints",
            COUNT(CASE WHEN "reason" = 'post' THEN 1 END) as "postCount",
            COUNT(CASE WHEN "reason" = 'like' THEN 1 END) as "likesReceived",
            COUNT(CASE WHEN "reason" = 'save' THEN 1 END) as "savesReceived",
            COUNT(CASE WHEN "reason" = 'weekly_featured' THEN 1 END) as "featuredCount"
          FROM "communityPoints"
          WHERE "userId" = ${userId}
          AND ${period === 'all_time' ? sql`TRUE` : 
              period.length === 4 ? sql`"period" LIKE ${period + '-%'}` :
              sql`"period" = ${period}`}
        `);
        
        if (result.length > 0) {
          const stats = result[0];
          const totalPoints = Number(stats.totalPoints) || 0;
          
          // Determinar nível com base em pontos
          let level = 'Iniciante KDG';
          if (totalPoints >= 10001) level = 'Lenda KDG';
          else if (totalPoints >= 5001) level = 'Elite KDG';
          else if (totalPoints >= 2001) level = 'Destaque KDG';
          else if (totalPoints >= 501) level = 'Colaborador KDG';
          
          // Inserir no leaderboard
          await db.insert(schema.communityLeaderboard).values({
            userId: userId,
            totalPoints: totalPoints,
            postCount: Number(stats.postCount) || 0,
            likesReceived: Number(stats.likesReceived) || 0,
            savesReceived: Number(stats.savesReceived) || 0,
            featuredCount: Number(stats.featuredCount) || 0,
            period: period,
            level: level,
            rank: 0, // Será definido pelo próximo passo
            lastUpdated: new Date()
          });
        }
      }
      
      // Atualizar posições (ranks) no leaderboard
      const rankResult = await db.execute(sql`
        WITH ranked_users AS (
          SELECT 
            "id",
            "userId",
            "totalPoints",
            ROW_NUMBER() OVER (ORDER BY "totalPoints" DESC, "lastUpdated" ASC) as row_num
          FROM "communityLeaderboard"
          WHERE "period" = ${period}
        )
        UPDATE "communityLeaderboard" cl
        SET "rank" = ru.row_num
        FROM ranked_users ru
        WHERE cl."id" = ru."id"
        AND cl."period" = ${period}
      `);
    }
    
    console.log('Atualização de pontos KDGPRO concluída com sucesso!');
    console.log('Novos valores: Post=5, Like=1, Save=2, Destaque=5');
    
  } catch (error) {
    console.error('Erro durante a atualização de pontos KDGPRO:', error);
  } finally {
    await pool.end();
  }
}

// Executar função principal
updateKdgproPoints().catch(console.error);