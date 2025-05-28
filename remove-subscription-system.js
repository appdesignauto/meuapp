#!/usr/bin/env node

/**
 * Script para remover completamente o sistema de assinaturas
 * Remove arquivos, rotas, componentes e todas as dependências relacionadas
 */

import fs from 'fs';
import path from 'path';

console.log('🗑️ Removendo sistema de assinaturas completo...');

// 1. Remover arquivos do frontend
const frontendFilesToRemove = [
  'client/src/pages/admin/AssinaturasPage.tsx',
  'client/src/pages/admin/TestSubscriptionSettingsPage.tsx',
  'client/src/pages/painel/PainelAssinatura.tsx',
  'client/src/components/admin/SubscriptionDashboard.tsx',
  'client/src/components/admin/SubscriptionManagement.tsx'
];

frontendFilesToRemove.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removido: ${filePath}`);
  }
});

// 2. Remover serviços do backend
const backendFilesToRemove = [
  'server/services/subscription-service.ts'
];

backendFilesToRemove.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removido: ${filePath}`);
  }
});

// 3. Remover scripts relacionados a assinaturas
const scriptsToRemove = [
  'fix-subscription-dashboard.cjs',
  'fix-subscription-endpoint-final.js',
  'fix-subscription-endpoints.js',
  'fix-subscription-users-final.js',
  'add-subscription-settings-table.js',
  'create-subscription-settings-table.js'
];

scriptsToRemove.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removido script: ${filePath}`);
  }
});

console.log('✅ Remoção de arquivos concluída!');
console.log('📝 Próximos passos manuais:');
console.log('   - Limpar rotas de assinaturas no server/routes.ts');
console.log('   - Remover referências no dashboard administrativo');
console.log('   - Atualizar navegação do painel do usuário');