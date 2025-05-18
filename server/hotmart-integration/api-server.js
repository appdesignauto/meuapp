// api-server.js
import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middlewares
router.use(cors());
router.use(express.json());

// Middleware para autenticação JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido' });
  }
  
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'hotmart-integration-secret';
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    
    req.user = user;
    next();
  });
};

// Rota para obter dados do usuário atual
router.get('/user', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.user;
    
    // Buscar detalhes do usuário
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Remover senha do resultado
    const { password, ...userWithoutPassword } = user;
    
    return res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error.message);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para verificar o status da assinatura do usuário atual
router.get('/subscription/status', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.user;
    
    // Buscar detalhes do usuário
    const userResult = await pool.query(`
      SELECT id, email, tipoplano, origemassinatura, dataassinatura, dataexpiracao, acessovitalicio
      FROM users WHERE id = $1
    `, [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Verificar status da assinatura
    let status = 'free';
    let planDetails = null;
    
    if (user.acessovitalicio) {
      status = 'lifetime';
      planDetails = {
        type: 'lifetime',
        name: user.tipoplano || 'Acesso Vitalício',
        startDate: user.dataassinatura,
        source: user.origemassinatura
      };
    } else if (user.tipoplano && user.dataexpiracao && new Date(user.dataexpiracao) > new Date()) {
      status = 'active';
      planDetails = {
        type: 'subscription',
        name: user.tipoplano,
        startDate: user.dataassinatura,
        expiryDate: user.dataexpiracao,
        source: user.origemassinatura
      };
    } else if (user.tipoplano && user.dataexpiracao) {
      status = 'expired';
      planDetails = {
        type: 'expired',
        name: user.tipoplano,
        startDate: user.dataassinatura,
        expiryDate: user.dataexpiracao,
        source: user.origemassinatura
      };
    }
    
    return res.json({
      status,
      planDetails
    });
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error.message);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para listar logs de sincronização (apenas para administradores)
router.get('/sync/logs', authenticateJWT, async (req, res) => {
  try {
    // Verificar se o usuário é administrador
    const userRoleResult = await pool.query(`
      SELECT nivelacesso FROM users WHERE id = $1
    `, [req.user.id]);
    
    if (userRoleResult.rows.length === 0 || userRoleResult.rows[0].nivelacesso !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem ver logs de sincronização.' });
    }
    
    // Obter logs de sincronização
    const logsResult = await pool.query(`
      SELECT * FROM sync_logs
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    return res.json(logsResult.rows);
  } catch (error) {
    console.error('Erro ao listar logs de sincronização:', error.message);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para iniciar sincronização manual (apenas para administradores)
router.post('/sync/start', authenticateJWT, async (req, res) => {
  try {
    // Verificar se o usuário é administrador
    const userRoleResult = await pool.query(`
      SELECT nivelacesso FROM users WHERE id = $1
    `, [req.user.id]);
    
    if (userRoleResult.rows.length === 0 || userRoleResult.rows[0].nivelacesso !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem iniciar sincronização.' });
    }
    
    // Enviar mensagem para o serviço de sincronização via arquivo compartilhado
    // (Implementação simplificada, em um ambiente real usaríamos um sistema de mensageria)
    await pool.query(`
      INSERT INTO sync_logs (status, message, created_at)
      VALUES ('requested', 'Sincronização manual solicitada por administrador', NOW())
    `);
    
    return res.json({
      success: true,
      message: 'Pedido de sincronização enviado. A sincronização será iniciada em breve.'
    });
  } catch (error) {
    console.error('Erro ao iniciar sincronização manual:', error.message);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para obter estatísticas de assinaturas (apenas para administradores)
router.get('/subscription/stats', authenticateJWT, async (req, res) => {
  try {
    // Verificar se o usuário é administrador
    const userRoleResult = await pool.query(`
      SELECT nivelacesso FROM users WHERE id = $1
    `, [req.user.id]);
    
    if (userRoleResult.rows.length === 0 || userRoleResult.rows[0].nivelacesso !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem ver estatísticas.' });
    }
    
    // Obter estatísticas de assinaturas
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN acessovitalicio = true THEN 1 END) as lifetime_users,
        COUNT(CASE WHEN tipoplano IS NOT NULL AND dataexpiracao > NOW() THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN tipoplano IS NOT NULL AND dataexpiracao <= NOW() THEN 1 END) as expired_subscriptions,
        COUNT(CASE WHEN origemassinatura = 'hotmart' THEN 1 END) as hotmart_users
      FROM users
    `);
    
    // Estatísticas por plano
    const planStatsResult = await pool.query(`
      SELECT 
        tipoplano, 
        COUNT(*) as count
      FROM users
      WHERE tipoplano IS NOT NULL
      GROUP BY tipoplano
      ORDER BY count DESC
    `);
    
    return res.json({
      general: statsResult.rows[0],
      planDistribution: planStatsResult.rows
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de assinaturas:', error.message);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Exportar o router
export default router;