import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Heart, MessageSquare, Share2, ArrowLeft, Flag, MoreHorizontal, Send, Trash2 } from 'lucide-react';

import TopBar from '@/components/TopBar';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorContainer from '@/components/ErrorContainer';
import UserAvatar from '@/components/users/UserAvatar';
import FooterMenu from '@/components/FooterMenu';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  postId: number;
  likesCount: number;
  user: {
    id: number;
    username: string;
    name: string | null;
    profileimageurl: string | null;
    nivelacesso: string;
  };
  isLikedByUser?: boolean;
}

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isApproved: boolean;
  userId: number;
  isLikedByUser?: boolean;
  user: {
    id: number;
    username: string;
    name: string | null;
    profileimageurl: string | null;
    nivelacesso: string;
  };
  comments?: Comment[];
}

// Componente para comentário
const CommentItem: React.FC<{ 
  comment: Comment, 
  postId: number,
  onDelete: (commentId: number) => void
}> = ({ comment, postId, onDelete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canDelete = user && (user.id === comment.userId || user.nivelacesso === 'administrador');
  
  // Mutação para curtir um comentário
  const likeMutation = useMutation({
    mutationFn: async () => {
      const endpoint = comment.isLikedByUser 
        ? `/api/community/comments/${comment.id}/unlike` 
        : `/api/community/comments/${comment.id}/like`;
      
      await apiRequest('POST', endpoint);
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
          
          <div className="mt-2 flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 px-2 ${comment.isLikedByUser ? 'text-red-500 dark:text-red-400' : ''}`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-xs">{comment.likesCount}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Página de detalhe do post
const PostDetailPage: React.FC = () => {
  const params = useParams();
  const postId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  
  // Buscar detalhes do post
  const { 
    data: post, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<CommunityPost>({
    queryKey: [`/api/community/posts/${postId}`],
    refetchOnWindowFocus: false,
  });
  
  // Mutação para curtir um post
  const likeMutation = useMutation({
    mutationFn: async () => {
      const endpoint = post?.isLikedByUser 
        ? `/api/community/posts/${postId}/unlike` 
        : `/api/community/posts/${postId}/like`;
      
      await apiRequest('POST', endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
      toast({
        description: post?.isLikedByUser 
          ? "Curtida removida com sucesso" 
          : "Post curtido com sucesso",
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
  
  // Mutação para adicionar um comentário
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest('POST', `/api/community/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
      toast({
        description: "Comentário adicionado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível adicionar o comentário: ${error.message}`,
      });
    }
  });
  
  // Mutação para deletar um comentário
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest('DELETE', `/api/community/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
      toast({
        description: "Comentário excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível excluir o comentário: ${error.message}`,
      });
    }
  });
  
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };
  
  const handleShare = async () => {
    try {
      await navigator.share({
        title: post?.title,
        text: post?.content,
        url: window.location.href,
      });
    } catch (error) {
      toast({
        description: "Seu navegador não suporta compartilhamento. Copie o link manualmente.",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <LoadingScreen label="Carregando post..." />
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 flex items-center justify-center">
        <ErrorContainer 
          title="Erro ao carregar o post" 
          description="Não foi possível carregar as informações deste post."
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-16 md:pb-0">
      <TopBar showBack={true} backPath="/comunidade" />
      
      <div className="container max-w-2xl px-4 py-6">
        <Card className="overflow-hidden">
          <div className="relative w-full">
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className="w-full max-h-[300px] object-cover"
            />
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserAvatar user={post.user} size="sm" linkToProfile={true} />
                <div>
                  <p className="text-sm font-medium">
                    {post.user.name || post.user.username}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Denunciar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <h1 className="text-xl font-bold mb-2">{post.title}</h1>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line mb-4">
              {post.content}
            </p>
            
            {post.editLink && (
              <div className="mb-4 mt-2">
                <a 
                  href={post.editLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-md text-sm transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Editar no Canva/Google
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${post.isLikedByUser ? 'text-red-500 dark:text-red-400' : ''}`}
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending || !user}
              >
                <Heart className="h-4 w-4" />
                <span>{post.likesCount}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => document.getElementById('comment-input')?.focus()}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{post.commentsCount}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                <span>{post.sharesCount}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Comentários</h2>
          
          {user ? (
            <div className="mb-6 flex gap-3">
              <UserAvatar user={user} size="sm" />
              <div className="flex-1">
                <Textarea
                  id="comment-input"
                  placeholder="Adicione um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="mb-2 resize-none h-20"
                />
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending || !commentText.trim()}
                  >
                    {addCommentMutation.isPending ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Comentar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Card className="mb-6 p-3 text-center">
              <p className="text-sm mb-2">Faça login para comentar neste post</p>
              <Link href="/login">
                <Button size="sm">Entrar na sua conta</Button>
              </Link>
            </Card>
          )}
          
          {post.comments && post.comments.length > 0 ? (
            <div>
              {post.comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  postId={post.id} 
                  onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-zinc-500 dark:text-zinc-400">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            </div>
          )}
        </div>
      </div>
      
      <FooterMenu />
    </div>
  );
};

export default PostDetailPage;