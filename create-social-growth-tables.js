/**
 * Script para criar as tabelas do sistema de crescimento social
 */

import { neon } from '@neondatabase/serverless';

async function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL não encontrada nas variáveis de ambiente');
  }
  return neon(databaseUrl);
}

async function createSocialGrowthTables() {
  const db = await getDatabase();
  
  try {
    console.log('🔨 Criando tabelas do sistema de crescimento social...');
    
    // Tabela de perfis de redes sociais
    await db`
      CREATE TABLE IF NOT EXISTS social_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        username VARCHAR(255) NOT NULL,
        profile_url TEXT,
        followers_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Tabela social_profiles criada');

    // Tabela de metas
    await db`
      CREATE TABLE IF NOT EXISTS social_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        goal_type VARCHAR(50) NOT NULL, -- 'followers' ou 'sales'
        current_value INTEGER DEFAULT 0,
        target_value INTEGER NOT NULL,
        deadline DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Tabela social_goals criada');

    // Tabela de dados históricos de performance
    await db`
      CREATE TABLE IF NOT EXISTS social_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        month_year VARCHAR(7) NOT NULL, -- formato: '2024-06'
        followers_count INTEGER DEFAULT 0,
        sales_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, platform, month_year)
      )
    `;
    console.log('✅ Tabela social_progress criada');

    // Inserir dados de exemplo para demonstração
    console.log('📊 Inserindo dados de exemplo...');
    
    // Primeiro, vamos verificar se existe um usuário admin
    const adminUser = await db`SELECT id FROM users WHERE "nivelacesso" = 'admin' LIMIT 1`;
    let userId;
    
    if (adminUser.length > 0) {
      userId = adminUser[0].id;
    } else {
      // Criar um usuário de exemplo se não existir admin
      const newUser = await db`
        INSERT INTO users (name, email, password, "nivelacesso") 
        VALUES ('Demo User', 'demo@designauto.com', 'demo123', 'admin')
        RETURNING id
      `;
      userId = newUser[0].id;
    }

    // Inserir perfis de exemplo
    await db`
      INSERT INTO social_profiles (user_id, platform, username, profile_url, followers_count)
      VALUES 
        (${userId}, 'instagram', '@designauto_oficial', 'https://instagram.com/designauto_oficial', 8500),
        (${userId}, 'facebook', 'DesignAuto', 'https://facebook.com/designauto', 4200)
      ON CONFLICT DO NOTHING
    `;

    // Inserir metas de exemplo
    await db`
      INSERT INTO social_goals (user_id, platform, goal_type, current_value, target_value, deadline)
      VALUES 
        (${userId}, 'instagram', 'followers', 8500, 10000, '2024-12-31'),
        (${userId}, 'facebook', 'followers', 4200, 5000, '2024-11-30'),
        (${userId}, 'general', 'sales', 125, 150, '2024-10-31')
      ON CONFLICT DO NOTHING
    `;

    // Inserir dados históricos de exemplo
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
    const instagramData = [7200, 7500, 7800, 8100, 8300, 8500];
    const facebookData = [3800, 3900, 4000, 4100, 4150, 4200];
    const salesData = [45, 52, 58, 65, 70, 75];

    for (let i = 0; i < months.length; i++) {
      await db`
        INSERT INTO social_progress (user_id, platform, month_year, followers_count, sales_count)
        VALUES 
          (${userId}, 'instagram', ${months[i]}, ${instagramData[i]}, ${salesData[i]}),
          (${userId}, 'facebook', ${months[i]}, ${facebookData[i]}, ${Math.floor(salesData[i] * 0.6)})
        ON CONFLICT (user_id, platform, month_year) DO NOTHING
      `;
    }

    console.log('✅ Sistema de crescimento social configurado com sucesso!');
    console.log('📊 Dados de exemplo inseridos para demonstração');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSocialGrowthTables()
    .then(() => {
      console.log('🎉 Setup completo!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha no setup:', error);
      process.exit(1);
    });
}

export { createSocialGrowthTables };