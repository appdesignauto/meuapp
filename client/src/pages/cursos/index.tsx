import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Crown, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";

// Tipos
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

interface CourseLesson {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoDuration: number;
  isPremium: boolean;
  moduleId: number;
  order: number;
  videoProvider: "youtube" | "vimeo" | "vturb" | "panda";
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  progress?: number;
  isCompleted?: boolean;
}

const CursosPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  
  // Buscar todos os módulos
  const { data: modules, isLoading, error } = useQuery<CourseModule[]>({
    queryKey: ["/api/courses/modules"],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar progresso do usuário (apenas se estiver autenticado)
  const { data: userProgress } = useQuery<{lesson: CourseLesson, progress: any}[]>({
    queryKey: ["/api/courses/user-progress"],
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minuto
  });

  // Processar dados de progresso e adicionar aos módulos
  const modulesWithProgress = modules?.map(module => {
    if (!userProgress) return module;
    
    // Filtrar lições deste módulo
    const moduleLessons = userProgress.filter(p => p.lesson.moduleId === module.id);
    const totalLessons = moduleLessons.length;
    const completedLessons = moduleLessons.filter(p => p.progress?.isCompleted).length;
    
    return {
      ...module,
      totalLessons,
      completedLessons
    };
  });

  // Filtrar módulos por nível de dificuldade
  const filteredModules = selectedLevel 
    ? modulesWithProgress?.filter(module => module.level === selectedLevel)
    : modulesWithProgress;

  // Renderizar o nível do curso de forma legível
  const formatLevel = (level: string) => {
    switch (level) {
      case "iniciante": return "Iniciante";
      case "intermediario": return "Intermediário";
      case "avancado": return "Avançado";
      default: return level;
    }
  };

  // Renderizar badges de nível
  const getLevelColor = (level: string) => {
    switch (level) {
      case "iniciante": return "bg-green-500";
      case "intermediario": return "bg-blue-500";
      case "avancado": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Erro ao carregar cursos</h2>
        <p className="text-gray-600">Ocorreu um erro ao carregar os cursos. Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Videoaulas | DesignAuto</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Videoaulas</h1>
            <p className="text-gray-600 max-w-2xl">
              Aprenda a criar designs incríveis para sua loja automotiva com nossas videoaulas exclusivas.
              Domine as técnicas e estratégias para criar artes que convertem!
            </p>
          </div>
          
          {/* Filtros de nível */}
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Badge 
              className={`px-4 py-2 cursor-pointer ${!selectedLevel ? 'bg-primary' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              onClick={() => setSelectedLevel(null)}
            >
              Todos
            </Badge>
            <Badge 
              className={`px-4 py-2 cursor-pointer ${selectedLevel === 'iniciante' ? 'bg-green-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              onClick={() => setSelectedLevel('iniciante')}
            >
              Iniciante
            </Badge>
            <Badge 
              className={`px-4 py-2 cursor-pointer ${selectedLevel === 'intermediario' ? 'bg-blue-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              onClick={() => setSelectedLevel('intermediario')}
            >
              Intermediário
            </Badge>
            <Badge 
              className={`px-4 py-2 cursor-pointer ${selectedLevel === 'avancado' ? 'bg-purple-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              onClick={() => setSelectedLevel('avancado')}
            >
              Avançado
            </Badge>
          </div>
        </div>
        
        {filteredModules?.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Nenhum curso encontrado</h2>
            <p className="text-gray-600">
              {selectedLevel 
                ? `Não encontramos cursos no nível ${formatLevel(selectedLevel)}.` 
                : "Não encontramos cursos disponíveis no momento."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules?.map((module) => (
              <Link key={module.id} href={`/cursos/${module.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border border-gray-200">
                  {/* Imagem com indicador de premium */}
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={module.thumbnailUrl || "/images/placeholder-course.jpg"} 
                      alt={module.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    
                    {module.isPremium && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-md flex items-center">
                        <Crown size={16} className="mr-1" />
                        <span className="text-xs font-medium">Premium</span>
                      </div>
                    )}
                    
                    <Badge 
                      className={`absolute bottom-2 left-2 ${getLevelColor(module.level)}`}
                    >
                      {formatLevel(module.level)}
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    {user && module.totalLessons && module.totalLessons > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{module.completedLessons || 0} de {module.totalLessons} aulas concluídas</span>
                          <span>{Math.round(((module.completedLessons || 0) / module.totalLessons) * 100)}%</span>
                        </div>
                        <Progress 
                          value={((module.completedLessons || 0) / module.totalLessons) * 100} 
                          className="h-2"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen size={16} className="mr-1" />
                        <span>Comece a assistir agora</span>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    <div className="w-full flex justify-end items-center text-sm text-primary font-medium">
                      Ver módulo
                      <ArrowRight size={16} className="ml-1" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CursosPage;