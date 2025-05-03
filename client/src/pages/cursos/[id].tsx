import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  BookOpen,
  Info,
  HelpCircle,
  GraduationCap,
  Star,
  Award,
  BookmarkPlus,
  Bookmark,
  Share2,
  BarChart
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
  totalViews?: number;
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
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Componente para calcular tempo total do curso
const calculateTotalDuration = (lessons) => {
  if (!lessons || !lessons.length) return 0;
  return lessons.reduce((total, item) => total + (item.lesson.videoDuration || 0), 0);
};

// Componente para formatar tempo total em formato legível (horas e minutos)
const formatTotalDuration = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes} minutos`;
  }
};

// Componente de cartão de lição com tooltips explicativos
const LessonCard = ({ 
  lesson, 
  progress, 
  isLocked,
  moduleId,
  index,
  currentUserRole
}: { 
  lesson: CourseLesson;
  progress?: CourseProgress;
  isLocked: boolean;
  moduleId: number;
  index: number;
  currentUserRole?: string;
}) => {
  // Verificar se a lição está completa
  const isCompleted = progress?.isCompleted || false;
  const progressPercentage = progress?.progress || 0;
  const hasStarted = progressPercentage > 0 && !isCompleted;

  return (
    <div className={`relative p-5 border rounded-lg mb-4 transition-all duration-200 ${
      isLocked 
        ? 'bg-neutral-50 border-neutral-200' 
        : isCompleted 
          ? 'bg-green-50 border-green-200 hover:border-green-300 hover:shadow-sm'
          : hasStarted
            ? 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-sm'
            : 'bg-white border-neutral-200 hover:border-blue-300 hover:shadow-sm'
    }`}>
      <TooltipProvider>
        <div className="flex items-start">
          {/* Numeração e status */}
          <div className="flex-shrink-0 mr-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  isLocked 
                    ? 'bg-neutral-200 text-neutral-500'
                    : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : hasStarted
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-neutral-100 text-neutral-700'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : hasStarted ? (
                    <div className="relative">
                      <span className="absolute inset-0 flex items-center justify-center">
                        {Math.round(progressPercentage)}%
                      </span>
                      <svg className="w-10 h-10" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="3"
                          strokeDasharray={`${progressPercentage}, 100`}
                          strokeLinecap="round"
                          className="animate-pulse"
                        />
                      </svg>
                    </div>
                  ) : (
                    index + 1
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <p className="text-sm">
                  {isCompleted 
                    ? "Aula concluída!" 
                    : hasStarted
                      ? `Em progresso - ${Math.round(progressPercentage)}% concluído`
                      : isLocked
                        ? "Aula bloqueada - Assine o plano Premium para acessar"
                        : "Aula ainda não iniciada"}
                </p>
              </TooltipContent>
            </Tooltip>
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
              
              {/* Badge de Premium com tooltip explicativo */}
              {lesson.isPremium && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="bg-amber-100 border-amber-200 text-amber-700 flex items-center gap-1 font-medium ml-2 flex-shrink-0"
                    >
                      <Crown className="h-3 w-3" />
                      <span>Premium</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      {currentUserRole && ['premium', 'admin', 'designer_adm', 'mensal', 'anual', 'lifetime'].includes(currentUserRole)
                        ? 'Você tem acesso a este conteúdo Premium' 
                        : 'Disponível apenas para assinantes Premium'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center mt-3 justify-between">
              <div className="flex items-center space-x-4">
                {/* Duração com tooltip explicativo */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-neutral-500">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      <span>{formatDuration(lesson.videoDuration)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Duração da aula: {formatDuration(lesson.videoDuration)}</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Plataforma de vídeo com tooltip explicativo */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-neutral-500 capitalize">
                      <Video className="h-3.5 w-3.5 mr-1.5" />
                      <span>{lesson.videoProvider}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      {lesson.videoProvider === 'youtube' && 'Video hospedado no YouTube'}
                      {lesson.videoProvider === 'vimeo' && 'Video hospedado no Vimeo'}
                      {lesson.videoProvider === 'vturb' && 'Video hospedado no vTurb'}
                      {lesson.videoProvider === 'panda' && 'Video hospedado no Panda Video'}
                    </p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Status da visualização */}
                {hasStarted && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-xs text-blue-600">
                        <BarChart className="h-3.5 w-3.5 mr-1.5" />
                        <span>{progressPercentage}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Você já assistiu {progressPercentage}% desta aula</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              
              {/* Botão de acesso com estados diferentes */}
              {isLocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-neutral-500 text-sm bg-neutral-100 py-1 px-3 rounded-full">
                      <LockKeyhole className="h-4 w-4 mr-1.5" /> 
                      <span>Conteúdo Premium</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <div className="text-sm max-w-[220px]">
                      <p className="font-medium mb-1">Conteúdo exclusivo para assinantes</p>
                      <p>Assine o plano Premium para desbloquear este e outros conteúdos exclusivos.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link 
                  href={`/cursos/aula/${lesson.id}`}
                  className={`inline-flex items-center text-sm font-medium rounded-md py-1.5 px-3 transition-colors ${
                    isCompleted 
                      ? 'text-green-600 hover:text-green-700 hover:bg-green-50 border border-transparent hover:border-green-100' 
                      : hasStarted
                        ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-100'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-100'
                  }`}
                >
                  {isCompleted ? (
                    <>Rever aula</>
                  ) : hasStarted ? (
                    <>Continuar assistindo <ChevronRight className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Assistir aula <PlayCircle className="h-4 w-4 ml-1" /></>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

// Componente de estatísticas de progresso com visualização aprimorada
const ProgressStats = ({ 
  totalLessons, 
  completedLessons,
  totalDuration
}: { 
  totalLessons: number; 
  completedLessons: number;
  totalDuration: number;
}) => {
  // Calcular porcentagem de conclusão
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const remainingLessons = totalLessons - completedLessons;
  
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6 shadow-sm">
      <h3 className="font-medium text-lg mb-3 flex items-center">
        <BarChart className="mr-2 h-5 w-5 text-blue-600" />
        Seu progresso
      </h3>
      
      <div className="flex items-center justify-between text-sm text-neutral-600 mb-2.5">
        <span className="font-medium">{completionPercentage}% concluído</span>
        <span>{completedLessons}/{totalLessons} aulas</span>
      </div>
      
      <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            completionPercentage === 100 
              ? 'bg-green-500' 
              : completionPercentage > 75
                ? 'bg-emerald-500'
                : completionPercentage > 50
                  ? 'bg-blue-500'
                  : completionPercentage > 25
                    ? 'bg-blue-600'
                    : 'bg-blue-700'
          }`}
          style={{ width: `${completionPercentage || 0}%` }}
        ></div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-1">Total</p>
          <p className="font-bold text-xl text-blue-700">{totalLessons}</p>
          <p className="text-xs text-blue-600 mt-1">aulas</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800 font-medium mb-1">Concluídas</p>
          <p className="font-bold text-xl text-green-700">{completedLessons}</p>
          <p className="text-xs text-green-600 mt-1">aulas</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-800 font-medium mb-1">Pendentes</p>
          <p className="font-bold text-xl text-amber-700">{remainingLessons}</p>
          <p className="text-xs text-amber-600 mt-1">aulas</p>
        </div>
      </div>
      
      {/* Tempo total estimado */}
      <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
        <span className="text-sm text-neutral-700">Tempo total do curso:</span>
        <span className="font-medium">{formatTotalDuration(totalDuration)}</span>
      </div>
    </div>
  );
};

