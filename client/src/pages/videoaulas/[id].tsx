import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronDown,
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  ChevronRight,
  Clock,
  Download,
  Share2,
  Bookmark,
  ListChecks,
  CheckCircle2,
  CheckCircle,
  Circle,
  Check,
  Lock,
  ExternalLink,
  BookOpen,
  PlayCircle,
  ThumbsUp,
  Star,
  ArrowLeft,
  ArrowRight,
  Layers,
  Menu
} from "lucide-react";
import VideoComments from "@/components/videoaulas/VideoComments";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import YouTubePlayer from "@/components/ui/youtube-player";
import VimeoPlayer from "@/components/ui/vimeo-player";
import { Tutorial } from "@/components/videoaulas/TutorialData";

// Componente para player de vídeo que detecta o provedor e escolhe o player apropriado
const VideoPlayer: React.FC<{ videoUrl: string; thumbnailUrl: string; videoProvider?: string }> = ({ 
  videoUrl, 
  thumbnailUrl,
  videoProvider = 'youtube' // Valor padrão
}) => {
  console.log("[VideoPlayer] Iniciado com provedor:", videoProvider, "URL:", videoUrl); // Log para depuração
  
  // Verificar se a URL existe
  if (!videoUrl) {
    console.error("[VideoPlayer] URL de vídeo não fornecida ou inválida");
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <ExternalLink className="h-10 w-10 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">URL de vídeo inválida</h3>
          <p className="text-gray-600 text-sm mt-1">
            Nenhuma URL de vídeo foi fornecida para este conteúdo
          </p>
        </div>
      </div>
    );
  }
  
  // Definir o player com base no provedor de vídeo
  try {
    switch (videoProvider?.toLowerCase()) {
      case 'youtube':
        console.log("[VideoPlayer] Utilizando YouTube player");
        return <YouTubePlayer videoUrl={videoUrl} thumbnailUrl={thumbnailUrl} />;
      case 'vimeo':
        console.log("[VideoPlayer] Utilizando Vimeo player");
        return <VimeoPlayer videoUrl={videoUrl} thumbnailUrl={thumbnailUrl} />;
      default:
        // Se não for um provedor conhecido, ou se for 'local', usar o player padrão
        console.log("[VideoPlayer] Provedor não reconhecido:", videoProvider);
        return (
          <div className="w-full aspect-video bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-blue-500 mb-2">
                <ExternalLink className="h-10 w-10 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Provedor de vídeo não suportado</h3>
              <p className="text-gray-600 text-sm mt-1">
                O provedor "{videoProvider || 'desconhecido'}" ainda não é suportado
              </p>
              <a 
                href={videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Abrir link do vídeo
              </a>
            </div>
          </div>
        );
    }
  } catch (error) {
    // Capturar qualquer erro que possa ocorrer durante a renderização
    console.error("[VideoPlayer] Erro ao renderizar o player:", error);
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <ExternalLink className="h-10 w-10 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Erro ao carregar o vídeo</h3>
          <p className="text-gray-600 text-sm mt-1">
            Ocorreu um erro inesperado ao carregar o player de vídeo
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Detalhes técnicos: {String(error)}
          </p>
        </div>
      </div>
    );
  }
};

const VideoLessonPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const isPremiumUser = user && (user.nivelacesso === 'premium' || user.nivelacesso === 'admin');
  const [, navigate] = useLocation();

  // Conversão segura do id para número, com tratamento de erro
  const id = params.id ? parseInt(params.id) : null;
  
  // Garantir que id é um número válido
  if (id === null || isNaN(id)) {
    navigate("/videoaulas");
    return null;
  }
  
  // Buscar dados do banco - primeiro os hooks de consulta
  const { data: moduleData, isLoading: isLoadingModules } = useQuery({
    queryKey: ['/api/courses/modules'],
    retry: 1,
  });
  
  const { data: lessonsData, isLoading: isLoadingLessons } = useQuery({
    queryKey: ['/api/courses/lessons'],
    retry: 1,
  });
  
  // Encontrar a lição atual pelo ID - depois das consultas
  const currentLesson = lessonsData?.find(lesson => lesson.id === id);
  const currentModule = currentLesson ? moduleData?.find(module => module.id === currentLesson.moduleId) : null;
  
  // Estados
  const [isDesktop, setIsDesktop] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  
  const [watchedLessons, setWatchedLessons] = useState<number[]>(() => {
    // Recuperar aulas assistidas do localStorage
    const saved = localStorage.getItem('watchedLessons');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estados para o sistema de avaliação
  const [userRating, setUserRating] = useState<number>(() => {
    // Carregar avaliação atual do localStorage
    const savedRatings = localStorage.getItem('videoRatings');
    if (savedRatings) {
      const parsedRatings = JSON.parse(savedRatings);
      return parsedRatings[id] || 0;
    }
    return 0;
  });
  
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(userRating > 0);
  
  // Estado para controlar se a aula foi salva pelo usuário
  const [savedLessons, setSavedLessons] = useState<number[]>(() => {
    // Recuperar aulas salvas do localStorage
    const saved = localStorage.getItem('savedLessons');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estado para a aula salva
  const isSaved = savedLessons.includes(id);
  
  // Função para salvar/remover aula dos favoritos
  const toggleSaveLesson = () => {
    const newSavedLessons = isSaved
      ? savedLessons.filter(lessonId => lessonId !== id)
      : [...savedLessons, id];
    
    setSavedLessons(newSavedLessons);
    localStorage.setItem('savedLessons', JSON.stringify(newSavedLessons));
  };
  
  // Função para compartilhar a aula
  const shareLesson = async () => {
    const lessonUrl = window.location.href;
    const lessonTitle = currentLesson?.title || 'Tutorial';
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: lessonTitle,
          text: `Confira este tutorial: ${lessonTitle}`,
          url: lessonUrl,
        });
      } else {
        // Fallback para navegadores que não suportam a Web Share API
        navigator.clipboard.writeText(lessonUrl);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Tenta copiar para a área de transferência como fallback
      try {
        navigator.clipboard.writeText(lessonUrl);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
          variant: "default",
        });
      } catch (clipboardError) {
        toast({
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar ou copiar o link.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Função para alternar a expansão do módulo
  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };
  
  // Estado para controlar se a aula atual está concluída
  const isCompleted = watchedLessons.includes(id);
  
  // Função simples para formatação de duração
  const formatarDuracao = (segundos: number | string | null | undefined): string => {
    // Se for undefined ou null, retornar valor padrão
    if (segundos === undefined || segundos === null) {
      return "00:00";
    }
    
    // Se já for uma string formatada (contém ':'), retornar direto
    if (typeof segundos === 'string' && segundos.includes(':')) {
      return segundos;
    }
    
    // Converter para número
    let totalSegundos = 0;
    try {
      if (typeof segundos === 'string') {
        totalSegundos = parseInt(segundos, 10);
      } else if (typeof segundos === 'number') {
        totalSegundos = segundos;
      }
      
      // Verificar se é um número válido
      if (isNaN(totalSegundos) || totalSegundos < 0) {
        return "00:00";
      }
      
      // Calcular minutos e segundos
      const minutos = Math.floor(totalSegundos / 60);
      const segundosRestantes = Math.floor(totalSegundos % 60);
      
      // Retornar no formato MM:SS
      return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
    } catch (e) {
      console.error("Erro ao formatar duração:", e);
      return "00:00";
    }
  };
  
  // Detectar se é desktop após montagem do componente e rolar para o topo
  useEffect(() => {
    // Rolar para o topo da página quando a página é carregada ou o ID muda
    window.scrollTo(0, 0);
    
    // Definir isDesktop no lado do cliente
    const checkDesktop = () => window.innerWidth >= 768;
    setIsDesktop(checkDesktop());
    
    // Adicionar event listener para responsividade
    const handleResize = () => {
      setIsDesktop(checkDesktop());
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [id]); // Adicionar 'id' como dependência para rolar para o topo quando a aula mudar
  
  // Expandir automaticamente o módulo da aula atual
  useEffect(() => {
    if (currentLesson && currentLesson.moduleId) {
      setCurrentModuleId(currentLesson.moduleId);
      
      // Expandir automaticamente o módulo da aula atual se não estiver expandido
      if (!expandedModules.includes(currentLesson.moduleId)) {
        setExpandedModules(prev => [...prev, currentLesson.moduleId]);
      }
    }
  }, [currentLesson, expandedModules]);
  
  // Preparar o objeto tutorial no formato necessário para o componente
  const tutorial = currentLesson ? {
    id: currentLesson.id,
    title: currentLesson.title,
    description: currentLesson.description,
    thumbnailUrl: currentLesson.thumbnailUrl,
    videoUrl: currentLesson.videoUrl,
    videoProvider: currentLesson.videoProvider,
    duration: currentLesson.duration, // Manter o valor original em segundos
    durationFormatted: formatarDuracao(currentLesson.duration), // Adicionar formatação adequada
    level: currentModule?.level || 'iniciante',
    isPremium: currentLesson.isPremium,
    isWatched: false, // Será implementado com histórico do usuário no futuro
    views: 0, // Será implementado no futuro
    moduleId: currentLesson.moduleId,
    tags: [], // Será implementado no futuro
    progress: 0 // Será implementado no futuro
  } : null;
  
  // Filtrar aulas do módulo atual e determinar o índice da lição atual
  const moduleLessons = lessonsData?.filter(lesson => lesson.moduleId === currentLesson?.moduleId) || [];
  const currentLessonIndex = moduleLessons.findIndex(lesson => lesson.id === id);
  
  // Buscar lições relacionadas (do mesmo módulo)
  const tutoriaisRelacionados = lessonsData
    ?.filter(lesson => lesson.id !== id && lesson.moduleId === currentLesson?.moduleId)
    .slice(0, 4)
    .map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      thumbnailUrl: lesson.thumbnailUrl,
      videoUrl: lesson.videoUrl,
      videoProvider: lesson.videoProvider,
      duration: lesson.duration, // Valor original
      durationFormatted: formatarDuracao(lesson.duration), // Valor formatado
      level: currentModule?.level || 'iniciante',
      isPremium: lesson.isPremium,
      isWatched: false,
      views: 0,
      moduleId: lesson.moduleId,
      tags: []
    })) || [];

  // Função para verificar se o conteúdo premium deve ser bloqueado
  const isPremiumLocked = (isPremium: boolean) => {
    if (!isPremium) return false;
    return !isPremiumUser;
  };
  
  // Funções para o sistema de avaliação
  const handleRate = (rating: number) => {
    setUserRating(rating);
    setHasRated(true);
    
    // Aqui você pode implementar a lógica para enviar a avaliação para o backend
    // Por exemplo, salvar no localStorage ou fazer uma requisição API
    console.log(`Usuário avaliou a aula com ${rating} estrelas`);
    
    // Exemplo de salvar no localStorage
    const savedRatings = localStorage.getItem('videoRatings') 
      ? JSON.parse(localStorage.getItem('videoRatings') || '{}') 
      : {};
    
    savedRatings[id] = rating;
    localStorage.setItem('videoRatings', JSON.stringify(savedRatings));
  };
  
  const handleHoverStar = (rating: number) => {
    setHoverRating(rating);
  };
  
  const handleLeaveStars = () => {
    setHoverRating(0);
  };
  
  // Função para alternar o estado de conclusão da aula (marcar/desmarcar)
  const handleComplete = () => {
    let newWatchedLessons = [...watchedLessons];
    
    if (isCompleted) {
      // Se já está concluída, remover da lista de concluídas
      newWatchedLessons = newWatchedLessons.filter(lessonId => lessonId !== id);
      setWatchedLessons(newWatchedLessons);
      localStorage.setItem('watchedLessons', JSON.stringify(newWatchedLessons));
      // Não navegamos para nenhum lugar, apenas desmarcamos
    } else {
      // Se não está concluída, adicionar à lista e navegar para a próxima
      newWatchedLessons.push(id);
      setWatchedLessons(newWatchedLessons);
      localStorage.setItem('watchedLessons', JSON.stringify(newWatchedLessons));
      
      // Aguardar um instante para mostrar visualmente que a aula foi concluída
      setTimeout(() => {
        // Navegar para a próxima aula se existir
        const nextLesson = lessonsData?.find(l => l.moduleId === currentLesson?.moduleId && l.id > id);
        if (nextLesson) {
          navigate(`/videoaulas/${nextLesson.id}`);
        }
      }, 300);
    }
  };

  // Se o tutorial não existir, redirecionar para a página de videoaulas
  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tutorial não encontrado</h1>
          <p className="text-gray-600 mb-6">O tutorial que você está procurando não existe ou foi removido.</p>
          <Button 
            onClick={() => navigate("/videoaulas")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para Videoaulas
          </Button>
        </div>
      </div>
    );
  }

  const isLocked = isPremiumLocked(tutorial.isPremium);

  return (
    <>
      {/* Helmet temporariamente desativado para corrigir erro
      <Helmet>
        <title>{tutorial.title} | DesignAuto Videoaulas</title>
        <meta name="description" content={tutorial.description} />
      </Helmet> */}
      
      <div className="min-h-screen bg-white pb-12">
        {/* Cabeçalho com navegação - estilo mais suave */}
        <div className="bg-gradient-to-r from-blue-500/90 to-blue-600/90 py-4 border-b border-blue-200 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-white hover:bg-blue-500/20 -ml-3 transition-colors mr-3"
                  onClick={() => navigate("/videoaulas")}
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="hidden sm:inline ml-1">Voltar</span>
                </Button>
                
                <div className="hidden sm:flex items-center text-white">
                  <span className="mx-2 text-blue-200">|</span>
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-1.5 text-blue-200" />
                    <span className="font-medium">{currentModule?.title || "Módulo"}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Botão de módulos para mobile */}
                <Button 
                  variant="outline" 
                  className="sm:hidden bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => navigate("/videoaulas")}
                >
                  <Menu className="h-4 w-4 mr-1" />
                  Módulos
                </Button>
                
                {tutorial.isPremium && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-sm font-medium px-3 py-1">
                    <Lock className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                
                <Badge className="bg-blue-600 text-white border-0 shadow-sm font-medium px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {tutorial.durationFormatted || tutorial.duration}
                </Badge>
                
                {isCompleted ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium px-3 py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Concluído
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium px-3 py-1">
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Em andamento
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Removida a barra de progresso do módulo que estava duplicada */}
          </div>
        </div>
        
        {/* Conteúdo principal em duas colunas */}
        <div className="container mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna do vídeo e detalhes */}
            <div className="lg:col-span-2">
              {/* Player de vídeo */}
              <div className="rounded-lg overflow-hidden bg-white border border-blue-100 shadow-sm">
                {isLocked ? (
                  <div className="aspect-video relative flex items-center justify-center bg-blue-50">
                    <img 
                      src={tutorial.thumbnailUrl} 
                      alt={tutorial.title} 
                      className="w-full h-full object-cover opacity-30 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-blue-900/5 backdrop-blur-sm"></div>
                    <div className="text-center z-10 p-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 rounded-full shadow-md">
                          <Lock className="h-10 w-10 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Conteúdo Premium
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Este tutorial está disponível apenas para assinantes do plano premium.
                        Assine agora para desbloquear este e todos os outros conteúdos exclusivos.
                      </p>
                      <Link href="/planos">
                        <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md transition-all font-medium">
                          Ver Planos de Assinatura
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <VideoPlayer 
                    videoUrl={tutorial.videoUrl} 
                    thumbnailUrl={tutorial.thumbnailUrl}
                    videoProvider={tutorial.videoProvider || 'youtube'}
                  />
                )}
                
                {/* Informações do tutorial - layout responsivo */}
                <div className="p-4 sm:p-5">
                  {/* Versão Mobile - Layout Otimizado */}
                  <div className="block sm:hidden">
                    {/* Cabeçalho com título e botões de navegação */}
                    <div className="flex justify-between items-start mb-2">
                      <h1 className="text-xl font-bold text-gray-800 pr-3">{tutorial.title}</h1>
                      
                      {/* Botões de navegação mobile - design aprimorado */}
                      <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                        {/* Botão anterior */}
                        {(() => {
                          const prevLesson = lessonsData?.find(l => l.moduleId === currentLesson?.moduleId && l.id < id);
                          return prevLesson ? (
                            <Link 
                              href={`/videoaulas/${prevLesson.id}`} 
                              className="inline-flex"
                              onClick={(e) => {
                                // Permitir o comportamento padrão do link, o useEffect cuidará da rolagem
                              }}
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md flex items-center justify-center text-white shadow-sm hover:shadow-md hover:from-blue-700 hover:to-blue-800 transition-all">
                                <ChevronLeft className="h-4 w-4" />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 cursor-not-allowed">
                              <ChevronLeft className="h-4 w-4" />
                            </div>
                          );
                        })()}
                        
                        {/* Botão próximo */}
                        {(() => {
                          const nextLesson = lessonsData?.find(l => l.moduleId === currentLesson?.moduleId && l.id > id);
                          return nextLesson ? (
                            <Link 
                              href={`/videoaulas/${nextLesson.id}`} 
                              className="inline-flex"
                              onClick={(e) => {
                                // Permitir o comportamento padrão do link, o useEffect cuidará da rolagem
                              }}
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md flex items-center justify-center text-white shadow-sm hover:shadow-md hover:from-blue-700 hover:to-blue-800 transition-all">
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 cursor-not-allowed">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Descrição do tutorial */}
                    <p className="text-gray-600 text-sm mb-3">{tutorial.description}</p>
                    
                    {/* Avaliação com estrelas abaixo da descrição */}
                    <div className="mb-3 flex items-center">
                      <div className="mr-2 text-xs text-gray-600">Avalie:</div>
                      <div 
                        className="flex space-x-1" 
                        onMouseLeave={handleLeaveStars}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            className="text-[#434756] focus:outline-none transition-all duration-150"
                            onClick={() => handleRate(star)}
                            onMouseEnter={() => handleHoverStar(star)}
                            aria-label={`Avaliação ${star} estrelas`}
                          >
                            <Star 
                              className={`h-5 w-5 transform hover:scale-110 ${
                                (hoverRating >= star || (!hoverRating && userRating >= star)) 
                                  ? "text-yellow-400 fill-yellow-400" 
                                  : "text-[#434756]"
                              }`} 
                            />
                          </button>
                        ))}
                        {hasRated && (
                          <span className="ml-1 text-xs text-gray-500 self-center">
                            {userRating}/5
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Botões de ação na mesma linha em mobile - distribuídos igualmente */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {!isLocked && (
                        <Button 
                          onClick={handleComplete}
                          variant="outline"
                          size="sm"
                          className={`text-xs px-2 py-1 h-9 ${isCompleted 
                            ? "text-blue-700 border-blue-300 hover:bg-blue-50 transition-all" 
                            : "text-blue-700 border-blue-200 hover:bg-blue-50 transition-all"}`}
                        >
                          {isCompleted ? (
                            <div className="flex items-center">
                              <div className="relative mr-1 flex-shrink-0">
                                <Check className="h-3.5 w-3.5 text-blue-600" />
                                <Check className="h-3.5 w-3.5 text-blue-600 absolute -top-0.5 -left-0.5" />
                              </div>
                              <span>Concluído</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Circle className="mr-1 h-3.5 w-3.5" />
                              <span>Concluir</span>
                            </div>
                          )}
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 py-1 h-9 text-blue-700 border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <Share2 className="mr-1 h-3.5 w-3.5" />
                        <span>Compartilhar</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 py-1 h-9 text-blue-700 border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <Bookmark className="mr-1 h-3.5 w-3.5" />
                        <span>Salvar</span>
                      </Button>
                    </div>
                  </div>

                  {/* Versão Desktop - Layout Original */}
                  <div className="hidden sm:block">
                    <div className="flex justify-between items-center mb-2">
                      <h1 className="text-2xl font-bold text-gray-800">{tutorial.title}</h1>
                      
                      {/* Container para estrelas e setas de navegação */}
                      <div className="flex items-center gap-4">
                        {/* Avaliação com estrelas interativa */}
                        <div 
                          className="flex space-x-1" 
                          onMouseLeave={handleLeaveStars}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star} 
                              className="text-[#434756] focus:outline-none transition-all duration-150"
                              onClick={() => handleRate(star)}
                              onMouseEnter={() => handleHoverStar(star)}
                              aria-label={`Avaliação ${star} estrelas`}
                            >
                              <Star 
                                className={`h-5 w-5 transform hover:scale-110 ${
                                  (hoverRating >= star || (!hoverRating && userRating >= star)) 
                                    ? "text-yellow-400 fill-yellow-400" 
                                    : "text-[#434756]"
                                }`} 
                              />
                            </button>
                          ))}
                          {hasRated && (
                            <span className="ml-1 text-xs text-gray-500 self-center">
                              {userRating}/5
                            </span>
                          )}
                        </div>
                        
                        {/* Setas de navegação */}
                        <div className="flex gap-2">
                          {/* Botão anterior */}
                          {(() => {
                            const prevLesson = lessonsData?.find(l => l.moduleId === currentLesson?.moduleId && l.id < id);
                            return prevLesson ? (
                              <Link 
                                href={`/videoaulas/${prevLesson.id}`} 
                                className="inline-flex"
                                onClick={(e) => {
                                  // Permitir o comportamento padrão do link, o useEffect cuidará da rolagem
                                }}
                              >
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md flex items-center justify-center text-white shadow-sm hover:shadow-md hover:from-blue-700 hover:to-blue-800 transition-all">
                                  <ChevronLeft className="h-5 w-5" />
                                </div>
                              </Link>
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 cursor-not-allowed">
                                <ChevronLeft className="h-5 w-5" />
                              </div>
                            );
                          })()}
                          
                          {/* Botão próximo */}
                          {(() => {
                            const nextLesson = lessonsData?.find(l => l.moduleId === currentLesson?.moduleId && l.id > id);
                            return nextLesson ? (
                              <Link 
                                href={`/videoaulas/${nextLesson.id}`} 
                                className="inline-flex"
                                onClick={(e) => {
                                  // Permitir o comportamento padrão do link, o useEffect cuidará da rolagem
                                }}
                              >
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md flex items-center justify-center text-white shadow-sm hover:shadow-md hover:from-blue-700 hover:to-blue-800 transition-all">
                                  <ChevronRight className="h-5 w-5" />
                                </div>
                              </Link>
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 cursor-not-allowed">
                                <ChevronRight className="h-5 w-5" />
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-5">{tutorial.description}</p>
                    
                    {/* Ações */}
                    <div className="flex flex-wrap gap-3">
                      {!isLocked && (
                        <Button 
                          onClick={handleComplete}
                          variant="outline"
                          className={isCompleted 
                            ? "text-blue-700 border-blue-300 hover:bg-blue-50 transition-all" 
                            : "text-blue-700 border-blue-200 hover:bg-blue-50 transition-all"}
                        >
                          {isCompleted ? (
                            <div className="flex items-center">
                              <div className="relative mr-2 flex-shrink-0">
                                <Check className="h-4 w-4 text-blue-600" />
                                <Check className="h-4 w-4 text-blue-600 absolute -top-0.5 -left-0.5" />
                              </div>
                              <span>Concluído</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Circle className="mr-2 h-4 w-4" />
                              <span>Concluir</span>
                            </div>
                          )}
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="text-blue-700 border-blue-200 hover:bg-blue-50 transition-colors"
                        onClick={shareLesson}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartilhar
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className={`text-blue-700 border-blue-200 hover:bg-blue-50 transition-colors ${isSaved ? 'bg-blue-50' : ''}`}
                        onClick={toggleSaveLesson}
                      >
                        <Bookmark className={`mr-2 h-4 w-4 ${isSaved ? 'fill-blue-600' : ''}`} />
                        {isSaved ? 'Salvo' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              


              {/* Abas de conteúdo adicional - estilo aprimorado */}
              <div className="mt-4 sm:mt-6">
                <Tabs defaultValue={isDesktop ? "comentarios" : "aulas"} className="w-full">
                  <TabsList className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-sm w-full mb-0 h-auto p-1 sm:p-1.5">
                    {isDesktop ? (
                      <>
                        <TabsTrigger 
                          value="comentarios" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-1.5 px-2 sm:px-4 sm:py-2 flex-1 rounded-md"
                        >
                          Comentários
                        </TabsTrigger>
                        <TabsTrigger 
                          value="aulas" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-1.5 px-2 sm:px-4 sm:py-2 flex-1 rounded-md"
                        >
                          Aulas
                        </TabsTrigger>
                        <TabsTrigger 
                          value="materiais" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-1.5 px-2 sm:px-4 sm:py-2 flex-1 rounded-md"
                        >
                          Materiais
                        </TabsTrigger>
                      </>
                    ) : (
                      <>
                        <TabsTrigger 
                          value="aulas" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-1.5 px-2 sm:px-4 sm:py-2 flex-1 rounded-md"
                        >
                          Aulas
                        </TabsTrigger>
                        <TabsTrigger 
                          value="comentarios" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-1.5 px-2 sm:px-4 sm:py-2 flex-1 rounded-md"
                        >
                          Comentários
                        </TabsTrigger>
                        <TabsTrigger 
                          value="materiais" 
                          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm py-1.5 px-2 sm:px-4 sm:py-2 flex-1 rounded-md"
                        >
                          Materiais
                        </TabsTrigger>
                      </>
                    )}
                  </TabsList>
                  
                  <TabsContent value="comentarios" className="mt-3 sm:mt-4 bg-white p-3 sm:p-5 rounded-lg border border-blue-100 shadow-sm">
                    {id ? (
                      <VideoComments lessonId={id} />
                    ) : (
                      <div className="py-6 text-center text-gray-400">
                        <p>Nenhuma aula selecionada</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="materiais" className="mt-3 sm:mt-4 bg-white p-3 sm:p-5 rounded-lg border border-blue-100 shadow-sm">
                    {isLocked ? (
                      <div className="text-center p-4 sm:p-8">
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-100 p-3 sm:p-4 rounded-full shadow-sm inline-flex mb-2 sm:mb-3">
                          <Lock className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-500" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                          Materiais Premium
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4 max-w-md mx-auto">
                          Os materiais deste tutorial estão disponíveis apenas para assinantes premium.
                        </p>
                        <Link href="/planos">
                          <Button 
                            size="sm"
                            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-sm transition-all text-xs sm:text-sm"
                          >
                            Ver Planos de Assinatura
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Materiais de apoio</h3>
                        
                        <div className="border border-blue-100 rounded-md p-3 sm:p-4 hover:bg-blue-50 transition-colors flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-md">
                              <Download className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-gray-800 font-medium text-xs sm:text-sm">Guia de Referência</h4>
                              <p className="text-gray-500 text-[10px] sm:text-xs">PDF • 2.4 MB</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-700 border-blue-200 hover:bg-blue-50 text-xs h-7 px-2 sm:px-3"
                          >
                            Baixar
                          </Button>
                        </div>
                        
                        <div className="border border-blue-100 rounded-md p-3 sm:p-4 hover:bg-blue-50 transition-colors flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="bg-purple-100 p-1.5 sm:p-2 rounded-md">
                              <Download className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="text-gray-800 font-medium text-xs sm:text-sm">Templates</h4>
                              <p className="text-gray-500 text-[10px] sm:text-xs">ZIP • 5.8 MB</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-700 border-blue-200 hover:bg-blue-50 text-xs h-7 px-2 sm:px-3"
                          >
                            Baixar
                          </Button>
                        </div>
                        
                        <div className="border border-blue-100 rounded-md p-3 sm:p-4 hover:bg-blue-50 transition-colors flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="bg-green-100 p-1.5 sm:p-2 rounded-md">
                              <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="text-gray-800 font-medium text-xs sm:text-sm">Link para template Canva</h4>
                              <p className="text-gray-500 text-[10px] sm:text-xs">Link externo • Canva</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-700 border-blue-200 hover:bg-blue-50 text-xs h-7 px-2 sm:px-3"
                          >
                            Abrir link
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="aulas" className="mt-3 sm:mt-4 bg-white p-3 sm:p-5 rounded-lg border border-blue-100 shadow-sm">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Lista de Reprodução</h3>
                    
                    {/* Renderização da lista de módulos e aulas com rolagem vertical */}
                    {(() => {
                      // Calcular progresso para cada módulo
                      const moduleProgress: Record<string, {completed: number, total: number}> = {};
                      
                      moduleData?.forEach(modulo => {
                        const moduleLessons = lessonsData?.filter(lesson => lesson.moduleId === modulo.id) || [];
                        const completedLessons = moduleLessons.filter(lesson => 
                          watchedLessons.includes(lesson.id)
                        ).length;
                        
                        moduleProgress[modulo.id] = {
                          completed: completedLessons,
                          total: moduleLessons.length
                        };
                      });
                      
                      return (
                        <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                          {/* Ordenar e agrupar todas as aulas por módulo */}
                          {moduleData?.map(modulo => {
                            const moduleLessons = lessonsData
                              ?.filter(lesson => lesson.moduleId === modulo.id)
                              .sort((a, b) => a.order - b.order) || [];
                              
                            const progress = moduleProgress[modulo.id] || { completed: 0, total: 0 };
                            const progressPercent = progress.total > 0 
                              ? Math.round((progress.completed / progress.total) * 100) 
                              : 0;
                              
                            const isExpanded = expandedModules.includes(modulo.id);
                            const containsCurrentLesson = currentLesson?.moduleId === modulo.id;
                            
                            return (
                              <div key={modulo.id} className="border border-blue-100 rounded-lg overflow-hidden shadow-sm">
                                {/* Cabeçalho do módulo (clicável) */}
                                <button 
                                  onClick={() => toggleModuleExpansion(modulo.id)}
                                  className={`w-full flex justify-between items-center p-3 sm:p-4 text-left transition-colors ${
                                    containsCurrentLesson 
                                      ? "bg-blue-50 hover:bg-blue-100" 
                                      : "bg-white hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <div className={`flex-shrink-0 mr-3 ${isExpanded ? 'transform rotate-90' : ''} transition-transform`}>
                                      <ChevronRight className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{modulo.title}</h4>
                                      <p className="text-xs text-gray-500">{progress.completed} de {progress.total} aulas concluídas</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                    {modulo.level || 'Iniciante'}
                                  </Badge>
                                </button>
                                
                                {/* Barra de progresso */}
                                <div className="w-full h-1 bg-gray-100">
                                  <div 
                                    className="h-full bg-blue-600 transition-all duration-300" 
                                    style={{ width: `${progressPercent}%` }}
                                  ></div>
                                </div>
                                
                                {/* Aulas do módulo (expansíveis) */}
                                {isExpanded && (
                                  <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 divide-y divide-gray-100">
                                    {moduleLessons.map((aula) => (
                                      <Link 
                                        key={aula.id} 
                                        href={`/videoaulas/${aula.id}`}
                                        className={`flex items-center p-2 sm:p-3 rounded-md transition-colors ${
                                          aula.id === id 
                                            ? "bg-blue-50" 
                                            : "hover:bg-gray-50"
                                        }`}
                                      >
                                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-md overflow-hidden mr-3 sm:mr-4">
                                          <img 
                                            src={aula.thumbnailUrl} 
                                            alt={aula.title} 
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between">
                                            <h4 className={`font-medium text-sm sm:text-base truncate ${
                                              aula.id === id ? "text-blue-700" : "text-gray-800"
                                            }`}>
                                              {aula.title}
                                            </h4>
                                            {watchedLessons.includes(aula.id) && (
                                              <div className="ml-2 sm:ml-3 flex-shrink-0">
                                                <div className="relative flex-shrink-0">
                                                  <Check className="h-4 w-4 text-blue-600" />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <p className="text-xs sm:text-sm text-gray-500 truncate max-w-full">
                                            {formatarDuracao(aula.duration)} • {aula.isPremium ? 'Premium' : 'Gratuito'}
                                          </p>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </div>
              

            </div>
            
            {/* Sidebar com tutoriais relacionados e progresso - estilo clean */}
            <div className="space-y-4 sm:space-y-6">
              {/* Progresso do módulo */}
              <div className="bg-white rounded-lg border border-blue-100 p-3 sm:p-5 shadow-sm">
                <h3 className="text-gray-800 font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
                  <ListChecks className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
                  <span>Progresso do Módulo</span>
                </h3>
                <div className="space-y-2 sm:space-y-2.5">
                  {tutoriaisRelacionados.slice(0, 5).map((t, index) => (
                    <Link 
                      key={t.id}
                      href={`/videoaulas/${t.id}`}
                      className={`${
                        t.id === id 
                          ? 'bg-blue-50 border-blue-400' 
                          : 'border-blue-100 hover:bg-blue-50/50'
                      } border rounded-md p-2 sm:p-3 transition-colors flex items-center justify-between shadow-sm w-full`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`${t.id === id ? 'ring-2 ring-blue-600' : ''} h-10 w-16 sm:h-12 sm:w-20 rounded overflow-hidden flex-shrink-0 transition-all shadow-sm relative`}>
                          <img 
                            src={t.thumbnailUrl} 
                            alt={t.title} 
                            className="w-full h-full object-cover"
                          />
                          {t.isWatched && (
                            <div className="absolute bottom-0.5 right-0.5 bg-green-600 rounded-full h-4 w-4 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                          {t.id === id && (
                            <div className="absolute inset-0 bg-blue-900/20 flex items-center justify-center">
                              <div className="bg-blue-600 h-6 w-6 rounded-full flex items-center justify-center shadow-sm">
                                <Play fill="white" className="h-3.5 w-3.5 text-white ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`${t.id === id ? 'text-blue-700' : 'text-gray-800'} font-medium text-xs sm:text-sm truncate`}>
                            {t.title}
                          </h4>
                          <p className="text-gray-500 text-[10px] sm:text-xs flex items-center">
                            <Clock className="h-2.5 w-2.5 mr-0.5 inline-block" />
                            {formatarDuracao(t.duration)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-xs sm:text-sm">Progresso do módulo</span>
                    <span className="text-blue-700 text-xs sm:text-sm font-medium">2/8</span>
                  </div>
                  <div className="w-full h-2 sm:h-2.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Navegação de módulos dropdown moderno */}
              <div className="bg-white rounded-lg border border-blue-100 p-3 sm:p-5 shadow-sm">
                <h3 className="text-gray-800 font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
                  <Layers className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
                  <span>Módulos do Curso</span>
                </h3>

                <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-1 custom-scrollbar">
                  {moduleData && moduleData.map((modulo) => {
                    const moduleLessons = lessonsData?.filter(l => l.moduleId === modulo.id) || [];
                    const watchedCount = moduleLessons.filter(l => watchedLessons.includes(l.id)).length;
                    const progressPercent = moduleLessons.length > 0 
                      ? (watchedCount / moduleLessons.length) * 100 
                      : 0;
                    
                    // Estado de expansão para este módulo específico
                    const isExpanded = expandedModules.includes(modulo.id);
                    
                    return (
                      <div key={modulo.id} className="border border-blue-100 rounded-md overflow-hidden shadow-sm">
                        {/* Cabeçalho do módulo (clicável) */}
                        <button 
                          className="w-full flex justify-between items-center px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all"
                          onClick={() => toggleModuleExpansion(modulo.id)}
                        >
                          <div className="flex items-center gap-2 text-left">
                            <div className="bg-blue-500 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs sm:text-sm font-medium">{modulo.id}</span>
                            </div>
                            <div>
                              <h4 className="text-gray-800 text-xs sm:text-sm font-medium">{modulo.title}</h4>
                              <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
                                {watchedCount}/{moduleLessons.length} aulas • {Math.round(progressPercent)}% concluído
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              {modulo.level || 'Iniciante'}
                            </Badge>
                            <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-blue-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        {/* Barra de progresso */}
                        <div className="w-full h-1 bg-gray-100">
                          <div 
                            className="h-full bg-blue-600 transition-all duration-300" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        
                        {/* Aulas do módulo (expansíveis) */}
                        {isExpanded && (
                          <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 divide-y divide-gray-100">
                            {moduleLessons.map((aula) => (
                              <Link 
                                key={aula.id} 
                                href={`/videoaulas/${aula.id}`}
                                className={`flex items-center p-2 sm:p-3 rounded-md transition-colors ${
                                  aula.id === id 
                                    ? "bg-blue-50" 
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-md overflow-hidden mr-3 sm:mr-4 relative">
                                  <img 
                                    src={aula.thumbnailUrl} 
                                    alt={aula.title} 
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  {watchedLessons.includes(aula.id) && (
                                    <div className="absolute bottom-0.5 right-0.5 bg-green-600 rounded-full h-4 w-4 flex items-center justify-center">
                                      <Check className="h-2.5 w-2.5 text-white" />
                                    </div>
                                  )}
                                  {aula.id === id && (
                                    <div className="absolute inset-0 bg-blue-900/20 flex items-center justify-center">
                                      <div className="bg-blue-600 h-6 w-6 rounded-full flex items-center justify-center shadow-sm">
                                        <Play fill="white" className="h-3.5 w-3.5 text-white ml-0.5" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`${aula.id === id ? "text-blue-700" : "text-gray-800"} text-xs sm:text-sm font-medium line-clamp-2`}>
                                    {aula.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-gray-500 text-[10px] sm:text-xs flex items-center">
                                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 inline-block" />
                                      {formatarDuracao(aula.duration)}
                                    </span>
                                    {aula.isPremium && (
                                      <span className="bg-amber-100 text-amber-700 text-[8px] sm:text-[10px] px-1 py-0.5 rounded">
                                        PREMIUM
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Espaço adicional no final da seção (substituindo os botões de navegação) */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-100">
                  {/* Botões de navegação removidos conforme solicitado */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoLessonPage;