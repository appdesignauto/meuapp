import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  User, CheckCircle2, Clock, XCircle, Heart, MessageCircle, 
  Share, MoreHorizontal, ExternalLink, ZoomIn 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ErrorContainer from '@/components/ErrorContainer';
import UserAvatar from '@/components/users/UserAvatar';

interface MyPostsProps {
  setSelectedPostId: (id: number | null) => void;
  setIsPostViewOpen: (open: boolean) => void;
  refetchPopularPosts?: () => void;
}

// Componente individual para cada post em "Meus Posts"
const MyPostCard: React.FC<{
  post: any;
  user: any;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  isLikedByUser: boolean;
  onRefresh: () => void;
  setSelectedPostId: (id: number | null) => void;
  setIsPostViewOpen: (open: boolean) => void;
}> = ({ 
  post, 
  user, 
  likesCount, 
  commentsCount, 
  savesCount, 
  isLikedByUser, 
  onRefresh, 
  setSelectedPostId, 
  setIsPostViewOpen 
}) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(isLikedByUser);
  const [currentLikesCount, setCurrentLikesCount] = useState(likesCount);
  const [isLoading, setIsLoading] = useState(false);

  // Função para curtir/descurtir
  const handleLike = async () => {
    setIsLoading(true);
    try {
      if (isLiked) {
        const response = await apiRequest("DELETE", `/api/community/posts/${post.id}/like`);
        if (response.ok) {
          setIsLiked(false);
          setCurrentLikesCount(prev => Math.max(0, prev - 1));
          toast({
            title: "Curtida removida",
            description: "Você removeu sua curtida deste post",
          });
        }
      } else {
        const response = await apiRequest("POST", `/api/community/posts/${post.id}/like`);
        if (response.ok) {
          setIsLiked(true);
          setCurrentLikesCount(prev => prev + 1);
          toast({
            title: "Post curtido",
            description: "Você curtiu este post",
          });
        }
      }
      onRefresh();
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

  // Função para abrir o post em detalhes
  const handleOpenPost = () => {
    setSelectedPostId(post.id);
    setIsPostViewOpen(true);
  };

  return (
    <Card className="mb-5 overflow-hidden border-0 border-b border-b-zinc-200 dark:border-b-zinc-800 sm:border-b-0 sm:border sm:border-zinc-100 sm:dark:border-zinc-800 shadow-none sm:shadow-md hover:shadow-lg transition-all duration-300 ease-in-out w-full sm:max-w-[470px] md:max-w-full mx-0 sm:mx-auto relative">
      {/* Badge de status */}
      <div className="absolute top-4 right-4 z-10">
        {post.status === 'approved' && (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        )}
        {post.status === 'pending' && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )}
        {post.status === 'rejected' && (
          <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        )}
      </div>

      {/* Cabeçalho do post */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserAvatar user={user} size="sm" linkToProfile={true} />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{user.name || user.username}</span>
              {user.nivelacesso === 'admin' && (
                <span className="text-blue-500">
                  <CheckCircle2 className="h-3.5 w-3.5 fill-blue-500 text-white" />
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {post.formattedDate || 'há pouco tempo'}
            </p>
          </div>
        </div>
      </div>

      {/* Imagem do post */}
      {post.imageUrl && (
        <div className="relative">
          <img 
            src={post.imageUrl} 
            alt={post.title || 'Post image'} 
            className="w-full h-auto object-cover cursor-pointer"
            onClick={handleOpenPost}
          />
          <button
            onClick={handleOpenPost}
            className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Conteúdo do post */}
      <CardContent className="p-3">
        {post.title && (
          <h3 className="text-sm font-semibold mb-2 line-clamp-2">{post.title}</h3>
        )}
        {post.content && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3 line-clamp-3">
            {post.content}
          </p>
        )}

        {/* Ações do post */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLoading}
              className={`p-0 h-auto hover:bg-transparent ${
                isLiked ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Heart 
                className={`h-5 w-5 mr-1 ${isLiked ? 'fill-current' : ''}`} 
              />
              <span className="text-sm">{currentLikesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenPost}
              className="p-0 h-auto hover:bg-transparent text-zinc-600 dark:text-zinc-400"
            >
              <MessageCircle className="h-5 w-5 mr-1" />
              <span className="text-sm">{commentsCount}</span>
            </Button>
          </div>

          {post.editLink && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(post.editLink, '_blank')}
              className="p-0 h-auto hover:bg-transparent text-zinc-600 dark:text-zinc-400"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MyPosts: React.FC<MyPostsProps> = ({ 
  setSelectedPostId, 
  setIsPostViewOpen,
  refetchPopularPosts
}) => {
  const { user } = useAuth();

  // Buscar meus posts
  const { 
    data: myPosts, 
    isLoading: myPostsLoading, 
    error: myPostsError,
    refetch: refetchMyPosts
  } = useQuery({
    queryKey: ['/api/community/my-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/community/my-posts?userId=${user.id}&limit=50`);
      if (!response.ok) {
        throw new Error('Falha ao carregar seus posts');
      }
      return response.json();
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  // Contar posts por status para exibir estatísticas
  const statusCounts = React.useMemo(() => {
    if (!myPosts || !Array.isArray(myPosts)) return { all: 0, approved: 0, pending: 0, rejected: 0 };
    
    return myPosts.reduce((counts, item: any) => {
      const status = item.post?.status || 'pending';
      counts.all++;
      if (status === 'approved') counts.approved++;
      else if (status === 'pending') counts.pending++;
      else if (status === 'rejected') counts.rejected++;
      return counts;
    }, { all: 0, approved: 0, pending: 0, rejected: 0 });
  }, [myPosts]);

  // Função para refetch que será passada para o PostCard
  const handleRefresh = () => {
    refetchMyPosts();
    if (refetchPopularPosts) {
      refetchPopularPosts();
    }
  };

  if (!user) {
    return (
      <div className="text-center py-10">
        <User className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
          Faça login para ver seus posts
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          Entre na sua conta para visualizar suas publicações na comunidade.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Meus Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {statusCounts.all}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statusCounts.approved}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Aprovados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {statusCounts.pending}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statusCounts.rejected}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Rejeitados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de posts */}
      <div className="mt-6">
        {myPostsLoading ? (
          // Estado de loading
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
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
              </Card>
            ))}
          </div>
        ) : myPostsError ? (
          // Estado de erro
          <ErrorContainer 
            title="Erro ao carregar seus posts" 
            description="Não foi possível carregar suas publicações."
            onAction={() => refetchMyPosts()}
          />
        ) : !myPosts || myPosts.length === 0 ? (
          // Estado vazio
          <div className="text-center py-10">
            <div className="mb-4">
              <User className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Você ainda não publicou nenhuma arte
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Compartilhe sua primeira criação na comunidade!
            </p>
          </div>
        ) : (
          // Lista de posts usando estrutura similar ao PostCard
          <div className="space-y-4">
            {myPosts.map((item: any) => (
              <MyPostCard
                key={item.post.id}
                post={item.post}
                user={item.user}
                likesCount={item.likesCount || 0}
                commentsCount={item.commentsCount || 0}
                savesCount={item.savesCount || 0}
                isLikedByUser={item.isLikedByUser || item.userHasLiked || false}
                onRefresh={handleRefresh}
                setSelectedPostId={setSelectedPostId}
                setIsPostViewOpen={setIsPostViewOpen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPosts;