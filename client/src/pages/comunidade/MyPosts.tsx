import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import { CommunityPost, User } from './types';

interface MyPostsProps {
  user: User | null;
  setIsCreatePostOpen: (open: boolean) => void;
}

export function MyPosts({ user, setIsCreatePostOpen }: MyPostsProps) {
  const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMyPosts = async (currentPage = 1) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/community/my-posts?page=${currentPage}&limit=10`);
      setMyPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
      setPage(currentPage);
    } catch (error) {
      console.error('Erro ao buscar meus posts:', error);
      toast.error('Erro ao carregar seus posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="mb-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Meus Posts</h2>
          {!isLoading && (
            <Badge 
              variant="outline" 
              className="bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs py-0.5 h-5 px-2 flex items-center gap-1.5"
            >
              <MessageSquare className="h-3 w-3 text-zinc-400" />
              <span>{myPosts.length} posts</span>
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchMyPosts(1)}
          className="gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      ) : myPosts.length > 0 ? (
        <>
          {myPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              refetch={() => fetchMyPosts(page)}
              user={user}
            />
          ))}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => fetchMyPosts(newPage)}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Nenhum post encontrado
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Você ainda não fez nenhum post na comunidade.
          </p>
          <Button onClick={() => setIsCreatePostOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Post
          </Button>
        </div>
      )}
    </div>
  );
} 