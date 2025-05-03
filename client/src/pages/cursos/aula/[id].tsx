import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Crown,
  CheckCircle,
  Loader2,
  Clock,
  Edit,
  Star,
  StarHalf,
  MessageSquare,
  PlayCircle,
  Calendar,
  ThumbsUp
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

// Componente de player de vídeo
const VideoPlayer = ({ lesson }: { lesson: CourseLesson }) => {
  // Função para criar URL de embed com base no provider
  const getEmbedUrl = () => {
    switch (lesson.videoProvider) {
      case 'youtube':
        // Extrair ID do vídeo do YouTube da URL
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const youtubeMatch = lesson.videoUrl.match(youtubeRegex);
        const youtubeId = youtubeMatch ? youtubeMatch[1] : null;
        return youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=0&modestbranding=1&rel=0` : lesson.videoUrl;
      
      case 'vimeo':
        // Extrair ID do vídeo do Vimeo da URL
        const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
        const vimeoMatch = lesson.videoUrl.match(vimeoRegex);
        const vimeoId = vimeoMatch ? vimeoMatch[1] : null;
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : lesson.videoUrl;
      
      case 'vturb':
      case 'panda':
        // Nestes casos, assumimos que a URL já está pronta para embed
        return lesson.videoUrl;
      
      default:
        return lesson.videoUrl;
    }
  };

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
      <iframe
        src={getEmbedUrl()}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={lesson.title}
      ></iframe>
    </div>
  );
};

// Componente para exibir duração em formato legível
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Componente de avaliação por estrelas
const RatingStars = ({ 
  value, 
  onChange, 
  readOnly = false
}: { 
  value: number; 
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange && onChange(star)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
            star <= value ? 'text-amber-400' : 'text-neutral-300'
          }`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );
};

// Componente de comentário
const Comment = ({ rating }: { rating: CourseRating }) => {
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <div className="font-medium">{rating.name || rating.username}</div>
          <span className="mx-2 text-neutral-400">•</span>
          <div className="text-sm text-neutral-500">
            {new Date(rating.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
        <RatingStars value={rating.rating} readOnly />
      </div>
      {rating.comment && (
        <p className="text-neutral-700 text-sm mt-2">{rating.comment}</p>
      )}
    </div>
  );
};

// Componente de formulário de avaliação
const RatingForm = ({ 
  lessonId, 
  userRating,
  onSuccess 
}: { 
  lessonId: number; 
  userRating: CourseRating | null;
  onSuccess: () => void;
}) => {
  const [rating, setRating] = useState(userRating?.rating || 0);
  const [comment, setComment] = useState(userRating?.comment || '');
  const { toast } = useToast();

  // Mutation para salvar avaliação
  const ratingMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      if (userRating) {
        // Atualizar avaliação existente
        return apiRequest('PUT', `/api/cursos/lessons/${lessonId}/ratings/${userRating.id}`, data);
      } else {
        // Criar nova avaliação
        return apiRequest('POST', `/api/cursos/lessons/${lessonId}/ratings`, data);
      }
    },
    onSuccess: () => {
      toast({
        title: userRating ? "Avaliação atualizada" : "Avaliação enviada",
        description: "Obrigado pelo seu feedback!",
        variant: "default",
      });
      // Invalida a consulta para recarregar os dados
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/lessons/${lessonId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/lessons/${lessonId}/ratings`] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar avaliação",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Avaliação inválida",
        description: "Por favor, selecione uma classificação por estrelas",
        variant: "destructive",
      });
      return;
    }
    ratingMutation.mutate({ rating, comment });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Sua avaliação</label>
        <RatingStars value={rating} onChange={setRating} />
      </div>
      
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-medium mb-2">Comentário (opcional)</label>
        <Textarea
          id="comment"
          placeholder="Compartilhe sua opinião sobre esta aula..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={ratingMutation.isPending}
        className="w-full"
      >
        {ratingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {userRating ? "Atualizar avaliação" : "Enviar avaliação"}
      </Button>
    </form>
  );
};

// Página de visualização de aula
export default function AulaPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Buscar detalhes da lição
  const { 
    data: lessonData, 
    isLoading: isLoadingLesson, 
    error: lessonError 
  } = useQuery({
    queryKey: [`/api/cursos/lessons/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/cursos/lessons/${id}`);
      if (!res.ok) throw new Error('Falha ao carregar detalhes da aula');
      return res.json();
    }
  });
  
  // Buscar avaliações
  const { 
    data: ratingsData, 
    isLoading: isLoadingRatings, 
    error: ratingsError 
  } = useQuery({
    queryKey: [`/api/cursos/lessons/${id}/ratings`],
    queryFn: async () => {
      const res = await fetch(`/api/cursos/lessons/${id}/ratings`);
      if (!res.ok) throw new Error('Falha ao carregar avaliações');
      return res.json();
    },
    enabled: !!lessonData
  });
  
  // Mutation para marcar aula como concluída
  const markCompletedMutation = useMutation({
    mutationFn: async (data: { isCompleted: boolean; notes?: string }) => {
      return apiRequest('PUT', `/api/cursos/lessons/${id}/progress`, data);
    },
    onSuccess: () => {
      toast({
        title: "Progresso atualizado",
        description: "Seu progresso foi salvo com sucesso!",
        variant: "default",
      });
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/lessons/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/cursos/modules/${lessonData?.module?.id}/lessons`] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar progresso",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  // Atualizar estado de notas quando dados da lição forem carregados
  useEffect(() => {
    if (lessonData?.progress?.notes) {
      setNotes(lessonData.progress.notes);
    }
  }, [lessonData]);

  // Processar dados de avaliação
  const userRating = ratingsData?.find((rating: CourseRating) => rating.userId === user?.id) || null;
  const publicRatings = ratingsData?.filter((rating: CourseRating) => rating.userId !== user?.id) || [];
  const averageRating = ratingsData?.length > 0 
    ? Math.round(ratingsData.reduce((acc: number, curr: CourseRating) => acc + curr.rating, 0) / ratingsData.length * 10) / 10
    : 0;

  // Loading state
  const isLoading = isLoadingLesson || isLoadingRatings;
  
  // Error state
  const error = lessonError || ratingsError;

  // Se estiver carregando, mostrar indicador
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-neutral-600">Carregando aula...</p>
        </div>
      </div>
    );
  }

  // Se ocorrer um erro, mostrar mensagem
  if (error || !lessonData) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center text-red-600">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-medium text-lg">Erro ao carregar a aula</p>
          <p className="text-sm mt-1 mb-4">Não foi possível encontrar esta aula ou você não tem permissão para acessá-la</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => setLocation('/cursos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para cursos
          </Button>
        </div>
      </div>
    );
  }

  const { lesson, module, progress } = lessonData;

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>{lesson.title} | DesignAuto</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        {/* Navegação superior */}
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent hover:text-blue-700 -ml-2"
            onClick={() => setLocation(`/cursos/${module.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o módulo
          </Button>
          
          {/* Status de progresso */}
          {user && (
            <div className="flex items-center ml-auto">
              {progress?.isCompleted ? (
                <Badge variant="outline" className="bg-green-100 border-green-200 text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Aula concluída</span>
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => markCompletedMutation.mutate({ isCompleted: true })}
                  disabled={markCompletedMutation.isPending}
                >
                  {markCompletedMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  <span>Marcar como concluída</span>
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Título da aula */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-3">{lesson.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1.5" />
              <span>{formatDuration(lesson.videoDuration)}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5" />
              <span>{new Date(lesson.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {ratingsData && ratingsData.length > 0 && (
              <div className="flex items-center">
                <Star className={`h-4 w-4 mr-1.5 ${averageRating > 0 ? 'text-amber-400 fill-amber-400' : 'text-neutral-400'}`} />
                <span>{averageRating} ({ratingsData.length} avaliações)</span>
              </div>
            )}
            {lesson.isPremium && (
              <Badge variant="outline" className="bg-amber-100 border-amber-200 text-amber-700 flex items-center gap-1">
                <Crown className="h-3 w-3" />
                <span>Premium</span>
              </Badge>
            )}
          </div>
        </div>
        
        {/* Player de vídeo */}
        <VideoPlayer lesson={lesson} />
        
        {/* Descrição da aula */}
        <div className="mt-6 mb-8">
          <h2 className="text-xl font-bold mb-3">Sobre esta aula</h2>
          <p className="text-neutral-700">{lesson.description}</p>
        </div>
        
        <Separator className="my-8" />
        
        {/* Seção de anotações - apenas para usuários logados */}
        {user && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">Suas anotações</h2>
            <Textarea
              placeholder="Adicione suas anotações sobre esta aula aqui..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="mb-3"
            />
            <Button 
              onClick={() => markCompletedMutation.mutate({ 
                isCompleted: progress?.isCompleted || false, 
                notes 
              })}
              disabled={markCompletedMutation.isPending}
            >
              {markCompletedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar anotações
            </Button>
          </div>
        )}
        
        <Separator className="my-8" />
        
        {/* Seção de avaliações */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Avaliações</h2>
            {user && !showRatingForm && (
              <Button 
                variant="outline" 
                onClick={() => setShowRatingForm(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {userRating ? (
                  <>
                    <Edit className="h-4 w-4 mr-1.5" />
                    <span>Editar sua avaliação</span>
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-1.5" />
                    <span>Avaliar esta aula</span>
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Formulário de avaliação */}
          {user && showRatingForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">
                  {userRating ? "Editar sua avaliação" : "Avaliar esta aula"}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowRatingForm(false)}
                >
                  Cancelar
                </Button>
              </div>
              
              <RatingForm 
                lessonId={parseInt(id)} 
                userRating={userRating} 
                onSuccess={() => setShowRatingForm(false)}
              />
            </div>
          )}
          
          {/* Lista de avaliações */}
          {ratingsData && ratingsData.length > 0 ? (
            <div>
              {/* Exibe a avaliação do usuário primeiro, se existir */}
              {userRating && !showRatingForm && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Sua avaliação</h3>
                  <Comment rating={userRating} />
                </div>
              )}
              
              {/* Exibe as outras avaliações */}
              {publicRatings.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    {publicRatings.length} {publicRatings.length === 1 ? 'avaliação' : 'avaliações'} de outros usuários
                  </h3>
                  {publicRatings.map((rating) => (
                    <Comment key={rating.id} rating={rating} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
              <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-center">
                Ainda não há avaliações para esta aula.
                {user && !showRatingForm && (
                  <button 
                    onClick={() => setShowRatingForm(true)}
                    className="ml-1 text-blue-600 hover:underline"
                  >
                    Seja o primeiro a avaliar!
                  </button>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}