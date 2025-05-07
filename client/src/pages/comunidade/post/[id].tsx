import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Bookmark, Share2, RefreshCw, Award, ChevronLeft, Send, EyeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import clsx from 'clsx';
import TopBar from '@/components/TopBar';
import FooterMenu from '@/components/FooterMenu';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorContainer from '@/components/ErrorContainer';
import UserAvatar from '@/components/users/UserAvatar';
import { Textarea } from '@/components/ui/textarea';

// Tipos para os dados do post
interface PostDetail {
  post: {
    id: number;
    title: string;
    content: string;
    imageUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    views: number;
    createdAt: string;
    updatedAt: string;
    userId: number;
    isWeeklyFeatured: boolean;
  };
  user: {
    id: number;
    username: string;
    name: string;
    profileimageurl: string;
    nivelacesso: string;
  };
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  userHasLiked?: boolean;
  userHasSaved?: boolean;
}

// Tipo para comentários do post
interface PostComment {
  comment: {
    id: number;
    postId: number;
    userId: number;
    content: string;
    isHidden: boolean;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: number;
    username: string;
    name: string;
    profileimageurl: string;
    nivelacesso: string;
  };
}

// Componente de comentário individual
const CommentItem: React.FC<{ comment: PostComment }> = ({ comment }) => {
  return (
    <div className="flex gap-3 mb-4">
      <UserAvatar 
        user={comment.user} 
        size="sm" 
        className="flex-shrink-0"
      />
      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-white">
            {comment.user.name || comment.user.username}
          </h4>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {new Date(comment.comment.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </span>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
          {comment.comment.content}
        </p>
      </div>
    </div>
  );
};

// Página de detalhes do post
const PostDetailPage: React.FC = () => {
  const params = useParams();
  const postId = parseInt(params.id);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  
  // Query para buscar detalhes do post
  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
    refetch: refetchPost
  } = useQuery({
    queryKey: [`/api/community/posts/${postId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/community/posts/${postId}`);
      return await res.json() as PostDetail;
    }
  });
  
  // Query para buscar comentários do post
  const {
    data: comments,
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments
  } = useQuery({
    queryKey: [`/api/community/posts/${postId}/comments`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/community/posts/${postId}/comments`);
      return await res.json() as PostComment[];
    }
  });
  
  // Mutation para dar like no post
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post?.userHasLiked) {
        // Se já deu like, remover
        const res = await apiRequest('DELETE', `/api/community/posts/${postId}/like`);
        return await res.json();
      } else {
        // Se não deu like, adicionar
        const res = await apiRequest('POST', `/api/community/posts/${postId}/like`);
        return await res.json();
      }
    },
    onSuccess: () => {
      // Atualizar dados do post
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar sua ação",
        variant: "destructive"
      });
    }
  });
  
  // Mutation para salvar o post
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (post?.userHasSaved) {
        // Se já salvou, remover
        const res = await apiRequest('DELETE', `/api/community/posts/${postId}/save`);
        return await res.json();
      } else {
        // Se não salvou, adicionar
        const res = await apiRequest('POST', `/api/community/posts/${postId}/save`);
        return await res.json();
      }
    },
    onSuccess: () => {
      // Atualizar dados do post
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar sua ação",
        variant: "destructive"
      });
    }
  });
  
  // Mutation para adicionar comentário
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/community/posts/${postId}/comments`, { content });
      return await res.json();
    },
    onSuccess: () => {
      // Limpar campo de comentário
      setComment('');
      
      // Atualizar lista de comentários
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}/comments`] });
      
      // Atualizar contagem de comentários no post
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
      
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handlers para ações
  const handleLike = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para curtir publicações",
        variant: "default"
      });
      setLocation('/auth');
      return;
    }
    
    likeMutation.mutate();
  };
  
  const handleSave = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para salvar publicações",
        variant: "default"
      });
      setLocation('/auth');
      return;
    }
    
    saveMutation.mutate();
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.post.title || 'Post do DesignAuto',
        text: post?.post.content || 'Confira este post na comunidade DesignAuto',
        url: window.location.href,
      }).catch(error => {
        console.error('Erro ao compartilhar:', error);
      });
    } else {
      // Fallback para navegadores que não suportam a API Share
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link copiado",
          description: "O link foi copiado para a área de transferência",
        });
      }).catch(() => {
        toast({
          title: "Erro ao copiar link",
          description: "Não foi possível copiar o link",
          variant: "destructive"
        });
      });
    }
  };
  
  const handleAddComment = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para comentar",
        variant: "default"
      });
      setLocation('/auth');
      return;
    }
    
    if (!comment.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Digite um comentário antes de enviar",
        variant: "destructive"
      });
      return;
    }
    
    commentMutation.mutate(comment);
  };
  
  // Carregando ou erro
  if (postLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <TopBar title="Carregando..." showBack />
        <div className="flex-1 flex items-center justify-center">
          <LoadingScreen label="Carregando detalhes do post..." />
        </div>
        <FooterMenu />
      </div>
    );
  }
  
  if (postError || !post) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <TopBar title="Erro" showBack />
        <div className="flex-1 flex items-center justify-center p-4">
          <ErrorContainer
            title="Não foi possível carregar o post"
            description="Este post pode não existir ou não estar disponível"
            actionLabel="Tentar novamente"
            onAction={() => refetchPost()}
          />
        </div>
        <FooterMenu />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopBar title={post.post.title} showBack />
      
      <main className="flex-1 container px-4 py-6 max-w-4xl">
        <div className="mb-4">
          <Link 
            href="/comunidade" 
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para a comunidade
          </Link>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="relative">
            <img 
              src={post.post.imageUrl || '/no-image.webp'} 
              alt={post.post.title}
              className="w-full object-cover max-h-[50vh]"
            />
            
            {post.post.isWeeklyFeatured && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-1 px-3 rounded-full font-medium flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Destaque da Semana
              </div>
            )}
          </div>
          
          <div className="p-6">
            <div className="flex items-center mb-4">
              <UserAvatar 
                user={post.user} 
                size="md" 
                className="mr-3" 
              />
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-white">
                  {post.user.name || post.user.username}
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(post.post.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
              {post.post.title}
            </h1>
            
            {post.post.content && (
              <p className="text-zinc-700 dark:text-zinc-300 mb-6 whitespace-pre-wrap">
                {post.post.content}
              </p>
            )}
            
            <div className="flex items-center justify-between py-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex space-x-5">
                <button 
                  onClick={handleLike}
                  className={clsx(
                    "flex items-center gap-2 py-1 px-2 rounded-lg transition-colors",
                    likeMutation.isPending && "opacity-70 pointer-events-none",
                    post.userHasLiked 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                  )}
                  disabled={likeMutation.isPending}
                >
                  {likeMutation.isPending ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-5 w-5" />
                  )}
                  <span>{post.likesCount}</span>
                </button>
                
                <button 
                  onClick={handleSave}
                  className={clsx(
                    "flex items-center gap-2 py-1 px-2 rounded-lg transition-colors",
                    saveMutation.isPending && "opacity-70 pointer-events-none",
                    post.userHasSaved 
                      ? "text-purple-600 dark:text-purple-400" 
                      : "text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                  )}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                  <span>{post.savesCount}</span>
                </button>
                
                <div className="flex items-center gap-2 py-1 px-2 text-zinc-600 dark:text-zinc-400">
                  <EyeIcon className="h-5 w-5" />
                  <span>{post.post.views}</span>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare}
                className="text-zinc-600 dark:text-zinc-400"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
            Comentários ({post.commentsCount || 0})
          </h2>
          
          <div className="flex mb-6">
            <UserAvatar 
              user={user || { id: 0, name: "", username: "", profileimageurl: "", nivelacesso: "" }}
              size="sm" 
              className="flex-shrink-0 mr-3 mt-1"
            />
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder={user ? "Adicione um comentário..." : "Faça login para comentar"}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                disabled={!user || commentMutation.isPending}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!user || !comment.trim() || commentMutation.isPending}
                  size="sm"
                >
                  {commentMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
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
          
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingScreen size="sm" label="Carregando comentários..." />
            </div>
          ) : commentsError ? (
            <ErrorContainer
              title="Erro ao carregar comentários"
              description="Não foi possível carregar os comentários deste post"
              actionLabel="Tentar novamente"
              onAction={() => refetchComments()}
            />
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <CommentItem key={comment.comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Ainda não há comentários. Seja o primeiro a comentar!
              </p>
            </div>
          )}
        </div>
      </main>
      
      <FooterMenu />
    </div>
  );
};

export default PostDetailPage;