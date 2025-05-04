// MockData.tsx
// Dados de exemplo para visualização da interface Netflix 
// quando não há dados reais disponíveis

import { 
  BookOpen, 
  Play, 
  Award, 
  Star, 
  TrendingUp, 
  Sparkles, 
  GraduationCap 
} from 'lucide-react';

export interface MockCourseModule {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  isPremium: boolean;
  level: "iniciante" | "intermediario" | "avancado";
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  totalLessons: number;
  completedLessons?: number;
  isActive: boolean;
  viewCount: number;
  lastUpdateDate?: string;
}

// Imagens para os cursos
const thumbnails = [
  '/images/placeholder-course.jpg',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1549558549-415fe4c37b60?q=80&w=2119&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566992466261-4d384d6ec215?q=80&w=2874&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581092160562-2ab cf941c77c?q=80&w=2940&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530710473538-03993d790c78?q=80&w=2526&auto=format&fit=crop',
];

// Gera um módulo de curso com dados fictícios
function generateMockModule(index: number, options: Partial<MockCourseModule> = {}): MockCourseModule {
  const levels = ["iniciante", "intermediario", "avancado"] as const;
  const level = options.level || levels[Math.floor(Math.random() * levels.length)];
  const isPremium = options.isPremium !== undefined ? options.isPremium : Math.random() > 0.6;
  const totalLessons = options.totalLessons || Math.floor(Math.random() * 10) + 3;
  const completedLessons = options.completedLessons !== undefined 
    ? options.completedLessons 
    : Math.random() > 0.7 ? Math.floor(Math.random() * totalLessons) : 0;
  
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  return {
    id: index + 1,
    title: options.title || `Curso de Design Automotivo ${index + 1}`,
    description: options.description || 
      `Aprenda técnicas profissionais de design para o segmento automotivo. Este curso aborda desde conceitos básicos até estratégias avançadas de marketing visual.`,
    thumbnailUrl: options.thumbnailUrl || thumbnails[index % thumbnails.length],
    isPremium,
    level,
    order: options.order || index,
    createdAt: options.createdAt || lastMonth.toISOString(),
    updatedAt: options.updatedAt || now.toISOString(),
    createdBy: options.createdBy || 1,
    totalLessons,
    completedLessons,
    isActive: options.isActive !== undefined ? options.isActive : true,
    viewCount: options.viewCount || Math.floor(Math.random() * 500) + 50,
    lastUpdateDate: options.lastUpdateDate || (Math.random() > 0.3 ? now.toISOString() : undefined),
  };
}

// Gerar módulos por categoria
export const mockModules: MockCourseModule[] = Array(20)
  .fill(null)
  .map((_, i) => generateMockModule(i));

// Módulos por níveis
export const beginnerModules = mockModules.filter(m => m.level === 'iniciante');
export const intermediateModules = mockModules.filter(m => m.level === 'intermediario');
export const advancedModules = mockModules.filter(m => m.level === 'avancado');

// Módulos por popularidade e destaque
export const recentModules = mockModules
  .filter(m => m.lastUpdateDate)
  .sort((a, b) => new Date(b.lastUpdateDate!).getTime() - new Date(a.lastUpdateDate!).getTime())
  .slice(0, 8);

export const popularModules = [...mockModules]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 8);

export const premiumModules = mockModules.filter(m => m.isPremium);
export const freeModules = mockModules.filter(m => !m.isPremium);

// Categorias de cursos para a interface tipo Netflix
export const courseCategories = [
  {
    id: 'inprogress',
    title: 'Continue de onde parou',
    subtitle: 'Cursos que você já começou a assistir',
    icon: <Play className="h-5 w-5 text-blue-500" />,
    modules: mockModules.filter(m => m.completedLessons && m.completedLessons > 0 && m.completedLessons < m.totalLessons),
  },
  {
    id: 'recents',
    title: 'Novidades',
    subtitle: 'Cursos recém adicionados ou atualizados',
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    modules: recentModules,
  },
  {
    id: 'popular',
    title: 'Mais populares',
    subtitle: 'Os cursos mais acessados da plataforma',
    icon: <TrendingUp className="h-5 w-5 text-red-500" />,
    modules: popularModules,
  },
  {
    id: 'starter',
    title: 'Para iniciantes',
    subtitle: 'Cursos recomendados para quem está começando',
    icon: <GraduationCap className="h-5 w-5 text-green-500" />,
    modules: beginnerModules,
  },
  {
    id: 'intermediate',
    title: 'Nível intermediário',
    subtitle: 'Para quem já possui conhecimentos básicos',
    icon: <Award className="h-5 w-5 text-blue-500" />,
    modules: intermediateModules,
  },
  {
    id: 'advanced',
    title: 'Nível avançado',
    subtitle: 'Técnicas avançadas para profissionais',
    icon: <Star className="h-5 w-5 text-purple-500" />,
    modules: advancedModules,
  },
  {
    id: 'premium',
    title: 'Conteúdo Premium',
    subtitle: 'Cursos exclusivos para assinantes',
    icon: <BookOpen className="h-5 w-5 text-amber-500" />,
    modules: premiumModules,
  },
];

// Módulo em destaque para o hero
export const featuredModule = mockModules.find(m => m.isPremium) || mockModules[0];