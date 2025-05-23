import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { CommunityPost, CommunityUser, Comment } from '@/types/community';
import { 
  ThumbsUp, MessageSquare, Share, MoreHorizontal, 
  Loader2, Pin, Trash2, ExternalLink, Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import UserAvatar from '@/components/users/UserAvatar';
import { FollowButton } from '@/components/community/FollowButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: CommunityPost;
  refetch?: () => void;
  refetchPopularPosts?: () => void;
  user?: CommunityUser | null;
  setSelectedPostId?: (id: number | null) => void;
  setIsPostViewOpen?: (open: boolean) => void;
  id?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  refetch,
  refetchPopularPosts,
  user: propUser,
  setSelectedPostId,
  setIsPostViewOpen,
  id
}) => {
  const { user: authUser } = useAuth() as { user: CommunityUser | null };
  const user = propUser || authUser;
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função para curtir/descurtir
  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para curtir posts",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest(
        isLiked ? "DELETE" : "POST", 
        `/api/community/posts/${post.id}/like`
      );
      
      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        
        toast({
          title: isLiked ? "Curtida removida" : "Post curtido",
          description: isLiked 
            ? "Você removeu sua curtida deste post" 
            : "Você curtiu este post",
        });
        
        if (refetch) refetch();
        if (refetchPopularPosts) refetchPopularPosts();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua ação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fixar/desafixar post
  const handlePinPost = async () => {
    if (user?.nivelacesso !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem fixar posts",
        variant: "destructive",
      });
      return;
    }
    
    setIsPinning(true);
    try {
      const response = await apiRequest(
        'PUT',
        `/api/community/posts/${post.id}/${post.isPinned ? 'unpin' : 'pin'}`
      );
      
      if (response.ok) {
        if (refetch) refetch();
        if (refetchPopularPosts) refetchPopularPosts();
        
        toast({
          title: post.isPinned ? "Post desafixado" : "Post fixado",
          description: post.isPinned 
            ? "O post não será mais exibido no topo" 
            : "O post será exibido no topo da comunidade",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua ação",
        variant: "destructive",
      });
    } finally {
      setIsPinning(false);
    }
  };

  // Função para excluir post
  const handleDeletePost = async () => {
    if (user?.nivelacesso !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem excluir posts",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir este post?")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await apiRequest('DELETE', `/api/community/posts/${post.id}`);
      
      if (response.ok) {
        if (refetch) refetch();
        if (refetchPopularPosts) refetchPopularPosts();
        
        toast({
          title: "Post excluído",
          description: "O post foi excluído com sucesso",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para compartilhar
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content || "Confira este post na comunidade!",
        url: window.location.origin + `/comunidade/post/${post.id}`,
      }).catch(console.error);
    } else {
      // Fallback: copiar link
      navigator.clipboard.writeText(
        window.location.origin + `/comunidade/post/${post.id}`
      ).then(() => {
        toast({
          title: "Link copiado",
          description: "Link copiado para a área de transferência!",
        });
      });
    }
  };

  return (
    <Card 
      id={id}
      className={`mb-5 overflow-hidden ${post.isPinned 
        ? 'border-2 border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-amber-900/10' 
        : 'border border-zinc-100 dark:border-zinc-800'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserAvatar user={post.user} size="sm" linkToProfile />
          <div>
            <span className="font-medium">{post.user.name || post.user.username}</span>
            <p className="text-xs text-zinc-500">{post.formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && user.id !== post.user.id && (
            <FollowButton 
              userId={post.user.id}
              isFollowing={post.user.isFollowing || false}
              size="sm"
            />
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opções</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {user?.nivelacesso === 'admin' && (
                <>
                  <DropdownMenuItem onClick={handlePinPost} disabled={isPinning}>
                    {isPinning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Pin className="mr-2 h-4 w-4" />
                    )}
                    {post.isPinned ? "Desafixar" : "Fixar"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="text-red-500"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
              
              {post.editLink && (
                <DropdownMenuItem onClick={() => window.open(post.editLink, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir link
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={handleShare}>
                <Share className="mr-2 h-4 w-4" />
                Compartilhar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div 
        className="relative cursor-pointer"
        onClick={() => {
          if (setSelectedPostId && setIsPostViewOpen) {
            setSelectedPostId(post.id);
            setIsPostViewOpen(true);
          }
        }}
      >
        <img 
          src={post.imageUrl} 
          alt={post.title}
          className="w-full h-auto"
        />
      </div>

      <div className="p-4">
        <h3 className="font-bold mb-2">{post.title}</h3>
        {post.content && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{post.content}</p>
        )}
      </div>

      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${isLiked ? 'text-blue-500' : ''}`}
          onClick={handleLike}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          )}
          {likesCount}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => {
            if (setSelectedPostId && setIsPostViewOpen) {
              setSelectedPostId(post.id);
              setIsPostViewOpen(true);
            }
          }}
        >
          <MessageSquare className="h-4 w-4" />
          {post.commentsCount}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleShare}
        >
          <Share className="h-4 w-4" />
          Compartilhar
        </Button>
      </div>
    </Card>
  );
}; 