/**
 * Script para testar criação de usuário pelo painel admin
 * Este script simula a criação de um usuário com senha personalizada
 */

import bcrypt from 'bcrypt';

async function testUserCreation() {
  console.log('=== TESTE DE CRIAÇÃO DE USUÁRIO PELO ADMIN ===\n');
  
  // Simular dados de um novo usuário
  const testUser = {
    email: 'teste@exemplo.com',
    password: 'minhasenha123',
    name: 'Usuário Teste',
    username: 'usuarioteste'
  };
  
  console.log('1. Dados do usuário a ser criado:');
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Senha: ${testUser.password}`);
  console.log(`   Nome: ${testUser.name}`);
  console.log(`   Username: ${testUser.username}\n`);
  
  // Simular o processo de hash da senha (como no servidor)
  console.log('2. Processando senha com bcrypt...');
  const hashedPassword = await bcrypt.hash(testUser.password, 10);
  console.log(`   Hash gerado: ${hashedPassword}\n`);
  
  // Simular verificação de login
  console.log('3. Testando login com a senha fornecida...');
  const loginTest = await bcrypt.compare(testUser.password, hashedPassword);
  console.log(`   Resultado: ${loginTest ? '✅ SUCESSO' : '❌ FALHA'}\n`);
  
  // Testar com senha incorreta
  console.log('4. Testando com senha incorreta...');
  const wrongPasswordTest = await bcrypt.compare('senhaerrada', hashedPassword);
  console.log(`   Resultado: ${wrongPasswordTest ? '❌ PROBLEMA' : '✅ CORRETAMENTE REJEITADA'}\n`);
  
  if (loginTest && !wrongPasswordTest) {
    console.log('✅ SISTEMA FUNCIONANDO CORRETAMENTE!');
    console.log('   - Senhas corretas são aceitas');
    console.log('   - Senhas incorretas são rejeitadas');
    console.log('   - Hash bcrypt está funcionando perfeitamente');
  } else {
    console.log('❌ PROBLEMA DETECTADO NO SISTEMA!');
  }
}

testUserCreation().catch(console.error);