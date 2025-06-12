/**
 * Script para testar se o domínio correto está sendo usado
 * nas solicitações de redefinição de senha
 */

const fetch = require('node-fetch');

async function testPasswordResetDomain() {
  try {
    const response = await fetch('http://localhost:5000/api/password-reset/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'soguruscursos@gmail.com'
      })
    });

    const result = await response.json();
    console.log('Resposta da API:', result);
    
    if (response.ok) {
      console.log('✅ Solicitação de redefinição enviada com sucesso');
      console.log('📧 Verifique os logs do servidor para confirmar o domínio usado no email');
    } else {
      console.log('❌ Erro na solicitação:', result.message);
    }
    
  } catch (error) {
    console.error('Erro ao testar redefinição de senha:', error);
  }
}

testPasswordResetDomain();