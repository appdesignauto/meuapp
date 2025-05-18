/**
 * Script para testar a API de mapeamento de produtos Hotmart
 */

import fetch from 'node-fetch';

async function testHotmartMappingAPI() {
  console.log('🧪 Testando API de mapeamento de produtos Hotmart...\n');
  
  // Usar a URL do servidor que está rodando no Replit
  const baseUrl = 'https://e1b8508c-921c-4d22-af73-1cb8fd7145e2-00-121uwb868mg4j.spock.replit.dev';
  
  try {
    console.log('1. Testando GET /api/hotmart-mappings (listar todos os mapeamentos)');
    const listResponse = await fetch(`${baseUrl}/api/hotmart-mappings`);
    const listData = await listResponse.json();
    
    console.log(`Status: ${listResponse.status}`);
    console.log(`Total de mapeamentos encontrados: ${Array.isArray(listData) ? listData.length : 'N/A'}`);
    console.log('Primeiros dois mapeamentos (se existirem):');
    if (Array.isArray(listData) && listData.length > 0) {
      console.log(JSON.stringify(listData.slice(0, 2), null, 2));
    } else {
      console.log('Nenhum mapeamento encontrado ou formato inesperado.');
    }
    
    console.log('\n2. Testando POST /api/hotmart-mappings (criar novo mapeamento)');
    
    // Dados de exemplo para o novo mapeamento
    const newMapping = {
      productId: '789012',
      offerCode: 'SEMESTRAL',
      productName: 'DesignAuto Premium - Semestral',
      planType: 'premium_semestral',
      durationDays: 180
    };
    
    const createResponse = await fetch(`${baseUrl}/api/hotmart-mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMapping)
    });
    
    const createData = await createResponse.json();
    console.log(`Status: ${createResponse.status}`);
    console.log('Resposta:');
    console.log(JSON.stringify(createData, null, 2));
    
    // Se a criação foi bem-sucedida, pegar o ID para teste de atualização e exclusão
    let mappingId = null;
    if (createResponse.status === 201 && createData.success && createData.data) {
      mappingId = createData.data.id;
      
      console.log(`\n3. Testando GET /api/hotmart-mappings/${mappingId} (buscar mapeamento específico)`);
      const getResponse = await fetch(`${baseUrl}/api/hotmart-mappings/${mappingId}`);
      const getData = await getResponse.json();
      
      console.log(`Status: ${getResponse.status}`);
      console.log('Dados do mapeamento:');
      console.log(JSON.stringify(getData, null, 2));
      
      console.log(`\n4. Testando PUT /api/hotmart-mappings/${mappingId} (atualizar mapeamento)`);
      
      // Dados para atualização
      const updatedMapping = {
        ...newMapping,
        productName: 'DesignAuto Premium - Semestral (Atualizado)',
        durationDays: 182
      };
      
      const updateResponse = await fetch(`${baseUrl}/api/hotmart-mappings/${mappingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMapping)
      });
      
      const updateData = await updateResponse.json();
      console.log(`Status: ${updateResponse.status}`);
      console.log('Resposta da atualização:');
      console.log(JSON.stringify(updateData, null, 2));
      
      console.log(`\n5. Testando DELETE /api/hotmart-mappings/${mappingId} (remover mapeamento)`);
      const deleteResponse = await fetch(`${baseUrl}/api/hotmart-mappings/${mappingId}`, {
        method: 'DELETE'
      });
      
      const deleteData = await deleteResponse.json();
      console.log(`Status: ${deleteResponse.status}`);
      console.log('Resposta da exclusão:');
      console.log(JSON.stringify(deleteData, null, 2));
    } else {
      console.log('\nA criação do mapeamento falhou, pulando testes de atualização e exclusão.');
    }
    
    console.log('\n✅ Testes concluídos!');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  }
}

// Executar os testes
testHotmartMappingAPI()
  .then(() => console.log('Script de teste finalizado.'))
  .catch(err => console.error('Erro no script de teste:', err));