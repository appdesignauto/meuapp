import { useState, useEffect, useRef } from 'react';
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
  Tag,
  ArrowUpRight,
  Sparkles,
  Trophy,
  Clock,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import RelatedArts from '@/components/art/RelatedArts';
import { DesignerSection } from '@/components/art/DesignerSection';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  favoriteCount?: number; // Contagem de favoritos
  shareCount?: number; // Contagem de compartilhamentos
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

  // Mutação para registrar compartilhamento
  const registerShareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/shares", { artId: Number(id) });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidar a query para atualizar os detalhes da arte com o novo contador
      queryClient.invalidateQueries({ queryKey: ['/api/arts', id] });
      toast({
        title: "Compartilhamento registrado",
        description: "Obrigado por compartilhar esta arte!",
      });
    },
    onError: (error) => {
      console.error("Erro ao registrar compartilhamento:", error);
      // Silenciar erro para o usuário - não deve afetar a experiência
    },
  });

  const handleShare = () => {
    // Otimistic update - incrementa o contador localmente antes da resposta da API
    const currentShareCount = art.shareCount || 0;
    
    // Registrar o compartilhamento na API
    registerShareMutation.mutate();
    
    if (navigator.share) {
      navigator.share({
        title: art?.title || 'DesignAuto - Arte Automotiva',
        text: 'Confira esta arte incrível no DesignAuto!',
        url: window.location.href,
      })
      .then(() => {
        toast({
          title: "Compartilhado com sucesso",
          description: "Obrigado por compartilhar nossa arte!",
        });
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
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-0">
          {/* Art Image - Ocupando 4/6 para manter proporção original da imagem */}
          <motion.div 
            className="relative bg-neutral-50 flex items-center justify-center p-4 md:p-6 lg:col-span-4 border-r border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-full relative group">
              <motion.img 
                src={art.imageUrl} 
                alt={art.title} 
                className="w-full h-full object-contain max-h-[80vh] transition-all duration-300 rounded-md"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Badges de status */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                {art.isPremium && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full font-medium shadow-md flex items-center">
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Premium
                    </Badge>
                  </motion.div>
                )}
                
                {art.viewCount && art.viewCount > 10 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full font-medium shadow-md flex items-center">
                      <Trophy className="h-3.5 w-3.5 mr-1" />
                      Popular
                    </Badge>
                  </motion.div>
                )}
                
                {new Date(art.createdAt).getTime() > new Date().getTime() - 7 * 24 * 60 * 60 * 1000 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full font-medium shadow-md flex items-center">
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      Novidade
                    </Badge>
                  </motion.div>
                )}
              </div>
              
              {/* Overlay de informações no hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 rounded-md">
                <div className="text-white">
                  <p className="text-sm font-medium mb-1 flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {art.viewCount || 0} visualizações
                  </p>
                  <p className="text-sm font-medium mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Adicionado há {formatDistance(new Date(art.createdAt), new Date(), { locale: ptBR })}
                  </p>
                </div>
              </div>
              

            </div>
          </motion.div>
          
          {/* Art Details - Agora ocupa 2/6 para um painel lateral mais estreito */}
          <div className="p-5 md:p-6 flex flex-col h-full lg:col-span-2 bg-white">
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
            
            {/* Descrição da arte removida conforme solicitado */}
            
            {/* Benefits Section - Animação e design melhorados */}
            <motion.div 
              className="mb-5 space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex items-start gap-2 text-sm group cursor-default hover:bg-blue-50/40 p-2 rounded-md transition-colors">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Arquivo em formato <span className="font-medium text-blue-700">{art.fileType?.name || 'editável'}</span></span>
              </div>
              
              <div className="flex items-start gap-2 text-sm group cursor-default hover:bg-blue-50/40 p-2 rounded-md transition-colors">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Para qualquer competência e profissional</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm group cursor-default hover:bg-blue-50/40 p-2 rounded-md transition-colors">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Facilmente personalizável</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm group cursor-default hover:bg-blue-50/40 p-2 rounded-md transition-colors">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Qualidade de imagem verificada</span>
              </div>
            </motion.div>
            
            {/* Action Buttons - Redesenhados com animações */}
            <motion.div 
              className="mb-5 space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Button 
                  onClick={handleOpenEdit} 
                  size="lg"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-5 shadow-md"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span className="flex items-center">
                    Editar no {art.fileType?.name || 'Editor'}
                    {art.downloadCount > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {art.downloadCount} {art.downloadCount === 1 ? 'download' : 'downloads'}
                      </span>
                    )}
                  </span>
                </Button>
              </motion.div>
              
              <div className="flex gap-2">
                <motion.div className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Button 
                    variant="outline" 
                    size="default"
                    className="w-full flex items-center justify-center gap-1 border-blue-200 text-blue-600 py-5 hover:bg-blue-50"
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
                        <motion.div
                          animate={liked ? { scale: [1, 1.5, 1] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          <Heart className={`h-4 w-4 ${liked ? 'fill-blue-600 text-blue-600' : ''}`} />
                        </motion.div>
                        <span className="flex items-center">
                          {liked ? 'Favoritado' : 'Favoritar'}
                          {art.favoriteCount > 0 && (
                            <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                              {art.favoriteCount}
                            </span>
                          )}
                        </span>
                      </>
                    )}
                  </Button>
                </motion.div>
                
                <motion.div className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Button 
                    variant="outline" 
                    size="default"
                    className="w-full flex items-center justify-center gap-1 border-blue-200 text-blue-600 py-5 hover:bg-blue-50"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="flex items-center">
                      Compartilhar
                      {art.shareCount > 0 && (
                        <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                          {art.shareCount}
                        </span>
                      )}
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Designer Section - Agora após os botões conforme solicitado */}
            {art.designer && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.45 }}
                className="mb-5"
              >
                <DesignerSection designer={art.designer} userId={user?.id} />
              </motion.div>
            )}
            
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
            
            {/* Metadata - Layout melhorado e mais profissional */}
            <motion.div 
              className="border border-neutral-200 rounded-lg overflow-hidden mt-auto bg-gray-50/50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="bg-gradient-to-r from-blue-50 to-white border-b border-neutral-200 p-3">
                <h3 className="text-sm font-semibold text-blue-700">Especificações do Arquivo</h3>
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-neutral-200">
                <div className="p-3 bg-white hover:bg-blue-50/30 transition-colors">
                  <p className="text-xs text-neutral-500 mb-1">Formato</p>
                  <p className="font-medium text-sm flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    {typeof art.format === 'string' ? art.format : art.format?.name || 'Não especificado'}
                  </p>
                </div>
                
                <div className="p-3 bg-white hover:bg-blue-50/30 transition-colors">
                  <p className="text-xs text-neutral-500 mb-1">Tipo de Arquivo</p>
                  <p className="font-medium text-sm flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    {typeof art.fileType === 'string' ? art.fileType : art.fileType?.name || 'Não especificado'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-white border-y border-neutral-200 p-3">
                <h3 className="text-sm font-semibold text-blue-700">Visualizações e Downloads</h3>
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-neutral-200">
                <div className="p-3 bg-white hover:bg-blue-50/30 transition-colors">
                  <p className="text-xs text-neutral-500 mb-1">Visualizações</p>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="font-medium text-sm">{art.viewCount || 0}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-white hover:bg-blue-50/30 transition-colors">
                  <p className="text-xs text-neutral-500 mb-1">Downloads</p>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="font-medium text-sm">{art.downloadCount || 0}</p>
                  </div>
                </div>
              </div>
              
              {art.category && (
                <div className="p-3 bg-white border-t border-neutral-200 hover:bg-blue-50/30 transition-colors">
                  <p className="text-xs text-neutral-500 mb-1">Categoria</p>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="font-medium text-sm">{art.category.name}</p>
                  </div>
                </div>
              )}
            </motion.div>
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
      
      {/* Related Arts Section - Com animação */}
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <ArrowUpRight className="h-5 w-5 text-blue-600 mr-2" />
            Conheça artes similares
          </h2>
          <Badge 
            variant="outline" 
            className="px-3 py-0.5 text-xs font-normal text-neutral-600 border-neutral-200"
          >
            Baseadas na sua navegação
          </Badge>
        </div>
        
        <RelatedArts artId={Number(id)} />
        
        <div className="mt-8 flex justify-center">
          <Button 
            variant="ghost" 
            className="text-blue-600 flex items-center group"
            onClick={() => setLocation('/')}
          >
            Explorar mais artes
            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}