// Componente de guia do curso
const CourseGuide = ({ moduleData, onClose }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 mb-6 shadow-sm relative">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Como aproveitar melhor este curso</h3>
          
          <ul className="space-y-2">
            <li className="flex items-start text-blue-700">
              <CheckCircle className="h-4 w-4 mr-2 mt-1 text-green-600" />
              <span>Assista as aulas na ordem recomendada para melhor compreensão</span>
            </li>
            <li className="flex items-start text-blue-700">
              <CheckCircle className="h-4 w-4 mr-2 mt-1 text-green-600" />
              <span>Seu progresso é salvo automaticamente enquanto assiste</span>
            </li>
            <li className="flex items-start text-blue-700">
              <CheckCircle className="h-4 w-4 mr-2 mt-1 text-green-600" />
              <span>Uma aula é marcada como concluída quando você assiste até o final</span>
            </li>
            <li className="flex items-start text-blue-700">
              <CheckCircle className="h-4 w-4 mr-2 mt-1 text-green-600" />
              <span>Você pode revisar as aulas mesmo depois de concluídas</span>
            </li>
          </ul>
          
          <div className="mt-4 pt-3 border-t border-blue-200">
            <p className="text-blue-800 font-medium">
              Este curso é de nível {moduleData?.level === 'iniciante' ? 'iniciante' : 
                moduleData?.level === 'intermediario' ? 'intermediário' : 'avançado'}
            </p>
          </div>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full bg-white"
        onClick={onClose}
      >
        <span className="sr-only">Fechar</span>
        <span aria-hidden="true">×</span>
      </Button>
    </div>
  );
};

