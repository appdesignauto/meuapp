/**
 * Script para testar o acesso à tabela de mapeamento de produtos Hotmart
 */

import { PrismaClient } from '@prisma/client';

async function testHotmartMappings() {
  console.log('🧪 Testando acesso à tabela de mapeamentos Hotmart...');
  
  const prisma = new PrismaClient();
  
  try {
    // Buscar todos os mapeamentos
    const mappings = await prisma.$queryRaw`
      SELECT * FROM "HotmartProductMapping"
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`✅ Encontrados ${mappings.length} mapeamentos:`);
    console.table(mappings);
    
    return mappings;
  } catch (error) {
    console.error('❌ Erro ao buscar mapeamentos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testHotmartMappings()
  .then(() => console.log('Teste concluído.'))
  .catch(error => console.error('Erro no teste:', error));