import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { BRAZIL_TIMEZONE } from './utils/date-utils';

// Configurar WebSocket para o Neon PostgreSQL com fallback
try {
  neonConfig.webSocketConstructor = ws;
} catch (error) {
  console.warn('WebSocket configuration failed, continuing with default:', error);
}

// Checar se a variável de ambiente está definida
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configurar o client PostgreSQL com configurações mais robustas
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Definir o timezone para todas as conexões PostgreSQL com tratamento de erro
pool.on('connect', (client) => {
  try {
    // Define o timezone para fuso horário de Brasília/São Paulo (UTC-3)
    client.query(`SET timezone = '${BRAZIL_TIMEZONE}'`);
  } catch (error) {
    console.warn('Failed to set timezone, continuing with default:', error);
  }
});

// Tratamento de erros de conexão
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Configurar Drizzle ORM com o cliente PostgreSQL
export const db = drizzle({ client: pool, schema });
