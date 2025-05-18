import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar pool de conexão
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Criar router Express
const apiRouter = express.Router();

// Endpoint para verificar status da integração
apiRouter.get('/status', async (req, res) => {
  try {
    // Verificar tabela de configurações
    const settingsResult = await pool.query('SELECT * FROM integration_settings WHERE provider = $1', ['hotmart']);
    
    // Verificar tabela de logs
    const logsResult = await pool.query('SELECT COUNT(*) FROM sync_logs');
    
    res.json({
      status: 'active',
      hasCredentials: settingsResult.rows.length > 0,
      syncLogsCount: parseInt(logsResult.rows[0].count, 10)
    });
  } catch (error) {
    console.error('Erro ao verificar status da integração:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar status da integração',
      details: error.message
    });
  }
});

// Endpoint para listar logs de sincronização
apiRouter.get('/sync/logs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar logs de sincronização:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar logs de sincronização',
      details: error.message
    });
  }
});

// Endpoint para iniciar sincronização manual
apiRouter.post('/sync/start', async (req, res) => {
  try {
    // Registrar solicitação de sincronização
    const logResult = await pool.query(
      'INSERT INTO sync_logs (status, message) VALUES ($1, $2) RETURNING id',
      ['requested', 'Sincronização manual solicitada']
    );
    
    const syncId = logResult.rows[0].id;
    
    // Iniciar processo de sincronização em background
    const syncProcess = fork(path.join(__dirname, 'sync-service.js'), ['--manual', `--sync-id=${syncId}`]);
    
    // Configurar detecção de término do processo
    syncProcess.on('exit', (code) => {
      console.log(`Processo de sincronização encerrado com código ${code}`);
    });
    
    res.json({ 
      message: 'Sincronização iniciada com sucesso', 
      syncId 
    });
  } catch (error) {
    console.error('Erro ao iniciar sincronização:', error);
    res.status(500).json({ 
      error: 'Erro ao iniciar sincronização',
      details: error.message
    });
  }
});

// Endpoint para obter estatísticas de assinaturas
apiRouter.get('/subscription/stats', async (req, res) => {
  try {
    // Estatísticas gerais
    const generalStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN acessovitalicio = true THEN 1 ELSE 0 END) as lifetime_users,
        SUM(CASE WHEN dataexpiracao > NOW() AND tipoplano IS NOT NULL THEN 1 ELSE 0 END) as active_subscriptions,
        SUM(CASE WHEN dataexpiracao <= NOW() AND tipoplano IS NOT NULL THEN 1 ELSE 0 END) as expired_subscriptions,
        SUM(CASE WHEN origemassinatura = 'hotmart' THEN 1 ELSE 0 END) as hotmart_users
      FROM users
    `;
    
    const generalStats = await pool.query(generalStatsQuery);
    
    // Distribuição por plano
    const planDistributionQuery = `
      SELECT 
        COALESCE(tipoplano, 'Sem plano') as tipoplano,
        COUNT(*) as count
      FROM users
      GROUP BY tipoplano
      ORDER BY count DESC
    `;
    
    const planDistribution = await pool.query(planDistributionQuery);
    
    res.json({
      general: generalStats.rows[0],
      planDistribution: planDistribution.rows
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de assinaturas:', error);
    res.status(500).json({ 
      error: 'Erro ao obter estatísticas de assinaturas',
      details: error.message
    });
  }
});

// Exportar router
export default apiRouter;