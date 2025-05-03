import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Crown,
  ChevronRight,
  Video,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2
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
}

// Componente de cartão de módulo
const ModuleCard = ({ module, isPremiumLocked }: { 
  module: CourseModule; 
  isPremiumLocked: boolean;
}) => {
  const levelColors = {
    iniciante: "bg-green-100 text-green-700",
    intermediario: "bg-blue-100 text-blue-700",
    avancado: "bg-purple-100 text-purple-700"
  };

  const levelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado"
  };

  // Calcular porcentagem de conclusão
  const completionPercentage = module.completedLessons && module.totalLessons 
    ? Math.round((module.completedLessons / module.totalLessons) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="relative">
        <img 
          src={module.thumbnailUrl || '/images/placeholder-course.jpg'} 
          alt={module.title}
          className="w-full h-40 object-cover"
        />
        {module.isPremium && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-amber-100 border-amber-200 text-amber-700 flex items-center gap-1 font-medium">
              <Crown className="h-3 w-3" />
              <span>Premium</span>
            </Badge>
          </div>
        )}
        <Badge 
          variant="outline" 
          className={`absolute bottom-3 left-3 ${levelColors[module.level]}`}
        >
          {levelLabels[module.level]}
        </Badge>
        
        {/* Ícone de cadeado para conteúdo premium bloqueado */}
        {isPremiumLocked && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col text-white">
            <Crown className="h-8 w-8 mb-2 text-amber-400" />
            <p className="text-sm font-medium">Conteúdo Premium</p>
            <Button variant="outline" className="mt-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/40">
              Ver Planos
            </Button>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{module.title}</h3>
        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{module.description}</p>
        
        {/* Status de progresso - Mostrar apenas se o usuário tiver começado */}
        {module.completedLessons !== undefined && module.completedLessons > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-neutral-600 mb-1">
              <span>{completionPercentage}% concluído</span>
              <span>{module.completedLessons}/{module.totalLessons} aulas</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-neutral-500">
            <Video className="h-4 w-4 mr-1" />
            <span>{module.totalLessons || 0} aulas</span>
          </div>
          <Link 
            href={`/cursos/${module.id}`}
            className={`inline-flex items-center text-sm font-medium ${isPremiumLocked ? 'pointer-events-none text-neutral-400' : 'text-blue-600 hover:text-blue-700'}`}
          >
            Ver módulo <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Página principal de cursos
export default function CursosPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("todos");
  
  // Função para verificar se o conteúdo premium deve ser bloqueado
  const shouldLockPremiumContent = (isPremium: boolean) => {
    if (!isPremium) return false;
    if (!user) return true;
    if (user.role === 'admin' || user.role === 'designer_adm') return false;
    return !['premium', 'mensal', 'anual', 'lifetime'].includes(user.role);
  };

  // Buscar todos os módulos
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['/api/cursos/modules'],
    queryFn: async () => {
      const res = await fetch('/api/cursos/modules');
      if (!res.ok) throw new Error('Falha ao carregar módulos');
      return res.json();
    }
  });

  // Filtrar módulos por categoria (tab)
  const filteredModules = modules ? modules.filter(module => {
    if (activeTab === 'todos') return true;
    if (activeTab === 'premium') return module.isPremium;
    if (activeTab === 'gratuito') return !module.isPremium;
    if (activeTab === 'em-andamento') {
      return module.completedLessons > 0 && module.completedLessons < module.totalLessons;
    }
    if (activeTab === 'concluidos') {
      return module.completedLessons === module.totalLessons && module.totalLessons > 0;
    }
    return true;
  }) : [];

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Videoaulas | DesignAuto</title>
      </Helmet>
      
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Videoaulas</h1>
            <p className="text-neutral-600">Aprenda técnicas e estratégias para otimizar suas artes automotivas</p>
          </div>
          
          {/* Exibir upgrade premium apenas para usuários free */}
          {user && user.role !== 'premium' && (
            <Button className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              <Crown className="h-4 w-4" />
              <span>Desbloquear conteúdo premium</span>
            </Button>
          )}
        </div>
        
        <Separator className="my-6" />
        
        {/* Tabs de filtro */}
        <Tabs 
          defaultValue="todos" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="todos">Todos os módulos</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            <TabsTrigger value="gratuito">Gratuitos</TabsTrigger>
            <TabsTrigger value="em-andamento">Em andamento</TabsTrigger>
            <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-neutral-600">Carregando módulos...</p>
          </div>
        )}
        
        {/* Erro */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-red-600">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="font-medium">Erro ao carregar os módulos</p>
            <p className="text-sm mt-1">Por favor, tente novamente mais tarde</p>
          </div>
        )}
        
        {/* Grid de módulos */}
        {!isLoading && !error && filteredModules && filteredModules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map(module => (
              <ModuleCard 
                key={module.id} 
                module={module} 
                isPremiumLocked={shouldLockPremiumContent(module.isPremium)}
              />
            ))}
          </div>
        )}
        
        {/* Estado vazio */}
        {!isLoading && !error && (!filteredModules || filteredModules.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-600">
            <BookOpen className="h-12 w-12 mb-4" />
            <p className="font-medium">Nenhum módulo encontrado</p>
            {activeTab !== 'todos' ? (
              <p className="text-sm mt-1">Tente outro filtro ou volte mais tarde</p>
            ) : (
              <p className="text-sm mt-1">Novos módulos serão adicionados em breve</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}