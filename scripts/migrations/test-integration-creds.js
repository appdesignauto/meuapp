import axios from 'axios';

async function testIntegrationSettings() {
  try {
    // Login com usuário admin
    const loginResponse = await axios.post('http://localhost:5000/api/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    
    if (!cookies) {
      console.error('Nenhum cookie foi retornado no login');
      return;
    }
    
    // Testar a API de configurações de integração
    const settingsResponse = await axios.get('http://localhost:5000/api/integrations/settings', {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    
    console.log('Resposta da API:');
    console.log(JSON.stringify(settingsResponse.data, null, 2));
    
    // Verificar especificamente as configurações da Hotmart
    if (settingsResponse.data.hotmart) {
      console.log('\nConfigurações da Hotmart:');
      for (const key in settingsResponse.data.hotmart) {
        const config = settingsResponse.data.hotmart[key];
        console.log(`- ${key}:`);
        console.log(`  isDefined: ${config.isDefined}`);
        console.log(`  realValue presente: ${!!config.realValue}`);
        console.log(`  lastChars: ${config.lastChars}`);
      }
    }
    
    // Verificar específicamente as configurações do Doppus
    if (settingsResponse.data.doppus) {
      console.log('\nConfigurações do Doppus:');
      for (const key in settingsResponse.data.doppus) {
        const config = settingsResponse.data.doppus[key];
        console.log(`- ${key}:`);
        console.log(`  isDefined: ${config.isDefined}`);
        console.log(`  realValue presente: ${!!config.realValue}`);
        console.log(`  lastChars: ${config.lastChars}`);
      }
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
