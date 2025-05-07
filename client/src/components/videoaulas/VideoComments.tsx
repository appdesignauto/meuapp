import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest, CommentSyncEvent } from '@/lib/queryClient';
import { ThumbsUp, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: number;
  content: string;
  createdAt: string; // ISO date string
  userId: number;
  lessonId: number;
  likes: number;
  isHidden: boolean;
  username: string;
  name: string | null;
  profileImageUrl: string | null;
}

interface VideoCommentsProps {
  lessonId: number;
}

const VideoComments: React.FC<VideoCommentsProps> = ({ lessonId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();
  
  // Buscar comentários
  const { data: comments = [], isLoading, error, refetch } = useQuery<Comment[]>({
    queryKey: ['/api/video-comments', lessonId],
    queryFn: async () => {
      const response = await fetch(`/api/video-comments/${lessonId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar comentários');
      }
      return response.json();
    },
    retry: 1,
  });
  
  // Escutar eventos de sincronização do painel de administração
  useEffect(() => {
    // Esta função verificará periodicamente se há eventos de sincronização
    const checkForSyncEvents = () => {
      const syncEvents = queryClient.getQueryData<CommentSyncEvent[]>(['commentSyncEvents']) || [];
      
      // Filtramos apenas eventos para esta aula específica
      const relevantEvents = syncEvents.filter(event => event.lessonId === lessonId);
      
      if (relevantEvents.length > 0) {
        // Se houver eventos relevantes, recarregamos os comentários
        refetch();
        
        // Limpar os eventos processados do cache
        const remainingEvents = syncEvents.filter(event => event.lessonId !== lessonId);
        queryClient.setQueryData(['commentSyncEvents'], remainingEvents);
      }
    };
    
    // Verificar imediatamente se há eventos
    checkForSyncEvents();
    
    // Configurar intervalo para verificar periodicamente
    const intervalId = setInterval(checkForSyncEvents, 1000);
    
    // Limpar intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, [lessonId, queryClient, refetch]);
  
  // Mutação para adicionar comentário
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/video-comments', {
        lessonId,
        content
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar comentário');
      }
      return response.json();
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['/api/video-comments', lessonId] });
      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi publicado com sucesso.',
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro ao adicionar comentário',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para dar like em comentário
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest('POST', `/api/video-comments/${commentId}/like`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao curtir comentário');
      }
      return response.json();
    },
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-comments', lessonId] });
    },
    onError: (error: Error) => {
      console.error('Erro ao curtir comentário:', error);
      toast({
        title: 'Erro ao curtir comentário',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para deletar comentário
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest('DELETE', `/api/video-comments/${commentId}`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir comentário');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-comments', lessonId] });
      toast({
        title: 'Comentário excluído',
        description: 'Seu comentário foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir comentário:', error);
      toast({
        title: 'Erro ao excluir comentário',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  });
  
  // Formatação relativa de data (ex: "há 2 dias")
  const formatRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return diffMinutes <= 1 ? 'agora mesmo' : `${diffMinutes} minutos atrás`;
        }
        return diffHours === 1 ? 'há 1 hora' : `há ${diffHours} horas`;
      } else if (diffDays === 1) {
        return 'ontem';
      } else if (diffDays < 7) {
        return `há ${diffDays} dias`;
      } else if (diffDays < 30) {
        const diffWeeks = Math.floor(diffDays / 7);
        return diffWeeks === 1 ? 'há 1 semana' : `há ${diffWeeks} semanas`;
      } else if (diffDays < 365) {
        const diffMonths = Math.floor(diffDays / 30);
        return diffMonths === 1 ? 'há 1 mês' : `há ${diffMonths} meses`;
      } else {
        const diffYears = Math.floor(diffDays / 365);
        return diffYears === 1 ? 'há 1 ano' : `há ${diffYears} anos`;
      }
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'data desconhecida';
    }
  };
  
  // Manipulador para envio de comentário
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && user) {
      addCommentMutation.mutate(commentText.trim());
    }
  };
  
  // Manipulador para like em comentário
  const handleLikeComment = (commentId: number) => {
    if (user) {
      likeCommentMutation.mutate(commentId);
    } else {
      toast({
        title: 'Login necessário',
        description: 'Faça login para curtir este comentário.',
        variant: 'destructive',
      });
    }
  };
  
  // Manipulador para exclusão de comentário
  const handleDeleteComment = (commentId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este comentário?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  // Verificar se usuário pode excluir um comentário (sendo o dono ou admin)
  const canDeleteComment = (comment: Comment) => {
    return user && (user.id === comment.userId || user.nivelacesso === 'admin');
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
        <span className="bg-gradient-to-r from-blue-500 to-blue-600 h-5 w-1 rounded-full"></span>
        Comentários
      </h3>
      
      {/* Formulário de comentário (apenas para usuários logados) */}
      {user ? (
        <div>
          <form onSubmit={handleSubmitComment} className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 overflow-hidden flex-shrink-0 shadow-sm">
              {user.profileimageurl ? (
                <img 
                  src={user.profileimageurl} 
                  alt={user.name || user.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs sm:text-base">
                  {(user.name?.[0] || user.username[0]).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea 
                className="w-full p-2 sm:p-3 bg-white border border-blue-200 text-gray-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm text-xs sm:text-sm transition-all"
                placeholder="Deixe seu comentário sobre este tutorial..."
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <div className="flex justify-end mt-2">
                <Button 
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm text-xs sm:text-sm px-3 sm:px-4 transition-all"
                  disabled={addCommentMutation.isPending || !commentText.trim()}
                >
                  {addCommentMutation.isPending ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex items-center justify-center p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 mb-4 shadow-sm">
          <p className="text-blue-700 text-sm text-center font-medium">
            Faça login para deixar seu comentário sobre este tutorial.
          </p>
        </div>
      )}
      
      {/* Lista de comentários */}
      <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8">
        <h4 className="text-gray-500 text-xs sm:text-sm font-medium border-b border-gray-100 pb-2">
          {comments.length > 0 
            ? `Todos os comentários (${comments.length})`
            : 'Nenhum comentário ainda. Seja o primeiro a comentar!'}
        </h4>
        
        {isLoading && (
          <div className="py-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="py-4 flex justify-center text-red-500 items-center gap-2">
            <AlertTriangle size={16} />
            <span className="text-sm">Erro ao carregar comentários. Tente novamente.</span>
          </div>
        )}
        
        {comments.length === 0 && !isLoading && !error && (
          <div className="py-8 text-center text-gray-400">
            <p>Seja o primeiro a comentar nesta aula!</p>
          </div>
        )}
        
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 sm:p-4 border border-blue-100 rounded-lg shadow-sm bg-white hover:bg-blue-50 transition-colors mb-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-blue-100 overflow-hidden flex-shrink-0 shadow-sm">
                {comment.profileImageUrl ? (
                  <img 
                    src={comment.profileImageUrl} 
                    alt={comment.name || comment.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-[10px] sm:text-xs">
                    {(comment.name?.[0] || comment.username[0]).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <h5 className="font-medium text-gray-800 text-xs sm:text-sm">
                    {comment.name || comment.username}
                  </h5>
                  <span className="text-gray-400 text-[10px] sm:text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {formatRelativeDate(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-gray-700 text-xs sm:text-sm leading-relaxed">{comment.content}</p>
                <div className="mt-3 flex items-center gap-4 border-t border-blue-50 pt-2">
                  <button 
                    onClick={() => handleLikeComment(comment.id)}
                    disabled={likeCommentMutation.isPending}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors text-[10px] sm:text-xs bg-white rounded-full px-2 py-1 border border-gray-200 hover:border-blue-200 shadow-sm"
                  >
                    <ThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>{comment.likes || 0}</span>
                  </button>
                  
                  {canDeleteComment(comment) && (
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition-colors text-[10px] sm:text-xs bg-white rounded-full px-2 py-1 border border-gray-200 hover:border-red-200 shadow-sm"
                    >
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoComments;