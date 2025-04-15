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
    const { rows: arts } = await pool.query('SELECT id, title, "imageUrl" FROM arts');
    console.log(`Encontradas ${arts.length} artes no banco de dados`);

    // Cria mapeamento organizado por categorias
    const categoryMap = {
      lavagem: [],
      mecanica: [],
      locacao: [],
      vendas: []
    };
    
    // Organiza as imagens por categoria
    uploadResults.forEach(result => {
      const filename = result.originalFile.toLowerCase();
      
      if (filename.includes('lavagem')) {
        categoryMap.lavagem.push({
          name: result.originalFile,
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          category: 'lavagem'
        });
      } else if (filename.includes('mecânica') || filename.includes('mecanica')) {
        categoryMap.mecanica.push({
          name: result.originalFile,
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          category: 'mecanica'
        });
      } else if (filename.includes('locação') || filename.includes('locacao')) {
        categoryMap.locacao.push({
          name: result.originalFile,
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          category: 'locacao'
        });
      } else if (filename.includes('vendas') || filename.includes('venda')) {
        categoryMap.vendas.push({
          name: result.originalFile,
          imageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          category: 'vendas'
        });
      }
    });
    
    console.log('Imagens organizadas por categoria:');
    for (const [category, images] of Object.entries(categoryMap)) {
      console.log(`  ${category}: ${images.length} imagens`);
    }

    // Conta atualizações
    let updateCount = 0;
    let noMatchCount = 0;
    let manualMatchCount = 0;

    // Atribuições manuais para casos específicos
    const manualMatches = [
      { artId: 1, imageFileName: 'LAVAGEM 01.png' },
      { artId: 2, imageFileName: 'LAVAGEM 03.png' },
      { artId: 3, imageFileName: 'LAVAGEM 04.png' },
      { artId: 4, imageFileName: 'LAVAGEM 10.png' },
      { artId: 5, imageFileName: 'MECÂNICA 08.png' },
      { artId: 6, imageFileName: 'MECÂNICA MOTO 01.png' },
      { artId: 7, imageFileName: 'LOCAÇÃO 06.png' },
      { artId: 8, imageFileName: 'VENDAS 32.png' },
      { artId: 9, imageFileName: 'VENDAS 04.png' },
      { artId: 10, imageFileName: 'VENDAS 10.png' },
      { artId: 11, imageFileName: 'VENDAS 36.png' },
      { artId: 12, imageFileName: 'VENDAS 57.png' }
    ];

    // Percorre cada arte e tenta encontrar uma correspondência
    for (const art of arts) {
      let matched = false;
      
      // Primeiro tenta com as atribuições manuais
      const manualMatch = manualMatches.find(match => match.artId === art.id);
      if (manualMatch) {
        const originalFile = manualMatch.imageFileName;
        const matchedImage = uploadResults.find(result => 
          result.originalFile.toLowerCase() === originalFile.toLowerCase());
          
        if (matchedImage) {
          console.log(`Correspondência manual encontrada:`);
          console.log(`  Arte ID ${art.id}: "${art.title}"`);
          console.log(`  Imagem: "${originalFile}"`);
          console.log(`  URL Atual: ${art.imageUrl}`);
          console.log(`  Novo URL: ${matchedImage.imageUrl}`);
          console.log('---');
          
          // Atualiza os URLs no banco de dados
          if (!DRY_RUN) {
            await pool.query(
              'UPDATE arts SET "imageUrl" = $1 WHERE id = $2',
              [matchedImage.imageUrl, art.id]
            );
          }
          
          updateCount++;
          manualMatchCount++;
          matched = true;
          continue;
        }
      }
      
      // Se não encontrou correspondência manual, tenta por título
      if (!matched && art.title) {
        const artTitle = art.title.toLowerCase();
        let category = '';
        
        // Determina a categoria pelo título
        if (artTitle.includes('lavagem')) {
          category = 'lavagem';
        } else if (artTitle.includes('revisão') || artTitle.includes('manutenção') || artTitle.includes('mecanica')) {
          category = 'mecanica';
        } else if (artTitle.includes('locação') || artTitle.includes('plano')) {
          category = 'locacao';
        } else if (artTitle.includes('venda') || artTitle.includes('carro') || artTitle.includes('volkswagen') || artTitle.includes('bmw')) {
          category = 'vendas';
        }
        
        // Se identificou uma categoria, tenta encontrar imagem correspondente
        if (category && categoryMap[category].length > 0) {
          // Pega a primeira imagem da categoria
          const matchedImage = categoryMap[category][0];
          
          console.log(`Correspondência por categoria encontrada:`);
          console.log(`  Arte ID ${art.id}: "${art.title}" (categoria: ${category})`);
          console.log(`  Imagem: "${matchedImage.name}"`);
          console.log(`  URL Atual: ${art.imageUrl}`);
          console.log(`  Novo URL: ${matchedImage.imageUrl}`);
          console.log('---');
          
          // Atualiza os URLs no banco de dados
          if (!DRY_RUN) {
            await pool.query(
              'UPDATE arts SET "imageUrl" = $1 WHERE id = $2',
              [matchedImage.imageUrl, art.id]
            );
          }
          
          // Remove a imagem da lista para não reutilizá-la
          categoryMap[category].shift();
          
          updateCount++;
          matched = true;
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