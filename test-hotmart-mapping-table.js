/**
 * Script para testar o acesso à tabela de mapeamento de produtos Hotmart
 * após a correção do nome da tabela
 */

import { PrismaClient } from '@prisma/client';

async function testHotmartMappingTable() {
  console.log('🧪 Testando acesso à tabela de mapeamentos Hotmart após correção...');
  
  const prisma = new PrismaClient();
  
  try {
    // Listar todos os mapeamentos existentes
    const mappings = await prisma.hotmartProductMapping.findMany();
    
    console.log(`✅ Encontrados ${mappings.length} mapeamentos.`);
    
    if (mappings.length > 0) {
      console.log('Dados dos mapeamentos:');
      console.table(mappings);
    } else {
      console.log('A tabela está vazia. Vamos adicionar um mapeamento de exemplo...');
      
      // Criar um mapeamento de teste
      const newMapping = await prisma.hotmartProductMapping.create({
        data: {
          productId: 'TEST123',
          offerCode: 'TESTE',
          productName: 'Produto de Teste',
          planType: 'pro',
          durationDays: 30
        }
      });
      
      console.log('✅ Mapeamento de teste criado com sucesso:');
      console.log(newMapping);
    }
    
    console.log('\nTeste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao acessar tabela:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testHotmartMappingTable()
  .then(() => console.log('Script finalizado.'))
  .catch(err => console.error('Erro no script:', err));