/**
 * Script para corrigir senhas de usuários criados pelo admin que ainda estão no formato scrypt
 * Este script atualiza a senha do usuário específico para o formato bcrypt correto
 */

import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function fixUserPassword() {
  try {
    const email = 'designerinovedigital@gmail.com';
    const newPassword = 'designauto@123'; // Senha padrão para usuários criados pelo admin
    
    console.log(`Corrigindo senha para usuário: ${email}`);
    
    // Hash da nova senha usando bcrypt (mesmo método do sistema de login)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Nova senha hash criada:', hashedPassword);
    
    // Atualizar a senha no banco de dados
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email))
      .returning({ id: users.id, email: users.email });
    
    if (result.length > 0) {
      console.log('✅ Senha atualizada com sucesso!');
      console.log('Usuário pode agora fazer login com:');
      console.log(`Email: ${email}`);
      console.log(`Senha: ${newPassword}`);
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
  } catch (error) {
    console.error('Erro ao corrigir senha:', error);
  }
}

fixUserPassword();