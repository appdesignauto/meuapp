import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
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
  Lock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
      className="relative rounded-md overflow-hidden bg-black w-full aspect-video" 
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
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white" fill="white" />
            )}
          </div>
        </div>
        
        {/* Controles inferiores */}
        <div className="p-3 flex flex-col gap-2">
          {/* Barra de progresso */}
          <div 
            className="w-full h-2 bg-white/20 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Controles e tempo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button onClick={handlePlay} className="text-white hover:text-blue-400 transition-colors">
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" fill="currentColor" />
                )}
              </button>
              
              {/* Mute/Unmute */}
              <button onClick={handleMute} className="text-white hover:text-blue-400 transition-colors">
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              
              {/* Volume slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="1"
                onChange={handleVolumeChange}
                className="w-16 md:w-24 accent-blue-500"
              />
              
              {/* Tempo */}
              <div className="text-white text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
              <Maximize className="w-5 h-5" />
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

  // Encontrar o tutorial pelo ID
  const tutorial = tutoriais.find(t => t.id === id);
  const tutoriaisRelacionados = tutoriaisPopulares.filter(t => t.id !== id).slice(0, 4);

  // Função para verificar se o conteúdo premium deve ser bloqueado
  const isPremiumLocked = (isPremium: boolean) => {
    if (!isPremium) return false;
    return !isPremiumUser;
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
      <Helmet>
        <title>{tutorial.title} | DesignAuto Videoaulas</title>
        <meta name="description" content={tutorial.description} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-950 pb-12">
        {/* Cabeçalho com navegação e título */}
        <div className="bg-gray-900 py-4 border-b border-gray-800">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-white hover:bg-gray-800 -ml-3"
                onClick={() => navigate("/videoaulas")}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Voltar para Videoaulas
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {tutorial.isPremium && (
                <Badge className="bg-yellow-600 text-white border-0">
                  <Lock className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
              
              <Badge className="bg-blue-600 text-white border-0">
                <Clock className="h-3 w-3 mr-1" />
                {tutorial.duration}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Conteúdo principal em duas colunas */}
        <div className="container mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna do vídeo e detalhes */}
            <div className="lg:col-span-2">
              {/* Player de vídeo */}
              <div className="rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
                {isLocked ? (
                  <div className="aspect-video relative flex items-center justify-center bg-gray-900">
                    <img 
                      src={tutorial.thumbnailUrl} 
                      alt={tutorial.title} 
                      className="w-full h-full object-cover opacity-20 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-black/70"></div>
                    <div className="text-center z-10 p-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-yellow-600/20 p-4 rounded-full">
                          <Lock className="h-12 w-12 text-yellow-500" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Conteúdo Premium
                      </h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Este tutorial está disponível apenas para assinantes do plano premium.
                        Assine agora para desbloquear este e todos os outros conteúdos exclusivos.
                      </p>
                      <Link href="/planos">
                        <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
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
                
                {/* Informações do tutorial */}
                <div className="p-5">
                  <h1 className="text-2xl font-bold text-white mb-2">{tutorial.title}</h1>
                  <p className="text-gray-400 mb-4">{tutorial.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {tutorial.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Ações */}
                  <div className="flex flex-wrap gap-3">
                    {!isLocked && (
                      <Button variant="outline" className="text-gray-300 border-gray-700 hover:bg-gray-800">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar materiais
                      </Button>
                    )}
                    
                    <Button variant="outline" className="text-gray-300 border-gray-700 hover:bg-gray-800">
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                    
                    <Button variant="outline" className="text-gray-300 border-gray-700 hover:bg-gray-800">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Abas de conteúdo adicional */}
              <div className="mt-6">
                <Tabs defaultValue="conteudo" className="w-full">
                  <TabsList className="bg-gray-900 border border-gray-800">
                    <TabsTrigger 
                      value="conteudo" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Conteúdo
                    </TabsTrigger>
                    <TabsTrigger 
                      value="materiais" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Materiais
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notas" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      Minhas Notas
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="conteudo" className="mt-4 bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-3">O que você vai aprender</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300">Técnicas avançadas de design para o setor automotivo</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300">Como escolher as cores e tipografia corretas para seus anúncios</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300">Estratégias comprovadas para aumentar o engajamento nas redes sociais</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-300">Como criar fluxos de trabalho eficientes para produção rápida</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="materiais" className="mt-4 bg-gray-900 p-4 rounded-lg border border-gray-800">
                    {isLocked ? (
                      <div className="text-center p-8">
                        <Lock className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-white mb-2">
                          Materiais Premium
                        </h3>
                        <p className="text-gray-400 mb-4 max-w-md mx-auto">
                          Os materiais deste tutorial estão disponíveis apenas para assinantes premium.
                        </p>
                        <Link href="/planos">
                          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            Ver Planos de Assinatura
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-3">Materiais de apoio</h3>
                        
                        <div className="border border-gray-800 rounded-md p-3 hover:bg-gray-800/50 transition-colors flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-900/50 p-2 rounded">
                              <Download className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-medium">Guia de Referência</h4>
                              <p className="text-gray-400 text-sm">PDF • 2.4 MB</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/50">
                            Baixar
                          </Button>
                        </div>
                        
                        <div className="border border-gray-800 rounded-md p-3 hover:bg-gray-800/50 transition-colors flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-900/50 p-2 rounded">
                              <Download className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-medium">Templates</h4>
                              <p className="text-gray-400 text-sm">ZIP • 5.8 MB</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/50">
                            Baixar
                          </Button>
                        </div>
                        
                        <div className="border border-gray-800 rounded-md p-3 hover:bg-gray-800/50 transition-colors flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-900/50 p-2 rounded">
                              <ExternalLink className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-medium">Link para template Canva</h4>
                              <p className="text-gray-400 text-sm">Link externo • Canva</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/50">
                            Abrir link
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="notas" className="mt-4 bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-3">Minhas anotações</h3>
                    {user ? (
                      <div>
                        <textarea 
                          className="w-full h-40 p-3 bg-gray-800 border border-gray-700 text-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Faça suas anotações sobre este tutorial aqui..."
                        ></textarea>
                        <div className="flex justify-end mt-3">
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Salvar notas
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-gray-400 mb-3">
                          Faça login para adicionar notas a este tutorial.
                        </p>
                        <Link href="/auth">
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Entrar
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Sidebar com tutoriais relacionados e progresso */}
            <div className="space-y-6">
              {/* Progresso do módulo */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                  <ListChecks className="h-5 w-5 mr-2 text-blue-400" />
                  Progresso do Módulo
                </h3>
                <div className="space-y-3">
                  {tutoriaisRelacionados.slice(0, 5).map((t, index) => (
                    <div 
                      key={t.id}
                      className={`${
                        t.id === id 
                          ? 'bg-blue-900/40 border-blue-500' 
                          : 'border-gray-800 hover:bg-gray-800/50'
                      } border rounded-md p-3 transition-colors flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-800 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-300">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">
                            {t.title}
                          </h4>
                          <p className="text-gray-400 text-xs">{t.duration}</p>
                        </div>
                      </div>
                      
                      {t.id === id ? (
                        <div className="bg-blue-600 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                          <Play fill="white" className="h-3.5 w-3.5 text-white ml-0.5" />
                        </div>
                      ) : t.isWatched ? (
                        <div className="bg-green-500/20 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        </div>
                      ) : (
                        <Link href={`/videoaulas/${t.id}`} className="flex">
                          <div className="bg-gray-800 hover:bg-gray-700 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                            <Play fill="white" className="h-3.5 w-3.5 text-white ml-0.5" />
                          </div>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Progresso do módulo</span>
                    <span className="text-white text-sm font-medium">2/8</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Tutoriais relacionados */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                <h3 className="text-white font-bold text-lg mb-3">
                  Tutoriais Relacionados
                </h3>
                <div className="space-y-3">
                  {tutoriaisRelacionados.map((t) => (
                    <Link key={t.id} href={`/videoaulas/${t.id}`}>
                      <div className="group border border-gray-800 hover:border-gray-700 rounded-md overflow-hidden transition-colors cursor-pointer">
                        {/* Thumbnail */}
                        <div className="relative aspect-video">
                          <img 
                            src={t.thumbnailUrl} 
                            alt={t.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Overlay gradiente */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          
                          {/* Duração */}
                          <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                            {t.duration}
                          </div>
                          
                          {/* Status (assistido/premium) */}
                          {t.isWatched && (
                            <div className="absolute top-2 left-2 text-xs bg-green-500/90 text-white px-1.5 py-0.5 rounded-sm flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Assistido
                            </div>
                          )}
                          
                          {t.isPremium && !t.isWatched && (
                            <div className="absolute top-2 left-2 text-xs bg-yellow-600/90 text-white px-1.5 py-0.5 rounded-sm flex items-center">
                              <Lock className="h-3 w-3 mr-1" />
                              Premium
                            </div>
                          )}
                          
                          {/* Play button no centro */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                              <Play className="h-6 w-6 text-white" fill="white" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Título */}
                        <div className="p-2">
                          <h4 className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors line-clamp-2">
                            {t.title}
                          </h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full text-gray-300 border-gray-700 hover:bg-gray-800"
                    onClick={() => navigate("/videoaulas")}
                  >
                    Ver todos os tutoriais
                    <ChevronRight className="ml-2 h-4 w-4" />
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