/**
 * Script para criar a tabela HotmartProductMapping no banco de dados
 * Esta tabela armazenará os mapeamentos entre produtos da Hotmart e planos no DesignAuto
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Função principal para criar a tabela e inserir dados de exemplo
 */
async function createHotmartMappingsTable() {
  console.log('📦 Iniciando criação da tabela de mapeamento de produtos Hotmart...');
  
  const prisma = new PrismaClient();
  
  try {
    // Criar a tabela diretamente usando SQL
    console.log('Criando tabela HotmartProductMapping (caso não exista)...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "HotmartProductMapping" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "offerCode" TEXT,
        "productName" TEXT NOT NULL,
        "planType" TEXT NOT NULL,
        "durationDays" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "HotmartProductMapping_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Verificar se já existe algum mapeamento usando SQL direto
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "HotmartProductMapping";
    `;
    
    const count = parseInt(countResult[0].count, 10);
    console.log(`Registros encontrados: ${count}`);
    
    if (count === 0) {
      console.log('Tabela está vazia. Inserindo mapeamentos de exemplo...');
      
      // Inserir mapeamentos de exemplo diretamente via SQL
      await prisma.$executeRaw`
        INSERT INTO "HotmartProductMapping" ("id", "productId", "offerCode", "productName", "planType", "durationDays")
        VALUES 
          (${randomUUID()}, '123456', 'MENSAL', 'DesignAuto Pro - Mensal', 'pro_mensal', 30),
          (${randomUUID()}, '123456', 'ANUAL', 'DesignAuto Pro - Anual', 'pro_anual', 365),
          (${randomUUID()}, '123456', NULL, 'DesignAuto Pro - Padrão', 'pro_mensal', 30);
      `;
      
      console.log('✅ Mapeamentos de exemplo inseridos com sucesso!');
    } else {
      console.log(`A tabela HotmartProductMapping já existe e contém ${count} registros.`);
    }
    
    console.log('Operação concluída com sucesso! ✨');
  } catch (error) {
    console.error('❌ Erro durante a criação da tabela ou inserção de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar função principal
createHotmartMappingsTable()
  .then(() => console.log('Script de migração finalizado.'))
  .catch(err => console.error('Erro na execução do script:', err));