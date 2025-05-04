/**
 * Script para popular banco de dados com módulos e aulas de exemplo do TutorialData
 * 
 * Este script insere os módulos e aulas de exemplo no banco de dados
 * para que possam ser visualizados e editados no painel administrativo
 */

const { db } = require('./server/db');
const { courseModules, courseLessons } = require('./shared/schema');
const { sql, desc, eq } = require('drizzle-orm');

// Adaptado dos dados de TutorialData.ts para o esquema do banco
const modulos = [
  {
    id: 1,
    title: "Módulo 1",
    description: "Estratégias para Redes Sociais Automotivas - Como criar presença digital efetiva para sua loja de carros, oficina ou concessionária.",
    thumbnailUrl: "https://images.unsplash.com/photo-1612825173281-9a193378527e?q=80&w=1499&auto=format&fit=crop",
    level: "iniciante",
    order: 1,
    isActive: true,
    isPremium: false,
    createdBy: 1
  },
  {
    id: 2,
    title: "Módulo 2",
    description: "Introdução ao Design para Carros - Aprenda os conceitos básicos de design para o setor automotivo, com foco em estratégias para atrair clientes.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1470&auto=format&fit=crop",
    level: "iniciante",
    order: 2,
    isActive: true,
    isPremium: false,
    createdBy: 1
  },
  {
    id: 3,
    title: "Módulo 3",
    description: "Criando Publicações para Instagram Stories - Como criar publicações atrativas para Instagram Stories que geram interesse e conversões.",
    thumbnailUrl: "https://images.unsplash.com/photo-1619196721139-4039c7f323a9?q=80&w=1374&auto=format&fit=crop",
    level: "intermediario",
    order: 3,
    isActive: true,
    isPremium: false,
    createdBy: 1
  },
  {
    id: 4,
    title: "Módulo 4",
    description: "Fotografias Profissionais para Veículos - Como fazer fotografia profissional de carros com equipamento básico e técnicas de iluminação.",
    thumbnailUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0d02?q=80&w=1470&auto=format&fit=crop",
    level: "intermediario",
    order: 4,
    isActive: true,
    isPremium: true,
    createdBy: 1
  },
  {
    id: 5,
    title: "Módulo 5",
    description: "Princípios de Design para Oficinas Mecânicas - Como criar uma identidade visual profissional para oficinas mecânicas e serviços automotivos.",
    thumbnailUrl: "https://images.unsplash.com/photo-1632823471565-1978922f9903?q=80&w=1470&auto=format&fit=crop",
    level: "iniciante",
    order: 5,
    isActive: true,
    isPremium: false,
    createdBy: 1
  }
];

const aulas = [
  {
    moduleId: 1,
    title: "Estratégias para Redes Sociais Automotivas",
    description: "Como criar presença digital efetiva para sua loja de carros, oficina ou concessionária.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: 19 * 60 + 45, // em segundos (19:45)
    thumbnailUrl: "https://images.unsplash.com/photo-1612825173281-9a193378527e?q=80&w=1499&auto=format&fit=crop",
    order: 1,
    isPremium: false,
    createdBy: 1
  },
  {
    moduleId: 2,
    title: "Introdução ao Design para Carros",
    description: "Aprenda os conceitos básicos de design para o setor automotivo, com foco em estratégias para atrair clientes.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: 15 * 60 + 35, // em segundos (15:35)
    thumbnailUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1470&auto=format&fit=crop",
    order: 1,
    isPremium: false,
    createdBy: 1
  },
  {
    moduleId: 2,
    title: "Cores e Tipografia em Anúncios Automotivos",
    description: "Descubra como escolher cores e fontes que transmitem confiança e qualidade para seu público alvo.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: 22 * 60 + 18, // em segundos (22:18)
    thumbnailUrl: "https://images.unsplash.com/photo-1535063130060-8a72e8d5f8ef?q=80&w=1170&auto=format&fit=crop",
    order: 2,
    isPremium: false,
    createdBy: 1
  },
  {
    moduleId: 3,
    title: "Criando Publicações para Instagram Stories",
    description: "Como criar publicações atrativas para Instagram Stories que geram interesse e conversões.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: 16 * 60 + 22, // em segundos (16:22)
    thumbnailUrl: "https://images.unsplash.com/photo-1619196721139-4039c7f323a9?q=80&w=1374&auto=format&fit=crop",
    order: 1,
    isPremium: false,
    createdBy: 1
  },
  {
    moduleId: 4,
    title: "Fotografias Profissionais para Veículos",
    description: "Como fazer fotografia profissional de carros com equipamento básico e técnicas de iluminação.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: 45 * 60 + 21, // em segundos (45:21)
    thumbnailUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0d02?q=80&w=1470&auto=format&fit=crop",
    order: 1,
    isPremium: true,
    createdBy: 1
  },
  {
    moduleId: 5,
    title: "Princípios de Design para Oficinas Mecânicas",
    description: "Como criar uma identidade visual profissional para oficinas mecânicas e serviços automotivos.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: 20 * 60 + 45, // em segundos (20:45)
    thumbnailUrl: "https://images.unsplash.com/photo-1632823471565-1978922f9903?q=80&w=1470&auto=format&fit=crop",
    order: 1,
    isPremium: false,
    createdBy: 1
  },
  {
    moduleId: 1,
    title: "Atraindo Seguidores nas Redes Sociais",
    description: "Técnicas para atrair seguidores qualificados e interessados em seus produtos automotivos.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: 18 * 60 + 30, // em segundos (18:30)
    thumbnailUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1374&auto=format&fit=crop",
    order: 2,
    isPremium: false,
    createdBy: 1
  },
  {
    moduleId: 4,
    title: "Técnicas de Iluminação para Fotografias Externas",
    description: "Aprenda a controlar a luz natural e usar refletores para fotografias externas perfeitas.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: 28 * 60 + 15, // em segundos (28:15)
    thumbnailUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0d02?q=80&w=1470&auto=format&fit=crop",
    order: 2,
    isPremium: true,
    createdBy: 1
  }
];

// Função para limpar e repopular o banco de dados
async function populateCourseData() {
  try {
    console.log('Iniciando população de dados de curso...');
    
    // Verificar se já existem módulos no banco
    const existingModules = await db.select().from(courseModules);
    console.log(`Encontrados ${existingModules.length} módulos existentes`);
    
    // Se já tiver dados suficientes, não faz nada
    if (existingModules.length >= 5) {
      console.log('Banco de dados já possui módulos suficientes. Abortando população');
      process.exit(0);
    }
    
    // Deletar todas as aulas existentes
    console.log('Limpando aulas existentes...');
    await db.delete(courseLessons);
    
    // Deletar todos os módulos existentes
    console.log('Limpando módulos existentes...');
    await db.delete(courseModules);
    
    // Inserir os módulos
    console.log('Inserindo módulos...');
    for (const modulo of modulos) {
      await db.insert(courseModules).values({
        ...modulo
      });
      console.log(`Módulo "${modulo.title}" inserido`);
    }
    
    // Inserir as aulas
    console.log('Inserindo aulas...');
    for (const aula of aulas) {
      await db.insert(courseLessons).values({
        ...aula
      });
      console.log(`Aula "${aula.title}" inserida`);
    }
    
    console.log('Dados de curso populados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao popular dados de curso:', error);
    process.exit(1);
  }
}

// Executar a função de população
populateCourseData();