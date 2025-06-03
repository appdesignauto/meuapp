/**
 * Script para corrigir definitivamente os endpoints de assinaturas
 * que estão com problemas de sintaxe e dados zerados
 */

const fs = require('fs');

// Endpoint correto e funcional para substituir o quebrado
const fixedEndpoint = `
  // Endpoint principal para métricas de assinaturas do dashboard
  app.get("/api/admin/subscription-metrics", isAdmin, async (req, res) => {
    try {
      console.log("📊 Calculando métricas completas de assinaturas...");
      
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      await client.connect();
      
      // Métricas principais
      const metricsQuery = \`
        WITH subscription_stats AS (
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN isactive = true THEN 1 END) as active_users,
            COUNT(CASE WHEN (acessovitalicio = true OR nivelacesso IN ('premium', 'designer', 'designer_adm')) AND isactive = true THEN 1 END) as premium_users,
            COUNT(CASE WHEN nivelacesso IN ('free', 'admin') AND NOT acessovitalicio AND isactive = true THEN 1 END) as free_users,
            COUNT(CASE WHEN dataexpiracao IS NOT NULL AND dataexpiracao <= NOW() AND NOT acessovitalicio AND isactive = true THEN 1 END) as expired_users,
            COUNT(CASE WHEN acessovitalicio = true AND isactive = true THEN 1 END) as lifetime_users,
            COUNT(CASE WHEN criadoem >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
            COUNT(CASE WHEN criadoem >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d
          FROM users
        ),
        expiring_soon AS (
          SELECT COUNT(*) as count
          FROM users
          WHERE dataexpiracao IS NOT NULL 
          AND dataexpiracao > NOW() 
          AND dataexpiracao <= NOW() + INTERVAL '7 days'
          AND NOT acessovitalicio
          AND isactive = true
        )
        SELECT 
          s.*,
          es.count as expiring_soon_count
        FROM subscription_stats s, expiring_soon es;
      \`;
      
      const metricsResult = await client.query(metricsQuery);
      const metrics = metricsResult.rows[0];
      
      console.log("🔍 Dados brutos das métricas:", metrics);
      
      // Estatísticas por origem
      const originStatsResult = await client.query(\`
        SELECT 
          COALESCE(origemassinatura, 'manual') as origin,
          COUNT(*) as count
        FROM users 
        WHERE isactive = true AND (acessovitalicio = true OR nivelacesso IN ('premium', 'designer', 'designer_adm'))
        GROUP BY origemassinatura
      \`);
      
      // Estatísticas por plano
      const planStatsResult = await client.query(\`
        SELECT 
          COALESCE(tipoplano, 'indefinido') as plan,
          COUNT(*) as count
        FROM users 
        WHERE isactive = true AND (acessovitalicio = true OR nivelacesso IN ('premium', 'designer', 'designer_adm'))
        GROUP BY tipoplano
      \`);
      
      // Crescimento mensal (últimos 12 meses)
      const growthQuery = \`
        SELECT 
          DATE_TRUNC('month', criadoem) as month,
          COUNT(*) as new_users,
          COUNT(CASE WHEN (acessovitalicio = true OR nivelacesso IN ('premium', 'designer', 'designer_adm')) THEN 1 END) as new_premium
        FROM users
        WHERE criadoem >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', criadoem)
        ORDER BY month DESC
      \`;
      
      const growthResult = await client.query(growthQuery);
      
      await client.end();
      
      // Calcular taxa de conversão
      const conversionRate = metrics.total_users > 0 
        ? ((parseInt(metrics.premium_users) / parseInt(metrics.total_users)) * 100).toFixed(1)
        : '0.0';
      
      // Calcular churn rate (usuários que expiraram nos últimos 30 dias)
      const churnRate = metrics.premium_users > 0 
        ? ((parseInt(metrics.expired_users) / parseInt(metrics.premium_users)) * 100).toFixed(1)
        : '0.0';
      
      const response = {
        overview: {
          totalUsers: parseInt(metrics.total_users) || 0,
          activeUsers: parseInt(metrics.active_users) || 0,
          premiumUsers: parseInt(metrics.premium_users) || 0,
          freeUsers: parseInt(metrics.free_users) || 0,
          lifetimeUsers: parseInt(metrics.lifetime_users) || 0,
          expiredUsers: parseInt(metrics.expired_users) || 0,
          expiringSoon: parseInt(metrics.expiring_soon_count) || 0,
          newUsers30d: parseInt(metrics.new_users_30d) || 0,
          newUsers7d: parseInt(metrics.new_users_7d) || 0,
          conversionRate: parseFloat(conversionRate),
          churnRate: parseFloat(churnRate)
        },
        distribution: {
          byOrigin: originStatsResult.rows.map(row => ({
            origin: row.origin,
            count: parseInt(row.count),
            percentage: metrics.premium_users > 0 
              ? ((parseInt(row.count) / parseInt(metrics.premium_users)) * 100).toFixed(1)
              : '0.0'
          })),
          byPlan: planStatsResult.rows.map(row => ({
            plan: row.plan,
            count: parseInt(row.count),
            percentage: metrics.premium_users > 0 
              ? ((parseInt(row.count) / parseInt(metrics.premium_users)) * 100).toFixed(1)
              : '0.0'
          }))
        },
        growth: growthResult.rows.map(row => ({
          month: row.month,
          newUsers: parseInt(row.new_users),
          newPremium: parseInt(row.new_premium)
        }))
      };
      
      console.log("📈 Métricas calculadas:", {
        total: response.overview.totalUsers,
        premium: response.overview.premiumUsers,
        conversion: response.overview.conversionRate + '%'
      });
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error("❌ Erro ao calcular métricas:", error);
      res.status(500).json({ message: "Erro ao calcular métricas de assinaturas" });
    }
  });

  // Endpoint para listar usuários com assinaturas
  app.get("/api/admin/subscription-users", isAdmin, async (req, res) => {
    try {
      console.log("📋 Listando usuários com assinaturas...");
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      await client.connect();
      
      // Query simplificada para evitar erros
      const usersQuery = \`
        SELECT 
          id, username, email, name, profileimageurl,
          nivelacesso, origemassinatura, tipoplano, 
          dataassinatura, dataexpiracao, acessovitalicio,
          isactive, criadoem, ultimologin
        FROM users 
        WHERE isactive = true
        ORDER BY criadoem DESC
        LIMIT $1 OFFSET $2
      \`;
      
      const countQuery = \`SELECT COUNT(*) as total FROM users WHERE isactive = true\`;
      
      const [usersResult, countResult] = await Promise.all([
        client.query(usersQuery, [limit, offset]),
        client.query(countQuery)
      ]);
      
      await client.end();
      
      const users = usersResult.rows.map(user => ({
        ...user,
        subscriptionStatus: user.acessovitalicio ? 'lifetime' : 
          (user.nivelacesso === 'premium' || user.nivelacesso === 'designer') ? 'premium' : 'free',
        daysRemaining: user.dataexpiracao ? 
          Math.max(0, Math.ceil((new Date(user.dataexpiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
          null
      }));
      
      console.log(\`✅ Encontrados \${users.length} usuários\`);
      
      res.status(200).json({
        users,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page,
          limit,
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      });
      
    } catch (error) {
      console.error("❌ Erro ao listar usuários:", error);
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });
`;

console.log("🔧 Endpoint corrigido preparado");
console.log("📄 Arquivo gerado: fix-subscription-endpoints.js");
console.log("🎯 Próximo passo: aplicar a correção no routes.ts");