import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Loader2, ArrowLeft, Crown, BookOpen, Lock, 
  Clock, CheckCircle, Play, Star, ChevronRight 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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
}

interface CourseProgress {
  progress: number;
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const CursoDetalhesPage = () => {
  const [, params] = useRoute("/cursos/:id");
  const moduleId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Buscar dados do módulo
  const { 
    data: module, 
    isLoading: moduleLoading, 
    error: moduleError 
  } = useQuery<CourseModule>({
    queryKey: [`/api/courses/modules/${moduleId}`],
    enabled: !!moduleId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Buscar aulas do módulo
  const { 
    data: lessons, 
    isLoading: lessonsLoading, 
    error: lessonsError 
  } = useQuery<CourseLesson[]>({
    queryKey: [`/api/courses/modules/${moduleId}/lessons`],
    enabled: !!moduleId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Buscar progresso do usuário neste módulo
  const { 
    data: moduleProgress,
    isLoading: progressLoading
  } = useQuery<{lesson: CourseLesson, progress: CourseProgress}[]>({
    queryKey: [`/api/courses/modules/${moduleId}/progress`],
    enabled: !!moduleId && !!user,
    staleTime: 1000 * 60, // 1 minuto
  });
  
  // Calcular progresso geral do módulo
  const overallProgress = moduleProgress && lessons?.length
    ? Math.round((moduleProgress.filter(p => p.progress?.isCompleted).length / lessons.length) * 100)
    : 0;
  
  // Verificar se o usuário tem acesso ao conteúdo premium
  const hasPremiumAccess = !!user && (
    user.nivelacesso === "premium" || 
    user.nivelacesso === "admin" ||
    user.acessovitalicio === true
  );

  // Função para formatar a duração do vídeo em minutos
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  // Renderizar o nível do curso de forma legível
  const formatLevel = (level: string) => {
    switch (level) {
      case "iniciante": return "Iniciante";
      case "intermediario": return "Intermediário";
      case "avancado": return "Avançado";
      default: return level;
    }
  };

  // Função para verificar se uma aula está bloqueada
  const isLessonLocked = (lesson: CourseLesson) => {
    return lesson.isPremium && !hasPremiumAccess;
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

  if (moduleLoading || lessonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (moduleError || !module) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Módulo não encontrado</h2>
        <p className="text-gray-600 mb-4">O módulo solicitado não existe ou você não tem permissão para acessá-lo.</p>
        <Link href="/cursos">
          <Button>
            <ArrowLeft size={16} className="mr-2" />
            Voltar para Cursos
          </Button>
        </Link>
      </div>
    );
  }

  if (lessonsError || !lessons) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Erro ao carregar aulas</h2>
        <p className="text-gray-600 mb-4">Ocorreu um erro ao carregar as aulas deste módulo.</p>
        <Link href="/cursos">
          <Button>
            <ArrowLeft size={16} className="mr-2" />
            Voltar para Cursos
          </Button>
        </Link>
      </div>
    );
  }

  // Ordenar aulas por ordem
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <>
      <Helmet>
        <title>{module.title} | Videoaulas | DesignAuto</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb e Voltar */}
        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
          <Link href="/cursos">
            <Button variant="ghost" size="sm" className="h-8">
              <ArrowLeft size={16} className="mr-1" />
              Voltar para Cursos
            </Button>
          </Link>
          <div className="flex items-center">
            <Link href="/cursos">
              <span className="text-gray-500 hover:text-primary cursor-pointer">Cursos</span>
            </Link>
            <ChevronRight size={16} className="mx-1 text-gray-400" />
            <span className="font-medium">{module.title}</span>
          </div>
        </div>
        
        {/* Cabeçalho do módulo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Imagem */}
          <div className="lg:col-span-1">
            <div className="relative rounded-lg overflow-hidden aspect-video">
              <img 
                src={module.thumbnailUrl || "/images/placeholder-course.jpg"} 
                alt={module.title}
                className="w-full h-full object-cover"
              />
              
              {module.isPremium && (
                <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-md flex items-center">
                  <Crown size={16} className="mr-1" />
                  <span className="text-sm font-medium">Premium</span>
                </div>
              )}
              
              <Badge 
                className={`absolute bottom-3 left-3 ${getLevelColor(module.level)}`}
              >
                {formatLevel(module.level)}
              </Badge>
            </div>
          </div>
          
          {/* Informações */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-3">{module.title}</h1>
            
            {user && lessons.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso do módulo</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2 mb-2" />
                <p className="text-sm text-gray-600">
                  {moduleProgress?.filter(p => p.progress?.isCompleted).length || 0} de {lessons.length} aulas concluídas
                </p>
              </div>
            )}
            
            <p className="text-gray-700 mb-6">{module.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Nível</span>
                <span className="font-medium">{formatLevel(module.level)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Aulas</span>
                <span className="font-medium">{lessons.length} aulas</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Duração total</span>
                <span className="font-medium">
                  {formatDuration(lessons.reduce((acc, lesson) => acc + lesson.videoDuration, 0))}
                </span>
              </div>
            </div>
            
            {module.isPremium && !hasPremiumAccess && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h3 className="flex items-center text-amber-800 font-semibold mb-2">
                  <Lock size={16} className="mr-2" />
                  Conteúdo Premium
                </h3>
                <p className="text-amber-700 text-sm mb-3">
                  Este módulo contém conteúdo exclusivo para assinantes premium.
                  Faça upgrade do seu plano para acessar todas as aulas.
                </p>
                <Link href="/planos">
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    Ver planos premium
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Lista de aulas */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Aulas deste módulo</h2>
          
          {sortedLessons.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Nenhuma aula disponível</h3>
              <p className="text-gray-600">
                Este módulo ainda não possui aulas disponíveis. Volte em breve!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedLessons.map((lesson, index) => {
                const lessonProgress = moduleProgress?.find(p => p.lesson.id === lesson.id)?.progress;
                const isCompleted = !!lessonProgress?.isCompleted;
                const isLocked = isLessonLocked(lesson);
                
                return (
                  <Link key={lesson.id} href={isLocked ? "#" : `/cursos/aula/${lesson.id}`}>
                    <Card 
                      className={`hover:shadow transition-shadow cursor-pointer overflow-hidden border ${
                        isLocked ? 'opacity-80' : ''
                      } ${isCompleted ? 'border-l-4 border-l-green-500' : ''}`}
                      onClick={(e) => {
                        if (isLocked) {
                          e.preventDefault();
                          toast({
                            title: "Conteúdo Premium",
                            description: "Esta aula é exclusiva para assinantes premium.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Thumbnail */}
                        <div className="md:col-span-1 relative">
                          <div className="relative aspect-video md:aspect-auto md:h-full">
                            <img 
                              src={lesson.thumbnailUrl || "/images/placeholder-lesson.jpg"} 
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                                <Play size={24} className="text-primary ml-1" />
                              </div>
                            </div>
                            
                            {isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="bg-white p-2 rounded-full">
                                  <Lock size={24} className="text-amber-500" />
                                </div>
                              </div>
                            )}
                            
                            {isCompleted && (
                              <div className="absolute top-2 right-2">
                                <div className="bg-green-500 text-white p-1 rounded-full">
                                  <CheckCircle size={16} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="md:col-span-3 p-4 md:p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                              <span>{index + 1}. {lesson.title}</span>
                              {lesson.isPremium && (
                                <Badge className="ml-2 bg-amber-500">
                                  <Crown size={12} className="mr-1" />
                                  Premium
                                </Badge>
                              )}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">{lesson.description}</p>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500 mt-2">
                            <div className="flex items-center mr-4">
                              <Clock size={16} className="mr-1" />
                              <span>{formatDuration(lesson.videoDuration)}</span>
                            </div>
                            
                            {isCompleted ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle size={16} className="mr-1" />
                                <span>Concluída</span>
                              </div>
                            ) : lessonProgress?.progress ? (
                              <div className="flex items-center text-blue-600">
                                <BookOpen size={16} className="mr-1" />
                                <span>Em andamento ({lessonProgress.progress}%)</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CursoDetalhesPage;