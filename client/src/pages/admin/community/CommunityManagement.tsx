import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Check, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Filter,
  RefreshCw,
  User,
  Calendar 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorContainer from '@/components/ErrorContainer';
import UserAvatar from '@/components/users/UserAvatar';

// Interfaces
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

interface CommentData {
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
    name: string | null;
    profileimageurl: string | null;
    nivelacesso: string;
  };
  post: {
    id: number;
    title: string;
  };
}

interface CommentStats {
  totalComments: number;
  hiddenComments: number;
  visibleComments: number;
}

interface PostStats {
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  totalComments?: number;
}

// Componente Principal
const CommunityManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  
  const itemsPerPage = 10;
  
  // Buscar estatísticas gerais
  const { data: stats, isLoading: statsLoading } = useQuery<PostStats>({
    queryKey: ['/api/community/admin/stats'],
    refetchOnWindowFocus: false,
  });
  
  // Buscar posts baseado no status (pendente ou aprovado)
  const postsQuery = useQuery<{posts: CommunityPost[], total: number}>({
    queryKey: [
      '/api/community/admin/posts', 
      activeTab, 
      currentPage, 
      searchQuery, 
      filterUser,
      sortBy,
      new Date().getTime() // Adicionar timestamp para evitar cache
    ],
    refetchInterval: 15000, // Recarregar a cada 15 segundos
    staleTime: 5000, // Considerar dados obsoletos após 5 segundos
    queryFn: async () => {
      const status = activeTab === 'pending' ? 'pending' : 'approved';
      const params = new URLSearchParams({
        status,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (filterUser) {
        params.append('userId', filterUser);
      }
      
      const result = await apiRequest('GET', `/api/community/admin/posts?${params.toString()}`);
      return result.json();
    },
    refetchOnWindowFocus: false,
  });
  
  const posts = postsQuery.data?.posts || [];
  const totalPosts = postsQuery.data?.total || 0;
  const totalPages = Math.ceil(totalPosts / itemsPerPage);
  
  // Buscar comentários para a aba de moderação de comentários
  const commentsQuery = useQuery<{comments: CommentData[], total: number, totalPages: number}>({
    queryKey: [
      '/api/community/admin/comments', 
      currentPage, 
      searchQuery, 
      filterUser,
      sortBy,
      visibilityFilter
    ],
    queryFn: async () => {
      if (activeTab !== 'comments') {
        return { comments: [], total: 0, totalPages: 0 };
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        hideStatus: visibilityFilter
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (filterUser) {
        params.append('userId', filterUser);
      }
      
      if (sortBy) {
        params.append('sortBy', sortBy);
      }
      
      const result = await apiRequest('GET', `/api/community/admin/comments?${params.toString()}`);
      return result.json();
    },
    enabled: activeTab === 'comments',
    refetchOnWindowFocus: false,
  });
  
  const comments = commentsQuery.data?.comments || [];
  const totalComments = commentsQuery.data?.total || 0;
  const totalCommentsPages = commentsQuery.data?.totalPages || 0;
  
  // Mutação para aprovar um post
  const approvePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest('POST', `/api/community/admin/posts/${postId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/stats'] });
      toast({
        description: "Post aprovado com sucesso!"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível aprovar o post: ${error.message}`,
      });
    }
  });
  
  // Mutação para rejeitar um post
  const rejectPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest('POST', `/api/community/admin/posts/${postId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/stats'] });
      toast({
        description: "Post rejeitado com sucesso!"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível rejeitar o post: ${error.message}`,
      });
    }
  });
  
  // Mutação para excluir um post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest('DELETE', `/api/community/admin/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/stats'] });
      toast({
        description: "Post excluído com sucesso!"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível excluir o post: ${error.message}`,
      });
    }
  });
  
  // Mutação para alternar visibilidade de um comentário
  const toggleCommentVisibilityMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest('PATCH', `/api/community/admin/comments/${commentId}/toggle-visibility`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/comments'] });
      const action = data.comment.isHidden ? "ocultado" : "mostrado";
      toast({
        description: `Comentário ${action} com sucesso!`
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível alterar a visibilidade do comentário: ${error.message}`,
      });
    }
  });
  
  // Mutação para excluir um comentário
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest('DELETE', `/api/community/admin/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/admin/stats'] });
      toast({
        description: "Comentário excluído com sucesso!"
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
  
  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Função para realizar pesquisa
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchQuery(searchTerm);
  };
  
  // Função para limpar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSearchQuery('');
    setFilterUser('');
    setSortBy('newest');
    setCurrentPage(1);
  };
  
  // Componente para exibir a paginação
  const Pagination = () => {
    const isCommentsTab = activeTab === 'comments';
    const pages = isCommentsTab ? totalCommentsPages : totalPages;
    
    if (pages <= 1) return null;
    
    return (
      <div className="flex items-center justify-center gap-1 mt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          let pageNumber;
          
          if (pages <= 5) {
            pageNumber = i + 1;
          } else {
            if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= pages - 2) {
              pageNumber = pages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }
          }
          
          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          );
        })}
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.min(pages, currentPage + 1))}
          disabled={currentPage === pages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };
  
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Gerenciamento da Comunidade</h1>
        <Link href="/comunidade" target="_blank">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Ver Comunidade
          </Button>
        </Link>
      </div>
      
      {/* Card de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total de Posts</p>
            {statsLoading ? (
              <div className="h-8 w-8"><LoadingScreen size="sm" label="" /></div>
            ) : (
              <h3 className="text-2xl font-bold">{stats?.totalPosts || 0}</h3>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">Pendentes</p>
            {statsLoading ? (
              <div className="h-8 w-8"><LoadingScreen size="sm" label="" /></div>
            ) : (
              <h3 className="text-2xl font-bold text-amber-500">{stats?.pendingPosts || 0}</h3>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">Aprovados</p>
            {statsLoading ? (
              <div className="h-8 w-8"><LoadingScreen size="sm" label="" /></div>
            ) : (
              <h3 className="text-2xl font-bold text-green-500">{stats?.approvedPosts || 0}</h3>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros e pesquisa */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <form onSubmit={handleSearch} className="flex space-x-2">
                <Input
                  placeholder="Pesquisar posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
            
            <div className="flex space-x-2">
              <Select
                value={sortBy}
                onValueChange={setSortBy}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="most_likes">Mais curtidos</SelectItem>
                  <SelectItem value="most_comments">Mais comentados</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleClearFilters}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs de navegação */}
      <Tabs value={activeTab} onValueChange={(value) => { 
          setActiveTab(value); 
          setCurrentPage(1); 
          
          // Atualizar placeholder e filtros específicos para a aba de comentários
          if (value === 'comments') {
            setVisibilityFilter('all');
          }
        }}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="pending">
            Pendentes
            {stats?.pendingPosts ? (
              <Badge variant="secondary" className="ml-2">{stats.pendingPosts}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovados
            {stats?.approvedPosts ? (
              <Badge variant="secondary" className="ml-2">{stats.approvedPosts}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="comments">
            Comentários
            {stats?.totalComments ? (
              <Badge variant="secondary" className="ml-2">{stats.totalComments}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
        
        {/* Conteúdo das Tabs */}
        <TabsContent value="pending" className="space-y-4">
          {postsQuery.isLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingScreen label="Carregando posts pendentes..." />
            </div>
          ) : postsQuery.error ? (
            <ErrorContainer 
              title="Erro ao carregar posts" 
              description="Não foi possível carregar os posts pendentes." 
              onAction={() => postsQuery.refetch()}
            />
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground opacity-25 mb-2" />
              <h3 className="text-lg font-medium">Nenhum post pendente</h3>
              <p className="text-muted-foreground mt-1">
                Não há posts aguardando aprovação no momento.
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-[300px_1fr] gap-4">
                    <div className="relative aspect-video md:aspect-auto">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={post.user} size="sm" linkToProfile={true} />
                          <div>
                            <p className="text-sm font-medium">{post.user.name || post.user.username}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => approvePostMutation.mutate(post.id)}
                            disabled={approvePostMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Rejeitar post</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja rejeitar este post? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => rejectPostMutation.mutate(post.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Rejeitar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      
                      <Link href={`/comunidade?postId=${post.id}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver post
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Pagination />
            </>
          )}
        </TabsContent>
        
        <TabsContent value="approved" className="space-y-4">
          {postsQuery.isLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingScreen label="Carregando posts aprovados..." />
            </div>
          ) : postsQuery.error ? (
            <ErrorContainer 
              title="Erro ao carregar posts" 
              description="Não foi possível carregar os posts aprovados." 
              onAction={() => postsQuery.refetch()}
            />
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground opacity-25 mb-2" />
              <h3 className="text-lg font-medium">Nenhum post aprovado</h3>
              <p className="text-muted-foreground mt-1">
                Não há posts aprovados no momento.
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-[300px_1fr] gap-4">
                    <div className="relative aspect-video md:aspect-auto">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={post.user} size="sm" linkToProfile={true} />
                          <div>
                            <p className="text-sm font-medium">{post.user.name || post.user.username}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <Check className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir post</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deletePostMutation.mutate(post.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{post.likesCount} curtidas</span>
                          <span>{post.commentsCount} comentários</span>
                        </div>
                        
                        <Link href={`/comunidade?postId=${post.id}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver post
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Pagination />
            </>
          )}
        </TabsContent>
        
        {/* Aba de comentários */}
        <TabsContent value="comments" className="space-y-4">
          {/* Filtros específicos para comentários */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={visibilityFilter}
                  onValueChange={setVisibilityFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os comentários</SelectItem>
                    <SelectItem value="visible">Comentários visíveis</SelectItem>
                    <SelectItem value="hidden">Comentários ocultos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {commentsQuery.isLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingScreen label="Carregando comentários..." />
            </div>
          ) : commentsQuery.error ? (
            <ErrorContainer 
              title="Erro ao carregar comentários" 
              description="Não foi possível carregar os comentários." 
              onAction={() => commentsQuery.refetch()}
            />
          ) : comments.length === 0 ? (
            <div className="py-20 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground opacity-25 mb-2" />
              <h3 className="text-lg font-medium">Nenhum comentário encontrado</h3>
              <p className="text-muted-foreground mt-1">
                Não há comentários que correspondam aos critérios de filtro atuais.
              </p>
            </div>
          ) : (
            <>
              {comments.map(({comment, user, post}) => (
                <Card key={comment.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={user} size="sm" linkToProfile={true} />
                          <div>
                            <p className="text-sm font-medium">{user.name || user.username}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={comment.isHidden 
                              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                              : "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"}
                            onClick={() => toggleCommentVisibilityMutation.mutate(comment.id)}
                            disabled={toggleCommentVisibilityMutation.isPending}
                          >
                            {comment.isHidden ? (
                              <Eye className="h-4 w-4 mr-1" />
                            ) : (
                              <Eye className="h-4 w-4 mr-1" />
                            )}
                            {comment.isHidden ? "Mostrar" : "Ocultar"}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir comentário</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <div className="bg-muted/40 p-3 rounded-md">
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-muted-foreground">
                          {comment.isHidden ? "Oculto" : "Visível"}
                        </Badge>
                        
                        <Link href={`/comunidade?postId=${post.id}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver post: {post.title}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Pagination />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityManagement;