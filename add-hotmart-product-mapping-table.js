/**
 * Script para criar a tabela hotmartProductMappings no banco de dados
 * Esta tabela armazenará os mapeamentos entre produtos da Hotmart e planos no DesignAuto
 */
import pkg from '@neondatabase/serverless';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema.ts';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Obtém conexão com o banco de dados
 */
async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida");
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  return { pool, db };
}

/**
 * Cria a tabela hotmartProductMappings e insere mapeamentos de exemplo
 */
async function createHotmartProductMappingsTable() {
  try {
    console.log("Iniciando criação da tabela hotmartProductMappings...");
    
    const { pool, db } = await getDatabase();
    
    // Verificar se a tabela já existe
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'hotmartProductMappings'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log("Criando tabela hotmartProductMappings...");
      
      // Criar a tabela
      await db.execute(sql`
        CREATE TABLE "hotmartProductMappings" (
          "id" SERIAL PRIMARY KEY,
          "productId" TEXT NOT NULL DEFAULT '',
          "offerId" TEXT NOT NULL DEFAULT '',
          "productName" TEXT NOT NULL,
          "planType" TEXT NOT NULL,
          "durationDays" INTEGER,
          "isLifetime" BOOLEAN DEFAULT FALSE,
          "isActive" BOOLEAN DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW(),
          UNIQUE("productName")
        );
      `);
      
      console.log("Tabela hotmartProductMappings criada com sucesso!");
      
      // Inserir mapeamentos de exemplo
      await db.execute(sql`
        INSERT INTO "hotmartProductMappings" 
        ("productName", "planType", "durationDays", "isLifetime") 
        VALUES 
          ('Design Auto PRO Mensal', 'premium', 30, FALSE),
          ('Design Auto PRO Anual', 'premium', 365, FALSE),
          ('Design Auto Vitalício', 'premium', NULL, TRUE);
      `);
      
      console.log("Mapeamentos de exemplo inseridos com sucesso!");
    } else {
      console.log("Tabela hotmartProductMappings já existe, verificando estrutura...");
      
      // Verificar se todas as colunas necessárias existem
      const columns = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'hotmartProductMappings';
      `);
      
      const existingColumns = columns.rows.map(row => row.column_name);
      
      // Adicionar colunas que possam estar faltando
      if (!existingColumns.includes('isActive')) {
        console.log("Adicionando coluna isActive...");
        await db.execute(sql`
          ALTER TABLE "hotmartProductMappings" 
          ADD COLUMN "isActive" BOOLEAN DEFAULT TRUE;
        `);
      }
      
      console.log("Estrutura da tabela verificada e atualizada!");
    }
    
    // Fechar a conexão com o banco
    await pool.end();
    
    console.log("Processo concluído com sucesso!");
  } catch (error) {
    console.error("Erro ao criar/atualizar tabela hotmartProductMappings:", error);
    process.exit(1);
  }
}

// Executar a função principal
createHotmartProductMappingsTable();