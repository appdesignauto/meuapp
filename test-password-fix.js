/**
 * Script para testar se a correção de senha está funcionando
 * Este script testa se uma senha criada pelo admin consegue fazer login
 */

const bcrypt = require('bcrypt');

async function testPasswordHashing() {
  const testPassword = "designauto@123";
  
  // Simular o hash que seria criado no admin panel
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  console.log("Senha hash criada:", hashedPassword);
  
  // Simular a verificação que seria feita no login
  const isValid = await bcrypt.compare(testPassword, hashedPassword);
  console.log("Verificação de senha:", isValid ? "✅ SUCESSO" : "❌ FALHOU");
  
  return isValid;
}

testPasswordHashing()
  .then(result => {
    if (result) {
      console.log("\n✅ A correção está funcionando! Usuários criados pelo admin poderão fazer login.");
    } else {
      console.log("\n❌ Ainda há problema com o hashing de senhas.");
    }
  })
  .catch(error => {
    console.error("Erro ao testar:", error);
  });