import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
// Helmet comentado temporariamente para evitar erros
// import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronLeft, 
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
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
// import { 
//   Tooltip, 
//   TooltipContent, 
//   TooltipProvider, 
//   TooltipTrigger 
// } from "@/components/ui/tooltip";
import { Tutorial } from "@/components/videoaulas/TutorialData";

// Importar os dados simulados
import { tutoriais, tutoriaisPopulares } from "@/components/videoaulas/TutorialData";

// Componente para player de vídeo personalizado
const VideoPlayer: React.FC<{ videoUrl: string; thumbnailUrl: string }> = ({ videoUrl, thumbnailUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Atualizar o progresso do vídeo
  const updateProgress = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / duration) * 100);
    }
  };

  // Formatar tempo (segundos para MM:SS)
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Manipuladores de eventos
  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const volume = parseFloat(e.target.value);
      videoRef.current.volume = volume;
      if (volume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && playerContainerRef.current) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.log(`Erro ao tentar entrar em tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };
      
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', updateProgress);
      document.addEventListener('fullscreenchange', handleFullscreenChange);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', updateProgress);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, []);

  return (
    <div 
      ref={playerContainerRef}
      className="relative rounded-md sm:rounded-lg overflow-hidden bg-black w-full aspect-video" 
    >
      {/* Vídeo */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={thumbnailUrl}
        src={videoUrl}
        onClick={handlePlay}
      />

      {/* Overlay de controles */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
        {/* Botão de play central */}
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={handlePlay}>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-4">
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
            ) : (
              <Play className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="white" />
            )}
          </div>
        </div>
        
        {/* Controles inferiores */}
        <div className="p-2 sm:p-3 flex flex-col gap-1 sm:gap-2">
          {/* Barra de progresso */}
          <div 
            className="w-full h-1.5 sm:h-2 bg-white/20 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Controles e tempo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play/Pause */}
              <button onClick={handlePlay} className="text-white hover:text-blue-400 transition-colors">
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
                )}
              </button>
              
              {/* Mute/Unmute */}
              <button onClick={handleMute} className="text-white hover:text-blue-400 transition-colors">
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              
              {/* Volume slider - escondido em telas muito pequenas */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="1"
                onChange={handleVolumeChange}
                className="hidden xs:block w-12 sm:w-16 md:w-24 accent-blue-500"
              />
              
              {/* Tempo */}
              <div className="text-white text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoLessonPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const { user } = useAuth();
  const isPremiumUser = user && (user.nivelacesso === 'premium' || user.nivelacesso === 'admin');
  const [, navigate] = useLocation();
  const [watchedLessons, setWatchedLessons] = useState<number[]>(() => {
    // Recuperar aulas assistidas do localStorage
    const saved = localStorage.getItem('watchedLessons');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estado para controlar se a aula atual está concluída
  const isCompleted = watchedLessons.includes(id);
  
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

  // Encontrar o tutorial pelo ID
  const tutorial = tutoriais.find(t => t.id === id);
  const tutoriaisRelacionados = tutoriaisPopulares.filter(t => t.id !== id).slice(0, 4);

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
        if (id < tutoriais.length) {
          navigate(`/videoaulas/${id + 1}`);
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
        {/* Cabeçalho com navegação - estilo clean, sem breadcrumbs */}
        <div className="bg-gradient-to-r from-blue-50 to-white py-4 border-b border-blue-100 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <Button 
                  variant="ghost" 
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-50 -ml-3 transition-colors"
                  onClick={() => navigate("/videoaulas")}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar para Videoaulas
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {tutorial.isPremium && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-sm font-medium px-3 py-1">
                    <Lock className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                
                <Badge className="bg-blue-600 text-white border-0 shadow-sm font-medium px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {tutorial.duration}
                </Badge>
                
                {tutorial.isWatched ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium px-3 py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Assistido
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium px-3 py-1">
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Em andamento
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Barra de progresso - estilo sofisticado e minimalista */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden shadow-inner relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-sm transition-all duration-500 ease-out"
                  style={{ width: `${tutorial.progress || 15}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-700 font-medium">{tutorial.progress || 15}%</div>
            </div>
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
                    <div className="absolute inset-0 bg-blue-900/10"></div>
                    <div className="text-center z-10 p-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-100 p-4 rounded-full shadow-sm">
                          <Lock className="h-12 w-12 text-yellow-500" />
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
                        <Button className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-sm transition-all">
                          Ver Planos de Assinatura
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <VideoPlayer 
                    videoUrl={tutorial.videoUrl} 
                    thumbnailUrl={tutorial.thumbnailUrl} 
                  />
                )}
                
                {/* Informações do tutorial - layout responsivo */}
                <div className="p-4 sm:p-5">
                  {/* Versão Mobile - Layout Otimizado */}
                  <div className="block sm:hidden">
                    {/* Cabeçalho com título e botões de navegação */}
                    <div className="flex justify-between items-start mb-2">
                      <h1 className="text-xl font-bold text-gray-800 pr-3">{tutorial.title}</h1>
                      
                      {/* Botões de navegação mobile - agora ao lado do título */}
                      <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                        {/* Botão anterior */}
                        {id > 1 ? (
                          <Link href={`/videoaulas/${id - 1}`} className="inline-flex">
                            <div className="w-8 h-8 bg-[#434756] rounded-md flex items-center justify-center text-white hover:bg-[#5a5f73] transition-colors">
                              <ChevronLeft className="h-4 w-4" />
                            </div>
                          </Link>
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-md flex items-center justify-center text-white cursor-not-allowed">
                            <ChevronLeft className="h-4 w-4" />
                          </div>
                        )}
                        
                        {/* Botão próximo */}
                        {id < tutoriais.length ? (
                          <Link href={`/videoaulas/${id + 1}`} className="inline-flex">
                            <div className="w-8 h-8 bg-[#434756] rounded-md flex items-center justify-center text-white hover:bg-[#5a5f73] transition-colors">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </Link>
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-md flex items-center justify-center text-white cursor-not-allowed">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        )}
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
                          {id > 1 ? (
                            <Link href={`/videoaulas/${id - 1}`} className="inline-flex">
                              <div className="w-10 h-10 bg-[#434756] rounded-md flex items-center justify-center text-white hover:bg-[#5a5f73] transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-md flex items-center justify-center text-white cursor-not-allowed">
                              <ChevronLeft className="h-5 w-5" />
                            </div>
                          )}
                          
                          {/* Botão próximo */}
                          {id < tutoriais.length ? (
                            <Link href={`/videoaulas/${id + 1}`} className="inline-flex">
                              <div className="w-10 h-10 bg-[#434756] rounded-md flex items-center justify-center text-white hover:bg-[#5a5f73] transition-colors">
                                <ChevronRight className="h-5 w-5" />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-md flex items-center justify-center text-white cursor-not-allowed">
                              <ChevronRight className="h-5 w-5" />
                            </div>
                          )}
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
                      
                      <Button variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50 transition-colors">
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartilhar
                      </Button>
                      
                      <Button variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50 transition-colors">
                        <Bookmark className="mr-2 h-4 w-4" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Abas de conteúdo adicional - estilo clean */}
              <div className="mt-4 sm:mt-6">
                <Tabs defaultValue="comentarios" className="w-full">
                  <TabsList className="bg-white border border-blue-100 rounded-md shadow-sm w-full mb-0 h-auto p-0.5 sm:p-1">
                    <TabsTrigger 
                      value="comentarios" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors text-xs sm:text-sm py-1 px-2 sm:px-3 sm:py-1.5 flex-1"
                    >
                      Comentários
                    </TabsTrigger>
                    <TabsTrigger 
                      value="materiais" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors text-xs sm:text-sm py-1 px-2 sm:px-3 sm:py-1.5 flex-1"
                    >
                      Materiais
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notas" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors text-xs sm:text-sm py-1 px-2 sm:px-3 sm:py-1.5 flex-1"
                    >
                      Notas
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comentarios" className="mt-3 sm:mt-4 bg-white p-3 sm:p-5 rounded-lg border border-blue-100 shadow-sm">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Comentários</h3>
                    {user ? (
                      <div>
                        <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-5">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 overflow-hidden flex-shrink-0">
                            {user.profileimageurl ? (
                              <img 
                                src={user.profileimageurl} 
                                alt={user.name || user.username} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-blue-200 text-blue-600 font-bold text-xs sm:text-base">
                                {(user.name?.[0] || user.username[0]).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <textarea 
                              className="w-full p-2 sm:p-3 bg-white border border-blue-200 text-gray-700 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm text-xs sm:text-sm"
                              placeholder="Deixe seu comentário sobre este tutorial..."
                              rows={3}
                            ></textarea>
                            <div className="flex justify-end mt-2">
                              <Button 
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 shadow-sm text-xs sm:text-sm px-3 sm:px-4"
                              >
                                Comentar
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8">
                          <h4 className="text-gray-500 text-xs sm:text-sm font-medium border-b border-gray-100 pb-2">Todos os comentários (3)</h4>
                          
                          {/* Comentário exemplo 1 */}
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0">
                              <div className="w-full h-full flex items-center justify-center bg-indigo-200 text-indigo-600 font-bold text-[10px] sm:text-xs">
                                M
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <h5 className="font-medium text-gray-800 text-xs sm:text-sm">Maria Silva</h5>
                                <span className="text-gray-400 text-[10px] sm:text-xs">2 dias atrás</span>
                              </div>
                              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                Ótimo tutorial! Estou aplicando essas técnicas nos anúncios da minha oficina e já notei um aumento nas conversões.
                              </p>
                              <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-2">
                                <button className="text-[10px] sm:text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                                  <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span>12</span>
                                </button>
                                <button className="text-[10px] sm:text-xs text-gray-500 hover:text-blue-600">
                                  Responder
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Comentário exemplo 2 */}
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 overflow-hidden flex-shrink-0">
                              <div className="w-full h-full flex items-center justify-center bg-green-200 text-green-600 font-bold text-[10px] sm:text-xs">
                                J
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <h5 className="font-medium text-gray-800 text-xs sm:text-sm">João Costa</h5>
                                <span className="text-gray-400 text-[10px] sm:text-xs">5 dias atrás</span>
                              </div>
                              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                Você poderia fazer um tutorial específico sobre posts para Instagram? Tenho dificuldade em adaptar os designs para o formato do Stories.
                              </p>
                              <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-2">
                                <button className="text-[10px] sm:text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                                  <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span>8</span>
                                </button>
                                <button className="text-[10px] sm:text-xs text-gray-500 hover:text-blue-600">
                                  Responder
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Comentário exemplo 3 */}
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-100 overflow-hidden flex-shrink-0">
                              <div className="w-full h-full flex items-center justify-center bg-amber-200 text-amber-600 font-bold text-[10px] sm:text-xs">
                                C
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <h5 className="font-medium text-gray-800 text-xs sm:text-sm">Carlos Mendes</h5>
                                <span className="text-gray-400 text-[10px] sm:text-xs">1 semana atrás</span>
                              </div>
                              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                Consegui aplicar as dicas de tipografia em todos os meus designs. Os resultados foram impressionantes! Obrigado pelo conteúdo de qualidade.
                              </p>
                              <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-2">
                                <button className="text-[10px] sm:text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                                  <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span>15</span>
                                </button>
                                <button className="text-[10px] sm:text-xs text-gray-500 hover:text-blue-600">
                                  Responder
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-md">
                        <p className="text-gray-700 text-sm mb-3">
                          Faça login para ver e adicionar comentários.
                        </p>
                        <Link href="/auth">
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 shadow-sm text-xs sm:text-sm"
                          >
                            Entrar
                          </Button>
                        </Link>
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
                  
                  <TabsContent value="notas" className="mt-3 sm:mt-4 bg-white p-3 sm:p-5 rounded-lg border border-blue-100 shadow-sm">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Minhas anotações</h3>
                    {user ? (
                      <div>
                        <textarea 
                          className="w-full min-h-[150px] sm:min-h-[200px] p-3 sm:p-4 bg-white border border-blue-200 text-gray-700 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm text-xs sm:text-sm"
                          placeholder="Faça suas anotações sobre este tutorial aqui..."
                        ></textarea>
                        <div className="flex justify-end mt-3">
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 shadow-sm text-xs sm:text-sm"
                          >
                            Salvar notas
                          </Button>
                        </div>
                        
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                          <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-2">Dicas para anotações:</h4>
                          <ul className="list-disc pl-4 sm:pl-5 text-gray-600 space-y-1 text-xs sm:text-sm">
                            <li>Anote os pontos principais com suas próprias palavras</li>
                            <li>Registre dúvidas para pesquisar mais tarde</li>
                            <li>Adicione exemplos relacionados à sua área</li>
                            <li>Crie uma lista para implementar o aprendizado</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-md">
                        <p className="text-gray-700 text-xs sm:text-sm mb-3">
                          Faça login para adicionar notas a este tutorial.
                        </p>
                        <Link href="/auth">
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 shadow-sm text-xs sm:text-sm"
                          >
                            Entrar
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Navegação entre aulas (estilo minimalista com botões circulares) */}
              <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-3 sm:pt-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
                    <span className="text-gray-500 text-xs sm:text-sm">{tutorial.id}/10</span>
                    <h3 className="text-gray-800 font-medium text-xs sm:text-sm truncate">
                      {tutorial.title}
                    </h3>
                  </div>
                  
                  <div className="flex gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
                    {/* Botão anterior - sempre visível, desabilitado se for a primeira aula */}
                    {id > 1 ? (
                      <Link href={`/videoaulas/${id - 1}`} className="inline-flex">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#434756] rounded-full flex items-center justify-center text-white hover:bg-[#5a5f73] transition-colors">
                          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      </Link>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center text-white cursor-not-allowed">
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    )}
                    
                    {/* Botão próximo - sempre visível, desabilitado se for a última aula */}
                    {id < tutoriais.length ? (
                      <Link href={`/videoaulas/${id + 1}`} className="inline-flex">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#434756] rounded-full flex items-center justify-center text-white hover:bg-[#5a5f73] transition-colors">
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      </Link>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center text-white cursor-not-allowed">
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    )}
                  </div>
                </div>
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
                    <div 
                      key={t.id}
                      className={`${
                        t.id === id 
                          ? 'bg-blue-50 border-blue-400' 
                          : 'border-blue-100 hover:bg-blue-50/50'
                      } border rounded-md p-2 sm:p-3 transition-colors flex items-center justify-between shadow-sm`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`${t.id === id ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'} h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium transition-colors shadow-sm`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`${t.id === id ? 'text-blue-700' : 'text-gray-800'} font-medium text-xs sm:text-sm truncate`}>
                            {t.title}
                          </h4>
                          <p className="text-gray-500 text-[10px] sm:text-xs">{t.duration}</p>
                        </div>
                      </div>
                      
                      {t.id === id ? (
                        <div className="bg-blue-600 h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Play fill="white" className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white ml-0.5" />
                        </div>
                      ) : t.isWatched ? (
                        <div className="bg-green-100 h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                        </div>
                      ) : (
                        <Link href={`/videoaulas/${t.id}`} className="flex">
                          <div className="bg-blue-100 hover:bg-blue-200 h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors shadow-sm">
                            <Play fill="#2563EB" className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 ml-0.5" />
                          </div>
                        </Link>
                      )}
                    </div>
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
              
              {/* Tutoriais relacionados - estilo minimalista */}
              <div className="bg-white rounded-lg border border-blue-100 p-3 sm:p-5 shadow-sm">
                <h3 className="text-gray-800 font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
                  <span>Tutoriais Relacionados</span>
                </h3>
                
                {/* Mesma série */}
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3 flex items-center">
                    <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-blue-500" />
                    <span>Mesma série</span>
                  </h4>
                  <div className="space-y-2 sm:space-y-2.5">
                    {tutoriaisRelacionados.slice(0, 2).map((t) => (
                      <Link key={t.id} href={`/videoaulas/${t.id}`}>
                        <div className="group flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-blue-50 rounded-md transition-colors cursor-pointer">
                          {/* Thumbnail pequena melhorada */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden shadow-sm">
                            <img 
                              src={t.thumbnailUrl} 
                              alt={t.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            
                            {/* Indicador de Play hover */}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="white" />
                            </div>
                            
                            {/* Indicadores de status */}
                            {t.isWatched && (
                              <div className="absolute bottom-1 right-1 bg-green-500 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-white flex items-center justify-center">
                                <CheckCircle2 className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" />
                              </div>
                            )}
                            {t.isPremium && !t.isWatched && (
                              <div className="absolute bottom-1 right-1 bg-yellow-500 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-white flex items-center justify-center">
                                <Lock className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Informações */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-gray-800 text-xs sm:text-sm font-medium group-hover:text-blue-700 transition-colors line-clamp-2">
                              {t.title}
                            </h4>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                              <span className="text-gray-500 text-[10px] sm:text-xs flex items-center">
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 inline-block" />
                                {t.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Recomendados para você */}
                <div className="pt-2 sm:pt-3 border-t border-blue-100">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3 flex items-center">
                    <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-blue-500" />
                    <span>Recomendados para você</span>
                  </h4>
                  <div className="space-y-2 sm:space-y-2.5">
                    {tutoriaisRelacionados.slice(2, 5).map((t) => (
                      <Link key={t.id} href={`/videoaulas/${t.id}`}>
                        <div className="group flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-blue-50 rounded-md transition-colors cursor-pointer">
                          {/* Thumbnail pequena */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden shadow-sm">
                            <img 
                              src={t.thumbnailUrl} 
                              alt={t.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            
                            {/* Indicador de Play hover */}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="white" />
                            </div>
                            
                            {/* Indicadores de status */}
                            {t.isWatched && (
                              <div className="absolute bottom-1 right-1 bg-green-500 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-white flex items-center justify-center">
                                <CheckCircle2 className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" />
                              </div>
                            )}
                            {t.isPremium && !t.isWatched && (
                              <div className="absolute bottom-1 right-1 bg-yellow-500 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-white flex items-center justify-center">
                                <Lock className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Informações */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-gray-800 text-xs sm:text-sm font-medium group-hover:text-blue-700 transition-colors line-clamp-2">
                              {t.title}
                            </h4>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                              <span className="text-gray-500 text-[10px] sm:text-xs flex items-center">
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 inline-block" />
                                {t.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                
                {/* Navegação de tutoriais (anterior/próximo) */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-100">
                  <div className="flex gap-2 sm:gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 text-blue-700 border-blue-200 hover:bg-blue-50 shadow-sm text-xs sm:text-sm h-8 sm:h-10"
                      onClick={() => {
                        // Navegar para o tutorial anterior (simulado)
                        // Na implementação real, usaria id - 1 ou encontraria o tutorial anterior baseado em ordem
                        const prevId = Math.max(1, id - 1);
                        navigate(`/videoaulas/${prevId}`);
                      }}
                    >
                      <ChevronLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Tutorial</span> Anterior
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 text-blue-700 border-blue-200 hover:bg-blue-50 shadow-sm text-xs sm:text-sm h-8 sm:h-10"
                      onClick={() => {
                        // Navegar para o próximo tutorial (simulado)
                        // Na implementação real, usaria id + 1 ou encontraria o próximo tutorial baseado em ordem
                        const nextId = Math.min(tutoriais.length, id + 1);
                        navigate(`/videoaulas/${nextId}`);
                      }}
                    >
                      <span className="hidden xs:inline">Próximo</span> Tutorial
                      <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-2 sm:mt-3 text-blue-700 border-blue-200 hover:bg-blue-50 shadow-sm text-xs sm:text-sm h-8 sm:h-10"
                    onClick={() => navigate("/videoaulas")}
                  >
                    Ver todos os tutoriais
                    <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
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