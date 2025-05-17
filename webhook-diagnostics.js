/**
 * Script de diagnóstico para verificar o problema de webhooks da Hotmart
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Criar uma conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function diagnosticarWebhooks() {
  console.log('🔍 Iniciando diagnóstico de webhooks da Hotmart...');
  
  try {
    // 1. Verificar configurações da URL de webhook
    const settingsQuery = await pool.query('SELECT * FROM "subscriptionSettings" WHERE id = 1');
    const settings = settingsQuery.rows[0];
    
    console.log('\n📋 Configurações atuais:');
    console.log('- URL de webhook: ' + (settings.webhookUrl || 'NÃO CONFIGURADA'));
    console.log('- Ambiente Hotmart: ' + settings.hotmartEnvironment);
    console.log('- Cliente ID Hotmart: ' + (settings.hotmartClientId ? (settings.hotmartClientId.slice(0, 4) + '...') : 'Não definido'));
    console.log('- Chave Secreta: ' + (settings.webhookSecretKey ? (settings.webhookSecretKey.slice(0, 4) + '...') : 'Não definida'));
    
    // 2. Verificar os últimos webhooks recebidos
    const logsQuery = await pool.query('SELECT * FROM "webhookLogs" WHERE source = \'hotmart\' ORDER BY id DESC LIMIT 5');
    const logs = logsQuery.rows;
    
    console.log('\n📊 Últimos webhooks da Hotmart registrados:');
    if (logs.length === 0) {
      console.log('❌ Nenhum webhook da Hotmart registrado no sistema.');
    } else {
      logs.forEach(log => {
        console.log(`- ID: ${log.id}, Email: ${log.email || 'N/A'}, Status: ${log.status}, Evento: ${log.eventType}`);
      });
    }
    
    // 3. Verificar se existe algum webhook com os emails informados
    const emailsToCheck = ['ws.advogaciasm@gmail.com', 'kitescolinhacrista@gmail.com'];
    const emailQuery = await pool.query('SELECT * FROM "webhookLogs" WHERE email = ANY($1)', [emailsToCheck]);
    
    console.log('\n🔎 Verificação de emails específicos:');
    if (emailQuery.rows.length === 0) {
      console.log(`❌ Nenhum webhook encontrado para os emails: ${emailsToCheck.join(', ')}`);
    } else {
      emailQuery.rows.forEach(log => {
        console.log(`- Email: ${log.email}, ID: ${log.id}, Status: ${log.status}, Evento: ${log.eventType}`);
      });
    }
    
    // 4. Diagnosticar a rota de webhooks
    console.log('\n🛠️ Diagnóstico de rotas:');
    
    // Verificar se há múltiplas rotas de webhook definidas
    try {
      const indexPath = path.join(process.cwd(), 'server', 'index.ts');
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const webhookMatches = indexContent.match(/app\.post\(['"]\/webhook\/hotmart/g);
        
        if (webhookMatches && webhookMatches.length > 0) {
          console.log(`✅ Rota de webhook encontrada no arquivo principal: ${webhookMatches.length} ocorrências`);
        } else {
          console.log('❌ Rota de webhook não encontrada no arquivo principal.');
        }
      }
    } catch (err) {
      console.log('❌ Erro ao verificar arquivos de rotas: ' + err.message);
    }

    // 5. Resumo do diagnóstico
    console.log('\n📑 RESUMO DO DIAGNÓSTICO:');
    if (!settings.webhookUrl) {
      console.log('❌ PROBLEMA CRÍTICO: URL de webhook não está configurada. A Hotmart não sabe para onde enviar as notificações.');
      console.log('   - Solução: Configure a URL de webhook no painel da Hotmart para: https://designauto.com.br/webhook/hotmart');
    } else {
      console.log('✅ URL de webhook configurada: ' + settings.webhookUrl);
    }
    
    if (logs.length === 0) {
      console.log('⚠️ ALERTA: Nenhum webhook da Hotmart foi registrado. Verifique se a URL está correta no painel da Hotmart.');
    } else {
      console.log('✅ Webhooks da Hotmart estão sendo registrados no sistema.');
    }
    
    if (emailQuery.rows.length === 0) {
      console.log('⚠️ ALERTA: Os webhooks específicos não foram encontrados. Verifique se eles foram realmente enviados pela Hotmart.');
    }
    
    // 6. Recomendações
    console.log('\n🚀 RECOMENDAÇÕES:');
    console.log('1. Verifique se a URL de webhook no painel da Hotmart é exatamente: https://designauto.com.br/webhook/hotmart');
    console.log('2. Certifique-se de que também está configurada a URL: https://designauto.com.br/api/webhooks/hotmart (rota alternativa)');
    console.log('3. Verifique se o token secreto está configurado corretamente no painel da Hotmart');
    console.log('4. Ao reprocessar webhooks no painel da Hotmart, confirme que o status retornado é 200 OK');
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico: ', error);
  } finally {
    await pool.end();
  }
}

diagnosticarWebhooks();
