import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as syncService from './sync-service.js';

dotenv.config();

const router = express.Router();

// Middleware para logs
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Endpoint para verificar status da integração
router.get("/subscription/stats", async (req, res) => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Estatísticas de usuários
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const activeSubscriptionsResult = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE nivelacesso != 'free' AND dataexpiracao > NOW()
    `);
    const lifetimeUsersResult = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE acessovitalicio = true
    `);
    const expiredSubscriptionsResult = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE nivelacesso != 'free' AND dataexpiracao < NOW()
    `);
    const hotmartUsersResult = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE origemassinatura = 'hotmart'
    `);

    // Distribuição por plano
    const planDistributionResult = await pool.query(`
      SELECT tipoplano, COUNT(*) as count 
      FROM users 
      WHERE tipoplano IS NOT NULL 
      GROUP BY tipoplano
    `);

    // Formatando os resultados
    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    const activeSubscriptions = parseInt(activeSubscriptionsResult.rows[0].count);
    const lifetimeUsers = parseInt(lifetimeUsersResult.rows[0].count);
    const expiredSubscriptions = parseInt(expiredSubscriptionsResult.rows[0].count);
    const hotmartUsers = parseInt(hotmartUsersResult.rows[0].count);

    // Preparando a resposta
    const response = {
      general: {
        total_users: totalUsers,
        active_subscriptions: activeSubscriptions,
        lifetime_users: lifetimeUsers,
        expired_subscriptions: expiredSubscriptions,
        hotmart_users: hotmartUsers
      },
      planDistribution: planDistributionResult.rows
    };

    await pool.end();
    res.json(response);
  } catch (error) {
    console.error("Erro ao obter estatísticas de assinatura:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas de assinatura" });
  }
});

// Endpoint para iniciar sincronização manualmente
router.post("/sync/start", async (req, res) => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Registrar início da sincronização
    const syncLogResult = await pool.query(`
      INSERT INTO sync_logs (status, message, details, created_at)
      VALUES ('started', 'Sincronização iniciada manualmente', $1, NOW())
      RETURNING id
    `, [JSON.stringify({ startedBy: req.user?.username || 'sistema' })]);

    const syncId = syncLogResult.rows[0].id;

    // Iniciar processo de sincronização de forma assíncrona
    syncService.syncHotmartData()
      .then(async (result) => {
        // Atualizar log com resultados
        await pool.query(`
          UPDATE sync_logs
          SET status = 'completed', 
              message = 'Sincronização concluída com sucesso',
              details = $1
          WHERE id = $2
        `, [JSON.stringify(result), syncId]);
        console.log("Sincronização manual concluída:", result);
      })
      .catch(async (error) => {
        // Atualizar log com erro
        await pool.query(`
          UPDATE sync_logs
          SET status = 'failed',
              message = 'Falha na sincronização',
              details = $1
          WHERE id = $2
        `, [JSON.stringify({ error: error.message }), syncId]);
        console.error("Erro na sincronização manual:", error);
      });

    await pool.end();
    res.json({ message: "Sincronização iniciada", syncId });
  } catch (error) {
    console.error("Erro ao iniciar sincronização:", error);
    res.status(500).json({ error: "Erro ao iniciar sincronização" });
  }
});

// Endpoint para obter logs de sincronização
router.get("/sync/logs", async (req, res) => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    const logs = await pool.query(`
      SELECT id, status, message, details, created_at
      FROM sync_logs
      ORDER BY created_at DESC
      LIMIT 10
    `);

    await pool.end();
    res.json(logs.rows);
  } catch (error) {
    console.error("Erro ao obter logs de sincronização:", error);
    res.status(500).json({ error: "Erro ao obter logs de sincronização" });
  }
});

export default router;