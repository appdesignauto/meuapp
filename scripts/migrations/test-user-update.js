/**
 * Script para testar a atualização de usuário webhook
 */

const fetch = require('node-fetch');

async function testUserUpdate() {
  try {
    const response = await fetch('http://localhost:3000/api/users/105', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-test' // Simular autenticação admin
      },
      body: JSON.stringify({
        name: 'Fernando Oliveira 22',
        username: 'suporteeducacaokids'
      })
    });

    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);

    if (!response.ok) {
      console.log('Erro na resposta:', result);
    } else {
      console.log('Usuário atualizado com sucesso!');
    }

  } catch (error) {
    console.error('Erro ao testar atualização:', error);
  }
}

testUserUpdate();