// Componente de certificado de conclusão
const CompletionCertificate = ({ moduleData, completionDate }) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 mb-6 shadow-sm">
      <div className="text-center">
        <div className="inline-flex p-3 bg-green-100 rounded-full mb-3">
          <Award className="h-7 w-7 text-green-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-green-800 mb-2">Parabéns! Curso Concluído</h3>
        <p className="text-green-700 mb-4">
          Você completou todas as aulas do curso "{moduleData?.title}".
        </p>
        
        <div className="bg-white p-3 rounded-lg border border-green-200 mb-4">
          <p className="text-sm text-neutral-600 mb-1">Data de conclusão:</p>
          <p className="font-medium">{new Date(completionDate).toLocaleDateString('pt-BR')}</p>
        </div>
        
        <Button 
          variant="outline" 
          className="bg-white border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 w-full justify-center"
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Ver certificado
        </Button>
      </div>
    </div>
  );
};

// Componente para exibir informações do curso
const CourseInfoCard = ({ 
  moduleData, 
  totalLessons, 
  totalDuration,
  isPremium 
}) => {
  const [isSaved, setIsSaved] = useState(false);
  
  // Função para simular salvar curso
  const handleSaveCourse = () => {
    setIsSaved(!isSaved);
  };
  
  // Função para simular compartilhar
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: moduleData.title,
        text: `Confira este curso sobre ${moduleData.title} no DesignAuto`,
        url: window.location.href,
      });
    } else {
      // Fallback - copiar link para clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };
  
  const levelColors = {
    iniciante: "text-green-600 bg-green-50 border-green-100",
    intermediario: "text-blue-600 bg-blue-50 border-blue-100",
    avancado: "text-purple-600 bg-purple-50 border-purple-100"
  };
  
  const levelIcons = {
    iniciante: <GraduationCap className="h-4 w-4 mr-1.5" />,
    intermediario: <Award className="h-4 w-4 mr-1.5" />,
    avancado: <Star className="h-4 w-4 mr-1.5" />
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Badge 
              variant="outline" 
              className={`flex items-center ${levelColors[moduleData?.level || 'iniciante']}`}
            >
              {levelIcons[moduleData?.level || 'iniciante']}
              {moduleData?.level === 'iniciante' ? 'Iniciante' : 
                moduleData?.level === 'intermediario' ? 'Intermediário' : 'Avançado'}
            </Badge>
          </div>
          
          {isPremium && (
            <Badge 
              variant="outline" 
              className="bg-amber-50 text-amber-700 border-amber-100 flex items-center"
            >
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <div className="flex items-center text-sm">
              <Video className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="text-neutral-700">
                <span className="font-medium">{totalLessons}</span> aulas
              </span>
            </div>
          </div>
          
          <div className="border-b border-neutral-100 pb-3">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="text-neutral-700">
                Duração total: <span className="font-medium">{formatTotalDuration(totalDuration)}</span>
              </span>
            </div>
          </div>
          
          {moduleData?.totalViews && (
            <div className="border-b border-neutral-100 pb-3">
              <div className="flex items-center text-sm">
                <BarChart className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-neutral-700">
                  <span className="font-medium">{moduleData.totalViews}</span> alunos neste curso
                </span>
              </div>
            </div>
          )}
          
          <div className="border-b border-neutral-100 pb-3">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="text-neutral-700">
                Atualizado em <span className="font-medium">{new Date(moduleData?.updatedAt || Date.now()).toLocaleDateString('pt-BR')}</span>
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 ${isSaved ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}
              onClick={handleSaveCourse}
            >
              {isSaved ? (
                <>
                  <Bookmark className="mr-1.5 h-4 w-4" />
                  Salvo
                </>
              ) : (
                <>
                  <BookmarkPlus className="mr-1.5 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 className="mr-1.5 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Página principal de detalhes do módulo (redesenhada)
export default function CursoDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [showGuide, setShowGuide] = useState(true);
  
  // Função para verificar se uma lição premium deve ser bloqueada
  const isLessonLocked = (lesson: CourseLesson) => {
    if (!lesson.isPremium) return false;
    if (!user) return true;
    if (user.role === 'admin' || user.role === 'designer_adm') return false;
    return !['premium', 'mensal', 'anual', 'lifetime'].includes(user.role);
  };

  // Buscar detalhes do módulo usando a rota corrigida
  const { 
    data: moduleData, 
    isLoading: isLoadingModule, 
    error: moduleError 
  } = useQuery({
    queryKey: [`/api/courses/modules/${id}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/courses/modules/${id}`);
      return await res.json();
    }
  });

  // Buscar lições e progresso com a rota corrigida
  const { 
    data: lessonData, 
    isLoading: isLoadingLessons, 
    error: lessonsError,
    refetch: refetchLessons
  } = useQuery<{lesson: CourseLesson, progress: CourseProgress}[]>({
    queryKey: [`/api/courses/modules/${id}/lessons`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/courses/modules/${id}/lessons`);
      return await res.json();
    }
  });

  // Mutação para registrar visualização do módulo
  const viewModuleMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) return null;
      return await apiRequest('POST', `/api/courses/modules/${id}/view`);
    },
    onSuccess: () => {
      // Não precisamos fazer nada especial aqui, apenas registrar a visualização
    }
  });

  // Efeito para registrar visualização ao entrar na página
  useEffect(() => {
    if (user && id && !isLoadingModule && !moduleError) {
      viewModuleMutation.mutate();
    }
  }, [user, id, isLoadingModule, moduleError]);

  // Loading state
  const isLoading = isLoadingModule || isLoadingLessons;
  
  // Error state
  const error = moduleError || lessonsError;

  // Processar estatísticas
  const totalLessons = lessonData?.length || 0;
  const completedLessons = lessonData?.filter(item => item.progress?.isCompleted).length || 0;
  const totalDuration = calculateTotalDuration(lessonData);
  
  // Calcular se o curso está concluído e a data de conclusão
  const isCourseCompleted = completedLessons === totalLessons && totalLessons > 0;
  const courseCompletionDate = isCourseCompleted && lessonData && lessonData.length > 0
    ? lessonData.reduce((latest, item) => {
        if (!item.progress?.updatedAt) return latest;
        const date = new Date(item.progress.updatedAt);
        return date > latest ? date : latest;
      }, new Date(0))
    : null;

  // Estado para o botão de continuar (destacado se houver progresso)
  const hasProgress = completedLessons > 0 && completedLessons < totalLessons;

  // Se estiver carregando, mostrar indicador amigável
  if (isLoading) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-neutral-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <h2 className="text-xl font-medium text-neutral-800 mb-2">Carregando o curso</h2>
              <p className="text-neutral-600 text-center max-w-md">
                Estamos preparando todo o conteúdo do curso para você. Aguarde um momento...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se ocorrer um erro, mostrar mensagem amigável e opções claras
  if (error) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-neutral-200 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-xl font-medium text-neutral-800 mb-2">Não foi possível carregar este curso</h2>
              <p className="text-neutral-600 mb-6 max-w-md">
                Desculpe, encontramos um problema ao carregar os detalhes deste curso. 
                Isso pode ser devido a uma conexão instável ou um problema temporário.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="default" 
                  onClick={() => refetchLessons()}
                >
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Tentar novamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/cursos')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> 
                  Voltar para cursos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se o módulo não for encontrado, mostrar mensagem explicativa
  if (!moduleData) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-neutral-200 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-neutral-100 p-4 rounded-full mb-4">
                <BookOpen className="h-10 w-10 text-neutral-500" />
              </div>
              <h2 className="text-xl font-medium text-neutral-800 mb-2">Curso não encontrado</h2>
              <p className="text-neutral-600 mb-6 max-w-md">
                O curso que você está procurando não está disponível ou foi removido.
                Explore nossos outros cursos disponíveis.
              </p>
              <Button 
                variant="default" 
                onClick={() => setLocation('/cursos')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> 
                Voltar para todos os cursos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderização principal com layout aprimorado
  return (
    <div className="bg-neutral-50 min-h-screen pb-12">
      <Helmet>
        <title>{moduleData.title} | DesignAuto</title>
        <meta name="description" content={moduleData.description} />
      </Helmet>
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-800 mb-8">
        <div className="container mx-auto px-4 pt-8 pb-12">
          <div className="max-w-5xl mx-auto">
            {/* Navegação superior */}
            <div className="mb-6">
              <Button 
                variant="ghost" 
                className="pl-0 hover:bg-white/10 text-white/90 hover:text-white -ml-3"
                onClick={() => setLocation('/cursos')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para cursos
              </Button>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Informações do curso */}
              <div className="lg:flex-1">
                {/* Badges e título */}
                <div className="flex flex-wrap gap-2 mb-4">
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
                    <Badge variant="outline" className="bg-amber-500/20 border-amber-400/30 text-amber-50 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      <span>Conteúdo Premium</span>
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">{moduleData.title}</h1>
                <p className="text-lg text-white/90 mb-6">{moduleData.description}</p>
                
                {/* Estatísticas do curso */}
                <div className="flex flex-wrap items-center gap-5 text-sm text-white/80 mb-6">
                  <div className="flex items-center">
                    <Video className="h-4 w-4 mr-2" />
                    <span>{totalLessons} aulas</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatTotalDuration(totalDuration)} de conteúdo</span>
                  </div>
                  
                  {user && completedLessons > 0 && (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>{completedLessons} de {totalLessons} aulas concluídas</span>
                    </div>
                  )}
                </div>
                
                {/* Botão de ação principal */}
                {lessonData && lessonData.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {isCourseCompleted ? (
                      <Button 
                        variant="outline"
                        className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 hover:text-green-800 shadow-sm"
                        onClick={() => {
                          if (lessonData && lessonData.length > 0) {
                            setLocation(`/cursos/aula/${lessonData[0].lesson.id}`);
                          }
                        }}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Curso concluído - Rever aulas</span>
                      </Button>
                    ) : hasProgress ? (
                      <Button 
                        className="bg-white text-blue-700 hover:bg-blue-50 shadow-sm animate-pulse"
                        onClick={() => {
                          const nextLesson = lessonData.find(item => !item.progress?.isCompleted && !isLessonLocked(item.lesson));
                          if (nextLesson) {
                            setLocation(`/cursos/aula/${nextLesson.lesson.id}`);
                          }
                        }}
                      >
                        <PlayCircle className="h-5 w-5 mr-2" />
                        <span>Continuar de onde parou</span>
                      </Button>
                    ) : (
                      <Button 
                        className="bg-white text-blue-700 hover:bg-blue-50 shadow-sm"
                        onClick={() => {
                          const firstAvailableLesson = lessonData.find(item => !isLessonLocked(item.lesson));
                          if (firstAvailableLesson) {
                            setLocation(`/cursos/aula/${firstAvailableLesson.lesson.id}`);
                          }
                        }}
                      >
                        <PlayCircle className="h-5 w-5 mr-2" />
                        <span>Começar o curso</span>
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      className="text-white border border-white/30 hover:bg-white/10 hover:text-white"
                      onClick={() => setShowGuide(!showGuide)}
                    >
                      <HelpCircle className="h-5 w-5 mr-2" />
                      <span>{showGuide ? 'Ocultar guia' : 'Mostrar guia'}</span>
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Imagem do curso (visível apenas em desktop) */}
              <div className="hidden lg:block lg:w-1/3">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img 
                    src={moduleData.thumbnailUrl || '/images/placeholder-course.jpg'} 
                    alt={moduleData.title}
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                    {hasProgress && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex justify-between text-xs text-white/90 mb-1.5">
                          <span>{Math.round((completedLessons / totalLessons) * 100)}% concluído</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.round((completedLessons / totalLessons) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Guia do curso (pode ser fechado) */}
          {showGuide && (
            <CourseGuide 
              moduleData={moduleData} 
              onClose={() => setShowGuide(false)} 
            />
          )}
          
          {/* Conteúdo principal em duas colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            {/* Lista de lições */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                    Conteúdo do curso
                  </h2>
                  
                  {user && completedLessons > 0 && completedLessons < totalLessons && (
                    <div className="text-sm text-neutral-600">
                      <span className="font-medium text-blue-600">{completedLessons}</span> de {totalLessons} aulas concluídas
                    </div>
                  )}
                </div>
                
                {/* Barra de progresso para usuários com progresso */}
                {user && completedLessons > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-neutral-600 mb-2">
                      <span className="font-medium">{Math.round((completedLessons / totalLessons) * 100)}% concluído</span>
                      <span>{completedLessons}/{totalLessons} aulas</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          completedLessons === totalLessons 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.round((completedLessons / totalLessons) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Lista de lições */}
                {lessonData && lessonData.length > 0 ? (
                  <div>
                    {lessonData
                      .sort((a, b) => a.lesson.order - b.lesson.order)
                      .map((item, index) => (
                      <LessonCard 
                        key={item.lesson.id}
                        lesson={item.lesson}
                        progress={item.progress}
                        isLocked={isLessonLocked(item.lesson)}
                        moduleId={parseInt(id)}
                        index={index}
                        currentUserRole={user?.role}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-600 bg-neutral-50 rounded-lg border border-neutral-200">
                    <BookOpen className="h-12 w-12 mb-4 text-neutral-400" />
                    <p className="font-medium">Nenhuma aula disponível no momento</p>
                    <p className="text-sm mt-2 text-center max-w-md">
                      Este curso está em desenvolvimento. 
                      Novas aulas serão adicionadas em breve.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar com informações e ações */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {/* Informações do curso */}
              <CourseInfoCard 
                moduleData={moduleData}
                totalLessons={totalLessons}
                totalDuration={totalDuration}
                isPremium={moduleData.isPremium}
              />
              
              {/* Progresso (apenas para usuários autenticados com progresso) */}
              {user && completedLessons > 0 && (
                <ProgressStats 
                  totalLessons={totalLessons} 
                  completedLessons={completedLessons}
                  totalDuration={totalDuration} 
                />
              )}
              
              {/* Certificado de conclusão (apenas se o curso estiver completo) */}
              {user && isCourseCompleted && courseCompletionDate && (
                <CompletionCertificate 
                  moduleData={moduleData}
                  completionDate={courseCompletionDate}
                />
              )}
              
              {/* Começar/Continuar curso - versão mobile */}
              {lessonData && lessonData.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm mb-6 lg:hidden">
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <PlayCircle className="mr-2 h-5 w-5 text-blue-600" />
                    {isCourseCompleted 
                      ? 'Curso concluído' 
                      : hasProgress 
                        ? 'Continue de onde parou' 
                        : 'Comece este curso'}
                  </h3>
                  
                  {isCourseCompleted ? (
                    <Button 
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => {
                        if (lessonData && lessonData.length > 0) {
                          setLocation(`/cursos/aula/${lessonData[0].lesson.id}`);
                        }
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Rever aulas do curso</span>
                    </Button>
                  ) : hasProgress ? (
                    <Button 
                      className="w-full flex items-center justify-center gap-2 animate-pulse"
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
                  ) : (
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
                      <span>Começar a assistir</span>
                    </Button>
                  )}
                  
                  {hasProgress && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <div className="text-xs text-neutral-600 flex justify-between mb-1.5">
                        <span>{Math.round((completedLessons / totalLessons) * 100)}% concluído</span>
                        <span>{completedLessons}/{totalLessons} aulas</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.round((completedLessons / totalLessons) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}