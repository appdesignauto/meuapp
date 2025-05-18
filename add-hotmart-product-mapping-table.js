/**
 * Script para criar a tabela hotmartProductMappings no banco de dados
 * Esta tabela armazenará os mapeamentos entre produtos da Hotmart e planos no DesignAuto
 */

// Importações necessárias
const { PrismaClient } = require('@prisma/client');

/**
 * Obtém conexão com o banco de dados
 */
async function getDatabase() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    return prisma;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

/**
 * Cria a tabela hotmartProductMappings e insere mapeamentos de exemplo
 */
async function createHotmartProductMappingsTable() {
  console.log('Iniciando criação da tabela hotmartProductMappings...');
  
  const prisma = await getDatabase();
  
  try {
    // Verificar se a tabela já existe
    try {
      // Tentamos acessar um registro para verificar se a tabela existe
      await prisma.hotmartProductMapping.findFirst();
      console.log('A tabela hotmartProductMappings já existe.');
    } catch (error) {
      // Se ocorrer erro significa que a tabela não existe
      // A criação será feita automaticamente pela primeira migração do Prisma
      console.log('A tabela hotmartProductMappings não existe e será criada.');
      
      // Executamos manualmente a criação da tabela
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "hotmartProductMapping" (
          "id" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "offerCode" TEXT,
          "productName" TEXT NOT NULL,
          "planType" TEXT NOT NULL,
          "durationDays" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "hotmartProductMapping_pkey" PRIMARY KEY ("id")
        );
      `;
      
      console.log('Tabela hotmartProductMappings criada com sucesso.');
    }
    
    // Inserir mapeamentos de exemplo
    const exampleMappings = [
      {
        id: '1', // UUID gerado automaticamente em produção
        productId: '123456',
        offerCode: 'MENSAL',
        productName: 'DesignAuto Pro - Mensal',
        planType: 'premium_mensal',
        durationDays: 30,
        createdAt: new Date()
      },
      {
        id: '2',
        productId: '123456',
        offerCode: 'ANUAL',
        productName: 'DesignAuto Pro - Anual',
        planType: 'premium_anual',
        durationDays: 365,
        createdAt: new Date()
      }
    ];
    
    // Verificar se já existem mapeamentos
    const existingCount = await prisma.hotmartProductMapping.count();
    if (existingCount === 0) {
      console.log('Inserindo mapeamentos de exemplo...');
      
      for (const mapping of exampleMappings) {
        try {
          await prisma.hotmartProductMapping.create({
            data: mapping
          });
        } catch (e) {
          console.warn(`Erro ao inserir mapeamento para ${mapping.productName}: ${e.message}`);
        }
      }
      
      console.log(`${exampleMappings.length} mapeamentos de exemplo inseridos com sucesso.`);
    } else {
      console.log(`Já existem ${existingCount} mapeamentos. Pulando inserção de exemplos.`);
    }
    
    console.log('Operação concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a criação da tabela ou inserção de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função principal
createHotmartProductMappingsTable().catch(console.error);