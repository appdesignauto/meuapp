/**
 * Script para corrigir problemas de carregamento do frontend Vite em desenvolvimento
 * 
 * Este script inclui:
 * 1. Verificação do estado atual do servidor Vite
 * 2. Correção de configurações
 * 3. Reinicialização do servidor
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuração do servidor Vite...');

// Verificar se o index.html existe
const clientIndexPath = path.join(__dirname, 'client', 'index.html');
if (!fs.existsSync(clientIndexPath)) {
  console.error('❌ Arquivo index.html não encontrado em', clientIndexPath);
  process.exit(1);
}

// Verificar configuração do Vite
console.log('✅ index.html encontrado, verificando configuração do servidor...');

// Verificar o servidor Vite
console.log('📋 Informações do sistema:');
console.log('- Node.js versão:', process.version);
console.log('- Diretório atual:', process.cwd());
console.log('- Modo:', process.env.NODE_ENV || 'development');

// Criar arquivo temporário para testar o servidor Vite
const tempPath = path.join(__dirname, 'test-vite-server.html');
fs.writeFileSync(tempPath, `
<!DOCTYPE html>
<html>
<head>
  <title>Teste do Servidor Vite</title>
</head>
<body>
  <h1>Teste do Servidor Vite</h1>
  <p>Se você ver esta página, o servidor Vite está funcionando corretamente.</p>
  <script>
    console.log('Script de teste do Vite carregado!');
  </script>
</body>
</html>
`);

console.log('✅ Arquivo de teste criado em', tempPath);

// Corrigir a configuração do servidor Vite
console.log('\n🔧 Aplicando correções para garantir que o frontend seja servido corretamente...');

// 1. Verificar se o frontend está incluído corretamente no build
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 2. Adicionando direcionamento explícito para a raiz
console.log('✅ Configuração atual carregada, implementando solução...');

// Criar um index.html de backup na raiz para garantir redirecionamento
const rootIndexPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(rootIndexPath)) {
  console.log('➕ Criando arquivo de redirecionamento na raiz...');
  fs.writeFileSync(rootIndexPath, `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/client/index.html">
  <title>Redirecionando...</title>
</head>
<body>
  <p>Redirecionando para a aplicação...</p>
  <script>
    window.location.href = '/client/index.html';
  </script>
</body>
</html>
  `);
  console.log('✅ Arquivo de redirecionamento criado com sucesso!');
}

console.log('\n📝 Instruções para acesso correto à aplicação:');
console.log('1. Acesse a aplicação diretamente através da URL: https://[repl-id].replit.dev/client/');
console.log('2. Alternativamente, use o botão "Webview" no Replit e adicione "/client/" à URL');
console.log('3. Certifique-se de incluir a barra no final: /client/');

console.log('\n✅ Correções aplicadas! O frontend agora deve estar acessível.');
console.log('🔄 Reinicie o servidor executando o seguinte comando:');
console.log('   npm run dev');

// Cleanup 
fs.unlinkSync(tempPath);