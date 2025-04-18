import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import useScrollTop from '@/hooks/useScrollTop';
import { 
  ArrowLeft, 
  Eye, 
  Download, 
  Share2, 
  Heart, 
  ExternalLink,
  Calendar, 
  Tag 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import RelatedArts from '@/components/art/RelatedArts';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Interfaces para tipagem de dados
interface RecentArt {
  id: number;
  title: string;
  imageUrl: string;
}

interface Designer {
  id: number;
  name: string | null;
  username: string;
  profileImageUrl: string | null;
  bio: string | null;
  followers: number;
  isFollowing: boolean;
  totalArts?: number;
  recentArts?: RecentArt[];
}

interface Art {
  id: number;
  title: string;
  imageUrl: string;
  description?: string;
  editUrl: string;
  viewCount?: number;
  downloadCount?: number;
  isPremium: boolean;
  isPremiumLocked?: boolean;
  createdAt: string;
  category?: {
    id: number;
    name: string;
  };
  format?: {
    id: number;
    name: string;
  };
  fileType?: {
    id: number;
    name: string;
  };
  designer?: Designer;
}

export default function ArtDetail() {
  // Garantir rolagem para o topo ao navegar para esta página
  useScrollTop();
  
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  // Fetch art details
  const { data: art, isLoading, error } = useQuery({
    queryKey: ['/api/arts', id],
    queryFn: async () => {
      const res = await fetch(`/api/arts/${id}`);
      if (!res.ok) {
        throw new Error('Erro ao carregar detalhes da arte');
      }
      return res.json();
    },
    retry: 1,
  });
  
  // Verificar se a arte está favoritada
  const { data: favoriteStatus } = useQuery({
    queryKey: ['/api/favorites/check', id],
    queryFn: async () => {
      const res = await fetch(`/api/favorites/check/${id}`);
      if (!res.ok) return { isFavorited: false };
      return res.json();
    },
    enabled: !!user && !!id,
  });
  
  // Efeito para sincronizar o estado liked com o resultado da API
  useEffect(() => {
    if (favoriteStatus) {
      setLiked(favoriteStatus.isFavorited);
    }
  }, [favoriteStatus]);
  
  // Mutação para adicionar aos favoritos
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/favorites", { artId: Number(id) });
      return await res.json();
    },
    onSuccess: () => {
      setLiked(true);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', id] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar aos favoritos. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para remover dos favoritos
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/favorites/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      setLiked(false);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', id] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível remover dos favoritos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    setLocation('/');
  };

  // Mutação para registrar download
  const registerDownloadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/downloads", { artId: Number(id) });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      // Não precisamos invalidar a query da arte atual, já que o contador é calculado no backend
    },
    onError: (error) => {
      console.error("Erro ao registrar download:", error);
      // Silenciar erro para o usuário - não deve afetar a experiência
    },
  });
  
  const handleOpenEdit = () => {
    // Para conteúdo premium bloqueado, mostrar mensagem de upgrade
    if (art.isPremiumLocked) {
      toast({
        title: "Conteúdo Premium",
        description: "Assine o plano Premium para acessar este conteúdo",
        variant: "destructive",
      });
      return;
    }

    // If not authenticated, prompt to log in
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Faça login para acessar e editar esta arte",
        variant: "destructive",
      });
      return;
    }
    
    // Registrar download antes de abrir a URL
    registerDownloadMutation.mutate();
    
    // Feedback para o usuário (opcional)
    toast({
      title: "Redirecionando para o editor",
      description: "Abrindo o editor em uma nova janela...",
    });

    // Abrir a URL do editor em uma nova aba
    window.open(art.editUrl, '_blank');
  };

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Faça login para favoritar esta arte",
        variant: "destructive",
      });
      return;
    }

    if (liked) {
      // Remove dos favoritos
      removeFavoriteMutation.mutate();
    } else {
      // Adiciona aos favoritos
      addFavoriteMutation.mutate();
    }
    
    // Feedback visual imediato (será sobrescrito pelo resultado da mutação)
    toast({
      title: liked ? "Removendo dos favoritos..." : "Adicionando aos favoritos...",
      description: liked 
        ? "Removendo a arte da sua lista de favoritos" 
        : "Adicionando a arte à sua lista de favoritos",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: art?.title || 'DesignAuto - Arte Automotiva',
        text: 'Confira esta arte incrível no DesignAuto!',
        url: window.location.href,
      })
      .catch((error) => {
        console.log('Erro ao compartilhar:', error);
      });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast({
            title: "Link copiado",
            description: "Link da arte copiado para a área de transferência",
          });
        })
        .catch(() => {
          toast({
            title: "Erro ao copiar",
            description: "Não foi possível copiar o link para a área de transferência",
            variant: "destructive",
          });
        });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          size="sm"
          className="mb-8 text-blue-600"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a galeria
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-xl overflow-hidden bg-neutral-100">
            <Skeleton className="w-full aspect-square" />
          </div>
          
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-5 w-2/3 mb-6" />
            
            <Skeleton className="h-32 w-full mb-6" />
            
            <div className="flex gap-3 mb-8">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-12" />
              <Skeleton className="h-12 w-12" />
            </div>
            
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
        
        <div className="mt-16">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !art) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erro ao carregar a arte
          </h1>
          <p className="text-gray-600 mb-8">
            Não foi possível carregar os detalhes desta arte. Por favor, tente novamente mais tarde.
          </p>
          <Button onClick={handleBack}>
            Voltar para a galeria
          </Button>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        size="sm"
        className="mb-6 text-blue-600"
        onClick={handleBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a galeria
      </Button>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Art Image - Agora ocupa 2/3 */}
          <div className="relative bg-neutral-50 flex items-center justify-center p-4 md:p-6 lg:col-span-2 border-r border-gray-100">
            <div className="w-full h-full relative">
              <img 
                src={art.imageUrl} 
                alt={art.title} 
                className="w-full h-full object-contain max-h-[80vh]"
              />
              
              {/* Premium Badge */}
              {art.isPremium && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full font-medium shadow-md">
                    Premium
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Art Details - Agora ocupa 1/3 */}
          <div className="p-5 md:p-6 flex flex-col h-full">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              {art.title}
            </h1>
            
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(art.createdAt)}
              </div>
              <span>•</span>
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                {art.category?.name || 'Categoria não especificada'}
              </div>
            </div>
            
            {/* Designer Section - Versão minimalista com foco no botão seguir */}
            {art.designer && (
              <div 
                className="flex items-center justify-between mb-4 py-3 border-t border-b border-neutral-100"
                onClick={() => setLocation(`/designers/${art.designer.username}`)}
              >
                <div className="flex items-center cursor-pointer">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0">
                    {art.designer.profileImageUrl ? (
                      <img 
                        src={art.designer.profileImageUrl}
                        alt={art.designer.name || art.designer.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-medium">
                        {(art.designer.name?.[0] || art.designer.username[0]).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-3">
                    <div className="flex items-center">
                      <p className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors">
                        {art.designer.name || art.designer.username}
                      </p>
                      <span className="mx-2 text-neutral-300">•</span>
                      <p className="text-xs text-neutral-500 flex items-center">
                        <span className="flex items-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                          {art.designer.followers || '0'}
                        </span>
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                          {art.designer.totalArts || '0'}
                        </span>
                      </p>
                    </div>
                    
                    {art.designer.bio && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                        {art.designer.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                {user && user.id !== art.designer.id && (
                  <Button
                    variant={art.designer.isFollowing ? "default" : "outline"}
                    size="sm"
                    className={`text-xs h-8 min-w-[90px] ${
                      art.designer.isFollowing 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "border-blue-300 text-blue-600 hover:bg-blue-50"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation(); // Evita o redirecionamento para o perfil ao clicar no botão
                      
                      if (!user) {
                        toast({
                          title: "Login Necessário",
                          description: "Faça login para seguir este designer",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      const isCurrentlyFollowing = art.designer.isFollowing;
                      
                      // Otimistic UI update
                      const designer = {...art.designer};
                      designer.isFollowing = !isCurrentlyFollowing;
                      if (isCurrentlyFollowing) {
                        designer.followers = (designer.followers || 1) - 1;
                      } else {
                        designer.followers = (designer.followers || 0) + 1;
                      }
                      
                      // Update local state
                      const updatedArt = {...art, designer};
                      
                      // API call
                      fetch(`/api/${isCurrentlyFollowing ? 'unfollow' : 'follow'}/${art.designer.id}`, {
                        method: isCurrentlyFollowing ? 'DELETE' : 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        credentials: 'include'
                      })
                      .then(response => {
                        if (!response.ok) throw new Error('Falha na operação de seguir');
                        return response.json();
                      })
                      .then(() => {
                        toast({
                          title: isCurrentlyFollowing ? "Deixou de seguir" : "Designer seguido",
                          description: isCurrentlyFollowing 
                            ? `Você deixou de seguir ${art.designer.name || art.designer.username}`
                            : `Você está seguindo ${art.designer.name || art.designer.username}`,
                        });
                      })
                      .catch(error => {
                        toast({
                          title: "Erro na operação",
                          description: error.message,
                          variant: "destructive",
                        });
                      });
                    }}
                  >
                    {art.designer.isFollowing ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 6 9 17l-5-5"></path></svg>
                        Seguindo
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Seguir
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            <p className="text-neutral-600 mb-4 text-sm">
              {art.description || 'Sem descrição disponível para esta arte.'}
            </p>
            
            {/* Benefits Section */}
            <div className="mb-5 space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Arquivo em formato {art.fileType?.name || 'editável'}</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Para qualquer competência e profissional</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Facilmente personalizável</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Qualidade de imagem verificada</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mb-5 space-y-2">
              <Button 
                onClick={handleOpenEdit} 
                size="lg"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-5"
              >
                <ExternalLink className="h-5 w-5" />
                Editar no {art.fileType?.name || 'Editor'}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="default"
                  className="flex-1 flex items-center justify-center gap-1 border-blue-200 text-blue-600 py-5"
                  onClick={handleLike}
                  disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                >
                  {addFavoriteMutation.isPending || removeFavoriteMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {liked ? 'Removendo...' : 'Adicionando...'}
                    </>
                  ) : (
                    <>
                      <Heart className={`h-4 w-4 ${liked ? 'fill-blue-600' : ''}`} />
                      {liked ? 'Favoritado' : 'Favoritar'}
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="default"
                  className="flex-1 flex items-center justify-center gap-1 border-blue-200 text-blue-600 py-5"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
            
            {/* Additional Info Box - Mostra o banner premium */}
            {art.isPremiumLocked && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <h3 className="text-amber-800 font-semibold flex items-center gap-2 mb-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                  Acesso Premium Necessário
                </h3>
                <p className="text-xs text-amber-700">
                  Este produto está disponível exclusivamente para os membros premium. 
                  Faça upgrade para uma conta Premium para ter acesso a todo o conteúdo premium.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-2 w-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    toast({
                      title: "Upgrade para Premium",
                      description: "Você será redirecionado para a página de planos premium",
                    });
                    // Navegar para página de planos
                    setLocation('/plans');
                  }}
                >
                  Fazer Upgrade para Premium
                </Button>
              </div>
            )}
            
            {/* Metadata */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden mt-auto">
              <div className="grid grid-cols-2 divide-x divide-neutral-200">
                <div className="p-3">
                  <p className="text-xs text-neutral-500 mb-1">Formato</p>
                  <p className="font-medium text-sm">{art.format?.name || 'Não especificado'}</p>
                </div>
                
                <div className="p-3">
                  <p className="text-xs text-neutral-500 mb-1">Tipo de Arquivo</p>
                  <p className="font-medium text-sm">{art.fileType?.name || 'Não especificado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-neutral-200 border-t border-neutral-200">
                <div className="p-3">
                  <p className="text-xs text-neutral-500 mb-1">Visualizações</p>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="font-medium text-sm">{art.viewCount || 0}</p>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="text-xs text-neutral-500 mb-1">Downloads</p>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="font-medium text-sm">{art.downloadCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Designer Other Arts Section - Se tiver designer */}
      {art.designer && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">
              Mais artes de {art.designer.name || art.designer.username}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 font-medium"
              onClick={() => setLocation(`/designers/${art.designer.username}`)}
            >
              Ver todas
            </Button>
          </div>
          
          {/* Aqui virá um componente para listar as artes do designer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Implementar query para buscar outras artes do designer */}
            {art.designer.recentArts && art.designer.recentArts.length > 0 ? (
              art.designer.recentArts.map((recentArt: RecentArt) => (
                <div 
                  key={recentArt.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 shadow-sm cursor-pointer"
                  onClick={() => {
                    if (recentArt.id !== art.id) {
                      setLocation(`/arts/${recentArt.id}`);
                    }
                  }}
                >
                  <img 
                    src={recentArt.imageUrl} 
                    alt={recentArt.title} 
                    className="w-full h-full object-cover"
                  />
                  {recentArt.id === art.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Arte atual</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Se não tiver artes recentes, mostrar placeholders
              Array(4).fill(0).map((_, index) => (
                <div key={index} 
                  className={`${index > 1 ? 'hidden md:flex' : 'flex'} h-48 bg-neutral-100 rounded-lg items-center justify-center text-neutral-400 text-sm`}
                  onClick={() => setLocation(`/designers/${art.designer.username}`)}
                >
                  <span className="text-center px-2">Ver mais artes no perfil</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Related Arts Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6">
          Conheça artes similares
        </h2>
        <RelatedArts artId={Number(id)} />
      </div>
    </div>
  );
}