// TutorialData.tsx
// Dados de exemplo dos tutoriais para a seção de Videoaulas DesignAuto

import { 
  BookOpen, 
  Play, 
  Award, 
  Star, 
  Sparkles, 
  GraduationCap,
  Layout,
  Image,
  Download,
  Upload,
  FileEdit,
  Search,
  Share2,
  Palette,
  Settings,
  Crop,
  Clock,
  Smartphone,
  Laptop,
  FileText,
  Instagram,
  Facebook,
  ImagePlus,
  PenTool,
  Type
} from 'lucide-react';
import React from 'react';

export interface Tutorial {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  isPremium: boolean;
  level: "iniciante" | "intermediario" | "avancado";
  order: number;
  duration: string | number; // Duração do tutorial em segundos (number) ou formato "MM:SS" (string)
  durationFormatted?: string; // Duração do tutorial em formato "MM:SS" ou "HH:MM:SS"
  createdAt: string;
  updatedAt: string;
  tags: string[];
  views: number;
  isWatched?: boolean;
  category: string;
  videoUrl?: string;
  // Campos adicionais para a transformação de aulas
  moduleId?: number;
  moduloNome?: string;
  videoProvider?: string;
}

// Thumbnails dos tutoriais - usamos URLs neutras que funcionariam como placeholders
const tutorialThumbnails = [
  '/images/placeholder-course.jpg',
  'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=2874&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2574&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2670&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587440871875-191322ee64b0?q=80&w=2971&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2890&auto=format&fit=crop',
];

// Categorias de tutoriais
const tutorialCategories = [
  {
    id: 'primeiros-passos',
    name: 'Primeiros Passos',
    icon: <Play className="h-5 w-5 text-green-500" />,
    color: 'text-green-500'
  },
  {
    id: 'interface',
    name: 'Interface',
    icon: <Layout className="h-5 w-5 text-blue-500" />,
    color: 'text-blue-500'
  },
  {
    id: 'galeria',
    name: 'Galeria de Artes',
    icon: <Image className="h-5 w-5 text-purple-500" />,
    color: 'text-purple-500'
  },
  {
    id: 'downloads',
    name: 'Downloads e Salvamentos',
    icon: <Download className="h-5 w-5 text-red-500" />,
    color: 'text-red-500'
  },
  {
    id: 'uploads',
    name: 'Uploads e Criação',
    icon: <Upload className="h-5 w-5 text-indigo-500" />,
    color: 'text-indigo-500'
  },
  {
    id: 'edicao',
    name: 'Edição de Artes',
    icon: <FileEdit className="h-5 w-5 text-amber-500" />,
    color: 'text-amber-500'
  },
  {
    id: 'mobile',
    name: 'Acesso Mobile',
    icon: <Smartphone className="h-5 w-5 text-teal-500" />,
    color: 'text-teal-500'
  },
  {
    id: 'avancado',
    name: 'Recursos Avançados',
    icon: <Star className="h-5 w-5 text-pink-500" />,
    color: 'text-pink-500'
  }
];

