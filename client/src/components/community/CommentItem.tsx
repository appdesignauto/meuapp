import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Comment, CommunityUser } from '@/types/community';
import { 
  ThumbsUp, MoreHorizontal, Loader2, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/users/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from '@/lib/utils/date';

interface CommentItemProps {
  comment: {
    comment: Comment;
    user: CommunityUser;
    isLikedByUser?: boolean;
    likesCount?: number;
  };
  refetchComments?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  refetchComments 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Verificar se o usuário pode excluir o comentário
  const canDelete = user && (
    user.id === comment.comment.userId || 
    user.nivelacesso === 'admin' || 
    user.nivelacesso === 'administrador' || 
    user.nivelacesso === 'designer_adm'
  );
  
  // Função para curtir/descurtir comentário
  const handleLikeComment = async () => {
    if (!user) {
      toast({
        title: "Ação não permitida",
        description: "Você precisa estar logado para curtir comentários.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLiking(true);
    try {
      const response = await apiRequest(
        'POST', 
        `/api/community/comments/${comment.comment.id}/like`
      );
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao curtir comentário`);
      }
      
      const data = await response.json();
      setIsLiked(data.liked);
      setLikeCount(data.likesCount);
      
      toast({
        title: data.liked ? "Comentário curtido" : "Curtida removida",
        description: data.liked 
          ? "Você curtiu este comentário." 
          : "Você removeu sua curtida deste comentário."
      });
    } catch (error) {
      toast({
        title: "Erro ao curtir comentário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao curtir este comentário.",
        variant: "destructive"
      });
    } finally {
      setIsLiking(false);
    }
  };
  
  // Função para excluir comentário
  const handleDeleteComment = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await apiRequest(
        'DELETE', 
        `/api/community/comments/${comment.comment.id}`
      );
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao excluir comentário`);
      }
      
      toast({
        title: "Comentário excluído",
        description: "Seu comentário foi excluído com sucesso."
      });
      
      if (refetchComments) {
        refetchComments();
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir comentário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir este comentário.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2 mb-2">
      <UserAvatar user={comment.user} size="xs" linkToProfile={true} />
      <div className="flex-1">
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 relative group">
          <div className="flex justify-between items-start">
            <span className="font-medium text-xs">
              {comment.user.name || comment.user.username}
            </span>
            
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleDeleteComment}
                    disabled={isDeleting}
                    className="text-red-500 dark:text-red-400"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-2" />
                    )}
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <p className="text-xs mt-0.5">{comment.comment.content}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`p-0 h-auto text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary flex items-center gap-1 ${
              isLiked ? 'text-blue-500 dark:text-blue-400 font-medium' : ''
            }`}
            onClick={handleLikeComment}
            disabled={isLiking}
          >
            {isLiking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ThumbsUp className={`h-3 w-3 ${
                isLiked ? 'fill-blue-500 dark:fill-blue-400 text-blue-500 dark:text-blue-400' : ''
              }`} />
            )}
            {likeCount > 0 && <span>{likeCount}</span>}
          </Button>
          
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {formatRelativeTime(comment.comment.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};