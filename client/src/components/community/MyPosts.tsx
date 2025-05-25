import React from 'react';
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

interface MyPostsProps {
  setSelectedPostId: (id: number | null) => void;
  setIsPostViewOpen: (open: boolean) => void;
  refetchPopularPosts?: () => void;
}

// PostCard simplificado específico para MyPosts
interface PostCardProps {
  post: any;
  author: any;
  hasLiked: boolean;
  likeCount: number;
  commentCount: number;
  canDelete?: boolean;
  showEditLink?: boolean;
  onPostClick: () => void;
  onRefresh: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  author,
  hasLiked,
  likeCount,
  commentCount,
  onPostClick,
  onRefresh
}) => {
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div onClick={onPostClick}>
        {/* Imagem do post */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-800 dark:to-zinc-900">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ZoomIn className="h-12 w-12 text-zinc-400" />
            </div>
          )}
          
          {/* Badge de status sobreposto */}
          <div className="absolute top-2 right-2">
            {getStatusBadge(post.status)}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Header com avatar e info do autor */}
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium mr-3">
              {author?.name?.charAt(0)?.toUpperCase() || author?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                {author?.name || author?.username || 'Usuário'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(post.createdAt)}
              </div>
            </div>
          </div>

          {/* Título e descrição */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-2">
              {post.title || 'Sem título'}
            </h3>
            {post.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
                {post.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Heart className={`h-4 w-4 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{likeCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{commentCount || 0}</span>
              </div>
            </div>

            {/* Link de edição */}
            {post.editLink && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(post.editLink, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </CardContent>
      </div>
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

  // Contar total de posts
  const totalPosts = myPosts ? myPosts.length : 0;

  // Função para refetch que será passada para o PostCard
  const handleRefresh = () => {
    refetchMyPosts();
    if (refetchPopularPosts) {
      refetchPopularPosts();
    }
  };

  // Estado de loading
  if (myPostsLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meus Posts
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Posts skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                    <Skeleton className="h-48 w-full rounded-lg mt-3" />
                    <div className="flex gap-2 mt-3">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Estado de erro
  if (myPostsError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meus Posts
            </CardTitle>
          </CardHeader>
        </Card>
        <ErrorContainer 
          title="Erro ao carregar seus posts"
          description="Não foi possível carregar suas publicações."
          onAction={() => refetchMyPosts()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header simples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Meus Posts
            {totalPosts > 0 && (
              <Badge variant="outline" className="ml-2">
                {totalPosts} {totalPosts === 1 ? 'post' : 'posts'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Lista de posts */}
      <div>
        {!myPosts || myPosts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="max-w-md mx-auto space-y-3">
                <User className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                <div className="text-zinc-400 dark:text-zinc-500 text-lg">
                  Você ainda não fez nenhum post
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Compartilhe suas criações com a comunidade!
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {myPosts.map((item: any) => (
              <PostCard
                key={item.post.id}
                post={item.post}
                author={item.author}
                hasLiked={item.hasLiked}
                likeCount={item.likeCount}
                commentCount={item.commentCount}
                canDelete={true}
                showEditLink={true}
                onPostClick={() => {
                  setSelectedPostId(item.post.id);
                  setIsPostViewOpen(true);
                }}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPosts;