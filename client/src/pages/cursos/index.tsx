import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';
import NetflixCard from '@/components/cursos/NetflixCard';
import CourseCategory from '@/components/cursos/CourseCategory';
import CourseHero from '@/components/cursos/CourseHero';
import {
  BookOpen,
  Crown,
  ChevronRight,
  Video,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Play,
  Bookmark,
  Users,
  Star,
  Award,
  GraduationCap,
  Heart,
  TrendingUp,
  BarChart,
  Info,
  HelpCircle,
  BookOpenCheck,
  Filter,
  Sparkles,
  FlaskConical,
  Zap
} from 'lucide-react';

// Interfaces para os dados
interface CourseModule {
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
  totalLessons?: number;
  completedLessons?: number;
  isActive?: boolean;
  viewCount?: number;
  lastUpdateDate?: string;
}

interface CategoryMetric {
  category: string; 
  count: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}

// Página principal de cursos (redesenhada com estilo Netflix)
export default function CursosPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const isPremiumUser = user && user.nivelacesso === 'premium';
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Query para buscar os módulos do curso
  const { data: modules, error, isLoading } = useQuery({
    queryKey: ['/api/cursos/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/cursos/modules');
      const data = await response.json();
      
      // Obter informações de progresso quando o usuário está logado
      if (user) {
        // Buscar progresso do usuário para cada módulo (em um cenário real)
        // Aqui estamos apenas simulando com dados aleatórios
        return data.map((module: CourseModule) => ({
          ...module,
          completedLessons: Math.floor(Math.random() * (module.totalLessons || 0)),
          // Marcar alguns módulos como recém atualizados para exemplo
          lastUpdateDate: Math.random() > 0.7 ? new Date().toISOString() : null
        }));
      }
      
      return data;
    }
  });
  
  // Filtrar módulos com base na tab ativa e no termo de busca
  const filteredModules = modules ? modules.filter((module: CourseModule) => {
    // Filtrar por termo de busca primeiro
    const matchesSearch = searchTerm === "" || (
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (!matchesSearch) return false;
    
    // Depois aplicar filtros de tabs
    if (activeTab === 'todos') return module.isActive !== false;
    if (activeTab === 'premium') return module.isPremium && module.isActive !== false;
    if (activeTab === 'gratuito') return !module.isPremium && module.isActive !== false;
    if (activeTab === 'em-andamento') {
      return module.completedLessons > 0 && 
             module.completedLessons < module.totalLessons && 
             module.isActive !== false;
    }
    if (activeTab === 'concluidos') {
      return module.completedLessons === module.totalLessons && 
             module.totalLessons > 0 && 
             module.isActive !== false;
    }
    
    return true;
  }) : [];
  
  // Calcular estatísticas
  const statistics = {
    total: modules?.filter((m: CourseModule) => m.isActive !== false).length || 0,
    premium: modules?.filter((m: CourseModule) => m.isPremium && m.isActive !== false).length || 0,
    free: modules?.filter((m: CourseModule) => !m.isPremium && m.isActive !== false).length || 0,
    inProgress: modules?.filter((m: CourseModule) => 
      m.completedLessons > 0 && 
      m.completedLessons < m.totalLessons && 
      m.isActive !== false
    ).length || 0,
    completed: modules?.filter((m: CourseModule) => 
      m.completedLessons === m.totalLessons && 
      m.totalLessons > 0 && 
      m.isActive !== false
    ).length || 0
  };
  
  // Métricas para mostrar no painel
  const metrics: CategoryMetric[] = [
    {
      category: 'total',
      count: statistics.total,
      label: 'Cursos Disponíveis',
      icon: <BookOpen className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50'
    },
    {
      category: 'premium',
      count: statistics.premium,
      label: 'Cursos Premium',
      icon: <Crown className="h-6 w-6 text-amber-500" />,
      color: 'bg-amber-50'
    },
    {
      category: 'free',
      count: statistics.free,
      label: 'Cursos Gratuitos',
      icon: <BookOpenCheck className="h-6 w-6 text-green-600" />,
      color: 'bg-green-50'
    },
    {
      category: user ? 'inProgress' : 'total',
      count: user ? statistics.inProgress : statistics.total,
      label: user ? 'Em Andamento' : 'Total de Módulos',
      icon: user ? <Clock className="h-6 w-6 text-purple-600" /> : <BookOpen className="h-6 w-6 text-blue-600" />,
      color: user ? 'bg-purple-50' : 'bg-blue-50'
    }
  ];
  
  // Função para verificar se o conteúdo premium deve ser bloqueado
  const isPremiumLocked = (isPremium: boolean) => {
    if (!isPremium) return false;
    return !isPremiumUser;
  };
  
  // Habilitar busca com tecla "/"
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '/' && document.activeElement !== searchInputRef.current) {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Encontrar um módulo em destaque (para o herói)
  const featuredModule = modules?.find((m: CourseModule) => m.isPremium && m.isActive !== false) || modules?.[0];

  // Organizar módulos por nível
  const initiateModules = modules?.filter((m: CourseModule) => m.level === 'iniciante' && m.isActive !== false) || [];
  const intermediateModules = modules?.filter((m: CourseModule) => m.level === 'intermediario' && m.isActive !== false) || [];
  const advancedModules = modules?.filter((m: CourseModule) => m.level === 'avancado' && m.isActive !== false) || [];
  
  // Módulos em andamento (para usuários logados)
  const inProgressModules = user ? modules?.filter((m: CourseModule) => 
    m.completedLessons > 0 && 
    m.completedLessons < m.totalLessons && 
    m.isActive !== false
  ) || [] : [];
  
  // Módulos recém atualizados
  const recentlyUpdatedModules = modules?.filter((m: CourseModule) => 
    m.lastUpdateDate && 
    new Date().getTime() - new Date(m.lastUpdateDate).getTime() < 7 * 24 * 60 * 60 * 1000 &&
    m.isActive !== false
  ) || [];
  
  // Módulos populares (com maior contagem de visualizações)
  const popularModules = modules ? [...modules]
    .filter((m: CourseModule) => m.isActive !== false)
    .sort((a: CourseModule, b: CourseModule) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 10) : [];
  
  return (
    <>
      <Helmet>
        <title>Cursos e Videoaulas | DesignAuto</title>
      </Helmet>
      
      <div className="bg-neutral-950">
        {/* Seção Hero */}
        {featuredModule && !isLoading && !error && (
          <CourseHero
            title={featuredModule.title}
            description={featuredModule.description}
            imageUrl={featuredModule.thumbnailUrl || '/images/placeholder-course.jpg'}
            courseId={featuredModule.id}
            isPremium={featuredModule.isPremium}
            isPremiumUser={!!isPremiumUser}
            totalLessons={featuredModule.totalLessons}
            level={featuredModule.level}
          />
        )}
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Barra de pesquisa e filtros */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold text-white">Cursos e Videoaulas</h2>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                onClick={() => setActiveTab(activeTab === 'todos' ? 'premium' : 'todos')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={16} />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar cursos... (/ )"
                  className="pl-9 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    onClick={() => setSearchTerm('')}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Menu de categorias (tabs) - Versão Netflix */}
          <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-5 bg-transparent flex gap-1">
              <TabsTrigger 
                value="todos" 
                className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=inactive]:bg-transparent data-[state=inactive]:text-neutral-300 hover:text-white"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Todos
              </TabsTrigger>
              <TabsTrigger 
                value="premium" 
                className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=inactive]:bg-transparent data-[state=inactive]:text-neutral-300 hover:text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Premium
              </TabsTrigger>
              <TabsTrigger 
                value="gratuito" 
                className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=inactive]:bg-transparent data-[state=inactive]:text-neutral-300 hover:text-white"
              >
                <BookOpenCheck className="h-4 w-4 mr-2" />
                Gratuitos
              </TabsTrigger>
              {user && (
                <>
                  <TabsTrigger 
                    value="em-andamento" 
                    className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=inactive]:bg-transparent data-[state=inactive]:text-neutral-300 hover:text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Em Andamento
                  </TabsTrigger>
                  <TabsTrigger 
                    value="concluidos" 
                    className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=inactive]:bg-transparent data-[state=inactive]:text-neutral-300 hover:text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluídos
                  </TabsTrigger>
                </>
              )}
            </TabsList>
        
            <TabsContent value={activeTab} className="mt-0">
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                  <span className="ml-3 text-neutral-400">Carregando cursos...</span>
                </div>
              )}
              
              {error && (
                <div className="bg-red-950 border border-red-800 text-red-300 p-4 rounded-lg flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Erro ao carregar cursos</h3>
                    <p className="text-sm text-red-400">
                      Ocorreu um erro ao carregar os cursos. Por favor, tente novamente mais tarde.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Resultados de pesquisa */}
              {searchTerm && !isLoading && !error && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Search className="mr-2 h-5 w-5 text-blue-500" />
                    Resultados para: "{searchTerm}"
                  </h3>
                  
                  {filteredModules.length === 0 ? (
                    <div className="bg-blue-950/50 border border-blue-900/50 text-blue-300 p-4 rounded-lg flex items-start">
                      <Info className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium">Nenhum curso encontrado</h3>
                        <p className="text-sm text-blue-400">
                          Não encontramos cursos com o termo "{searchTerm}". Tente outra busca.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredModules
                        .sort((a: CourseModule, b: CourseModule) => a.order - b.order)
                        .map((module: CourseModule) => (
                          <NetflixCard
                            key={module.id}
                            module={module}
                            isPremiumLocked={isPremiumLocked(module.isPremium)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Visualização estilo Netflix quando não está pesquisando */}
              {!searchTerm && !isLoading && !error && (
                <>
                  {/* Seção de Continuar Assistindo para usuários logados */}
                  {user && inProgressModules.length > 0 && (
                    <CourseCategory
                      title="Continue de onde parou"
                      subtitle="Cursos que você já começou a assistir"
                      icon={<Clock className="h-5 w-5 text-blue-500" />}
                      modules={inProgressModules}
                      isPremiumUser={!!isPremiumUser}
                      slidesPerView={4}
                    />
                  )}
                  
                  {/* Novos cursos / Adicionados recentemente */}
                  {recentlyUpdatedModules.length > 0 && (
                    <CourseCategory
                      title="Novidades"
                      subtitle="Cursos recém adicionados ou atualizados"
                      icon={<Sparkles className="h-5 w-5 text-amber-500" />}
                      modules={recentlyUpdatedModules}
                      isPremiumUser={!!isPremiumUser}
                      slidesPerView={4}
                    />
                  )}
                  
                  {/* Cursos em destaque / Populares */}
                  {popularModules.length > 0 && (
                    <CourseCategory
                      title="Mais populares"
                      subtitle="Os cursos mais assistidos da plataforma"
                      icon={<TrendingUp className="h-5 w-5 text-red-500" />}
                      modules={popularModules}
                      isPremiumUser={!!isPremiumUser}
                      slidesPerView={4}
                    />
                  )}
                  
                  {/* Cursos por nível de dificuldade */}
                  {initiateModules.length > 0 && (
                    <CourseCategory
                      title="Para iniciantes"
                      subtitle="Recomendados para quem está começando"
                      icon={<GraduationCap className="h-5 w-5 text-green-500" />}
                      modules={initiateModules}
                      isPremiumUser={!!isPremiumUser}
                      slidesPerView={4}
                    />
                  )}
                  
                  {intermediateModules.length > 0 && (
                    <CourseCategory
                      title="Nível intermediário"
                      subtitle="Para quem já possui conhecimentos básicos"
                      icon={<Award className="h-5 w-5 text-blue-500" />}
                      modules={intermediateModules}
                      isPremiumUser={!!isPremiumUser}
                      slidesPerView={4}
                    />
                  )}
                  
                  {advancedModules.length > 0 && (
                    <CourseCategory
                      title="Nível avançado"
                      subtitle="Técnicas avançadas para profissionais"
                      icon={<Star className="h-5 w-5 text-purple-500" />}
                      modules={advancedModules}
                      isPremiumUser={!!isPremiumUser}
                      slidesPerView={4}
                    />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
          
          {/* CTA para planos premium (apenas para não assinantes) */}
          {!isPremiumUser && (
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <h2 className="text-2xl font-bold mb-3">Desbloqueie todos os cursos Premium</h2>
                  <p className="text-blue-200 mb-4">
                    Tenha acesso ilimitado a todos os nossos cursos e conteúdos exclusivos com um plano premium.
                    Aprenda no seu ritmo e desenvolva suas habilidades.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-blue-300" />
                      <span>Acesso a todos os cursos premium</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-blue-300" />
                      <span>Novos cursos mensais</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-blue-300" />
                      <span>Certificados de conclusão</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0">
                  <Link href="/planos">
                    <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                      <Crown className="h-5 w-5 mr-2 text-amber-500" />
                      Conheça nossos planos
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}