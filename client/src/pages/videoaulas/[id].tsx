import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Maximize,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  CheckCircle,
  Lock,
  MessageSquare,
  FileText,
  ThumbsUp,
  Bookmark,
  Share2,
  Crown,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Tipos que serão usados na página
interface Lesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  videoProvider: string;
  duration: number;
  order: number;
  isPremium: boolean;
  thumbnailUrl?: string;
  additionalMaterialsUrl?: string;
  watched?: boolean;
  moduleId: number;
}

interface Module {
  id: number;
  title: string;
  description: string;
  level: string;
  lessons: Lesson[];
}

// Componente principal
export default function VideoLessonPage() {
  const { id } = useParams<{ id: string }>();
  const lessonId = parseInt(id);
  const { user } = useAuth();
  const isPremiumUser = user && (user.nivelacesso === 'premium' || user.nivelacesso === 'admin');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Estado do vídeo
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Estados da UI
  const [activeTab, setActiveTab] = useState('informacoes');
  const [noteContent, setNoteContent] = useState('');
  const [showFullScreen, setShowFullScreen] = useState(false);
  
  // Carregar dados da aula e módulo
  const { data: lesson, isLoading: isLessonLoading } = useQuery({
    queryKey: [`/api/videoaulas/aula/${lessonId}`],
    enabled: !!lessonId
  });
  
  const { data: module, isLoading: isModuleLoading } = useQuery({
    queryKey: ['/api/videoaulas/modulo', lesson?.moduleId],
    enabled: !!lesson?.moduleId
  });
  
  // Carregar progresso do curso
  const { data: courseProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['/api/videoaulas/progresso', lesson?.moduleId],
    enabled: !!lesson?.moduleId && !!user
  });
  
  // Verificar se o conteúdo é premium e bloqueado
  const isPremiumLocked = lesson?.isPremium && !isPremiumUser;
  
  // Funções de controle do vídeo
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const videoDuration = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(videoDuration);
      setProgress((current / videoDuration) * 100);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setProgress(seekTime);
    if (videoRef.current) {
      const newTime = (seekTime / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Atualizar visualização
  useEffect(() => {
    if (lesson && user) {
      const markAsViewed = async () => {
        try {
          await fetch(`/api/videoaulas/visualizacao/${lessonId}`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error("Erro ao marcar aula como visualizada", error);
        }
      };
      
      markAsViewed();
    }
  }, [lesson, user, lessonId]);
  
  // Verificar se a aula está acessível
  useEffect(() => {
    if (lesson && isPremiumLocked) {
      toast({
        title: "Conteúdo Premium",
        description: "Esta aula é exclusiva para assinantes. Faça upgrade para acessar.",
        variant: "warning"
      });
    }
  }, [lesson, isPremiumLocked, toast]);
  
  const saveNote = () => {
    if (noteContent.trim() === '') {
      toast({
        title: "Anotação vazia",
        description: "Por favor, escreva algo antes de salvar.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Anotação salva",
      description: "Sua anotação foi salva com sucesso.",
      variant: "default"
    });
    
    // Aqui viria a lógica para salvar no servidor
    setNoteContent('');
  };
  
  // Função para navegar para a próxima aula
  const goToNextLesson = () => {
    if (!module || !lesson) return;
    
    const currentIndex = module.lessons.findIndex(l => l.id === lesson.id);
    if (currentIndex < module.lessons.length - 1) {
      const nextLesson = module.lessons[currentIndex + 1];
      navigate(`/videoaulas/${nextLesson.id}`);
    }
  };
  
  // Função para navegar para a aula anterior
  const goToPrevLesson = () => {
    if (!module || !lesson) return;
    
    const currentIndex = module.lessons.findIndex(l => l.id === lesson.id);
    if (currentIndex > 0) {
      const prevLesson = module.lessons[currentIndex - 1];
      navigate(`/videoaulas/${prevLesson.id}`);
    }
  };
  
  // Carregar conteúdo de placeholder enquanto os dados não chegaram
  if (isLessonLoading || isModuleLoading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white">
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <ChevronLeft className="mr-2" />
            <Skeleton className="h-6 w-40 bg-gray-700" />
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/3">
              <Skeleton className="h-[400px] w-full bg-gray-800 rounded-lg mb-4" />
              <Skeleton className="h-8 w-3/4 bg-gray-700 mb-2" />
              <Skeleton className="h-4 w-1/2 bg-gray-700 mb-6" />
              
              <div className="flex space-x-4 mb-6">
                <Skeleton className="h-10 w-20 bg-gray-700 rounded-md" />
                <Skeleton className="h-10 w-20 bg-gray-700 rounded-md" />
                <Skeleton className="h-10 w-20 bg-gray-700 rounded-md" />
              </div>
              
              <Skeleton className="h-40 w-full bg-gray-800 rounded-lg" />
            </div>
            
            <div className="w-full md:w-1/3">
              <Skeleton className="h-12 w-full bg-gray-800 rounded-lg mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-800 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Conteúdo bloqueado para usuários não premium
  if (isPremiumLocked) {
    return (
      <div className="bg-gray-900 min-h-screen text-white">
        <div className="container mx-auto p-4">
          <Link href="/videoaulas" className="flex items-center text-blue-300 hover:text-blue-100 mb-8 transition">
            <ChevronLeft className="mr-2" />
            <span>Voltar para Videoaulas</span>
          </Link>
          
          <div className="max-w-2xl mx-auto text-center py-12 px-4">
            <div className="bg-blue-900/50 p-8 rounded-xl border border-blue-700">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">{lesson?.title}</h1>
              <p className="text-lg mb-6">Este conteúdo é exclusivo para assinantes premium.</p>
              <p className="text-gray-300 mb-8">
                Faça upgrade do seu plano para acessar todas as videoaulas, materiais exclusivos e muito mais.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/planos">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-medium">
                    <Crown className="w-4 h-4 mr-2" />
                    Conhecer Planos Premium
                  </Button>
                </Link>
                <Link href="/videoaulas">
                  <Button variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-800">
                    Ver Aulas Gratuitas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{lesson?.title ? `${lesson.title} | DesignAuto Videoaulas` : 'Videoaula | DesignAuto'}</title>
      </Helmet>
      
      <div className="bg-gray-900 min-h-screen text-white">
        {/* Barra superior com título e progresso do curso */}
        <div className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/videoaulas" className="text-blue-300 hover:text-blue-100 transition">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-medium truncate max-w-md">
                {module?.title || 'Carregando módulo...'}
              </h1>
            </div>
            
            <div className="flex items-center">
              {user && (
                <div className="flex items-center">
                  <Avatar className="h-7 w-7 mr-2">
                    <AvatarImage src={user.profileimageurl} alt={user.name || user.username} />
                    <AvatarFallback>{(user.name || user.username)?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm mr-3 hidden sm:inline">
                    {user.name || user.username}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Barra de progresso do curso */}
          <div className="container mx-auto mt-1">
            <div className="flex items-center justify-between mb-1 text-xs">
              <span>Progresso do curso</span>
              <span>
                {courseProgress 
                  ? `${courseProgress.completedLessons}/${courseProgress.totalLessons} (${Math.round(courseProgress.percentage)}%)`
                  : '0/0 (0%)'
                }
              </span>
            </div>
            <Progress 
              value={courseProgress?.percentage || 0} 
              className="h-1.5 bg-gray-800" 
              indicatorClassName="bg-blue-500" 
            />
          </div>
        </div>
        
        <div className="container mx-auto p-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Coluna principal com vídeo e conteúdo */}
            <div className="w-full lg:w-2/3">
              {/* Player de vídeo */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                {lesson?.videoProvider === 'youtube' ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${lesson.videoUrl.split('v=')[1]}?autoplay=0`}
                    title={lesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      src={lesson?.videoUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      onTimeUpdate={handleTimeUpdate}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={goToNextLesson}
                    />
                    
                    {/* Controles customizados */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-2">
                      {/* Barra de progresso */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer mb-2 accent-blue-500"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button onClick={handlePlayPause} className="text-white hover:text-blue-300 transition">
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>
                          
                          <div className="flex items-center space-x-3">
                            <button onClick={goToPrevLesson} className="text-white hover:text-blue-300 transition">
                              <SkipBack className="w-4 h-4" />
                            </button>
                            <button onClick={goToNextLesson} className="text-white hover:text-blue-300 transition">
                              <SkipForward className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button onClick={handleMuteToggle} className="text-white hover:text-blue-300 transition">
                              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="w-16 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-200">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                          <button onClick={handleFullScreen} className="text-white hover:text-blue-300 transition">
                            <Maximize className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Título e descrição da aula */}
              <h1 className="text-2xl font-bold mb-2">{lesson?.title}</h1>
              
              {/* Botões de ação */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-gray-600 hover:bg-blue-900 hover:text-white"
                  onClick={() => toast({
                    title: "Aula concluída",
                    description: "Marcamos esta aula como concluída para você!"
                  })}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Marcar como concluída
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-gray-600 hover:bg-blue-900 hover:text-white"
                >
                  <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                  Salvar
                </Button>
                
                {lesson?.additionalMaterialsUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs border-gray-600 hover:bg-blue-900 hover:text-white"
                    onClick={() => window.open(lesson.additionalMaterialsUrl, '_blank')}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Material de apoio
                  </Button>
                )}
              </div>
              
              {/* Abas de informações e comentários */}
              <Tabs defaultValue="informacoes" className="mb-8">
                <TabsList className="bg-gray-800 border-b border-gray-700 w-full justify-start rounded-none gap-4">
                  <TabsTrigger value="informacoes" className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:shadow-none">
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="comentarios" className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:shadow-none">
                    Comentários
                  </TabsTrigger>
                  <TabsTrigger value="anotacoes" className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:shadow-none">
                    Anotações
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="informacoes" className="pt-4 px-1">
                  <div className="space-y-4">
                    <p className="text-gray-300">
                      {lesson?.description}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="w-4 h-4 mr-1.5" />
                      <span>Duração: {formatTime(lesson?.duration || 0)}</span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="comentarios" className="pt-4 px-1">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileimageurl} alt={user?.name || user?.username} />
                        <AvatarFallback>{(user?.name || user?.username)?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <Textarea 
                          placeholder="Deixe seu comentário sobre esta aula..." 
                          className="bg-gray-800 border-gray-700 focus:border-blue-500 resize-none mb-2"
                        />
                        <Button size="sm">Enviar comentário</Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-4">
                      <p className="text-gray-400 text-center">
                        Ainda não há comentários nesta aula. Seja o primeiro a comentar!
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="anotacoes" className="pt-4 px-1">
                  <div className="space-y-4">
                    <Textarea 
                      placeholder="Escreva suas anotações sobre esta aula aqui..." 
                      className="bg-gray-800 border-gray-700 focus:border-blue-500 min-h-[200px] resize-none mb-2"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button onClick={saveNote}>Salvar anotação</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Navegação entre aulas */}
              <div className="flex justify-between pt-4 border-t border-gray-800">
                {module?.lessons.findIndex(l => l.id === lesson?.id) > 0 ? (
                  <Button 
                    variant="outline" 
                    onClick={goToPrevLesson}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Aula anterior
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {module && lesson && 
                  module.lessons.findIndex(l => l.id === lesson.id) < module.lessons.length - 1 ? (
                  <Button 
                    onClick={goToNextLesson}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Próxima aula
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      toast({
                        title: "Módulo concluído!",
                        description: "Parabéns por completar este módulo! Volte para a página de videoaulas para continuar aprendendo.",
                        variant: "success"
                      });
                      setTimeout(() => navigate('/videoaulas'), 1500);
                    }}
                  >
                    Concluir módulo
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Coluna lateral com lista de aulas */}
            <div className="w-full lg:w-1/3 bg-gray-800 rounded-lg overflow-hidden">
              {/* Título do módulo */}
              <div className="p-4 border-b border-gray-700">
                <h2 className="font-bold text-lg mb-1">
                  {module?.title}
                </h2>
                <div className="flex items-center text-sm text-gray-300">
                  <Info className="w-4 h-4 mr-1.5" />
                  <span>
                    {module?.lessons?.length || 0} aulas • {formatTime(
                      module?.lessons?.reduce((total, lesson) => total + (lesson.duration || 0), 0) || 0
                    )}
                  </span>
                </div>
              </div>
              
              {/* Lista de módulos e aulas */}
              <div className="max-h-[600px] overflow-y-auto">
                <Accordion 
                  type="single" 
                  collapsible 
                  defaultValue="modulo"
                  className="w-full"
                >
                  <AccordionItem value="modulo" className="border-b-0">
                    <AccordionTrigger className="px-4 py-3 text-white hover:bg-gray-700 hover:no-underline">
                      <div className="flex items-center">
                        <span className="font-semibold">
                          Módulo: {module?.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      <div className="space-y-px">
                        {module?.lessons?.map((moduleLesson) => {
                          const isCurrentLesson = moduleLesson.id === lesson?.id;
                          const isLocked = moduleLesson.isPremium && !isPremiumUser;
                          
                          return (
                            <Link 
                              key={moduleLesson.id}
                              href={isLocked ? '#' : `/videoaulas/${moduleLesson.id}`}
                              onClick={(e) => {
                                if (isLocked) {
                                  e.preventDefault();
                                  toast({
                                    title: "Conteúdo Premium",
                                    description: "Esta aula é exclusiva para assinantes. Faça upgrade para acessar.",
                                    variant: "warning"
                                  });
                                }
                              }}
                            >
                              <div 
                                className={`flex items-start p-3 hover:bg-gray-700 transition-colors ${
                                  isCurrentLesson ? 'bg-blue-900/40 border-l-2 border-blue-500' : ''
                                }`}
                              >
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 mr-3 flex-shrink-0 mt-0.5">
                                  {moduleLesson.watched ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  ) : isLocked ? (
                                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 text-gray-400" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate ${isCurrentLesson ? 'text-blue-300' : 'text-gray-100'}`}>
                                    {moduleLesson.title}
                                  </p>
                                  <div className="flex items-center mt-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span>{formatTime(moduleLesson.duration || 0)}</span>
                                    
                                    {moduleLesson.isPremium && (
                                      <span className="ml-2 flex items-center">
                                        <Crown className="w-3 h-3 text-yellow-500 mr-1" />
                                        <span className="text-yellow-500">Premium</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}