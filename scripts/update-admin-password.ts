import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function updateAdminPassword() {
  try {
    console.log('Iniciando atualização da senha do administrador...');

    // Buscar usuário administrador
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    
    if (adminUsers.length === 0) {
      console.log('Usuário administrador não encontrado');
      return;
    }
    
    const admin = adminUsers[0];
    console.log(`Atualizando senha para usuário: ${admin.username} (${admin.email})`);
    
    // Verificar se a senha já está em formato hash
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$') || admin.password.startsWith('$2y$')) {
      console.log('Senha já está em formato hash, não é necessário atualizar');
      return;
    }
    
    // Gerar nova senha hash mantendo a mesma senha
    const plainPassword = admin.password;
    const hashedPassword = await hashPassword(plainPassword);
    
    // Atualizar senha no banco de dados
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, admin.id));
    
    console.log('Senha do administrador atualizada com sucesso!');
    console.log(`Nova senha (hash): ${hashedPassword.substring(0, 15)}...`);
    
  } catch (error) {
    console.error('Erro ao atualizar senha do administrador:', error);
  } finally {
    process.exit(0);
  }
}

// Executar atualização
updateAdminPassword();