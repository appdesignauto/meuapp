/**
 * Script para testar o redirecionamento do painel administrativo
 */
console.log("Testando Rotas Administrativas:");
console.log("----------------------------------------");

console.log("Rotas de painel administrativo no App.tsx:");
const fs = require('fs');
const path = require('path');

// Ler App.tsx
const appTsxPath = path.join(__dirname, 'client/src/App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');

// Procurar padrões de rota administrativa
console.log("\nRutas declaradas em App.tsx:");
const adminRoutes = appTsxContent.match(/path="\/admin[^"]*"/g) || [];
adminRoutes.forEach(route => {
  console.log(` - ${route}`);
});

// Procurar outras rotas administrativas
console.log("\nRutas de redirecionamento:");
const redirectRoutes = appTsxContent.match(/path="\/admin-[^"]*"/g) || [];
redirectRoutes.forEach(route => {
  console.log(` - ${route}`);
});

// Analisar o Header.tsx para encontrar onde o link Admin aponta
const headerTsxPath = path.join(__dirname, 'client/src/components/layout/Header.tsx');
const headerTsxContent = fs.readFileSync(headerTsxPath, 'utf8');

console.log("\nLink do botão Admin no Header.tsx:");
const adminLinkMatch = headerTsxContent.match(/Link href="([^"]*)"[^>]*>(\s|\n)*<Button[^>]*>(\s|\n)*<LayoutDashboard/);
if (adminLinkMatch) {
  console.log(` - Link do botão Admin: ${adminLinkMatch[1]}`);
} else {
  console.log(" - Link do botão Admin não encontrado");
}

// Analisar a página de redirecionamento
const adminRedirectPath = path.join(__dirname, 'client/src/pages/admin-redirect.tsx');
const adminRedirectContent = fs.readFileSync(adminRedirectPath, 'utf8');

console.log("\nDestino do redirecionamento em admin-redirect.tsx:");
const redirectMatch = adminRedirectContent.match(/setLocation\('([^']*)'\)/);
if (redirectMatch) {
  console.log(` - Redirecionando para: ${redirectMatch[1]}`);
} else {
  console.log(" - Destino de redirecionamento não encontrado");
}

console.log("\nRota para o UpdatedDashboard:");
const updatedDashboardImport = appTsxContent.match(/import UpdatedDashboard from "([^"]*)"/);
if (updatedDashboardImport) {
  console.log(` - Importando UpdatedDashboard de: ${updatedDashboardImport[1]}`);
} else {
  console.log(" - Import do UpdatedDashboard não encontrado");
}

console.log("\nInformações dos arquivos:");
try {
  const updateDashboardPath = path.join(__dirname, 'client/src/pages/admin/UpdatedDashboard.tsx');
  const updateDashboardStat = fs.statSync(updateDashboardPath);
  console.log(` - UpdatedDashboard.tsx: ${updateDashboardStat.size} bytes (modificado em ${updateDashboardStat.mtime})`);
} catch (err) {
  console.log(` - UpdatedDashboard.tsx: ${err.message}`);
}

console.log("----------------------------------------");
console.log("Debugging concluído.");