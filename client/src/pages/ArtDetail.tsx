import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import useScrollTop from '@/hooks/useScrollTop';
import { 
  ArrowLeft, 
  ArrowRight,
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
  ChevronRight,
  ChevronLeft,
  Grid,
  LayoutGrid, 
  Check,
  Layers,
  Layout
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
  groupId?: string; // ID do grupo para associar formatos relacionados
  format?: string | { id: number; name: string; }; // Pode ser um slug ou um objeto de formato
  category?: {
    id: number;
    name: string;
    slug?: string;
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
  
  // Verificar o ID do grupo usando a rota de admin
  const { data: groupInfo } = useQuery({
    queryKey: ['/api/admin/arts/check-group', id],
    queryFn: async () => {
      if (!id) {
        console.log('ID da arte não disponível, não é possível verificar groupId');
        return { groupId: null };
      }
      console.log(`Verificando groupId da arte ${id}`);
      try {
        const res = await fetch(`/api/admin/arts/${id}/check-group`);
        if (!res.ok) {
          console.error(`Erro ao verificar groupId: ${res.status} ${res.statusText}`);
          return { groupId: null };
        }
        const data = await res.json();
        console.log('Dados do groupId:', data);
        return data;
      } catch (error) {
        console.error('Exceção ao verificar groupId:', error);
        return { groupId: null };
      }
    },
    enabled: !!id && !!user && (user.nivelacesso === 'admin' || user.nivelacesso === 'designer_adm' || user.nivelacesso === 'designer'),
  });

  // Buscar artes do mesmo grupo (para exibir outros formatos)
  const { data: groupArts } = useQuery({
    queryKey: ['/api/admin/arts/group', groupInfo?.groupId],
    queryFn: async () => {
      if (!groupInfo?.groupId) {
        console.log('Arte não possui groupId confirmado, retornando array vazio');
        return { arts: [] };
      }
      console.log(`Buscando artes do grupo: ${groupInfo.groupId}`);
      try {
        // Usar a rota de admin que sabemos que funciona
        const res = await fetch(`/api/admin/arts/group/${groupInfo.groupId}`);
        if (!res.ok) {
          console.error(`Erro ao buscar artes do grupo: ${res.status} ${res.statusText}`);
          return { arts: [] };
        }
        const data = await res.json();
        console.log('Dados do grupo recebidos:', data);
        return data;
      } catch (error) {
        console.error('Exceção ao buscar artes do grupo:', error);
        return { arts: [] };
      }
    },
    enabled: !!groupInfo?.groupId && !!user && (user.nivelacesso === 'admin' || user.nivelacesso === 'designer_adm' || user.nivelacesso === 'designer'),
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
  
  // Função para verificar se o usuário tem acesso ao conteúdo premium
  const userHasPremiumAccess = () => {
    if (!user) return false;
    
    // Verificar se o usuário tem acesso premium
    return user.tipoplano === 'mensal' || 
           user.tipoplano === 'anual' || 
           user.tipoplano === 'vitalicio' || 
           user.tipoplano === 'personalizado' || 
           user.acessovitalicio || 
           user.nivelacesso === 'admin' || 
           user.nivelacesso === 'designer_adm';
  };

  // Função para lidar com o clique no botão de edição para conteúdo premium
  const handleOpenPremiumEdit = () => {
    // Verificar se o usuário é premium
    if (!userHasPremiumAccess()) {
      // Redirecionar para página de planos
      setLocation('/planos');
      return;
    }
    
    // Se o usuário for premium, abrir o link de edição
    registerDownloadMutation.mutate();
    
    toast({
      title: "Redirecionando para o editor",
      description: "Abrindo o editor em uma nova janela...",
    });

    // Abrir a URL do editor em uma nova aba
    window.open(art.editUrl, '_blank');
  };

  const handleOpenEdit = () => {
    // Para conteúdo premium bloqueado, tratar de forma diferente
    if (art.isPremiumLocked) {
      handleOpenPremiumEdit();
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
                    {art.viewCount > 0 ? `${art.viewCount} visualizações` : "Nova"}
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
                {art.category?.name || 'Não especificada'}
              </div>
            </div>
            
            {/* Designer Section - Posicionada estrategicamente após metadados */}
            {art.designer && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-1"
              >
                <DesignerSection designer={art.designer} userId={user?.id} />
              </motion.div>
            )}
            
            {/* Descrição da arte removida conforme solicitado */}
            
            {/* Benefits Section - Animação e design melhorados */}
            <motion.div 
              className="mb-2 space-y-1"
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
              className="mb-1.5"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: art.isPremiumLocked ? 1 : 1.02 }}
                whileTap={{ scale: art.isPremiumLocked ? 1 : 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {art.isPremiumLocked ? (
                  <Button 
                    onClick={handleOpenPremiumEdit} 
                    size="lg"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-amber-500 hover:to-amber-600 py-5 shadow-md hover:text-white group"
                  >
                    <ExternalLink className="h-5 w-5 group-hover:hidden" />
                    <Sparkles className="h-5 w-5 hidden group-hover:block" />
                    <span className="flex items-center font-semibold">
                      <span className="group-hover:hidden">EDITAR NO CANVA</span>
                      <span className="hidden group-hover:inline-block">FAÇA UPGRADE PARA PREMIUM</span>
                    </span>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleOpenEdit} 
                    size="lg"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-5 shadow-md"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span className="flex items-center font-semibold">
                      EDITAR ARTE
                      {art.downloadCount > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-normal">
                          {art.downloadCount} {art.downloadCount === 1 ? 'download' : 'downloads'}
                        </span>
                      )}
                    </span>
                  </Button>
                )}
              </motion.div>
              
              <div className="flex gap-1.5 mt-1">
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
            
            {/* Designer Section já está posicionada após o título e metadados */}
            
            {/* Notificação Premium sem botão - apenas informativa */}
            {art.isPremiumLocked && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                <h3 className="text-amber-800 font-semibold flex items-center gap-2 mb-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                  Acesso Premium Necessário
                </h3>
                <p className="text-xs text-amber-700">
                  Este produto está disponível exclusivamente para os membros premium. 
                  Faça upgrade para uma conta Premium para ter acesso a todo o conteúdo premium.
                </p>
              </div>
            )}
            
            {/* Metadata - Layout melhorado e mais profissional */}
            <motion.div 
              className="border border-neutral-200 rounded-lg overflow-hidden mt-1.5 bg-gray-50/50"
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
              
              {/* Dropdown de formatos disponíveis mais intuitivo para leigos */}
              {groupArts && groupArts.arts && groupArts.arts.length > 1 && (
                <div className="border-t border-neutral-200">
                  {/* Estado inicial fechado - Header com dropdown claramente clicável */}
                  <div 
                    className="p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-md m-2 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      const dropdown = document.getElementById('formatosDropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                      const icon = document.getElementById('dropdownIcon');
                      if (icon) {
                        icon.classList.toggle('rotate-180');
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 text-blue-600 mr-2" />
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Formatos Disponíveis</p>
                    </div>
                    <div className="flex items-center">
                      <Badge 
                        variant="outline" 
                        className="px-2 py-0.5 text-xs font-normal text-blue-600 border-blue-200 bg-blue-50/50 mr-2"
                      >
                        {groupArts.arts.findIndex(art => art.id === Number(id)) + 1} de {groupArts.arts.length}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 px-2 py-0 text-[10px] font-medium flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 animate-pulse"
                      >
                        CLIQUE PARA VER OPÇÕES
                        <ChevronRight id="dropdownIcon" className="h-3 w-3 text-blue-600 transition-transform duration-200" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Conteúdo do dropdown - inicialmente oculto */}
                  <div id="formatosDropdown" className="hidden bg-white border border-blue-100 shadow-md m-2 mt-0 rounded-md">
                    <div className="p-3">
                      {/* Cabeçalho explicativo */}
                      <div className="bg-blue-50 p-2 rounded mb-3 border border-blue-100">
                        <p className="text-xs text-blue-700">
                          <span className="font-medium">Dica:</span> Escolha outra versão desta mesma arte em um formato diferente.
                        </p>
                      </div>
                      
                      {/* Seletor de formatos estilizado */}
                      <div className="flex flex-col space-y-2">
                        {/* Navegação rápida - compacta */}
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-neutral-500">Clique em um formato para visualizar:</span>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = groupArts.arts.findIndex(art => art.id === Number(id));
                                const prevIndex = currentIndex > 0 ? currentIndex - 1 : groupArts.arts.length - 1;
                                setLocation(`/arts/${groupArts.arts[prevIndex].id}`);
                              }}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = groupArts.arts.findIndex(art => art.id === Number(id));
                                const nextIndex = currentIndex < groupArts.arts.length - 1 ? currentIndex + 1 : 0;
                                setLocation(`/arts/${groupArts.arts[nextIndex].id}`);
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Lista compacta de formatos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {groupArts.arts.map((formatArt: any) => {
                            // Obter informações de dimensões para cada formato
                            const getFormatDimensions = (format: string) => {
                              switch(format.toLowerCase()) {
                                case 'stories': return '1080×1920px';
                                case 'feed': return '1080×1080px';
                                case 'cartaz': return '768×1024px';
                                case 'web banner': case 'banner': return '1200×628px';
                                case 'capa fan page': case 'cover': return '820×312px';
                                case 'carrocel': return '1080×1080px';
                                default: return '';
                              }
                            };
                            
                            // Obter ícone para cada formato
                            const getFormatIcon = (format: string) => {
                              switch(format.toLowerCase()) {
                                case 'stories': return <Layers className="h-3.5 w-3.5" />;
                                case 'feed': return <Grid className="h-3.5 w-3.5" />;
                                case 'cartaz': return <Layers className="h-3.5 w-3.5" />;
                                case 'web banner': case 'banner': return <LayoutGrid className="h-3.5 w-3.5" />;
                                case 'capa fan page': case 'cover': return <Layout className="h-3.5 w-3.5" />;
                                case 'carrocel': return <LayoutGrid className="h-3.5 w-3.5" />;
                                default: return <Layout className="h-3.5 w-3.5" />;
                              }
                            };
                            
                            const isCurrentFormat = formatArt.id === Number(id);
                            
                            return (
                              <div
                                key={formatArt.id}
                                className={`
                                  flex items-center p-2 rounded cursor-pointer transition-all duration-200
                                  ${isCurrentFormat 
                                    ? 'bg-blue-100/70 border border-blue-200' 
                                    : 'bg-gray-50 border border-transparent hover:bg-blue-50 hover:border-blue-100'}
                                `}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isCurrentFormat) {
                                    setLocation(`/arts/${formatArt.id}`);
                                  }
                                }}
                              >
                                {/* Miniatura do formato */}
                                <div className="relative h-8 w-8 bg-white rounded overflow-hidden border border-gray-200 shadow-sm mr-2 flex-shrink-0">
                                  <img 
                                    src={formatArt.imageUrl} 
                                    alt={formatArt.format}
                                    className="w-full h-full object-cover"
                                  />
                                  {isCurrentFormat && (
                                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                      <Check className="h-3 w-3 text-blue-600" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Informações compactas do formato */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center">
                                    <span className="flex items-center text-xs font-medium text-gray-900 capitalize truncate">
                                      {getFormatIcon(formatArt.format)}
                                      <span className="ml-1 truncate">{formatArt.format}</span>
                                    </span>
                                    <span className="ml-1 text-[10px] text-gray-500 hidden sm:inline">{getFormatDimensions(formatArt.format)}</span>
                                  </div>
                                </div>
                                
                                {/* Indicador de selecionado - versão compacta */}
                                {isCurrentFormat && (
                                  <Badge className="ml-1 bg-blue-600 text-white text-[10px] py-0 px-1.5 h-4">Atual</Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* A seção Outros Formatos foi removida conforme solicitado */}

      {/* Designer Other Arts Section - Vitrine Pinterest */}
      {/* A primeira seção de "Artes relacionadas" foi removida conforme solicitado */}
      
      {/* Related Arts Section - Com animação */}
      <motion.div 
        className="bg-white rounded-xl shadow-md p-6"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <LayoutGrid className="h-5 w-5 text-blue-600 mr-2" />
            Artes relacionadas
          </h2>
          <Badge 
            variant="outline" 
            className="px-3 py-0.5 text-xs font-normal text-neutral-600 border-neutral-200"
          >
            Baseadas em palavras-chave
          </Badge>
        </div>
        
        <RelatedArts 
          artId={Number(id)} 
          limit={12}
          originalCategory={art?.category}
          currentGroupId={art?.groupId} 
          designerName={art?.designer?.name || art?.designer?.username || "Design Auto"}
        />
        
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