// Criar uma lista de tutoriais com dados pertinentes à plataforma DesignAuto
export const tutoriais: Tutorial[] = [
  // Primeiros Passos
  {
    id: 1,
    title: "Bem-vindo ao DesignAuto - Tour Inicial",
    description: "Um passeio completo pela plataforma DesignAuto. Conheça todas as áreas e funcionalidades disponíveis para o seu negócio automotivo.",
    thumbnailUrl: tutorialThumbnails[0],
    isPremium: false,
    level: "iniciante",
    order: 1,
    duration: "04:35",
    createdAt: "2025-05-01T10:00:00Z",
    updatedAt: "2025-05-01T10:00:00Z",
    tags: ["introdução", "iniciante", "tour"],
    views: 1254,
    isWatched: false,
    category: "primeiros-passos"
  },
  {
    id: 2,
    title: "Como criar sua conta e configurar seu perfil",
    description: "Aprenda a criar sua conta, preencher seu perfil e definir suas preferências iniciais para uma experiência personalizada.",
    thumbnailUrl: tutorialThumbnails[1],
    isPremium: false,
    level: "iniciante",
    order: 2,
    duration: "03:21",
    createdAt: "2025-05-01T10:15:00Z",
    updatedAt: "2025-05-01T10:15:00Z",
    tags: ["conta", "perfil", "configuração"],
    views: 892,
    isWatched: false,
    category: "primeiros-passos"
  },
  {
    id: 3,
    title: "Diferenças entre planos: Free vs Premium",
    description: "Conheça as diferenças entre os planos gratuito e premium, e descubra qual é o mais adequado para o seu negócio automotivo.",
    thumbnailUrl: tutorialThumbnails[2],
    isPremium: false,
    level: "iniciante",
    order: 3,
    duration: "05:12",
    createdAt: "2025-05-01T10:30:00Z",
    updatedAt: "2025-05-01T10:30:00Z",
    tags: ["planos", "premium", "assinatura"],
    views: 756,
    isWatched: false,
    category: "primeiros-passos"
  },
  
  // Interface
  {
    id: 4,
    title: "Navegando pela Interface Principal",
    description: "Aprenda a navegar eficientemente pela interface principal do DesignAuto e acesse rapidamente todas as funcionalidades.",
    thumbnailUrl: tutorialThumbnails[3],
    isPremium: false,
    level: "iniciante",
    order: 4,
    duration: "04:08",
    createdAt: "2025-05-01T11:00:00Z",
    updatedAt: "2025-05-01T11:00:00Z",
    tags: ["interface", "navegação", "menu"],
    views: 684,
    isWatched: false,
    category: "interface"
  },
  {
    id: 5,
    title: "Personalizando sua Experiência",
    description: "Aprenda a personalizar a interface de acordo com suas preferências, incluindo modo escuro e configurações de exibição.",
    thumbnailUrl: tutorialThumbnails[4],
    isPremium: false,
    level: "intermediario",
    order: 5,
    duration: "03:45",
    createdAt: "2025-05-01T11:15:00Z",
    updatedAt: "2025-05-01T11:15:00Z",
    tags: ["personalização", "preferências", "tema"],
    views: 548,
    isWatched: false,
    category: "interface"
  },
  
  // Galeria
  {
    id: 6,
    title: "Explorando a Galeria de Artes",
    description: "Navegue pela vasta galeria de designs automotivos e aprenda a filtrar por categorias, favoritar e organizar os designs.",
    thumbnailUrl: tutorialThumbnails[5],
    isPremium: false,
    level: "iniciante",
    order: 6,
    duration: "05:32",
    createdAt: "2025-05-01T12:00:00Z",
    updatedAt: "2025-05-01T12:00:00Z",
    tags: ["galeria", "navegação", "filtros"],
    views: 912,
    isWatched: false,
    category: "galeria"
  },
  {
    id: 7,
    title: "Utilizando Filtros Avançados de Busca",
    description: "Domine as técnicas de busca avançada para encontrar rapidamente o design perfeito para sua necessidade.",
    thumbnailUrl: tutorialThumbnails[0],
    isPremium: false,
    level: "intermediario",
    order: 7,
    duration: "04:17",
    createdAt: "2025-05-01T12:15:00Z",
    updatedAt: "2025-05-01T12:15:00Z",
    tags: ["busca", "filtros", "categorias"],
    views: 645,
    isWatched: false,
    category: "galeria"
  },
  {
    id: 8,
    title: "Organizando Favoritos e Coleções",
    description: "Aprenda a criar coleções personalizadas e favoritar designs para acesso rápido no futuro.",
    thumbnailUrl: tutorialThumbnails[1],
    isPremium: true,
    level: "intermediario",
    order: 8,
    duration: "06:03",
    createdAt: "2025-05-01T12:30:00Z",
    updatedAt: "2025-05-01T12:30:00Z",
    tags: ["favoritos", "coleções", "organização"],
    views: 523,
    isWatched: false,
    category: "galeria"
  },
  
  // Downloads
  {
    id: 9,
    title: "Como Baixar e Salvar Designs",
    description: "Aprenda a baixar designs, escolher formatos e resoluções e salvá-los corretamente no seu dispositivo.",
    thumbnailUrl: tutorialThumbnails[2],
    isPremium: false,
    level: "iniciante",
    order: 9,
    duration: "03:48",
    createdAt: "2025-05-01T13:00:00Z",
    updatedAt: "2025-05-01T13:00:00Z",
    tags: ["download", "salvar", "formatos"],
    views: 1089,
    isWatched: false,
    category: "downloads"
  },
  {
    id: 10,
    title: "Gerenciando seu Histórico de Downloads",
    description: "Saiba como acessar, organizar e limpar seu histórico de downloads na plataforma.",
    thumbnailUrl: tutorialThumbnails[3],
    isPremium: true,
    level: "intermediario",
    order: 10,
    duration: "04:29",
    createdAt: "2025-05-01T13:15:00Z",
    updatedAt: "2025-05-01T13:15:00Z",
    tags: ["histórico", "organização", "downloads"],
    views: 476,
    isWatched: false,
    category: "downloads"
  },
  
  // Uploads
  {
    id: 11,
    title: "Enviando suas Próprias Artes (Designers)",
    description: "Para designers: aprenda a enviar suas criações para a plataforma e disponibilizá-las para os usuários.",
    thumbnailUrl: tutorialThumbnails[4],
    isPremium: true,
    level: "avancado",
    order: 11,
    duration: "07:16",
    createdAt: "2025-05-01T14:00:00Z",
    updatedAt: "2025-05-01T14:00:00Z",
    tags: ["upload", "designer", "criação"],
    views: 342,
    isWatched: false,
    category: "uploads"
  },
  {
    id: 12,
    title: "Criando Posts para Redes Sociais",
    description: "Aprenda a criar posts profissionais para Instagram, Facebook e outras redes sociais usando os templates da plataforma.",
    thumbnailUrl: tutorialThumbnails[5],
    isPremium: false,
    level: "iniciante",
    order: 12,
    duration: "05:52",
    createdAt: "2025-05-01T14:15:00Z",
    updatedAt: "2025-05-01T14:15:00Z",
    tags: ["redes sociais", "posts", "template"],
    views: 875,
    isWatched: false,
    category: "uploads"
  },
  {
    id: 13,
    title: "Criando Artes Multi-formato",
    description: "Aprenda a criar designs para diferentes formatos (feed, stories, banners) de uma só vez, mantendo a identidade visual.",
    thumbnailUrl: tutorialThumbnails[0],
    isPremium: true,
    level: "avancado",
    order: 13,
    duration: "08:35",
    createdAt: "2025-05-01T14:30:00Z",
    updatedAt: "2025-05-01T14:30:00Z",
    tags: ["multi-formato", "design", "avançado"],
    views: 298,
    isWatched: false,
    category: "uploads"
  },
  
  // Edição
  {
    id: 14,
    title: "Editando Textos e Informações",
    description: "Aprenda a editar textos, números e informações nos templates para personalizar os designs para seu negócio.",
    thumbnailUrl: tutorialThumbnails[1],
    isPremium: false,
    level: "iniciante",
    order: 14,
    duration: "04:21",
    createdAt: "2025-05-01T15:00:00Z",
    updatedAt: "2025-05-01T15:00:00Z",
    tags: ["edição", "texto", "personalização"],
    views: 967,
    isWatched: false,
    category: "edicao"
  },
  {
    id: 15,
    title: "Trocando Imagens e Fundos",
    description: "Saiba como substituir imagens e fundos nos templates para criar designs únicos com a sua identidade visual.",
    thumbnailUrl: tutorialThumbnails[2],
    isPremium: false,
    level: "intermediario",
    order: 15,
    duration: "05:07",
    createdAt: "2025-05-01T15:15:00Z",
    updatedAt: "2025-05-01T15:15:00Z",
    tags: ["imagens", "fundos", "edição"],
    views: 821,
    isWatched: false,
    category: "edicao"
  },
  {
    id: 16,
    title: "Técnicas Avançadas de Edição",
    description: "Técnicas profissionais para edição de designs, incluindo ajustes de cores, camadas e elementos visuais.",
    thumbnailUrl: tutorialThumbnails[3],
    isPremium: true,
    level: "avancado",
    order: 16,
    duration: "09:12",
    createdAt: "2025-05-01T15:30:00Z",
    updatedAt: "2025-05-01T15:30:00Z",
    tags: ["avançado", "edição", "técnicas"],
    views: 365,
    isWatched: false,
    category: "edicao"
  },
  
  // Mobile
  {
    id: 17,
    title: "Usando o DesignAuto em Dispositivos Móveis",
    description: "Aprenda a acessar e utilizar todas as funcionalidades do DesignAuto em smartphones e tablets.",
    thumbnailUrl: tutorialThumbnails[4],
    isPremium: false,
    level: "iniciante",
    order: 17,
    duration: "05:43",
    createdAt: "2025-05-01T16:00:00Z",
    updatedAt: "2025-05-01T16:00:00Z",
    tags: ["mobile", "smartphone", "tablet"],
    views: 734,
    isWatched: false,
    category: "mobile"
  },
  {
    id: 18,
    title: "Editando e Postando Direto do Celular",
    description: "Fluxo de trabalho completo para editar designs e publicá-los nas redes sociais diretamente do seu smartphone.",
    thumbnailUrl: tutorialThumbnails[5],
    isPremium: true,
    level: "intermediario",
    order: 18,
    duration: "06:18",
    createdAt: "2025-05-01T16:15:00Z",
    updatedAt: "2025-05-01T16:15:00Z",
    tags: ["mobile", "publicação", "workflow"],
    views: 689,
    isWatched: false,
    category: "mobile"
  },
  
  // Avançado
  {
    id: 19,
    title: "Criando sua Identidade Visual Automotiva",
    description: "Aprenda a desenvolver uma identidade visual consistente para seu negócio automotivo usando os recursos da plataforma.",
    thumbnailUrl: tutorialThumbnails[0],
    isPremium: true,
    level: "avancado",
    order: 19,
    duration: "10:27",
    createdAt: "2025-05-01T17:00:00Z",
    updatedAt: "2025-05-01T17:00:00Z",
    tags: ["identidade visual", "branding", "estratégia"],
    views: 412,
    isWatched: false,
    category: "avancado"
  },
  {
    id: 20,
    title: "Integrando com Outras Plataformas",
    description: "Saiba como integrar o DesignAuto com outras ferramentas de marketing digital para maximizar seus resultados.",
    thumbnailUrl: tutorialThumbnails[1],
    isPremium: true,
    level: "avancado",
    order: 20,
    duration: "08:54",
    createdAt: "2025-05-01T17:15:00Z",
    updatedAt: "2025-05-01T17:15:00Z",
    tags: ["integração", "ferramentas", "marketing"],
    views: 276,
    isWatched: false,
    category: "avancado"
  }
];

// Agrupar tutoriais por categoria
export const tutoriaisPorCategoria = tutorialCategories.map(category => {
  return {
    id: category.id,
    title: category.name,
    subtitle: `Tutoriais sobre ${category.name.toLowerCase()}`,
    icon: category.icon,
    modules: tutoriais.filter(tutorial => tutorial.category === category.id)
  };
});

// Agrupar por nível
export const iniciantes = tutoriais.filter(t => t.level === 'iniciante');
export const intermediarios = tutoriais.filter(t => t.level === 'intermediario');
export const avancados = tutoriais.filter(t => t.level === 'avancado');

// Tutoriais recentes (simulados)
export const tutoriaisRecentes = tutoriais.slice(0, 6);

// Tutoriais populares
export const tutoriaisPopulares = [...tutoriais]
  .sort((a, b) => b.views - a.views)
  .slice(0, 6);

// Tutorial em destaque
export const tutorialDestaque = tutoriais[0];