import { useEffect, useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2, ArrowLeft, Crown, BookOpen, CheckCircle,
  Play, Star, ChevronRight, ChevronLeft, MessageSquare
} from "lucide-react";

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

interface CourseRating {
  id: number;
  userId: number;
  lessonId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  username: string;
  name: string | null;
}

const VideoPlayer = ({ 
  lesson, 
  onProgress, 
  onComplete 
}: { 
  lesson: CourseLesson, 
  onProgress: (progress: number) => void,
  onComplete: () => void 
}) => {
  const videoRef = useRef<HTMLIFrameElement>(null);
  
  // Função para incorporar diferentes provedores de vídeo
  const getEmbedUrl = (url: string, provider: string) => {
    switch (provider) {
      case "youtube":
        // Extrair ID do vídeo do YouTube
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const youtubeId = youtubeMatch ? youtubeMatch[1] : url;
        return `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`;
        
      case "vimeo":
        // Extrair ID do vídeo do Vimeo
        const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/);
        const vimeoId = vimeoMatch ? vimeoMatch[1] : url;
        return `https://player.vimeo.com/video/${vimeoId}?autoplay=0`;
        
      case "vturb":
        // Assumindo que o URL já é o ID ou URL completo para embedar
        return url;
        
      case "panda":
        // Assumindo que o URL já é o ID ou URL completo para embedar
        return url;
        
      default:
        return url;
    }
  };
  
  const embedUrl = getEmbedUrl(lesson.videoUrl, lesson.videoProvider);

  // Simular evento de progresso para demonstração
  useEffect(() => {
    // Na vida real, você conectaria aos eventos de cada player via suas respectivas APIs
    const progressInterval = setInterval(() => {
      const randomProgress = Math.floor(Math.random() * 10);
      onProgress(randomProgress);
    }, 30000);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="w-full aspect-video mb-6 bg-black rounded-lg overflow-hidden shadow-lg">
      <iframe
        ref={videoRef}
        src={embedUrl}
        className="w-full h-full"
        allowFullScreen
        title={lesson.title}
      ></iframe>
    </div>
  );
};

