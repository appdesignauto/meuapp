import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

import UserAvatar from '@/components/users/UserAvatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CommentUser {
  id: number;
  username: string;
  name: string | null;
  profileimageurl: string | null;
  nivelacesso: string;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  postId: number;
  likesCount: number;
  repliesCount?: number;
  parentId?: number | null;
  user: CommentUser;
  isLikedByUser?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  postId: number;
  onDelete: (commentId: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, onDelete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  
  const canDelete = user && (user.id === comment.userId || user.nivelacesso === 'administrador');
  
  // Mutação para curtir um comentário
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (comment.isLikedByUser) {
        // Se já curtiu, usa método DELETE para remover a curtida
        await apiRequest('DELETE', `/api/community/comments/${comment.id}/like`);
      } else {
        // Se não curtiu, usa método POST para adicionar curtida
        await apiRequest('POST', `/api/community/comments/${comment.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
      toast({
        description: comment.isLikedByUser 
          ? "Curtida removida com sucesso" 
          : "Comentário curtido com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível processar sua ação: ${error.message}`,
      });
    }
  });
  
  // Mutação para responder a um comentário
  const replyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/community/comments/${comment.id}/replies`, {
        content: replyText.trim()
      });
    },
    onSuccess: () => {
      setReplyText('');
      setShowReplyInput(false);
      // Força a busca das respostas após adicionar uma nova
      fetchReplies();
      // Força a atualização da contagem no post
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
      toast({
        description: "Resposta adicionada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível adicionar sua resposta: ${error.message}`,
      });
    }
  });
  
  // Função para buscar respostas (replies) de um comentário
  const fetchReplies = async () => {
    if (!comment.repliesCount || comment.repliesCount === 0) {
      return;
    }
    
    setLoadingReplies(true);
    try {
      const response = await fetch(`/api/community/comments/${comment.id}/replies`);
      
      if (response.ok) {
        const data = await response.json();
        setReplies(data);
        setShowReplies(true);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar as respostas",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar as respostas",
      });
    } finally {
      setLoadingReplies(false);
    }
  };
  
  // Manipulador para o botão "Ver respostas"
  const handleViewReplies = () => {
    if (showReplies) {
      setShowReplies(false);
    } else {
      fetchReplies();
    }
  };
  
  return (
    <div className="py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="flex gap-3">
        <UserAvatar user={comment.user} size="sm" linkToProfile={true} />
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">
                {comment.user.name || comment.user.username}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(comment.createdAt)}
              </p>
            </div>
            
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-red-500 dark:text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {comment.content}
          </p>
          
          {/* Botões de interação estilo Facebook */}
          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <button 
              className={`font-medium hover:underline ${comment.isLikedByUser ? 'text-blue-600 dark:text-blue-400' : ''}`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              {comment.isLikedByUser ? 'Curtiu' : 'Curtir'}
              {comment.likesCount > 0 && ` · ${comment.likesCount}`}
            </button>
            
            {user && (
              <button 
                className="font-medium hover:underline"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                Responder
              </button>
            )}
          </div>
          
          {/* Área de resposta */}
          {showReplyInput && user && (
            <div className="mt-3 flex gap-2">
              <UserAvatar user={user} size="xs" />
              <div className="flex-1">
                <Textarea
                  placeholder="Escreva uma resposta..."
                  className="min-h-[60px] text-sm"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowReplyInput(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => replyMutation.mutate()}
                    disabled={replyMutation.isPending || !replyText.trim()}
                  >
                    {replyMutation.isPending ? "Enviando..." : "Responder"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Link para ver respostas */}
          {!showReplies && comment.repliesCount && comment.repliesCount > 0 && (
            <button 
              className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              onClick={handleViewReplies}
            >
              <ChevronDown className="h-4 w-4" />
              Ver {comment.repliesCount} {comment.repliesCount === 1 ? 'resposta' : 'respostas'}
            </button>
          )}
          
          {/* Exibição de respostas */}
          {showReplies && (
            <div className="mt-3 pl-4 border-l border-zinc-100 dark:border-zinc-800">
              {loadingReplies ? (
                <div className="py-2 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
              ) : (
                <>
                  {replies.map((reply) => (
                    <div key={reply.id} className="py-3 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                      <div className="flex gap-2">
                        <UserAvatar user={reply.user} size="xs" linkToProfile />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-xs">
                              {reply.user.name || reply.user.username}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300">
                            {reply.content}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <button 
                              className={`hover:underline ${reply.isLikedByUser ? 'text-blue-600 dark:text-blue-400' : ''}`}
                              onClick={() => {
                                const endpoint = reply.isLikedByUser 
                                  ? `DELETE` 
                                  : `POST`;
                                
                                apiRequest(endpoint, `/api/community/comments/${reply.id}/like`)
                                  .then(() => {
                                    // Recarregar as respostas
                                    fetchReplies();
                                    // Atualizar também o post principal para manter contagens atualizadas
                                    queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
                                    toast({
                                      description: reply.isLikedByUser 
                                        ? "Curtida removida com sucesso" 
                                        : "Resposta curtida com sucesso",
                                    });
                                  })
                                  .catch(error => {
                                    toast({
                                      variant: "destructive",
                                      title: "Erro",
                                      description: `Não foi possível processar sua ação: ${error.message}`,
                                    });
                                  });
                              }}
                            >
                              {reply.isLikedByUser ? 'Curtiu' : 'Curtir'}
                              {reply.likesCount > 0 && ` · ${reply.likesCount}`}
                            </button>
                            <span className="text-zinc-400 dark:text-zinc-500">{formatDate(reply.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {/* Botão para ocultar respostas */}
              <button 
                className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                onClick={() => setShowReplies(false)}
              >
                <ChevronUp className="h-4 w-4" />
                Ocultar respostas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;