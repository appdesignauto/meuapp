import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Crown,
  ChevronRight,
  Video,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
  PlayCircle,
  LockKeyhole,
  BookOpen
} from 'lucide-react';

// Interfaces
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

// Componente para exibir duração em formato legível
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Componente de cartão de lição
const LessonCard = ({ 
  lesson, 
  progress, 
  isLocked,
  moduleId,
  index
}: { 
  lesson: CourseLesson;
  progress?: CourseProgress;
  isLocked: boolean;
  moduleId: number;
  index: number;
}) => {
  // Verificar se a lição está completa
  const isCompleted = progress?.isCompleted || false;

  return (
    <div className={`relative p-4 border rounded-lg mb-3 transition-all duration-200 ${
      isLocked 
        ? 'bg-neutral-50 border-neutral-200' 
        : isCompleted 
          ? 'bg-green-50 border-green-200 hover:border-green-300 hover:shadow-sm'
          : 'bg-white border-neutral-200 hover:border-blue-300 hover:shadow-sm'
    }`}>
      <div className="flex items-start">
        {/* Numeração e status */}
        <div className="flex-shrink-0 mr-4">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
            isLocked 
              ? 'bg-neutral-200 text-neutral-500'
              : isCompleted
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
          }`}>
            {isCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-grow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-medium text-lg ${isLocked ? 'text-neutral-500' : ''}`}>
                {lesson.title}
              </h3>
              <p className={`text-sm mt-1 ${isLocked ? 'text-neutral-500' : 'text-neutral-600'}`}>
                {lesson.description}
              </p>
            </div>
            
            {/* Badge de Premium */}
            {lesson.isPremium && (
              <Badge variant="outline" className="bg-amber-100 border-amber-200 text-amber-700 flex items-center gap-1 font-medium ml-2 flex-shrink-0">
                <Crown className="h-3 w-3" />
                <span>Premium</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center mt-3 justify-between">
            <div className="flex items-center space-x-4">
              {/* Duração */}
              <div className="flex items-center text-xs text-neutral-500">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                <span>{formatDuration(lesson.videoDuration)}</span>
              </div>
              
              {/* Plataforma de vídeo */}
              <div className="flex items-center text-xs text-neutral-500 capitalize">
                <Video className="h-3.5 w-3.5 mr-1.5" />
                <span>{lesson.videoProvider}</span>
              </div>
            </div>
            
            {/* Botão de acesso */}
            {isLocked ? (
              <div className="flex items-center text-neutral-500 text-sm">
                <LockKeyhole className="h-4 w-4 mr-1.5" /> 
                <span>Bloqueado</span>
              </div>
            ) : (
              <Link 
                href={`/cursos/aula/${lesson.id}`}
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {isCompleted ? 'Rever aula' : 'Assistir'} <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de estatísticas de progresso
const ProgressStats = ({ 
  totalLessons, 
  completedLessons
}: { 
  totalLessons: number; 
  completedLessons: number;
}) => {
  // Calcular porcentagem de conclusão
  const completionPercentage = Math.round((completedLessons / totalLessons) * 100);
  
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-5 mb-6 shadow-sm">
      <h3 className="font-medium text-lg mb-3">Seu progresso</h3>
      
      <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
        <span>{completionPercentage}% concluído</span>
        <span>{completedLessons}/{totalLessons} aulas</span>
      </div>
      
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full" 
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div className="p-2 bg-blue-50 rounded-md">
          <p className="text-sm text-neutral-600">Total de aulas</p>
          <p className="font-bold text-xl text-blue-700">{totalLessons}</p>
        </div>
        <div className="p-2 bg-green-50 rounded-md">
          <p className="text-sm text-neutral-600">Concluídas</p>
          <p className="font-bold text-xl text-green-700">{completedLessons}</p>
        </div>
        <div className="p-2 bg-amber-50 rounded-md">
          <p className="text-sm text-neutral-600">Pendentes</p>
          <p className="font-bold text-xl text-amber-700">{totalLessons - completedLessons}</p>
        </div>
      </div>
    </div>
  );
};

// Página principal de detalhes do módulo
export default function CursoDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Função para verificar se uma lição premium deve ser bloqueada
  const isLessonLocked = (lesson: CourseLesson) => {
    if (!lesson.isPremium) return false;
    if (!user) return true;
    if (user.role === 'admin' || user.role === 'designer_adm') return false;
    return !['premium', 'mensal', 'anual', 'lifetime'].includes(user.role);
  };

  // Buscar detalhes do módulo
  const { data: moduleData, isLoading: isLoadingModule, error: moduleError } = useQuery({
    queryKey: [`/api/cursos/modules/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/cursos/modules/${id}`);
      if (!res.ok) throw new Error('Falha ao carregar detalhes do módulo');
      return res.json();
    }
  });

  // Buscar lições e progresso
  const { data: lessonData, isLoading: isLoadingLessons, error: lessonsError } = useQuery<{lesson: CourseLesson, progress: CourseProgress}[]>({
    queryKey: [`/api/cursos/modules/${id}/lessons`],
    queryFn: async () => {
      const res = await fetch(`/api/cursos/modules/${id}/lessons`);
      if (!res.ok) throw new Error('Falha ao carregar lições');
      return res.json();
    }
  });

  // Loading state
  const isLoading = isLoadingModule || isLoadingLessons;
  
  // Error state
  const error = moduleError || lessonsError;

  // Processar estatísticas
  const totalLessons = lessonData?.length || 0;
  const completedLessons = lessonData?.filter(item => item.progress?.isCompleted).length || 0;

  // Se estiver carregando, mostrar indicador
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-neutral-600">Carregando detalhes do curso...</p>
        </div>
      </div>
    );
  }

  // Se ocorrer um erro, mostrar mensagem
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center text-red-600">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="font-medium">Erro ao carregar detalhes do curso</p>
          <p className="text-sm mt-1">Por favor, tente novamente mais tarde</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation('/cursos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para cursos
          </Button>
        </div>
      </div>
    );
  }

  // Se o módulo não for encontrado
  if (!moduleData) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center text-neutral-600">
          <BookOpen className="h-12 w-12 mb-4" />
          <p className="font-medium">Módulo não encontrado</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation('/cursos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para cursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>{moduleData.title} | DesignAuto</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        {/* Navegação superior */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent hover:text-blue-700 -ml-2"
            onClick={() => setLocation('/cursos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para cursos
          </Button>
        </div>
        
        {/* Cabeçalho do módulo */}
        <div className="relative rounded-xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-800/90">
            <img 
              src={moduleData.thumbnailUrl || '/images/placeholder-course.jpg'} 
              alt={moduleData.title}
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
          </div>
          
          <div className="relative z-10 p-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <Badge 
                variant="outline" 
                className={`
                  ${moduleData.level === 'iniciante' ? 'bg-green-500/20 text-green-50 border-green-400/30' : 
                    moduleData.level === 'intermediario' ? 'bg-blue-500/20 text-blue-50 border-blue-400/30' : 
                    'bg-purple-500/20 text-purple-50 border-purple-400/30'}
                `}
              >
                {moduleData.level === 'iniciante' ? 'Iniciante' : 
                 moduleData.level === 'intermediario' ? 'Intermediário' : 'Avançado'}
              </Badge>
              
              {moduleData.isPremium && (
                <Badge variant="outline" className="bg-amber-500/20 border-amber-400/30 text-amber-50 flex items-center gap-1 mt-2 md:mt-0">
                  <Crown className="h-3 w-3" />
                  <span>Conteúdo Premium</span>
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{moduleData.title}</h1>
            <p className="text-lg text-white/90 mb-6">{moduleData.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <div className="flex items-center">
                <Video className="h-4 w-4 mr-2" />
                <span>{totalLessons} aulas</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Atualizado em {new Date(moduleData.updatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
              
              {user && completedLessons > 0 && (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{completedLessons} de {totalLessons} aulas concluídas</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Lista de lições */}
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-bold mb-4">Conteúdo do módulo</h2>
            
            {lessonData && lessonData.length > 0 ? (
              <div>
                {/* Progresso apenas para usuários autenticados */}
                {user && completedLessons > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-neutral-600 mb-2">
                      <span>{Math.round((completedLessons / totalLessons) * 100)}% concluído</span>
                      <span>{completedLessons}/{totalLessons} aulas</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.round((completedLessons / totalLessons) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Lições */}
                <div>
                  {lessonData.map((item, index) => (
                    <LessonCard 
                      key={item.lesson.id}
                      lesson={item.lesson}
                      progress={item.progress}
                      isLocked={isLessonLocked(item.lesson)}
                      moduleId={parseInt(id)}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-neutral-600 bg-white rounded-lg border border-neutral-200">
                <BookOpen className="h-12 w-12 mb-4" />
                <p className="font-medium">Nenhuma aula disponível</p>
                <p className="text-sm mt-1">Novas aulas serão adicionadas em breve</p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-2">
            {/* Progresso (apenas para usuários autenticados com progresso) */}
            {user && completedLessons > 0 && (
              <ProgressStats 
                totalLessons={totalLessons} 
                completedLessons={completedLessons} 
              />
            )}
            
            {/* Começar/Continuar curso */}
            {lessonData && lessonData.length > 0 && (
              <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-sm">
                <h3 className="font-medium text-lg mb-3">
                  {completedLessons > 0 ? 'Continue de onde parou' : 'Comece agora'}
                </h3>
                
                {completedLessons > 0 && completedLessons < totalLessons ? (
                  // Continue para a próxima aula não concluída
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      const nextLesson = lessonData.find(item => !item.progress?.isCompleted && !isLessonLocked(item.lesson));
                      if (nextLesson) {
                        setLocation(`/cursos/aula/${nextLesson.lesson.id}`);
                      }
                    }}
                  >
                    <PlayCircle className="h-4 w-4" />
                    <span>Continuar curso</span>
                  </Button>
                ) : completedLessons === totalLessons ? (
                  // Curso concluído, opção para revisitar a primeira aula
                  <Button 
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      if (lessonData && lessonData.length > 0) {
                        setLocation(`/cursos/aula/${lessonData[0].lesson.id}`);
                      }
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Curso concluído</span>
                  </Button>
                ) : (
                  // Começar com a primeira aula
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      const firstAvailableLesson = lessonData.find(item => !isLessonLocked(item.lesson));
                      if (firstAvailableLesson) {
                        setLocation(`/cursos/aula/${firstAvailableLesson.lesson.id}`);
                      }
                    }}
                  >
                    <PlayCircle className="h-4 w-4" />
                    <span>Começar curso</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}