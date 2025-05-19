import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { BRAZIL_TIMEZONE } from './utils/date-utils';

// Configurar WebSocket para o Neon PostgreSQL
neonConfig.webSocketConstructor = ws;

// Checar se a variável de ambiente está definida
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configurar o client PostgreSQL com o fuso horário de Brasília (UTC-3)
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Definir o timezone para todas as conexões PostgreSQL
// Executamos uma consulta SET TIMEZONE para cada nova conexão no pool
pool.on('connect', (client) => {
  // Define o timezone para fuso horário de Brasília/São Paulo (UTC-3)
  client.query(`SET timezone = '${BRAZIL_TIMEZONE}'`);
});

// Configurar Drizzle ORM com o cliente PostgreSQL
export const db = drizzle({ client: pool, schema });
