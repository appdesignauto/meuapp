import { storage } from './storage';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function createAdminUser() {
  try {
    // Verifica se já existe um usuário com este email
    const existingUser = await storage.getUserByEmail('inovedigitalmarketing10@gmail.com');
    
    if (existingUser) {
      // Se o usuário já existe, atualiza o papel para admin se necessário
      if (existingUser.nivelacesso !== 'admin') {
        // Atualiza tanto nivelacesso quanto role por compatibilidade
        await storage.updateUserRole(existingUser.id, 'admin');
        console.log('Usuário administrador atualizado com sucesso.');
      } else {
        console.log('Usuário administrador já existe.');
      }
      return;
    }
    
    // Cria um novo usuário administrador
    const adminUser = {
      username: 'admin',
      email: 'inovedigitalmarketing10@gmail.com',
      password: await hashPassword('admin123'),
      name: 'Design Auto', // Nome atualizado conforme solicitação
      role: 'admin', // Mantido para compatibilidade
      nivelacesso: 'admin', // Usando o novo campo
      isactive: true,
      profileimageurl: null,
      bio: null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedat: new Date()
    };
    
    await storage.createUser(adminUser);
    console.log('Usuário administrador criado com sucesso.');
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  }
}