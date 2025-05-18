import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import apiRouter from './api-server.js';

dotenv.config();

// Verificar se as tabelas necessárias existem
async function checkAndCreateTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Verificar se a tabela sync_logs existe
    const syncLogsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sync_logs'
      );
    `);

    // Se a tabela não existir, criar
    if (!syncLogsTableCheck.rows[0].exists) {
      console.log('[hotmart-integration] Criando tabela sync_logs...');
      await pool.query(`
        CREATE TABLE sync_logs (
          id SERIAL PRIMARY KEY,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          details TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('[hotmart-integration] Tabela sync_logs criada com sucesso!');
    }

    // Verificar se a tabela de configurações de integração existe
    const integrationSettingsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'integration_settings'
      );
    `);

    // Se não existir, criar
    if (!integrationSettingsCheck.rows[0].exists) {
      console.log('[hotmart-integration] Criando tabela integration_settings...');
      await pool.query(`
        CREATE TABLE integration_settings (
          id SERIAL PRIMARY KEY,
          integration_name VARCHAR(50) NOT NULL,
          client_id VARCHAR(100),
          client_secret VARCHAR(100),
          access_token TEXT,
          refresh_token TEXT,
          token_expires_at TIMESTAMP,
          webhook_url VARCHAR(255),
          webhook_token VARCHAR(100),
          is_active BOOLEAN DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Inserir configuração vazia para Hotmart
      await pool.query(`
        INSERT INTO integration_settings 
        (integration_name, is_active, created_at, updated_at) 
        VALUES ('hotmart', false, NOW(), NOW());
      `);
      
      console.log('[hotmart-integration] Tabela integration_settings criada com sucesso!');
    }

    console.log('[hotmart-integration] Verificação de tabelas concluída com sucesso!');
  } catch (error) {
    console.error('[hotmart-integration] Erro ao verificar ou criar tabelas:', error);
  } finally {
    await pool.end();
  }
}

// Inicializar a aplicação de integração Hotmart
async function startHotmartIntegration() {
  // Verificar tabelas necessárias
  await checkAndCreateTables();

  // Inicializar o servidor Express
  const app = express();
  
  // NOTA: Evitando iniciar um novo servidor HTTP, apenas criando o roteador
  // para ser usado pelo servidor principal. Isso evita conflitos de porta.
  console.log('[hotmart-integration] Executando somente em modo roteador (sem servidor HTTP dedicado)');
  
  // Configurar middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware para registrar requisições
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Rota de saúde para verificar se o serviço está funcionando
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Serviço de integração Hotmart em execução (modo integrado)',
      mode: 'embedded',
      timestamp: new Date() 
    });
  });

  // Registrar rotas da API
  app.use('/api/hotmart', apiRouter);

  console.log('[hotmart-integration] Serviço de integração Hotmart iniciado com sucesso!');
  return app;
}

// Iniciar o serviço quando este arquivo for importado
const hotmartIntegration = startHotmartIntegration();

export default hotmartIntegration;