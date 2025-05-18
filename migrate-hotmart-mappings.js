/**
 * Script para criar a tabela hotmartProductMappings no banco de dados
 * Esta tabela armazenará os mapeamentos entre produtos da Hotmart e planos no DesignAuto
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Função principal para criar a tabela e inserir dados de exemplo
 */
async function createHotmartMappingsTable() {
  console.log('📦 Iniciando criação da tabela de mapeamento de produtos Hotmart...');
  
  const prisma = new PrismaClient();
  
  try {
    // Verificar se a tabela já existe criando uma consulta
    let hasTable = false;
    try {
      const result = await prisma.$queryRaw`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'HotmartProductMapping'
      )`;
      
      // O resultado será um array com um objeto que contém a propriedade exists
      hasTable = Array.isArray(result) && result.length > 0 && result[0].exists;
      console.log(`Verificação de tabela existente: ${hasTable ? 'Existe' : 'Não existe'}`);
    } catch (error) {
      console.log('Erro ao verificar se a tabela existe, assumindo que não existe:', error.message);
      hasTable = false;
    }
    
    // Se a tabela não existir, criá-la manualmente
    if (!hasTable) {
      console.log('Criando tabela HotmartProductMapping...');
      
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
      
      // Inserir mapeamentos de exemplo se a tabela acabou de ser criada
      const exampleMappings = [
        {
          productId: '123456',
          offerCode: 'MENSAL',
          productName: 'DesignAuto Pro - Mensal',
          planType: 'pro_mensal',
          durationDays: 30
        },
        {
          productId: '123456',
          offerCode: 'ANUAL',
          productName: 'DesignAuto Pro - Anual',
          planType: 'pro_anual',
          durationDays: 365
        },
        {
          productId: '123456',
          offerCode: null,  // Mapeamento padrão para o produto
          productName: 'DesignAuto Pro - Padrão',
          planType: 'pro_mensal',
          durationDays: 30
        }
      ];
      
      console.log('Inserindo mapeamentos de exemplo...');
      for (const mapping of exampleMappings) {
        await prisma.HotmartProductMapping.create({
          data: mapping
        });
      }
      
      console.log('✅ Tabela criada e populada com dados de exemplo!');
    } else {
      // Verificar se já existe algum mapeamento
      const count = await prisma.hotmartProductMapping.count();
      
      if (count === 0) {
        console.log('Tabela existe mas está vazia. Inserindo mapeamentos de exemplo...');
        
        // Inserir mapeamentos de exemplo
        const exampleMappings = [
          {
            productId: '123456',
            offerCode: 'MENSAL',
            productName: 'DesignAuto Pro - Mensal',
            planType: 'pro_mensal',
            durationDays: 30
          },
          {
            productId: '123456',
            offerCode: 'ANUAL',
            productName: 'DesignAuto Pro - Anual',
            planType: 'pro_anual',
            durationDays: 365
          }
        ];
        
        for (const mapping of exampleMappings) {
          await prisma.HotmartProductMapping.create({
            data: mapping
          });
        }
        
        console.log('✅ Mapeamentos de exemplo inseridos com sucesso!');
      } else {
        console.log(`A tabela HotmartProductMapping já existe e contém ${count} registros.`);
      }
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