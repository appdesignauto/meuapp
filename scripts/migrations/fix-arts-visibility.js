// O problema: Artes ocultas ainda são exibidas nas páginas públicas
// Solução: Adicionar filtro isVisible=true em todas as queries que buscam artes

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesFilePath = path.join(__dirname, 'server/routes.ts');
let routesContent = fs.readFileSync(routesFilePath, 'utf8');

// Para corrigir a primeira rota /api/arts/recent (linha ~1143)
routesContent = routesContent.replace(
  `  app.get("/api/arts/recent", async (req, res) => {
    try {
      // Buscar as 6 artes mais recentes diretamente da tabela artes
      const artsResult = await db.execute(sql\`
        SELECT 
          id, 
          "createdAt", 
          "updatedAt", 
          title, 
          "imageUrl",
          format,
          "isPremium"
        FROM arts 
        ORDER BY "createdAt" DESC 
        LIMIT 6
      \`);`,
  `  app.get("/api/arts/recent", async (req, res) => {
    try {
      // Verificar se o usuário é admin para determinar visibilidade
      const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm' || req.user?.nivelacesso === 'designer';
      
      // Buscar as 6 artes mais recentes diretamente da tabela artes (apenas visíveis para usuários normais)
      const artsResult = await db.execute(sql\`
        SELECT 
          id, 
          "createdAt", 
          "updatedAt", 
          title, 
          "imageUrl",
          format,
          "isPremium"
        FROM arts 
        WHERE \${!isAdmin ? sql\`"isVisible" = TRUE\` : sql\`1=1\`}
        ORDER BY "createdAt" DESC 
        LIMIT 6
      \`);`
);

// Para corrigir a segunda rota /api/arts/recent (linha ~1308)
const secondOccurrenceIndex = routesContent.indexOf(`  app.get("/api/arts/recent", async (req, res) => {`, routesContent.indexOf(`  app.get("/api/arts/recent", async (req, res) => {`) + 1);

if (secondOccurrenceIndex !== -1) {
  const secondOccurrence = routesContent.substring(secondOccurrenceIndex, secondOccurrenceIndex + 500);
  
  const replacedSecondOccurrence = secondOccurrence.replace(
    `  app.get("/api/arts/recent", async (req, res) => {
    try {
      // Buscar as 6 artes mais recentes diretamente da tabela artes
      const artsResult = await db.execute(sql\`
        SELECT 
          id, 
          "createdAt", 
          "updatedAt",`,
    `  app.get("/api/arts/recent", async (req, res) => {
    try {
      // Verificar se o usuário é admin para determinar visibilidade
      const isAdmin = req.user?.nivelacesso === 'admin' || req.user?.nivelacesso === 'designer_adm' || req.user?.nivelacesso === 'designer';
      
      // Buscar as 6 artes mais recentes diretamente da tabela artes (apenas visíveis para usuários normais)
      const artsResult = await db.execute(sql\`
        SELECT 
          id, 
          "createdAt", 
          "updatedAt",`
  );
  
  routesContent = routesContent.substring(0, secondOccurrenceIndex) + replacedSecondOccurrence + routesContent.substring(secondOccurrenceIndex + 500);
}

// Adicionar WHERE "isVisible" = TRUE após FROM arts nas consultas subsequentes
// Linhas após FROM arts na segunda ocorrência
const fromArtsIndex = routesContent.lastIndexOf('FROM arts', routesContent.length);
if (fromArtsIndex !== -1) {
  // Encontrar a próxima linha após FROM arts
  const afterFromIndex = routesContent.indexOf('\n', fromArtsIndex);
  if (afterFromIndex !== -1) {
    const beforeFromArts = routesContent.substring(0, afterFromIndex);
    const afterFromArts = routesContent.substring(afterFromIndex);
    
    routesContent = beforeFromArts + '\n        WHERE ${!isAdmin ? sql`"isVisible" = TRUE` : sql`1=1`}' + afterFromArts;
  }
}

// Salvar as alterações
fs.writeFileSync(routesFilePath, routesContent, 'utf8');

console.log('✅ Rotas de artes atualizadas para filtrar artes não visíveis');
