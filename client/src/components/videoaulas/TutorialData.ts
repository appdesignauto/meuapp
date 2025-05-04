// Defininção do tipo Tutorial para uso em todo o aplicativo
export interface Tutorial {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoProvider: 'youtube' | 'vimeo' | 'vturb' | 'panda' | 'direct';
  duration: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  isPremium: boolean;
  isWatched?: boolean;
  views: number;
  category?: string;
  tags: string[];
  moduleId?: number;
}

// Dados de exemplo para tutoriais
export const tutoriais: Tutorial[] = [
  {
    id: 1,
    title: "Introdução ao Design para Carros",
    description: "Aprenda os conceitos básicos de design para o setor automotivo, com foco em estratégias para atrair clientes.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1470&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "15:35",
    level: "iniciante",
    isPremium: false,
    views: 5234,
    tags: ["design", "carros", "iniciante", "marketing"],
    moduleId: 1
  },
  {
    id: 2,
    title: "Cores e Tipografia em Anúncios Automotivos",
    description: "Descubra como escolher cores e fontes que transmitem confiança e qualidade para seu público alvo.",
    thumbnailUrl: "https://images.unsplash.com/photo-1535063130060-8a72e8d5f8ef?q=80&w=1170&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "22:18",
    level: "iniciante",
    isPremium: false,
    views: 3912,
    isWatched: true,
    tags: ["cores", "tipografia", "design", "carros"],
    moduleId: 1
  },
  {
    id: 3,
    title: "Layouts para Promoções de Concessionárias",
    description: "Técnicas avançadas para criar layouts de promoções que realmente convertem em visitas à loja.",
    thumbnailUrl: "https://images.unsplash.com/photo-1566473965997-3de9c817e938?q=80&w=1470&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "32:47",
    level: "intermediario",
    isPremium: true,
    views: 2845,
    tags: ["layout", "promoções", "conversão", "concessionárias"],
    moduleId: 2
  },
  {
    id: 4,
    title: "Fotografias Profissionais para Veículos",
    description: "Como fazer fotografia profissional de carros com equipamento básico e técnicas de iluminação.",
    thumbnailUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0d02?q=80&w=1470&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "45:21",
    level: "intermediario",
    isPremium: true,
    views: 4761,
    tags: ["fotografia", "carros", "iluminação", "profissional"],
    moduleId: 2
  },
  {
    id: 5,
    title: "Edição de Imagens para Destacar Veículos",
    description: "Aprenda técnicas de edição de imagens para destacar os pontos fortes dos veículos e minimizar imperfeições.",
    thumbnailUrl: "https://images.unsplash.com/photo-1596385580824-6ed38c4d8d7c?q=80&w=1470&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "28:33",
    level: "avancado",
    isPremium: true,
    views: 3489,
    tags: ["edição", "photoshop", "lightroom", "carros"],
    moduleId: 3
  },
  {
    id: 6,
    title: "Estratégias para Redes Sociais Automotivas",
    description: "Como criar presença digital efetiva para sua loja de carros, oficina ou concessionária.",
    thumbnailUrl: "https://images.unsplash.com/photo-1612825173281-9a193378527e?q=80&w=1499&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "19:45",
    level: "iniciante",
    isPremium: false,
    views: 6891,
    tags: ["redes sociais", "marketing digital", "instagram", "facebook"],
    moduleId: 1
  },
  {
    id: 7,
    title: "Criando Publicações para Instagram Stories",
    description: "Como criar publicações atrativas para Instagram Stories que geram interesse e conversões.",
    thumbnailUrl: "https://images.unsplash.com/photo-1619196721139-4039c7f323a9?q=80&w=1374&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "16:22",
    level: "intermediario",
    isPremium: false,
    isWatched: true,
    views: 5127,
    tags: ["instagram", "stories", "design", "marketing"],
    moduleId: 2
  },
  {
    id: 8,
    title: "Criação de Anúncios para Google e Facebook",
    description: "Técnicas avançadas para anúncios pagos que trazem resultados no setor automotivo.",
    thumbnailUrl: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=1470&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "36:14",
    level: "avancado",
    isPremium: true,
    views: 3967,
    tags: ["google ads", "facebook ads", "anúncios", "conversão"],
    moduleId: 3
  },
  {
    id: 9,
    title: "Design para Campanhas Sazonais Automotivas",
    description: "Como criar designs impactantes para campanhas sazonais como Black Friday, Natal e liquidação de estoque.",
    thumbnailUrl: "https://images.unsplash.com/photo-1603816245457-bf9598ac0548?q=80&w=1374&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "24:56",
    level: "intermediario",
    isPremium: true,
    views: 2913,
    tags: ["campanhas", "sazonais", "design", "black friday"],
    moduleId: 2
  },
  {
    id: 10,
    title: "Fotografando Interiores de Veículos",
    description: "Técnicas específicas para fotografar interiores de carros com qualidade profissional.",
    thumbnailUrl: "https://images.unsplash.com/photo-1594595711524-70a953c3fef2?q=80&w=1471&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "31:08",
    level: "avancado",
    isPremium: true,
    views: 3412,
    tags: ["fotografia", "interiores", "carros", "profissional"],
    moduleId: 3
  },
  {
    id: 11,
    title: "Princípios de Design para Oficinas Mecânicas",
    description: "Como criar uma identidade visual profissional para oficinas mecânicas e serviços automotivos.",
    thumbnailUrl: "https://images.unsplash.com/photo-1632823471565-1978922f9903?q=80&w=1470&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "20:45",
    level: "iniciante",
    isPremium: false,
    views: 4521,
    tags: ["oficinas", "identidade visual", "design", "serviços"],
    moduleId: 1
  },
  {
    id: 12,
    title: "Criação de Vídeos para Apresentação de Veículos",
    description: "Aprenda a criar vídeos profissionais para destacar os melhores atributos dos veículos à venda.",
    thumbnailUrl: "https://images.unsplash.com/photo-1607347888411-98a61b0d84db?q=80&w=1470&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoProvider: "youtube",
    duration: "42:17",
    level: "avancado",
    isPremium: true,
    views: 2874,
    tags: ["vídeos", "edição", "carros", "marketing"],
    moduleId: 3
  }
];

