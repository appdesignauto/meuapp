/**
 * SOLUÇÃO DEFINITIVA PARA O PROBLEMA DO ENDPOINT DE ASSINATURAS
 * 
 * Este script remove completamente o endpoint problemático e cria um novo funcional
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixSubscriptionEndpoint() {
  try {
    console.log('🔧 Iniciando correção definitiva do endpoint de assinaturas...');
    
    const routesPath = path.join(__dirname, 'server', 'routes.ts');
    let content = fs.readFileSync(routesPath, 'utf8');
    
    // Remover qualquer endpoint antigo problemático
    const problematicPatterns = [
      /\/\/ ENDPOINT.*subscription-users[\s\S]*?app\.get\(["']\/api\/admin\/subscription-users["'][\s\S]*?}\);/g,
      /app\.get\(["']\/api\/admin\/subscription-users["'][\s\S]*?}\);/g
    ];
    
    problematicPatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Adicionar o novo endpoint funcional no final das rotas
    const newEndpoint = `
  // ✅ ENDPOINT FUNCIONAL - Lista de usuários com assinaturas (SOLUÇÃO FINAL)
  app.get("/api/admin/subscription-users", isAdmin, async (req, res) => {
    try {
      console.log("📋 Listando usuários com assinaturas - VERSÃO FINAL...");
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Conexão PostgreSQL robusta
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      await client.connect();
      
      // Query otimizada e funcional
      const usersQuery = \`
        SELECT 
          id, username, email, name, profileimageurl, nivelacesso, 
          origemassinatura, tipoplano, dataassinatura, dataexpiracao, 
          acessovitalicio, isactive, criadoem, ultimologin
        FROM users 
        WHERE isactive = true
        ORDER BY criadoem DESC
        LIMIT $1 OFFSET $2
      \`;
      
      const countQuery = \`SELECT COUNT(*) as total FROM users WHERE isactive = true\`;
      
      // Executar queries de forma segura
      const usersResult = await client.query(usersQuery, [limit, offset]);
      const countResult = await client.query(countQuery);
      
      await client.end();
      
      // Processar usuários de forma robusta e segura
      const users = [];
      
      if (usersResult && usersResult.rows && Array.isArray(usersResult.rows)) {
        usersResult.rows.forEach((user) => {
          const isLifetime = Boolean(user.acessovitalicio);
          const isPremium = ['premium', 'designer', 'designer_adm'].includes(user.nivelacesso);
          
          users.push({
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name || user.username,
            profileimageurl: user.profileimageurl,
            nivelacesso: user.nivelacesso,
            origemassinatura: user.origemassinatura,
            tipoplano: user.tipoplano,
            dataassinatura: user.dataassinatura,
            dataexpiracao: user.dataexpiracao,
            acessovitalicio: user.acessovitalicio,
            isactive: user.isactive,
            criadoem: user.criadoem,
            ultimologin: user.ultimologin,
            subscriptionStatus: isLifetime ? 'lifetime' : (isPremium ? 'premium' : 'free'),
            daysRemaining: user.dataexpiracao && !isLifetime ? 
              Math.max(0, Math.ceil((new Date(user.dataexpiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 
              null
          });
        });
      }
      
      const total = parseInt(countResult?.rows?.[0]?.total || '0');
      const totalPages = Math.ceil(total / limit);
      
      console.log(\`✅ Usuários processados com sucesso: \${users.length} de \${total} total\`);
      
      res.status(200).json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
      
    } catch (error) {
      console.error("❌ Erro ao listar usuários:", error);
      res.status(500).json({ 
        message: "Erro ao listar usuários", 
        error: error.message 
      });
    }
  });
`;
    
    // Inserir o novo endpoint antes do último return da função
    const insertPosition = content.lastIndexOf('return server;');
    if (insertPosition !== -1) {
      content = content.slice(0, insertPosition) + newEndpoint + '\n\n  ' + content.slice(insertPosition);
    }
    
    // Salvar o arquivo corrigido
    fs.writeFileSync(routesPath, content);
    
    console.log('✅ Endpoint de assinaturas corrigido com sucesso!');
    console.log('✅ Endpoint problemático removido');
    console.log('✅ Novo endpoint funcional adicionado');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir endpoint:', error);
    throw error;
  }
}

// Executar a correção
fixSubscriptionEndpoint()
  .then(() => {
    console.log('🎉 Correção concluída com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Falha na correção:', error);
    process.exit(1);
  });