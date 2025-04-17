import crypto from "crypto";
import util from "util";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Configure WebSocket para Neon
neonConfig.webSocketConstructor = ws;
import { sql } from 'drizzle-orm';

// Configuração para hash de senha
const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function resetPassword() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não encontrado!');
  }

  try {
    // Conectar ao banco de dados
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });
    
    // Email do usuário que precisa de reset
    const userEmail = "fernando.sim2018@gmail.com";
    
    // Nova senha a ser definida
    const newPassword = "designauto@123";
    
    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);
    
    console.log(`Redefinindo senha para o usuário: ${userEmail}`);
    console.log(`Hash gerado: ${hashedPassword}`);
    
    // Atualizar a senha no banco de dados
    const result = await db.execute(sql`
      UPDATE users 
      SET password = ${hashedPassword}, updatedat = NOW()
      WHERE email = ${userEmail}
      RETURNING id, email, username
    `);
    
    if (result.rows.length === 0) {
      console.error('Usuário não encontrado!');
      return;
    }
    
    console.log(`Senha redefinida com sucesso para: ${result.rows[0].email}`);
    console.log(`Detalhes do usuário: ID ${result.rows[0].id}, Username: ${result.rows[0].username}`);
    
    // Fechar a conexão
    await pool.end();
    
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
  }
}

// Executar o script
resetPassword().catch(console.error);