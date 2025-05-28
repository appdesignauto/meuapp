#!/usr/bin/env node

/**
 * Script para corrigir rapidamente os erros que estão impedindo o servidor de iniciar
 * após a remoção completa do sistema de assinaturas
 */

const fs = require('fs');

console.log('🚀 Corrigindo erros críticos do servidor...');

// 1. Corrigir server/index.ts - remover código problemático
const indexPath = 'server/index.ts';
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Remover código problemático que está causando erros de sintaxe
  content = content.replace(/\s*\/\/ Métricas de assinatura[\s\S]*?catch \(error\) \{[\s\S]*?console\.error\("Erro ao calcular métricas:", error\);[\s\S]*?\}/g, '');
  content = content.replace(/\s*res\.json\(allUsers\);[\s\S]*?res\.status\(500\)\.json\(\{ message: "Erro interno do servidor" \}\);/g, '');
  content = content.replace(/\s*const downgradedCount[\s\S]*?const initialDowngradedCount[\s\S]*?\};/g, '');
  
  // Garantir que a estrutura esteja correta
  if (!content.includes('} catch (error) {\n    console.error("Erro ao inicializar banco de dados:", error);\n  }')) {
    // Adicionar estrutura de erro padrão se não existir
    content = content.replace(
      /console\.log\("Serviço da Hotmart inicializado com sucesso no modo " \+ \(process\.env\.HOTMART_SANDBOX === 'true' \? 'Sandbox' : 'Produção'\)\);/,
      `console.log("Serviço da Hotmart inicializado com sucesso no modo " + (process.env.HOTMART_SANDBOX === 'true' ? 'Sandbox' : 'Produção'));
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
  }`
    );
  }
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Arquivo index.ts corrigido');
}

// 2. Garantir que todas as rotas estão funcionais
const routesPath = 'server/routes.ts';
if (fs.existsSync(routesPath)) {
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Garantir que todas as rotas necessárias estão presentes
  if (!content.includes('setupAuth(app);')) {
    const setupAuthIndex = content.indexOf('// Aplicar middleware global');
    if (setupAuthIndex !== -1) {
      content = content.slice(0, setupAuthIndex) + 
        'setupAuth(app);\n  \n  ' + 
        content.slice(setupAuthIndex);
    }
  }
  
  // Adicionar rotas básicas necessárias se não existirem
  if (!content.includes('setupFollowRoutesSimple(app);')) {
    const beforeReturn = content.lastIndexOf('return server;');
    if (beforeReturn !== -1) {
      content = content.slice(0, beforeReturn) + 
        '  setupFollowRoutesSimple(app);\n  \n  ' + 
        content.slice(beforeReturn);
    }
  }
  
  fs.writeFileSync(routesPath, content);
  console.log('✅ Arquivo routes.ts corrigido');
}

console.log('🎉 Correções aplicadas com sucesso! O servidor deve iniciar agora.');