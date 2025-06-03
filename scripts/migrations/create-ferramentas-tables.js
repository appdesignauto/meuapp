import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from './shared/schema.js';
import 'dotenv/config';

// Função para obter a conexão com o banco de dados
async function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida nas variáveis de ambiente');
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  return { pool, db };
}

// Função para criar as tabelas de ferramentas
async function createFerramentasTables() {
  try {
    console.log('Iniciando criação das tabelas de ferramentas...');
    
    const { pool, db } = await getDatabase();
    
    // Verificar se a tabela ferramentasCategorias já existe
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "ferramentasCategorias" (
          "id" SERIAL PRIMARY KEY,
          "nome" TEXT NOT NULL,
          "slug" TEXT NOT NULL UNIQUE,
          "descricao" TEXT,
          "icone" TEXT,
          "ordem" INTEGER DEFAULT 0,
          "criadoEm" TIMESTAMP DEFAULT NOW() NOT NULL,
          "atualizadoEm" TIMESTAMP DEFAULT NOW() NOT NULL,
          "ativo" BOOLEAN DEFAULT TRUE
        );
      `);
      
      console.log('Tabela "ferramentasCategorias" criada ou já existente.');
    } catch (error) {
      console.error('Erro ao criar tabela "ferramentasCategorias":', error);
      throw error;
    }

    // Verificar se a tabela ferramentas já existe
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "ferramentas" (
          "id" SERIAL PRIMARY KEY,
          "nome" TEXT NOT NULL,
          "descricao" TEXT,
          "imageUrl" TEXT,
          "websiteUrl" TEXT NOT NULL,
          "isExterno" BOOLEAN DEFAULT TRUE,
          "isNovo" BOOLEAN DEFAULT FALSE,
          "categoriaId" INTEGER NOT NULL REFERENCES "ferramentasCategorias"("id"),
          "ordem" INTEGER DEFAULT 0,
          "criadoEm" TIMESTAMP DEFAULT NOW() NOT NULL,
          "atualizadoEm" TIMESTAMP DEFAULT NOW() NOT NULL,
          "ativo" BOOLEAN DEFAULT TRUE
        );
      `);
      
      console.log('Tabela "ferramentas" criada ou já existente.');
    } catch (error) {
      console.error('Erro ao criar tabela "ferramentas":', error);
      throw error;
    }

    // Criar categorias de exemplo se não existirem
    const categorias = [
      { nome: 'Edição', slug: 'edicao', descricao: 'Ferramentas para edição de imagens', icone: 'Edit', ordem: 1 },
      { nome: 'Remoção de fundo', slug: 'remocao-de-fundo', descricao: 'Ferramentas para remover fundo de imagens', icone: 'Eraser', ordem: 2 },
      { nome: 'Fontes', slug: 'fontes', descricao: 'Bibliotecas de fontes gratuitas', icone: 'Type', ordem: 3 },
      { nome: 'Ícones', slug: 'icones', descricao: 'Bibliotecas de ícones gratuitos', icone: 'SquareAsterisk', ordem: 4 },
      { nome: 'Bancos de imagens', slug: 'bancos-de-imagens', descricao: 'Sites com imagens gratuitas', icone: 'Image', ordem: 5 },
      { nome: 'Cores', slug: 'cores', descricao: 'Ferramentas para paleta de cores', icone: 'Palette', ordem: 6 },
      { nome: 'Melhoria', slug: 'melhoria', descricao: 'Ferramentas para melhorar qualidade de imagens', icone: 'ZoomIn', ordem: 7 }
    ];

    for (const categoria of categorias) {
      try {
        // Verificar se a categoria já existe
        const categoriaExistente = await db.query.ferramentasCategorias.findFirst({
          where: (ferramentasCategorias, { eq }) => eq(ferramentasCategorias.slug, categoria.slug)
        });

        if (!categoriaExistente) {
          // Inserir nova categoria
          await db.insert(schema.ferramentasCategorias).values({
            nome: categoria.nome,
            slug: categoria.slug,
            descricao: categoria.descricao,
            icone: categoria.icone,
            ordem: categoria.ordem,
            ativo: true,
            criadoEm: new Date(),
            atualizadoEm: new Date()
          });
          console.log(`Categoria "${categoria.nome}" criada com sucesso.`);
        } else {
          console.log(`Categoria "${categoria.nome}" já existe.`);
        }
      } catch (error) {
        console.error(`Erro ao criar categoria "${categoria.nome}":`, error);
      }
    }

    // Criar algumas ferramentas de exemplo
    const ferramentas = [
      { 
        nome: 'Canva', 
        slug: 'canva', 
        descricao: 'Editor de design online com milhares de templates',
        imageUrl: '/images/ferramentas/canva.png',
        websiteUrl: 'https://www.canva.com/',
        categoriaSlug: 'edicao',
        isNovo: false,
        ordem: 1
      },
      { 
        nome: 'Remove.bg', 
        slug: 'remove-bg', 
        descricao: 'Remova o fundo de imagens automaticamente',
        imageUrl: '/images/ferramentas/removebg.png',
        websiteUrl: 'https://www.remove.bg/',
        categoriaSlug: 'remocao-de-fundo',
        isNovo: false,
        ordem: 1
      },
      { 
        nome: 'Google Fonts', 
        slug: 'google-fonts', 
        descricao: 'Biblioteca de fontes gratuitas do Google',
        imageUrl: '/images/ferramentas/googlefonts.png',
        websiteUrl: 'https://fonts.google.com/',
        categoriaSlug: 'fontes',
        isNovo: false,
        ordem: 1
      },
      { 
        nome: 'Pixian.ai', 
        slug: 'pixian-ai', 
        descricao: 'Remova fundos com inteligência artificial',
        imageUrl: '/images/ferramentas/pixian.png',
        websiteUrl: 'https://pixian.ai/',
        categoriaSlug: 'remocao-de-fundo',
        isNovo: true,
        ordem: 2
      }
    ];

    for (const ferramenta of ferramentas) {
      try {
        // Buscar ID da categoria pelo slug
        const categoria = await db.query.ferramentasCategorias.findFirst({
          where: (ferramentasCategorias, { eq }) => eq(ferramentasCategorias.slug, ferramenta.categoriaSlug)
        });

        if (!categoria) {
          console.log(`Categoria "${ferramenta.categoriaSlug}" não encontrada para ferramenta "${ferramenta.nome}".`);
          continue;
        }

        // Verificar se a ferramenta já existe
        const ferramentaExistente = await db.query.ferramentas.findFirst({
          where: (ferramentas, { eq }) => eq(ferramentas.nome, ferramenta.nome)
        });

        if (!ferramentaExistente) {
          // Inserir nova ferramenta
          await db.insert(schema.ferramentas).values({
            nome: ferramenta.nome,
            descricao: ferramenta.descricao,
            imageUrl: ferramenta.imageUrl,
            websiteUrl: ferramenta.websiteUrl,
            isExterno: true,
            isNovo: ferramenta.isNovo,
            categoriaId: categoria.id,
            ordem: ferramenta.ordem,
            ativo: true,
            criadoEm: new Date(),
            atualizadoEm: new Date()
          });
          console.log(`Ferramenta "${ferramenta.nome}" criada com sucesso.`);
        } else {
          console.log(`Ferramenta "${ferramenta.nome}" já existe.`);
        }
      } catch (error) {
        console.error(`Erro ao criar ferramenta "${ferramenta.nome}":`, error);
      }
    }

    console.log('Processo de criação de tabelas e dados iniciais concluído com sucesso!');
    
    // Fechar a conexão com o banco de dados
    await pool.end();
  } catch (error) {
    console.error('Erro ao criar tabelas de ferramentas:', error);
  }
}

// Executar a função de criação das tabelas
createFerramentasTables();