const AulaDetalhesPage = () => {
  const [, params] = useRoute("/cursos/aula/:id");
  const lessonId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("descricao");
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userNotes, setUserNotes] = useState("");
  
  // Buscar dados da aula
  const { 
    data: lesson, 
    isLoading: lessonLoading, 
    error: lessonError 
  } = useQuery<CourseLesson>({
    queryKey: [`/api/courses/lessons/${lessonId}`],
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Buscar módulo da aula
  const { 
    data: module,
    isLoading: moduleLoading
  } = useQuery<CourseModule>({
    queryKey: [`/api/courses/modules/${lesson?.moduleId}`],
    enabled: !!lesson?.moduleId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Buscar progresso do usuário nesta aula
  const { 
    data: progressData,
    isLoading: progressLoading
  } = useQuery<CourseProgress>({
    queryKey: [`/api/courses/lessons/${lessonId}/progress`],
    enabled: !!lessonId && !!user,
    staleTime: 1000 * 60, // 1 minuto
    onSuccess: (data) => {
      if (data?.notes) {
        setUserNotes(data.notes);
      }
    }
  });
  
  // Buscar avaliações da aula
  const { 
    data: ratings,
    isLoading: ratingsLoading
  } = useQuery<CourseRating[]>({
    queryKey: [`/api/courses/lessons/${lessonId}/ratings`],
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Buscar a avaliação do usuário atual
  const { 
    data: userRatingData
  } = useQuery<CourseRating>({
    queryKey: [`/api/courses/lessons/${lessonId}/user-rating`],
    enabled: !!lessonId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
    onSuccess: (data) => {
      if (data) {
        setUserRating(data.rating);
        setComment(data.comment || "");
      }
    }
  });
  
  // Buscar aulas adjacentes do mesmo módulo (anterior e próxima)
  const {
    data: moduleLessons
  } = useQuery<CourseLesson[]>({
    queryKey: [`/api/courses/modules/${lesson?.moduleId}/lessons`],
    enabled: !!lesson?.moduleId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Determinar aula anterior e próxima
  const sortedLessons = moduleLessons 
    ? [...moduleLessons].sort((a, b) => a.order - b.order)
    : [];
  
  const currentIndex = lesson 
    ? sortedLessons.findIndex(l => l.id === lesson.id)
    : -1;
  
  const previousLesson = currentIndex > 0 
    ? sortedLessons[currentIndex - 1]
    : null;
    
  const nextLesson = currentIndex < sortedLessons.length - 1
    ? sortedLessons[currentIndex + 1]
    : null;
  
  // Mutação para atualizar o progresso
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { progress?: number, isCompleted?: boolean, notes?: string }) => {
      const response = await apiRequest(
        "PUT", 
        `/api/courses/lessons/${lessonId}/progress`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/lessons/${lessonId}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/modules/${lesson?.moduleId}/progress`] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar progresso",
        description: "Não foi possível salvar seu progresso. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });
  
  // Mutação para avaliar a aula
  const rateLessonMutation = useMutation({
    mutationFn: async (data: { rating: number, comment?: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/courses/lessons/${lessonId}/rate`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/lessons/${lessonId}/ratings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/lessons/${lessonId}/user-rating`] });
      
      toast({
        title: "Avaliação enviada",
        description: "Sua avaliação foi registrada com sucesso. Obrigado pelo feedback!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar avaliação",
        description: "Não foi possível registrar sua avaliação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });
  
  // Função para atualizar o progresso
  const handleUpdateProgress = (newProgress: number) => {
    if (!user) return;
    
    // Só atualiza se o progresso for maior que o atual
    if (!progressData || newProgress > progressData.progress) {
      updateProgressMutation.mutate({ progress: newProgress });
    }
  };
  
  // Função para marcar aula como concluída
  const handleMarkComplete = () => {
    if (!user) return;
    
    updateProgressMutation.mutate({ 
      isCompleted: true,
      progress: 100
    });
    
    toast({
      title: "Aula concluída",
      description: "Esta aula foi marcada como concluída. Parabéns pelo progresso!",
    });
  };
  
  // Função para salvar notas
  const handleSaveNotes = () => {
    if (!user) return;
    
    updateProgressMutation.mutate({ notes: userNotes });
    
    toast({
      title: "Notas salvas",
      description: "Suas anotações foram salvas com sucesso.",
    });
  };
  
  // Função para enviar avaliação
  const handleSubmitRating = () => {
    if (!user || userRating === 0) {
      toast({
        title: "Avaliação inválida",
        description: "Por favor, selecione uma classificação de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }
    
    rateLessonMutation.mutate({
      rating: userRating,
      comment: comment.trim() || undefined
    });
  };
  
  // Renderizar estrelas para avaliação
  const renderStars = (rating: number, isInteractive = false) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={isInteractive ? 24 : 16}
            className={`${star <= rating
              ? 'text-amber-500 fill-amber-500'
              : 'text-gray-300'
            } ${isInteractive ? 'cursor-pointer' : ''}`}
            onClick={isInteractive ? () => setUserRating(star) : undefined}
          />
        ))}
      </div>
    );
  };
  
  if (lessonLoading || moduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Aula não encontrada</h2>
        <p className="text-gray-600 mb-4">A aula solicitada não existe ou você não tem permissão para acessá-la.</p>
        <Link href="/cursos">
          <Button>
            <ArrowLeft size={16} className="mr-2" />
            Voltar para Cursos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{lesson.title} | Videoaulas | DesignAuto</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb e Navegação */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div className="flex items-center text-sm">
            <Link href="/cursos">
              <span className="text-gray-500 hover:text-primary cursor-pointer">Cursos</span>
            </Link>
            <ChevronRight size={16} className="mx-1 text-gray-400" />
            
            {module && (
              <>
                <Link href={`/cursos/${module.id}`}>
                  <span className="text-gray-500 hover:text-primary cursor-pointer">{module.title}</span>
                </Link>
                <ChevronRight size={16} className="mx-1 text-gray-400" />
              </>
            )}
            
            <span className="font-medium line-clamp-1">{lesson.title}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {previousLesson && (
              <Link href={`/cursos/aula/${previousLesson.id}`}>
                <Button variant="ghost" size="sm" className="h-8">
                  <ChevronLeft size={16} className="mr-1" />
                  Aula anterior
                </Button>
              </Link>
            )}
            
            {module && (
              <Link href={`/cursos/${module.id}`}>
                <Button variant="outline" size="sm" className="h-8">
                  Voltar ao módulo
                </Button>
              </Link>
            )}
            
            {nextLesson && (
              <Link href={`/cursos/aula/${nextLesson.id}`}>
                <Button variant="default" size="sm" className="h-8">
                  Próxima aula
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Título da aula */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          
          {/* Progresso da aula */}
          {user && progressData && (
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Seu progresso</span>
                <span>{progressData.progress}%</span>
              </div>
              <Progress value={progressData.progress} className="h-2" />
            </div>
          )}
        </div>
        
        {/* Player de vídeo */}
        <VideoPlayer 
          lesson={lesson} 
          onProgress={handleUpdateProgress}
          onComplete={handleMarkComplete}
        />
        
        {/* Botão de marcar como concluído */}
        {user && (
          <div className="mb-8 flex justify-end">
            <Button 
              onClick={handleMarkComplete}
              disabled={progressData?.isCompleted}
              className={progressData?.isCompleted ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {progressData?.isCompleted ? (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Aula concluída
                </>
              ) : (
                <>
                  <BookOpen size={16} className="mr-2" />
                  Marcar como concluída
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Tabs de conteúdo */}
        <Tabs defaultValue="descricao" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="descricao">Descrição</TabsTrigger>
            <TabsTrigger value="anotacoes">Suas anotações</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          </TabsList>
          
          {/* Tab Descrição */}
          <TabsContent value="descricao" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sobre esta aula</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">{lesson.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab Anotações */}
          <TabsContent value="anotacoes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Suas anotações</CardTitle>
                <CardDescription>
                  Registre suas observações e insights sobre esta aula para consultar depois.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-3">
                      Faça login para registrar suas anotações sobre esta aula.
                    </p>
                    <Link href="/login">
                      <Button>Fazer login</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <Textarea
                      placeholder="Escreva suas anotações sobre esta aula..."
                      className="min-h-[200px] mb-4"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                    />
                    <Button 
                      onClick={handleSaveNotes}
                      disabled={updateProgressMutation.isPending}
                    >
                      {updateProgressMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : "Salvar anotações"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab Avaliações */}
          <TabsContent value="avaliacoes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações</CardTitle>
                <CardDescription>
                  Veja o que outros alunos acharam desta aula ou deixe sua avaliação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Seção para avaliação do usuário */}
                {user && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-3">Sua avaliação</h3>
                    <div className="mb-3">
                      {renderStars(userRating, true)}
                    </div>
                    <Textarea
                      placeholder="Compartilhe sua opinião sobre esta aula (opcional)..."
                      className="mb-3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Button 
                      onClick={handleSubmitRating}
                      disabled={userRating === 0 || rateLessonMutation.isPending}
                    >
                      {rateLessonMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : "Enviar avaliação"}
                    </Button>
                  </div>
                )}
                
                {/* Lista de avaliações */}
                <div>
                  <h3 className="font-semibold mb-4">
                    {ratings?.length 
                      ? `${ratings.length} avaliação${ratings.length !== 1 ? 's' : ''}` 
                      : "Nenhuma avaliação ainda"}
                  </h3>
                  
                  {ratings?.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">
                        Seja o primeiro a avaliar esta aula!
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {ratings?.map((rating) => (
                      <div key={rating.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{rating.name || rating.username}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(rating.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="mb-2">
                          {renderStars(rating.rating)}
                        </div>
                        {rating.comment && (
                          <p className="text-gray-700">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Navegação entre aulas (bottom) */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {previousLesson && (
              <Link href={`/cursos/aula/${previousLesson.id}`}>
                <Button variant="outline" className="flex items-center">
                  <ChevronLeft size={16} className="mr-2" />
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Aula anterior</div>
                    <div className="font-medium line-clamp-1">{previousLesson.title}</div>
                  </div>
                </Button>
              </Link>
            )}
          </div>
          
          <div>
            {nextLesson && (
              <Link href={`/cursos/aula/${nextLesson.id}`}>
                <Button variant="outline" className="flex items-center">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Próxima aula</div>
                    <div className="font-medium line-clamp-1">{nextLesson.title}</div>
                  </div>
                  <ChevronRight size={16} className="ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AulaDetalhesPage;