// Tutorial em destaque
export const tutorialDestaque = tutoriais[0];

// Tutoriais recentes (os 6 mais recentes)
export const tutoriaisRecentes = [...tutoriais].sort(() => 0.5 - Math.random()).slice(0, 6);

// Tutoriais populares (os 6 mais visualizados)
export const tutoriaisPopulares = [...tutoriais].sort((a, b) => b.views - a.views).slice(0, 8);

// Definição da interface para categoria
export interface TutorialCategoria {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  tutoriais: Tutorial[];
}

// Tutoriais por categoria
export const tutoriaisPorCategoria: TutorialCategoria[] = [
  {
    id: 1,
    title: "Design Automotivo",
    subtitle: "Elementos visuais para o setor de carros",
    icon: "🎨",
    tutoriais: tutoriais.filter(t => t.tags.includes('design'))
  },
  {
    id: 2,
    title: "Marketing Digital",
    subtitle: "Estratégias para vender mais",
    icon: "📢",
    tutoriais: tutoriais.filter(t => t.tags.includes('marketing'))
  },
  {
    id: 3,
    title: "Fotografia Automotiva",
    subtitle: "Técnicas profissionais",
    icon: "📸",
    tutoriais: tutoriais.filter(t => t.tags.includes('fotografia'))
  },
  {
    id: 4,
    title: "Edição de Imagens",
    subtitle: "Pós-processamento profissional",
    icon: "🖌️",
    tutoriais: tutoriais.filter(t => t.tags.includes('edição'))
  }
];

// Tutoriais por nível
export const iniciantes = tutoriais.filter(t => t.level === 'iniciante');
export const intermediarios = tutoriais.filter(t => t.level === 'intermediario');
export const avancados = tutoriais.filter(t => t.level === 'avancado');

// Simulação de categorias (para a versão inicial do site)
export const categoriasSimuladas = [
  { 
    id: 1, 
    title: "Fundamentos de Design Automotivo", 
    description: "Conceitos básicos para criar designs impactantes no setor de carros",
    count: 12,
    image: "https://images.unsplash.com/photo-1587083153542-dea3e8ceaf80?q=80&w=1470&auto=format&fit=crop"
  },
  { 
    id: 2, 
    title: "Marketing Digital Automotivo", 
    description: "Estratégias de marketing digital focadas em concessionárias e lojas de carros",
    count: 8,
    image: "https://images.unsplash.com/photo-1522152514029-8a6d8eef9bfa?q=80&w=1470&auto=format&fit=crop"
  },
  { 
    id: 3, 
    title: "Fotografia de Veículos", 
    description: "Técnicas especializadas para fotografar carros com qualidade profissional",
    count: 10,
    image: "https://images.unsplash.com/photo-1626668893632-6f3a4466d092?q=80&w=1472&auto=format&fit=crop"
  },
  { 
    id: 4, 
    title: "Designs para Concessionárias", 
    description: "Layouts e materiais específicos para concessionárias e revendas",
    count: 6,
    image: "https://images.unsplash.com/photo-1574023717850-fd019f64d416?q=80&w=1500&auto=format&fit=crop"
  },
  { 
    id: 5, 
    title: "Edição Profissional de Imagens", 
    description: "Manipulação e edição de fotos para destacar veículos e serviços",
    count: 9,
    image: "https://images.unsplash.com/photo-1631016800696-5ea8801b3c2a?q=80&w=1470&auto=format&fit=crop"
  },
  { 
    id: 6, 
    title: "Redes Sociais para Automotivos", 
    description: "Conteúdo especializado para Instagram, Facebook e outras plataformas",
    count: 7,
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop"
  }
];