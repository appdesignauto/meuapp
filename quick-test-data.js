
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function quickTest() {
  try {
    console.log('🧪 TESTE RÁPIDO DOS DADOS\n');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // 1. Total de usuários
    const totalResult = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`📊 Total de usuários: ${totalResult[0].count}`);
    
    // 2. Usuários por nível de acesso
    const levelResults = await sql`
      SELECT nivelacesso, COUNT(*) as count 
      FROM users 
      WHERE nivelacesso IS NOT NULL 
      GROUP BY nivelacesso
    `;
    
    console.log('\n📋 Usuários por nível:');
    levelResults.forEach(result => {
      console.log(`   - ${result.nivelacesso}: ${result.count}`);
    });
    
    // 3. Usuários com acesso vitalício
    const vitalicios = await sql`SELECT COUNT(*) as count FROM users WHERE acessovitalicio = true`;
    console.log(`\n🎯 Usuários vitalícios: ${vitalicios[0].count}`);
    
    // 4. Exemplos de usuários
    const examples = await sql`
      SELECT email, nivelacesso, tipoplano, acessovitalicio 
      FROM users 
      LIMIT 5
    `;
    
    console.log('\n👥 Exemplos de usuários:');
    examples.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email}`);
      console.log(`      Nível: "${user.nivelacesso || 'null'}"`);
      console.log(`      Plano: "${user.tipoplano || 'null'}"`);
      console.log(`      Vitalício: ${user.acessovitalicio}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

quickTest();
