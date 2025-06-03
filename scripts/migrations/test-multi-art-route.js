// Testes simples para as rotas de artes multi-formato
const fetch = require('node-fetch');

async function testGetGroup(groupId = 'test-group-id') {
  try {
    console.log(`\n=== TESTANDO GET /api/admin/arts/group/${groupId} ===`);
    const response = await fetch(`http://localhost:5000/api/admin/arts/group/${groupId}`, {
      method: 'GET',
      headers: {
        'Cookie': 'connect.sid=seu_cookie_de_sessao_aqui',
      },
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Resposta:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Erro no teste GET:', error);
    return null;
  }
}

async function testPutGroup(groupId = 'test-group-id') {
  try {
    console.log(`\n=== TESTANDO PUT /api/admin/arts/group/${groupId} ===`);
    
    // Dados de exemplo para atualizar o grupo
    const testData = {
      categoryId: 1,
      globalFileType: 'canva',
      isPremium: true,
      globalTitle: 'Teste de Atualização Grupo',
      globalDescription: 'Descrição de teste para atualização de grupo',
      formats: [
        {
          format: 'feed',
          fileType: 'canva',
          title: 'Teste Feed',
          description: 'Descrição de teste para feed',
          imageUrl: 'https://example.com/image1.jpg',
          editUrl: 'https://canva.com/edit/123'
        },
        {
          format: 'stories',
          fileType: 'canva',
          title: 'Teste Stories',
          description: 'Descrição de teste para stories',
          imageUrl: 'https://example.com/image2.jpg',
          editUrl: 'https://canva.com/edit/456'
        }
      ]
    };
    
    const response = await fetch(`http://localhost:5000/api/admin/arts/group/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=seu_cookie_de_sessao_aqui',
      },
      body: JSON.stringify(testData)
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Resposta:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Erro no teste PUT:', error);
    return null;
  }
}

// Função principal para execução dos testes
async function runTests() {
  // Para executar um teste específico, descomente a linha correspondente
  // await testGetGroup('grupo-real-existente');
  // await testPutGroup('grupo-real-existente');
  
  console.log('\n=== TESTES COMPLETOS ===');
}

// Executar os testes (descomente para executar)
// runTests();

// Para usar na linha de comando:
// node test-multi-art-route.js