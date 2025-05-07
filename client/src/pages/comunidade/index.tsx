import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Settings, Plus, Filter, User, Trophy, Clock } from 'lucide-react';

import TopBar from '@/components/TopBar';
import FooterMenu from '@/components/FooterMenu';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorContainer from '@/components/ErrorContainer';
import UserAvatar from '@/components/users/UserAvatar';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

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
const PostCard: React.FC<{ post: CommunityPost }> = ({ post }) => {
  return (
    <Card className="mb-4 overflow-hidden">
      <div className="relative">
        <Link href={`/comunidade/post/${post.id}`}>
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-56 sm:h-64 object-cover hover:opacity-95 transition-opacity cursor-pointer"
          />
        </Link>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserAvatar user={post.user} size="sm" linkToProfile={true} />
            <div>
              <p className="text-sm font-medium">{post.user.name || post.user.username}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(post.createdAt)}</p>
            </div>
          </div>
        </div>
        
        <Link href={`/comunidade/post/${post.id}`}>
          <h3 className="text-lg font-semibold mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
          {post.content}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
        <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
          <span>{post.likesCount} curtidas</span>
        </div>
        <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
          <span>{post.commentsCount} comentários</span>
        </div>
      </CardFooter>
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
        <p className="font-medium text-sm">{user.name || user.username}</p>
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
  
  // Buscar posts da comunidade
  const { data: posts, isLoading: postsLoading, error: postsError, refetch: refetchPosts } = useQuery({
    queryKey: ['/api/community/posts'],
    refetchOnWindowFocus: false,
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
      
      <div className="container max-w-5xl px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Comunidade</h1>
          
          {user && (
            <Link href="/comunidade/criar">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Post
              </Button>
            </Link>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
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
          <TabsContent value="posts" className="space-y-0">
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
            ) : posts && posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post: CommunityPost) => (
                  <PostCard key={post.id} post={post} />
                ))}
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
                  <Link href="/comunidade/criar">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Post
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Tab de Ranking */}
          <TabsContent value="ranking" className="space-y-4">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-2 px-2">
              <Button 
                variant={rankingPeriod === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setRankingPeriod('week')}
              >
                <Clock className="h-3 w-3 mr-1" /> Semanal
              </Button>
              <Button 
                variant={rankingPeriod === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setRankingPeriod('month')}
              >
                <Clock className="h-3 w-3 mr-1" /> Mensal
              </Button>
              <Button 
                variant={rankingPeriod === 'year' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setRankingPeriod('year')}
              >
                <Clock className="h-3 w-3 mr-1" /> Anual
              </Button>
              <Button 
                variant={rankingPeriod === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setRankingPeriod('all')}
              >
                <Trophy className="h-3 w-3 mr-1" /> Geral
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {rankingLoading ? (
                  <div className="p-6 flex justify-center">
                    <LoadingScreen label="Carregando ranking..." />
                  </div>
                ) : rankingError ? (
                  <div className="p-4">
                    <ErrorContainer 
                      title="Erro ao carregar ranking" 
                      description="Não foi possível carregar o ranking da comunidade."
                      onAction={() => refetchRanking()}
                    />
                  </div>
                ) : ranking && ranking.length > 0 ? (
                  <div>
                    {ranking.map((user: RankingUser) => (
                      <RankingUserCard key={user.id} user={user} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4">
                    <Trophy className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                    <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Ranking não disponível
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">
                      Não há dados de ranking suficientes para este período. Comece a participar da comunidade para aparecer no ranking!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <FooterMenu />
    </div>
  );
};

export default CommunityPage;