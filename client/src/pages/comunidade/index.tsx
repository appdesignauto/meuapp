import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Settings, Plus, Filter, User, Trophy, Clock, Info, Award, Medal, Sparkles, Users, ImageIcon, ExternalLink, FileEdit, RefreshCw, Loader2, ZoomIn, X, MessageSquare, XCircle, FileQuestion, Globe, Share } from 'lucide-react';
import { differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths } from 'date-fns';

import TopBar from '@/components/TopBar';
import FooterMenu from '@/components/FooterMenu';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorContainer from '@/components/ErrorContainer';
import UserAvatar from '@/components/users/UserAvatar';
import VerifiedUsername from '@/components/users/VerifiedUsername';
import RankingList from '@/components/community/RankingList';
import { CreatePostDialog } from '@/components/community/CreatePostDialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Interface para post na comunidade
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
}

// Interface para ranking na comunidade
interface RankingUser {
  id: number;
  username: string;
  name: string | null;
  profileimageurl: string | null;
  nivelacesso: string;
  points: number;
  rank: number;
}

// Componente de Card do Post
interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  postId: number;
  isHidden: boolean;
  user: {
    id: number;
    username: string;
    name: string | null;
    profileimageurl: string | null;
    nivelacesso: string;
  };
}

// Função para formatar tempo relativo de comentários
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const minutesDiff = differenceInMinutes(now, date);
  if (minutesDiff < 60) {
    return minutesDiff <= 1 ? 'agora mesmo' : `${minutesDiff} min`;
  }
  
  const hoursDiff = differenceInHours(now, date);
  if (hoursDiff < 24) {
    return `${hoursDiff}h`;
  }
  
  const daysDiff = differenceInDays(now, date);
  if (daysDiff < 30) {
    return `${daysDiff}d`;
  }
  
  const monthsDiff = differenceInMonths(now, date);
  return `${monthsDiff}m`;
};

// Componente para exibir comentário individual
const CommentItem: React.FC<{ comment: any }> = ({ comment }) => {
  return (
    <div className="flex gap-2 mb-2">
      <UserAvatar user={comment.user} size="xs" linkToProfile={true} />
      <div className="flex-1">
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
          <span className="font-medium text-xs">
            {comment.user.name || comment.user.username}
          </span>
          <p className="text-xs mt-0.5">{comment.comment.content}</p>
        </div>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
          {formatRelativeTime(comment.comment.createdAt)}
        </p>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: CommunityPost; refetch?: () => void }> = ({ post, refetch }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  // Buscar comentários quando mostrar a área de comentários
  useEffect(() => {
    if (showCommentInput && comments.length === 0) {
      fetchComments();
    }
  }, [showCommentInput]);
  
  // Função para buscar comentários do post
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.slice(0, 3)); // Mostrar apenas os 3 comentários mais recentes
      }
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Função para curtir ou descurtir um post
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
      if (isLiked) {
        // Remover curtida
        const response = await apiRequest("DELETE", `/api/community/posts/${post.id}/like`);
        
        if (response.ok) {
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          toast({
            title: "Curtida removida",
            description: "Você removeu sua curtida deste post",
          });
        } else {
          throw new Error("Não foi possível remover sua curtida");
        }
      } else {
        // Adicionar curtida
        const response = await apiRequest("POST", `/api/community/posts/${post.id}/like`);
        
        if (response.ok) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          toast({
            title: "Post curtido",
            description: "Você curtiu este post",
          });
        } else {
          throw new Error("Não foi possível curtir o post");
        }
      }

      // Atualizar lista de posts se necessário
      if (refetch) {
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua ação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para adicionar um comentário
  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para comentar",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Por favor, digite um comentário",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await apiRequest("POST", `/api/community/posts/${post.id}/comments`, {
        content: commentText.trim()
      });
      
      if (response.ok) {
        toast({
          title: "Comentário adicionado",
          description: "Seu comentário foi publicado com sucesso",
        });
        
        // Atualizar a lista de comentários localmente
        const commentData = await response.json();
        if (commentData) {
          // Adicionar o novo comentário no topo da lista e manter apenas os 3 mais recentes
          setComments(prev => [commentData, ...prev].slice(0, 3));
        }
        
        setCommentText('');
        
        // Atualizar a lista de posts se necessário
        if (refetch) {
          refetch();
        }
      } else {
        throw new Error("Erro ao adicionar comentário");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao adicionar seu comentário",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Função para compartilhar um post
  const handleShare = () => {
    if (!navigator.share) {
      // Fallback para dispositivos que não suportam Web Share API
      toast({
        title: "Compartilhar",
        description: "Copie o link e compartilhe: " + window.location.origin + `/comunidade/post/${post.id}`,
      });
      
      // Copiar para a área de transferência
      navigator.clipboard.writeText(window.location.origin + `/comunidade/post/${post.id}`)
        .then(() => {
          toast({
            title: "Link copiado",
            description: "Link copiado para a área de transferência!",
          });
        })
        .catch(() => {
          toast({
            title: "Erro",
            description: "Não foi possível copiar o link",
            variant: "destructive",
          });
        });
      return;
    }

    // Web Share API
    navigator.share({
      title: post.title,
      text: post.content || "Confira este post na comunidade DesignAuto!",
      url: window.location.origin + `/comunidade/post/${post.id}`,
    }).catch((error) => {
      console.error("Erro ao compartilhar:", error);
    });
  };

  return (
    <Card className="mb-4 overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow w-full max-w-[500px] mx-auto">
      {/* Cabeçalho do post - estilo Facebook/Instagram */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar user={post.user} size="sm" linkToProfile={true} />
          <div>
            <VerifiedUsername user={post.user} className="text-sm" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <button className="text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
      
      {/* Imagem do post - estilo adaptado para mostrar imagem completa com aspecto variável */}
      <Link href={`/comunidade/post/${post.id}`}>
        <div className="relative w-full overflow-hidden bg-black">
          <div className="relative w-full">
            <div className="w-full max-h-[600px] min-h-[200px] flex items-center justify-center">
              <img 
                src={post.imageUrl} 
                alt={post.title}
                className="hover:scale-[1.02] transition-transform duration-500 cursor-pointer max-w-full max-h-[600px] object-contain"
              />
            </div>
          </div>
        </div>
      </Link>
      
      {/* Título abaixo da imagem */}
      <div className="px-4 pt-3 pb-1">
        <Link href={`/comunidade/post/${post.id}`}>
          <h3 className="text-base font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
            {post.title}
          </h3>
        </Link>
      </div>
      
      {/* Conteúdo/descrição abaixo do título */}
      {post.content && (
        <div className="px-4 pt-1 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {post.content}
          </p>
        </div>
      )}
      
      {/* Estatísticas de interação - similar ao Facebook */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </div>
          </div>
          <span>{likesCount} pessoas curtiram isso</span>
        </div>
        <div>
          {post.commentsCount > 0 && `${post.commentsCount} comentários`}
        </div>
      </div>
      
      {/* Botões de ação - estilo Facebook */}
      <div className="px-2 py-1 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
        <button 
          className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors ${
            isLiked 
              ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
              : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          onClick={handleLike}
          disabled={isLoading}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ${isLoading ? "animate-pulse" : ""}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <span className="text-sm font-medium">
            {isLiked ? "Curtido" : "Curtir"}
          </span>
        </button>
        
        <button 
          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          onClick={() => setShowCommentInput(!showCommentInput)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Comentar</span>
        </button>
        
        <button 
          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          onClick={handleShare}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span className="text-sm font-medium">Compartilhar</span>
        </button>
      </div>
      
      {/* Seção de comentários abaixo dos botões (estilo Instagram) */}
      {showCommentInput && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
          {/* Lista de comentários recentes */}
          {comments.length > 0 && (
            <div className="mb-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              ) : (
                <>
                  {comments.map((comment, index) => (
                    <CommentItem key={comment.comment.id + "-" + index} comment={comment} />
                  ))}
                  
                  {post.commentsCount > comments.length && (
                    <Link href={`/comunidade/post/${post.id}`}>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 hover:underline cursor-pointer">
                        Ver todos os {post.commentsCount} comentários
                      </p>
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Formulário para adicionar comentário */}
          {user ? (
            <div className="flex gap-2 items-start">
              <UserAvatar user={user} size="sm" />
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Adicione um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-zinc-500">Mantenha o respeito na comunidade.</p>
                  <Button 
                    size="sm" 
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !commentText.trim()}
                  >
                    {isSubmittingComment ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <span>Comentar</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 space-y-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Faça login para comentar.</p>
              <Link href="/login">
                <Button size="sm" variant="outline">Fazer Login</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// Componente de Card do Usuário no Ranking
const RankingUserCard: React.FC<{ user: RankingUser }> = ({ user }) => {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="text-lg font-bold w-6 text-zinc-400">
        {user.rank}
      </div>
      <UserAvatar user={user} size="sm" linkToProfile={true} />
      <div className="flex-1">
        <VerifiedUsername user={user} className="text-sm" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {user.points} pontos
        </p>
      </div>
    </div>
  );
};

// Componente para post em loading
const PostCardSkeleton: React.FC = () => {
  return (
    <Card className="mb-4 overflow-hidden">
      <Skeleton className="w-full h-56 sm:h-64" />
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Skeleton className="h-8 w-8 rounded-full mr-2" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </CardFooter>
    </Card>
  );
};

// Página principal da comunidade
const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [rankingPeriod, setRankingPeriod] = useState('week');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  // Buscar posts da comunidade
  const { data: posts, isLoading: postsLoading, error: postsError, refetch: refetchPosts } = useQuery({
    queryKey: ['/api/community/posts'],
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Recarrega a cada 30 segundos
  });
  
  // Buscar posts populares
  const { 
    data: popularPosts, 
    isLoading: popularPostsLoading, 
    error: popularPostsError,
    refetch: refetchPopularPosts
  } = useQuery({
    queryKey: ['/api/community/populares'], // NOVA ROTA COM NOME DIFERENTE
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // Recarrega a cada 5 minutos
    retry: 3, // Tenta até 3 vezes em caso de falha
    retryDelay: 3000, // Espera 3 segundos entre as tentativas
    onError: (error) => {
      console.error("Erro ao buscar posts populares:", error);
    },
    onSuccess: (data) => {
      if (!data || !Array.isArray(data)) {
        console.warn("Resposta da API de posts populares não é um array:", data);
      } else if (data.length === 0) {
        console.info("Nenhum post popular encontrado");
      } else {
        console.info(`${data.length} posts populares carregados com sucesso`);
      }
    }
  });
  
  // Buscar ranking dos usuários
  const { data: ranking, isLoading: rankingLoading, error: rankingError, refetch: refetchRanking } = useQuery({
    queryKey: ['/api/community/ranking', rankingPeriod],
    refetchOnWindowFocus: false,
  });
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-16 md:pb-0">
      <TopBar title="Comunidade">
        {user && (
          <Link href="/painel/comunidade">
            <Button variant="ghost" size="icon" className="text-zinc-500">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </TopBar>
      
      <div className="container max-w-6xl px-0 md:px-4 py-6 mx-auto">
        <div className="md:hidden flex justify-between items-center mb-6 px-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Comunidade</h1>
          
          {user && (
            <Button 
              size="sm" 
              className="gap-2"
              onClick={() => setIsCreatePostOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Criar Post
            </Button>
          )}
        </div>
        
        {/* Layout centralizado com colunas laterais */}
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* Sidebar esquerda - similar ao Facebook */}
          <div className="hidden md:block w-full md:w-72 lg:w-80 shrink-0">
            <div className="sticky top-20">
              <Card className="overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Comunidade DesignAuto</CardTitle>
                  <CardDescription>Compartilhe suas criações e inspirações</CardDescription>
                </CardHeader>
                
                <Separator className="mb-2" />
                
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                      <div className="bg-blue-100 dark:bg-blue-900 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Comunidade</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Explore posts da comunidade</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                      <div className="bg-amber-100 dark:bg-amber-900 w-10 h-10 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-300">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Ranking KDGPRO</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Criadores em destaque</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                      <div className="bg-green-100 dark:bg-green-900 w-10 h-10 rounded-full flex items-center justify-center text-green-600 dark:text-green-300">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Destaques da Semana</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Posts mais populares</p>
                      </div>
                    </div>
                  </div>
                  
                  {user && (
                    <Button 
                      className="w-full gap-2"
                      onClick={() => setIsCreatePostOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Criar Post
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              {/* Card de informações do sistema KDGPRO */}
              <Card className="overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Sobre o Sistema KDGPRO</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3 text-sm">
                  <p className="text-zinc-600 dark:text-zinc-300">
                    O ranking KDGPRO premia os criadores mais ativos da comunidade com base em pontos ganhos por
                    contribuições, curtidas e destaques recebidos.
                  </p>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Níveis e Pontos:</h5>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-xs">
                        <User className="h-3 w-3 text-zinc-500" /> <span className="font-medium">Iniciante KDG:</span> <span className="text-zinc-500">0-500 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Award className="h-3 w-3 text-blue-500" /> <span className="font-medium">Colaborador KDG:</span> <span className="text-zinc-500">501-2000 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Medal className="h-3 w-3 text-yellow-500" /> <span className="font-medium">Destaque KDG:</span> <span className="text-zinc-500">2001-5000 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Trophy className="h-3 w-3 text-amber-500" /> <span className="font-medium">Elite KDG:</span> <span className="text-zinc-500">5001-10000 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Sparkles className="h-3 w-3 text-purple-500" /> <span className="font-medium">Lenda KDG:</span> <span className="text-zinc-500">10001+ pontos</span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="mt-2 text-xs py-0 px-2 h-6 gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    Premiação mensal
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Área principal de conteúdo - feed central (estilo Instagram) */}
          <div className="w-full md:w-[470px] flex-shrink-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 px-4 md:px-0">
                <TabsTrigger value="posts">
                  <Filter className="h-4 w-4 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="ranking">
                  <Trophy className="h-4 w-4 mr-2" />
                  Ranking
                </TabsTrigger>
              </TabsList>
              
              {/* Tab de Posts */}
              <TabsContent value="posts" className="space-y-0 px-4 md:px-0">
                {/* Botão de atualização para mostrar posts mais recentes */}
                <div className="mb-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Posts Recentes</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetchPosts()}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Atualizar
                  </Button>
                </div>
                
                {/* Caixa de criação de post - estilo Facebook (visível apenas em desktop) */}
                {user && (
                  <Card className="mb-6 overflow-hidden border border-zinc-100 dark:border-zinc-800 hidden md:block">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="sm" />
                        <button 
                          className="flex-1 text-left p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          onClick={() => setIsCreatePostOpen(true)}
                        >
                          Já compartilhou sua arte hoje?
                        </button>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-around">
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                          onClick={() => setIsCreatePostOpen(true)}
                        >
                          <ImageIcon className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium">Foto</span>
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                          onClick={() => setIsCreatePostOpen(true)}
                        >
                          <ExternalLink className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium">Link</span>
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                          onClick={() => setIsCreatePostOpen(true)}
                        >
                          <FileEdit className="h-5 w-5 text-purple-500" />
                          <span className="text-sm font-medium">Arte</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <PostCardSkeleton key={i} />
                    ))}
                  </div>
                ) : postsError ? (
                  <ErrorContainer 
                    title="Erro ao carregar posts" 
                    description="Não foi possível carregar os posts da comunidade."
                    onAction={() => refetchPosts()}
                  />
                ) : posts && Array.isArray(posts) && posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((item) => {
                      // Mapear a estrutura da API para o formato esperado pelo PostCard
                      const formattedPost: CommunityPost = {
                        id: item.post.id,
                        title: item.post.title,
                        content: item.post.content,
                        imageUrl: item.post.imageUrl,
                        createdAt: item.post.createdAt,
                        likesCount: item.likesCount || 0,
                        commentsCount: item.commentsCount || 0,
                        sharesCount: 0,
                        isApproved: item.post.status === 'approved',
                        userId: item.post.userId,
                        isLikedByUser: item.isLikedByUser || item.userHasLiked || false,
                        user: item.user
                      };
                      return <PostCard key={item.post.id} post={formattedPost} refetch={refetchPosts} />;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <User className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                    <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nenhum post disponível
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">
                      Não há posts publicados na comunidade no momento. Seja o primeiro a compartilhar uma criação!
                    </p>
                    {user && (
                      <Button onClick={() => setIsCreatePostOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Post
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab de Ranking */}
              <TabsContent value="ranking" className="space-y-4 px-4 md:px-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">Ranking KDGPRO</h3>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Info className="h-4 w-4 text-zinc-400" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Sobre o Sistema KDGPRO</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            O ranking KDGPRO premia os criadores mais ativos da comunidade com base em pontos ganhos por
                            contribuições, curtidas e destaques recebidos.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant={rankingPeriod === 'week' ? 'default' : 'outline'} 
                      onClick={() => setRankingPeriod('week')}
                      className="text-xs h-8"
                    >
                      Semanal
                    </Button>
                    <Button 
                      size="sm" 
                      variant={rankingPeriod === 'month' ? 'default' : 'outline'} 
                      onClick={() => setRankingPeriod('month')}
                      className="text-xs h-8"
                    >
                      Mensal
                    </Button>
                    <Button 
                      size="sm" 
                      variant={rankingPeriod === 'year' ? 'default' : 'outline'} 
                      onClick={() => setRankingPeriod('year')}
                      className="text-xs h-8"
                    >
                      Anual
                    </Button>
                    <Button 
                      size="sm" 
                      variant={rankingPeriod === 'all' ? 'default' : 'outline'} 
                      onClick={() => setRankingPeriod('all')}
                      className="text-xs h-8"
                    >
                      Total
                    </Button>
                  </div>
                </div>
                
                <Card className="overflow-hidden border border-zinc-100 dark:border-zinc-800">
                  {rankingLoading ? (
                    <CardContent className="p-0">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800">
                          <Skeleton className="h-5 w-5 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                          <div className="flex-1" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </CardContent>
                  ) : rankingError ? (
                    <CardContent className="p-4 text-center">
                      <p className="text-zinc-500 dark:text-zinc-400 mb-2">Erro ao carregar ranking</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchRanking()}
                      >
                        Tentar novamente
                      </Button>
                    </CardContent>
                  ) : ranking && Array.isArray(ranking) && ranking.length > 0 ? (
                    <CardContent className="p-0">
                      {ranking.map((user) => (
                        <RankingUserCard key={user.id} user={user} />
                      ))}
                    </CardContent>
                  ) : (
                    <CardContent className="p-4 text-center">
                      <p className="text-zinc-500 dark:text-zinc-400">Nenhum usuário no ranking ainda</p>
                    </CardContent>
                  )}
                </Card>
                
                {ranking && Array.isArray(ranking) && ranking.length > 0 && (
                  <div className="bg-gradient-to-b from-transparent to-zinc-50 dark:to-zinc-900 p-4 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                      {rankingPeriod === 'week' && 'Ranking semanal atualizado toda segunda-feira'}
                      {rankingPeriod === 'month' && 'Ranking mensal atualizado no dia 1 de cada mês'}
                      {rankingPeriod === 'year' && 'Ranking anual atualizado em janeiro'}
                      {rankingPeriod === 'all' && 'Ranking geral atualizado diariamente'}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Próxima premiação: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                )}
                
                {/* Component precisa ser ajustado para aceitar o prop period */}
                <RankingList />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Coluna Direita - Conteúdo adicional similar ao Facebook/Instagram */}
          <div className="hidden md:block w-full md:w-72 lg:w-80 shrink-0">
            <div className="sticky top-20">
              {/* Card de usuários populares */}
              <Card className="overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Designers em Destaque</CardTitle>
                  <CardDescription>Criadores populares para seguir</CardDescription>
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* Lista de designers populares */}
                  <div className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 relative rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <img 
                        src="/images/avatars/designer1.jpg" 
                        alt="Designer" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/avatars/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Ana Oliveira</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Designer de Carros
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      Seguir
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 relative rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <img 
                        src="/images/avatars/designer2.jpg" 
                        alt="Designer" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/avatars/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Carlos Mendes</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Especialista em Motos
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      Seguir
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 relative rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <img 
                        src="/images/avatars/designer3.jpg" 
                        alt="Designer" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/avatars/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Mariana Silva</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Artes para Concessionárias
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      Seguir
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Card de posts populares */}
              <Card className="overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Posts Populares</CardTitle>
                      <CardDescription>Conteúdo mais engajado</CardDescription>
                    </div>
                    {popularPostsError && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => refetchPopularPosts()}
                        title="Tentar novamente"
                      >
                        <RefreshCw className="h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 p-4">
                  {popularPostsLoading ? (
                    // Skeleton loading state
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="w-16 h-16 rounded-md shrink-0" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : popularPostsError ? (
                    // Erro ao carregar
                    <div className="text-center py-4">
                      <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Erro ao carregar posts populares
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchPopularPosts()}
                        className="mt-2"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Atualizar
                      </Button>
                    </div>
                  ) : !popularPosts || popularPosts.length === 0 ? (
                    // Nenhum post encontrado
                    <div className="text-center py-4">
                      <FileQuestion className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Nenhum post popular disponível
                      </p>
                    </div>
                  ) : (
                    // Lista de posts populares
                    <>
                      {Array.isArray(popularPosts) && popularPosts.map((item: any) => {
                        // Verificar se o objeto e suas propriedades existem antes de renderizar
                        if (!item || !item.post) {
                          console.log('Item de post popular inválido:', item);
                          return null;
                        }
                        
                        const postId = item.post?.id || 0;
                        const imageUrl = item.post?.imageUrl || '';
                        const title = item.post?.title || 'Post sem título';
                        const likes = item.likesCount || 0;
                        const comments = item.commentsCount || 0;
                        
                        return (
                          <Link 
                            key={postId} 
                            href={`/comunidade/post/${postId}`}
                            className="flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 p-2 rounded-md transition-colors"
                          >
                            <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                              {imageUrl ? (
                                <img 
                                  src={imageUrl} 
                                  alt={title} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://placehold.co/200x200/gray/white?text=DesignAuto";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                  <ImageIcon className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm line-clamp-2">
                                {title}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                {likes} curtidas • {comments} comentários
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Card de dicas e tutoriais */}
              <Card className="overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Dicas & Tutoriais</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="rounded-md p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Dica do dia:</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Use cores contrastantes para destacar as informações principais em seus anúncios.
                    </p>
                  </div>
                  
                  <p className="text-sm">
                    Confira nossos recursos para melhorar suas artes:
                  </p>
                  
                  <div className="space-y-2">
                    <Link href="/videoaulas" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">1</span>
                      <span>Curso de Artes para Instagram</span>
                    </Link>
                    
                    <Link href="/videoaulas" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">2</span>
                      <span>Como criar anúncios atrativos</span>
                    </Link>
                    
                    <Link href="/videoaulas" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">3</span>
                      <span>Edição rápida no Canva</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <FooterMenu />
      
      {/* Dialog de criação de post */}
      <CreatePostDialog
        open={isCreatePostOpen}
        onOpenChange={setIsCreatePostOpen}
      />
    </div>
  );
};

export default CommunityPage;