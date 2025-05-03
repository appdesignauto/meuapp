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
  LucideInfo
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

// Componente de cartão de módulo com explicações mais claras para o usuário
const ModuleCard = ({ module, isPremiumLocked }: { 
  module: CourseModule; 
  isPremiumLocked: boolean;
}) => {
  const levelColors = {
    iniciante: "bg-green-100 text-green-700 border-green-200",
    intermediario: "bg-blue-100 text-blue-700 border-blue-200",
    avancado: "bg-purple-100 text-purple-700 border-purple-200"
  };

  const levelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado"
  };

  const levelIcons = {
    iniciante: <GraduationCap className="h-3 w-3 mr-1" />,
    intermediario: <Award className="h-3 w-3 mr-1" />,
    avancado: <Star className="h-3 w-3 mr-1" />
  };

  // Calcular porcentagem de conclusão
  const completionPercentage = module.completedLessons && module.totalLessons 
    ? Math.round((module.completedLessons / module.totalLessons) * 100) 
    : 0;
    
  // Verificar se o módulo foi atualizado recentemente (últimos 7 dias)
  const isRecentlyUpdated = module.lastUpdateDate && (
    new Date().getTime() - new Date(module.lastUpdateDate).getTime() < 7 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="group relative bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="relative">
        <img 
          src={module.thumbnailUrl || '/images/placeholder-course.jpg'} 
          alt={module.title}
          className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>
        
        {/* Badges no topo com explicações em tooltip */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {module.isPremium && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-sm flex items-center gap-1 font-medium cursor-help"
                  >
                    <Crown className="h-3 w-3" />
                    <span>Premium</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-sm">Conteúdo exclusivo para assinantes Premium</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isRecentlyUpdated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="bg-blue-100 border-blue-200 text-blue-700 flex items-center gap-1 font-medium cursor-help"
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span>Novo</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-sm">Conteúdo recém-adicionado ou atualizado</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Nível do curso (em baixo) com explicações em tooltip */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`flex items-center ${levelColors[module.level]} cursor-help`}
                >
                  {levelIcons[module.level]}
                  {levelLabels[module.level]}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-sm">
                  {module.level === 'iniciante' && 'Para quem está começando - conteúdo básico e introdutório'}
                  {module.level === 'intermediario' && 'Para quem já tem conhecimentos básicos - conteúdo moderadamente avançado'}
                  {module.level === 'avancado' && 'Para usuários experientes - conteúdo técnico e detalhado'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {module.viewCount && module.viewCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-white/70 border-white/30 text-neutral-700 flex items-center gap-1 font-medium backdrop-blur-sm cursor-help">
                    <Users className="h-3 w-3" />
                    <span>{module.viewCount}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-sm">Número de alunos que acessaram este curso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Botão Play hover com feedback visual claro */}
        {!isPremiumLocked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
              <Play className="h-12 w-12 text-white drop-shadow-lg" />
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 text-blue-700 text-xs font-bold py-1 px-3 rounded-full shadow-lg whitespace-nowrap">
                Clique para assistir
              </span>
            </div>
          </div>
        )}
        
        {/* Overlay para conteúdo premium bloqueado - com mensagem mais amigável */}
        {isPremiumLocked && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center flex-col text-white">
            <Crown className="h-12 w-12 mb-3 text-amber-400" />
            <p className="text-lg font-semibold mb-1">Conteúdo Premium</p>
            <p className="text-sm text-white/90 max-w-[80%] text-center mb-3">
              Desbloqueie este módulo e todos os outros conteúdos exclusivos com uma assinatura
            </p>
            <Button variant="secondary" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 animate-pulse">
              Conhecer Planos
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{module.title}</h3>
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{module.description}</p>
        
        {/* Status de progresso - Mostrar para todos com explicação clara */}
        {module.completedLessons !== undefined && module.totalLessons !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-neutral-600 mb-1.5">
              <span className="font-medium">
                {module.completedLessons > 0 ? (
                  <span className="flex items-center text-blue-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {completionPercentage}% concluído
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Info className="h-3 w-3 mr-1 text-neutral-400" />
                    Comece este curso
                  </span>
                )}
              </span>
              <span>{module.completedLessons}/{module.totalLessons} aulas</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  completionPercentage === 100 
                    ? 'bg-green-500' 
                    : completionPercentage > 0
                      ? 'bg-blue-500'
                      : 'bg-neutral-200'
                }`}
                style={{ width: `${completionPercentage || 5}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-neutral-500">
            <Video className="h-4 w-4 mr-1.5" />
            <span>{module.totalLessons || 0} aulas</span>
          </div>
          <Link 
            href={`/cursos/${module.id}`}
            className={`inline-flex items-center text-sm font-medium rounded-md py-1.5 px-3 transition-colors ${
              isPremiumLocked 
                ? 'pointer-events-none text-neutral-400' 
                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-100'
            }`}
          >
            {module.completedLessons && module.completedLessons > 0 
              ? "Continuar curso" 
              : "Iniciar curso"} 
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Componente de estatísticas com tooltips explicativos
const CourseStatistics = ({ metrics }: { metrics: CategoryMetric[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {metrics.map((metric, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="border border-neutral-200 hover:border-neutral-300 transition-colors cursor-help">
                <CardContent className="p-4 flex items-center">
                  <div className={`flex-shrink-0 mr-4 w-12 h-12 rounded-lg flex items-center justify-center ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.count}</p>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                {metric.category === 'total' && 'Número total de módulos disponíveis para você'}
                {metric.category === 'premium' && 'Conteúdos exclusivos para assinantes premium'}
                {metric.category === 'gratuito' && 'Módulos disponíveis para todos os usuários'}
                {metric.category === 'progress' && 'Cursos que você já começou, mas ainda não concluiu'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

// Componente de Guia Introdutório
const IntroGuide = ({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <div className="relative mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
          <HelpCircle className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-800 mb-1">Como funciona a área de cursos</h3>
          <p className="text-blue-700 mb-3">
            Este é o ambiente de aprendizado do DesignAuto. Aqui você encontra todo o conteúdo educacional 
            disponível na plataforma, organizado por módulos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <div className="flex items-start gap-2">
              <Play className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Assistir aulas</p>
                <p className="text-sm text-blue-600">Clique em qualquer curso para acessar suas aulas</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Progresso automático</p>
                <p className="text-sm text-blue-600">Seu progresso é salvo automaticamente enquanto estuda</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Search className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Encontre o que precisa</p>
                <p className="text-sm text-blue-600">Use a busca para encontrar conteúdos específicos</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BookOpenCheck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Aprenda no seu ritmo</p>
                <p className="text-sm text-blue-600">Acesse as aulas quando e onde quiser</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
        onClick={onDismiss}
      >
        <span className="sr-only">Fechar</span>
        <span aria-hidden="true">×</span>
      </Button>
    </div>
  );
};

// Página principal de cursos (redesenhada com foco em UX)
export default function CursosPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Função para verificar se o conteúdo premium deve ser bloqueado
  const shouldLockPremiumContent = (isPremium: boolean) => {
    if (!isPremium) return false;
    if (!user) return true;
    if (user.role === 'admin' || user.role === 'designer_adm') return false;
    return !['premium', 'mensal', 'anual', 'lifetime'].includes(user.role);
  };

  // Buscar todos os módulos (atualizando para a nova rota)
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['/api/courses/modules'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/courses/modules');
      return await res.json();
    }
  });

  // Filtrar módulos por categoria (tab) e por busca
  const filteredModules = modules ? modules.filter(module => {
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
    
    return module.isActive !== false;
  }) : [];
  
  // Calcular estatísticas para exibição
  const stats: CategoryMetric[] = [
    { 
      category: 'total', 
      count: modules?.filter(m => m.isActive !== false).length || 0,
      label: 'Total de Módulos',
      icon: <BookOpen className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50'
    },
    { 
      category: 'premium', 
      count: modules?.filter(m => m.isPremium && m.isActive !== false).length || 0,
      label: 'Conteúdo Premium',
      icon: <Crown className="h-6 w-6 text-amber-600" />,
      color: 'bg-amber-50'
    },
    { 
      category: 'gratuito', 
      count: modules?.filter(m => !m.isPremium && m.isActive !== false).length || 0,
      label: 'Módulos Gratuitos',
      icon: <Heart className="h-6 w-6 text-red-600" />,
      color: 'bg-red-50'
    },
    { 
      category: 'progress', 
      count: user ? (modules?.filter(m => 
        m.completedLessons > 0 && 
        m.completedLessons < m.totalLessons &&
        m.isActive !== false
      ).length || 0) : 0,
      label: 'Em Progresso',
      icon: <BarChart className="h-6 w-6 text-green-600" />,
      color: 'bg-green-50'
    }
  ];
  
  // Focar no campo de busca quando pressionar Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-neutral-50 min-h-screen pb-12">
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto pt-8 pb-10 px-4">
          <Helmet>
            <title>Área de Cursos | DesignAuto</title>
          </Helmet>
          
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-8 w-8 text-blue-300" />
                  <h1 className="text-3xl font-bold">Área de Cursos</h1>
                </div>
                <p className="text-blue-100 text-lg mt-2">
                  Aprenda com videoaulas exclusivas e melhore suas habilidades
                </p>
              </div>
              
              {/* Exibir upgrade premium apenas para usuários free com destacue visual */}
              {user && user.role !== 'premium' && user.role !== 'admin' && (
                <Button 
                  className="mt-6 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg transition-transform hover:scale-105"
                  size="lg"
                >
                  <Crown className="h-5 w-5" />
                  <span>Desbloquear Premium</span>
                </Button>
              )}
            </div>
            
            {/* Campo de busca com shortcut e dica */}
            <div className="mt-6 relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-blue-300" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Digite aqui para buscar cursos por título ou assunto..."
                className="pl-12 py-6 bg-white/10 border-white/20 text-white placeholder:text-blue-300 rounded-xl focus-visible:border-blue-300 focus-visible:ring-blue-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-4 top-3 flex items-center gap-2 text-blue-200 text-sm">
                <span>Atalho:</span>
                <div className="bg-blue-800/70 rounded-md py-1 px-2 text-xs font-bold">
                  Ctrl+K
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 -mt-6">
        <div className="max-w-5xl mx-auto">
          {/* Guia Introdutório para Novos Usuários */}
          {showGuide && (
            <IntroGuide onDismiss={() => setShowGuide(false)} />
          )}
          
          {/* Estastísticas */}
          <CourseStatistics metrics={stats} />
          
          {/* Tabs de filtro com legendas explicativas */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-neutral-800">Filtrar cursos por:</h2>
              {!showGuide && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 flex items-center gap-1"
                  onClick={() => setShowGuide(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Ajuda</span>
                </Button>
              )}
            </div>
            <Tabs 
              defaultValue="todos" 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 p-1 bg-white rounded-xl border shadow-sm">
                <TabsTrigger 
                  value="todos" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
                >
                  <BookOpen className="h-4 w-4 mr-1.5" />
                  Todos
                </TabsTrigger>
                <TabsTrigger 
                  value="premium"
                  className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-none"
                >
                  <Crown className="h-4 w-4 mr-1.5" />
                  Premium
                </TabsTrigger>
                <TabsTrigger 
                  value="gratuito"
                  className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none"
                >
                  <Bookmark className="h-4 w-4 mr-1.5" />
                  Gratuitos
                </TabsTrigger>
                <TabsTrigger 
                  value="em-andamento"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
                >
                  <Play className="h-4 w-4 mr-1.5" />
                  Em andamento
                </TabsTrigger>
                <TabsTrigger 
                  value="concluidos"
                  className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Concluídos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Loading com animação e mensagem amigável */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <p className="text-neutral-700 font-medium text-lg">Carregando seus cursos...</p>
              <p className="text-neutral-500 text-sm">Estamos preparando tudo para você</p>
            </div>
          )}
          
          {/* Erro com opção de retry e explicação clara */}
          {error && (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <p className="font-medium text-lg">Ops! Não conseguimos carregar os cursos</p>
              <p className="text-neutral-600 mb-6 text-center max-w-md">
                Parece que houve um problema ao buscar os cursos. 
                Isso pode ser devido a uma conexão instável ou um problema temporário no servidor.
              </p>
              <Button 
                variant="default" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Tentar novamente
              </Button>
            </div>
          )}
          
          {/* Admin Tools com explicações claras */}
          {user && (user.role === 'admin' || user.role === 'designer_adm') && (
            <div className="mb-8 p-5 bg-white border-l-4 border-l-blue-600 rounded-md shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center text-blue-800 text-lg">
                <GraduationCap className="mr-2 h-5 w-5" />
                Ferramentas de Administração
              </h3>
              <p className="text-neutral-600 mb-4">
                Como administrador, você pode gerenciar todo o conteúdo educacional da plataforma. 
                Use as ferramentas abaixo para adicionar, editar ou remover cursos.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="default" 
                  onClick={() => setLocation('/admin/gerenciar-cursos')}
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Gerenciar Cursos
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/admin')}
                  className="flex items-center"
                >
                  <BarChart className="mr-2 h-5 w-5" />
                  Dashboard Admin
                </Button>
              </div>
            </div>
          )}
          
          {/* Grid de módulos com layout aprimorado */}
          {!isLoading && !error && filteredModules && filteredModules.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-neutral-800 mb-1 flex items-center">
                  <BookOpenCheck className="mr-2 h-5 w-5 text-blue-600" />
                  {activeTab === 'todos' && 'Todos os cursos disponíveis'}
                  {activeTab === 'premium' && 'Cursos Premium'}
                  {activeTab === 'gratuito' && 'Cursos Gratuitos'}
                  {activeTab === 'em-andamento' && 'Seus cursos em andamento'}
                  {activeTab === 'concluidos' && 'Cursos que você concluiu'}
                  {searchTerm && ` - Resultados para "${searchTerm}"`}
                </h2>
                <p className="text-neutral-600 mb-4">
                  {activeTab === 'todos' && 'Explore todos os cursos disponíveis na plataforma'}
                  {activeTab === 'premium' && 'Conteúdo exclusivo com técnicas avançadas'}
                  {activeTab === 'gratuito' && 'Cursos gratuitos para todos os usuários'}
                  {activeTab === 'em-andamento' && 'Continue de onde parou - cursos que você já começou'}
                  {activeTab === 'concluidos' && 'Cursos que você completou com sucesso'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules
                  .sort((a, b) => a.order - b.order)
                  .map(module => (
                  <ModuleCard 
                    key={module.id} 
                    module={module} 
                    isPremiumLocked={shouldLockPremiumContent(module.isPremium)}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Estado vazio com ilustração amigável e orientação clara */}
          {!isLoading && !error && (!filteredModules || filteredModules.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border text-center">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                {searchTerm ? (
                  <Search className="h-12 w-12 text-blue-500" />
                ) : activeTab === 'em-andamento' ? (
                  <Play className="h-12 w-12 text-blue-500" />
                ) : activeTab === 'concluidos' ? (
                  <CheckCircle className="h-12 w-12 text-blue-500" />
                ) : (
                  <BookOpen className="h-12 w-12 text-blue-500" />
                )}
              </div>
              
              <p className="font-semibold text-xl mb-2">
                {searchTerm 
                  ? `Nenhum resultado para "${searchTerm}"` 
                  : activeTab === 'em-andamento'
                  ? "Você ainda não iniciou nenhum curso"
                  : activeTab === 'concluidos'
                  ? "Você ainda não concluiu nenhum curso"
                  : "Nenhum curso disponível no momento"
                }
              </p>
              
              <p className="text-neutral-600 text-center max-w-md mb-6">
                {searchTerm
                  ? "Tente usar termos mais gerais ou verifique a ortografia."
                  : activeTab === 'em-andamento'
                  ? "Explore os cursos disponíveis e comece a aprender agora mesmo!"
                  : activeTab === 'concluidos'
                  ? "Continue estudando para concluir seus cursos em andamento."
                  : activeTab === 'premium'
                  ? "Novos cursos premium serão adicionados em breve. Fique atento!"
                  : activeTab === 'gratuito'
                  ? "Novos cursos gratuitos serão adicionados em breve."
                  : "Estamos preparando conteúdos incríveis para você. Volte em breve!"
                }
              </p>
              
              {searchTerm ? (
                <Button 
                  variant="default" 
                  onClick={() => setSearchTerm("")}
                  className="flex items-center"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Limpar busca
                </Button>
              ) : activeTab !== 'todos' ? (
                <Button 
                  variant="default" 
                  onClick={() => setActiveTab('todos')}
                  className="flex items-center"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Ver todos os cursos
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}