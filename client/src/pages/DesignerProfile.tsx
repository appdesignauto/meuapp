import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UsersRound, Eye, Download, ShieldCheck, Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pagination } from "@/components/ui/pagination";
import ArtCard from "@/components/ui/ArtCard";
import { Badge } from "@/components/ui/badge";
import useScrollTop from "@/hooks/useScrollTop";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Designer = {
  id: number;
  name: string;
  username: string;
  bio: string | null;
  profileImageUrl: string | null;
  role: string;
  followers: number;
  following: number;
  createdAt: string;
  isFollowing: boolean;
  location?: string;
  statistics: {
    totalArts: number;
    premiumArts: number;
    totalDownloads: number;
    totalViews: number;
  };
  arts: {
    id: number;
    title: string;
    imageUrl: string;
    format: string;
    isPremium: boolean;
    createdAt: string;
  }[];
};

export default function DesignerProfile() {
  useScrollTop();
  
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [artsPage, setArtsPage] = useState(1);
  const artsPerPage = 12;
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'premium' | 'recentes' | 'emalta'>('todos');
  
  // Função para filtrar artes com base no filtro selecionado
  const filterArts = (arts: Designer['arts']) => {
    switch (activeFilter) {
      case 'premium':
        return arts.filter(art => art.isPremium);
      case 'recentes':
        // Clonar o array para não afetar o original e então ordenar por data mais recente
        return [...arts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'emalta':
        // Procurar artes com mais visualizações (assumindo que temos essa propriedade)
        // Primeiro, verificamos se a arte tem o campo viewCount, e depois ordenamos
        return [...arts].sort((a, b) => {
          // Estas propriedades não são parte da interface inicial, mas podem estar disponíveis
          const viewsA = (a as any).viewcount || 0;
          const viewsB = (b as any).viewcount || 0;
          return viewsB - viewsA;
        });
      case 'todos':
      default:
        return arts;
    }
  };
  
  // Calcular páginas de artes para paginação com filtros aplicados
  const displayedArts = (data: Designer) => {
    const filteredArts = filterArts(data.arts);
    return filteredArts.slice((artsPage - 1) * artsPerPage, artsPage * artsPerPage);
  };
  
  const totalArtsPages = (data: Designer) => {
    const filteredArts = filterArts(data.arts);
    return Math.ceil(filteredArts.length / artsPerPage);
  };
  
  // Buscar detalhes do designer
  const { data, isLoading, error } = useQuery<Designer>({
    queryKey: ["/api/designers", username],
    queryFn: async () => {
      const response = await fetch(`/api/designers/${username}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar detalhes do designer");
      }
      return response.json();
    },
  });
  
  // Mutação para seguir designer
  const followMutation = useMutation({
    mutationFn: async (designerId: number) => {
      const res = await apiRequest("POST", `/api/follow/${designerId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers", username] });
      toast({
        title: "Designer seguido com sucesso",
        description: "Você agora está seguindo este designer",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao seguir designer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutação para deixar de seguir
  const unfollowMutation = useMutation({
    mutationFn: async (designerId: number) => {
      const res = await apiRequest("DELETE", `/api/unfollow/${designerId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designers", username] });
      toast({
        title: "Deixou de seguir com sucesso",
        description: "Você não está mais seguindo este designer",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deixar de seguir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleFollowToggle = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para seguir designers",
        variant: "destructive",
      });
      return;
    }
    
    if (!data) return;
    
    if (data.isFollowing) {
      unfollowMutation.mutate(data.id);
    } else {
      followMutation.mutate(data.id);
    }
  };
  
  const handlePageChange = (page: number) => {
    setArtsPage(page);
  };
  
  // Função para formatar valores estatísticos com sufixos adequados (mil, mi, etc.)
  const formatStatisticValue = (value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' mi';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + ' mil';
    } else {
      return value.toString();
    }
  };
  
  // Função para formatar a data de criação do designer
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    return `${month} de ${year}`;
  };
  
  // Mutação para upload de imagem de perfil
  const profileImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/designers/profile-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer upload da imagem');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/designers', username] });
      toast({
        title: 'Imagem atualizada',
        description: 'Sua imagem de perfil foi atualizada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar imagem',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Criar URL temporária para pré-visualização
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
  };
  
  const handleImageUpload = () => {
    // Resetar a pré-visualização ao concluir
    const cleanup = () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
        setPreviewImage(null);
      }
      
      // Resetar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
      cleanup();
      return;
    }
    
    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('image', file);
    
    profileImageMutation.mutate(formData, {
      onSuccess: () => cleanup(),
      onError: () => cleanup()
    });
  };
  
  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Falha ao carregar perfil</h1>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Designer não encontrado"}
        </p>
        <Button asChild>
          <Link href="/designers">Voltar para Designers</Link>
        </Button>
      </div>
    );
  }
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="secondary" className="ml-2 font-normal">Administrador</Badge>;
      case 'designer_adm':
        return <Badge variant="secondary" className="ml-2 font-normal">Designer Oficial</Badge>;
      case 'designer':
        return <Badge variant="outline" className="ml-2 font-normal">Designer</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className="py-8 max-w-[1200px] mx-auto">
      {/* Profile Header - Estilo mais clean baseado na referência */}
      <div className="mb-12">
        {/* Cover photo com cores geométricas */}
        <div className="h-40 md:h-48 lg:h-52 rounded-lg overflow-hidden relative shadow-sm">
          {/* Background com formas geométricas e cores vibrantes */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-300 to-cyan-200"></div>
          
          {/* Formas decorativas */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Triangulo laranja */}
            <div className="absolute -top-5 -left-10 w-60 h-60 bg-orange-400 rotate-12 opacity-80"></div>
            
            {/* Retângulo azul */}
            <div className="absolute top-5 left-40 w-72 h-44 bg-blue-600 -rotate-12 opacity-80"></div>
            
            {/* Triangulo ciano */}
            <div className="absolute top-0 right-0 w-96 h-full bg-cyan-300 -rotate-45 origin-top-right opacity-80"></div>
          </div>
        </div>
        
        {/* Avatar e informações do perfil */}
        <div className="w-full max-w-3xl mx-auto px-4 relative">
          {/* Logo central na parte superior */}
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-1 shadow-md">
                <Avatar className="h-16 w-16 border border-gray-100">
                  <AvatarImage 
                    src={data.profileImageUrl || ""} 
                    alt={data.name || data.username} 
                  />
                  <AvatarFallback className="text-2xl bg-blue-50 text-blue-500">
                    {data.name ? data.name.charAt(0).toUpperCase() : data.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Badge verificado */}
              <div className="absolute -top-1 -right-1 bg-orange-400 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              
              {user && user.id === data.id && (
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="icon" 
                      className="absolute bottom-0 right-0 rounded-full h-6 w-6 shadow-md"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Atualizar foto de perfil</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Avatar className="h-24 w-24 border">
                          <AvatarImage 
                            src={previewImage || data.profileImageUrl || ""} 
                            alt={data.name || data.username} 
                          />
                          <AvatarFallback className="text-xl">
                            {data.name ? data.name.charAt(0).toUpperCase() : data.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        
                        <div className="flex gap-2">
                          {!previewImage ? (
                            <Button 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={profileImageMutation.isPending}
                            >
                              {profileImageMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              Escolher imagem
                            </Button>
                          ) : (
                            <>
                              <Button 
                                onClick={handleImageUpload}
                                disabled={profileImageMutation.isPending}
                                className="px-4"
                              >
                                {profileImageMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Salvar
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  if (previewImage) {
                                    URL.revokeObjectURL(previewImage);
                                    setPreviewImage(null);
                                  }
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                disabled={profileImageMutation.isPending}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* Conteúdo do perfil */}
          <div className="pt-14 flex flex-col items-center">
            {/* Nome e badges */}
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">
                {data.name || data.username}
              </h1>
              
              <div className="flex items-center justify-center gap-1 mt-2 text-gray-500 text-xs">
                {data.location && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span className="mr-3">{data.location || "Brasil"}</span>
                  </>
                )}
                
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Desde {formatDate(data.createdAt)}</span>
              </div>
            </div>
            
            {/* Bio */}
            <div className="mt-4 px-6 max-w-xl text-center">
              <p className="text-sm text-gray-600">
                Bem-vindo ao nosso perfil oficial, aqui você encontra conteúdos criativos que agregam valor aos seus projetos.
              </p>
            </div>
            
            {/* Botões de ação */}
            <div className="flex gap-2 mt-4">
              {user && user.id !== data.id && (
                <Button
                  onClick={handleFollowToggle}
                  variant={data.isFollowing ? "outline" : "default"}
                  className={`px-5 py-1 h-9 text-sm rounded-full ${data.isFollowing ? 'border-blue-200 text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    data.isFollowing ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 6 9 17l-5-5"></path></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    )
                  )}
                  <span className="flex items-center">
                    {data.isFollowing ? "Seguindo" : "Seguir"}
                    {data.followers > 0 && (
                      <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                        {data.followers}
                      </span>
                    )}
                  </span>
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="rounded-full h-8 px-2 border-gray-200 text-gray-600 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" x2="12" y1="2" y2="15"></line></svg>
              </Button>
              
              <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0 border-gray-200 text-gray-600 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18L12 4Z"></path></svg>
              </Button>
            </div>
            
            {/* Estatísticas com valores reais da plataforma */}
            <div className="flex justify-center gap-6 md:gap-10 mt-6 w-full max-w-2xl">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {formatStatisticValue(data.statistics.totalArts)}
                </p>
                <p className="text-[11px] text-gray-500">Arquivos</p>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {formatStatisticValue(data.statistics.totalDownloads)}
                </p>
                <p className="text-[11px] text-gray-500">Downloads</p>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {formatStatisticValue(data.statistics.totalViews)}
                </p>
                <p className="text-[11px] text-gray-500">Visualizações</p>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {formatStatisticValue(data.followers)}
                </p>
                <p className="text-[11px] text-gray-500">Seguidores</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Seção das Artes com layout centralizado e responsivo */}
      <div className="max-w-6xl mx-auto">
        {/* Título e Filtros Inteligentes */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white/60 p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold flex items-center text-blue-800">
            Artes do Designer
            <span className="ml-2 text-blue-400 font-normal text-base">
              ({data.statistics.totalArts})
            </span>
          </h2>
          
          {/* Filtros inteligentes */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full px-4 h-8 bg-white shadow-sm"
              disabled
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>
              Filtros
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`rounded-full px-4 h-8 bg-white shadow-sm ${activeFilter === 'todos' ? 'border-blue-200 text-blue-700' : 'hover:border-blue-200'}`}
              onClick={() => {
                setActiveFilter('todos');
                setArtsPage(1); // Reset para página 1 ao mudar filtro
              }}
            >
              Todos
              {activeFilter === 'todos' && <span className="ml-1.5 text-xs">({data.arts.length})</span>}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`rounded-full px-4 h-8 bg-white shadow-sm ${activeFilter === 'premium' ? 'border-blue-200 text-blue-700' : 'hover:border-blue-200'}`}
              onClick={() => {
                setActiveFilter('premium');
                setArtsPage(1); // Reset para página 1 ao mudar filtro
              }}
            >
              Premium
              {activeFilter === 'premium' && (
                <span className="ml-1.5 text-xs">
                  ({data.arts.filter(art => art.isPremium).length})
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`rounded-full px-4 h-8 bg-white shadow-sm ${activeFilter === 'recentes' ? 'border-blue-200 text-blue-700' : 'hover:border-blue-200'}`}
              onClick={() => {
                setActiveFilter('recentes');
                setArtsPage(1); // Reset para página 1 ao mudar filtro
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Recentes
              {activeFilter === 'recentes' && (
                <span className="ml-1.5 text-xs">
                  ({data.arts.length})
                </span>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className={`rounded-full px-4 h-8 bg-white shadow-sm ${activeFilter === 'emalta' ? 'border-blue-200 text-blue-700' : 'hover:border-blue-200'}`}
              onClick={() => {
                setActiveFilter('emalta');
                setArtsPage(1); // Reset para página 1 ao mudar filtro
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              Em Alta
              {activeFilter === 'emalta' && (
                <span className="ml-1.5 text-xs">
                  ({data.arts.length})
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {data.arts.length === 0 || filterArts(data.arts).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-medium text-gray-800">Nenhuma arte encontrada</h3>
            <p className="text-gray-500 mt-2">
              {data.arts.length === 0 
                ? "Este designer ainda não publicou nenhuma arte."
                : `Nenhuma arte encontrada com o filtro ${
                    activeFilter === 'premium' ? 'Premium' : 
                    activeFilter === 'recentes' ? 'Recentes' : 
                    activeFilter === 'emalta' ? 'Em Alta' : 
                    'selecionado'
                  }.`
              }
            </p>
          </div>
        ) : (
          <>
            {/* Layout com Masonry adaptativo para estilo Pinterest */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {displayedArts(data).map((art, index) => (
                <div 
                  key={art.id} 
                  className={`
                    mb-4 md:mb-6 transition-all duration-200 hover:translate-y-[-5px]
                    ${index % 3 === 0 ? 'row-span-1' : index % 5 === 0 ? 'row-span-1' : ''}
                  `}
                >
                  <ArtCard art={art} />
                </div>
              ))}
            </div>
            
            {/* Paginação centralizada */}
            {totalArtsPages(data) > 1 && (
              <div className="flex justify-center mt-10 mb-6">
                <Pagination
                  currentPage={artsPage}
                  totalPages={totalArtsPages(data)}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}