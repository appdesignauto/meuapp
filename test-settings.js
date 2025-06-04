import axios from 'axios';

async function testIntegrationSettings() {
  try {
    // Realizar login primeiro para obter o cookie de sessão
    const loginResponse = await axios.post('http://localhost:5000/api/login', {
      username: 'admin',
      password: 'Password123'  // Senha atualizada
    });
    
    // Extrair o cookie de sessão da resposta
    const cookies = loginResponse.headers['set-cookie'];
    console.log('Login realizado com sucesso, cookies obtidos.');
    
    if (!cookies) {
      console.error('Nenhum cookie foi retornado no login');
      return;
    }
    
    // Usar o cookie para fazer a solicitação à API de integrações
    const settingsResponse = await axios.get('http://localhost:5000/api/integrations/settings', {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    
    console.log('Resposta da API de integrações:');
    console.log(JSON.stringify(settingsResponse.data, null, 2));
    
    if (settingsResponse.data.hotmart && settingsResponse.data.hotmart.clientId) {
      console.log('\nDetalhe do Client ID da Hotmart:');
      console.log('isDefined:', settingsResponse.data.hotmart.clientId.isDefined);
      console.log('realValue:', settingsResponse.data.hotmart.clientId.realValue);
      console.log('lastChars:', settingsResponse.data.hotmart.clientId.lastChars);
    } else {
      console.log('\nClient ID da Hotmart não encontrado na resposta.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Erro na resposta:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error('Erro ao executar o teste:', error.message);
    }
  }
}

testIntegrationSettings();
