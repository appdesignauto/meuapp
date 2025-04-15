/**
 * Script para atualizar URLs de imagens no banco de dados
 * Uso: node scripts/update-arts-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configurar WebSocket para Neon Database
neonConfig.webSocketConstructor = ws;

// Configuração para usar __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivo com os resultados dos uploads
const RESULTS_FILE = path.join(__dirname, 'all-images-results.json');

// Apenas para logging, não modifica o banco de dados
const DRY_RUN = true; // Alterar para false quando estiver pronto para executar

// Função para conectar ao banco de dados
async function connectToDatabase() {
  // Verifica se a variável de ambiente DATABASE_URL está definida
  if (!process.env.DATABASE_URL) {
    throw new Error('Variável de ambiente DATABASE_URL não definida');
  }

  // Cria um pool de conexões
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return pool;
}

// Função para atualizar os URLs das imagens no banco de dados
async function updateImagesInDatabase() {
  try {
    // Verifica se o arquivo de resultados existe
    if (!fs.existsSync(RESULTS_FILE)) {
      throw new Error(`Arquivo de resultados não encontrado: ${RESULTS_FILE}`);
    }

    // Lê o arquivo de resultados
    const resultsData = fs.readFileSync(RESULTS_FILE, 'utf8');
    const uploadResults = JSON.parse(resultsData);

    console.log(`Carregados ${uploadResults.length} resultados de upload`);

    if (DRY_RUN) {
      console.log('\nMODO DE SIMULAÇÃO ATIVADO (DRY RUN)');
      console.log('Nenhuma alteração será feita no banco de dados');
      console.log('Para executar as atualizações, altere DRY_RUN para false no script\n');
    }

    // Conecta ao banco de dados
    const pool = await connectToDatabase();
    console.log('Conectado ao banco de dados');

    // Consulta todas as artes do banco de dados
    const { rows: arts } = await pool.query('SELECT id, title, "imageUrl", "thumbnailUrl" FROM arts');
    console.log(`Encontradas ${arts.length} artes no banco de dados`);

    // Cria mapeamento de nome para URL
    const nameToUrlMap = {};
    uploadResults.forEach(result => {
      // Remove a extensão para facilitar a correspondência parcial
      const baseName = result.originalFile.split('.')[0];
      nameToUrlMap[baseName.toLowerCase()] = {
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl
      };
    });

    // Conta atualizações
    let updateCount = 0;
    let noMatchCount = 0;

    // Percorre cada arte e tenta encontrar uma correspondência
    for (const art of arts) {
      let matched = false;
      
      // Tenta encontrar uma correspondência pelo título da arte
      if (art.title) {
        const artTitle = art.title.toLowerCase();
        
        for (const [baseName, urls] of Object.entries(nameToUrlMap)) {
          // Verifica se o nome da imagem está contido no título da arte ou vice-versa
          if (artTitle.includes(baseName) || baseName.includes(artTitle)) {
            console.log(`Correspondência encontrada:`);
            console.log(`  Arte ID ${art.id}: "${art.title}"`);
            console.log(`  Imagem: "${baseName}"`);
            console.log(`  URL Atual: ${art.imageUrl}`);
            console.log(`  Novo URL: ${urls.imageUrl}`);
            console.log('---');
            
            // Atualiza os URLs no banco de dados
            if (!DRY_RUN) {
              await pool.query(
                'UPDATE arts SET imageUrl = $1, thumbnailUrl = $2 WHERE id = $3',
                [urls.imageUrl, urls.thumbnailUrl, art.id]
              );
            }
            
            updateCount++;
            matched = true;
            break;
          }
        }
      }
      
      if (!matched) {
        noMatchCount++;
        console.log(`Sem correspondência para: "${art.title}" (ID: ${art.id})`);
      }
    }

    console.log('\n--- RESUMO ---');
    console.log(`Total de artes: ${arts.length}`);
    console.log(`Atualizações encontradas: ${updateCount}`);
    console.log(`Sem correspondência: ${noMatchCount}`);
    
    if (DRY_RUN) {
      console.log('\nIMPORTANTE: Nenhuma alteração foi feita no banco de dados (modo DRY_RUN)');
      console.log('Para executar as atualizações, altere DRY_RUN para false no script');
    } else {
      console.log('\nBanco de dados atualizado com sucesso!');
    }

    // Fecha a conexão com o banco de dados
    await pool.end();
  } catch (error) {
    console.error('Erro ao atualizar imagens:', error);
  }
}

// Executa o script
updateImagesInDatabase();