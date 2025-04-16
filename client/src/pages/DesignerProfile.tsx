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
  
  // Calcular páginas de artes para paginação
  const displayedArts = (data: Designer) => 
    data.arts.slice((artsPage - 1) * artsPerPage, artsPage * artsPerPage);
  
  const totalArtsPages = (data: Designer) => 
    Math.ceil(data.arts.length / artsPerPage);
  
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
    <div className="container py-8">
      {/* Profile Header - Estilo Pinterest moderno e centralizado */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 h-48 md:h-64 rounded-lg overflow-hidden relative">
          {/* Cover photo background com efeito mais elegante */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-blue-400/15"></div>
          
          {/* Sobreposição central para o avatar e nome */}
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={data.profileImageUrl || ""} 
                  alt={data.name || data.username} 
                />
                <AvatarFallback className="text-3xl bg-blue-100">
                  {data.name ? data.name.charAt(0).toUpperCase() : data.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {user && user.id === data.id && (
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="icon" 
                      className="absolute bottom-0 right-0 rounded-full h-9 w-9 shadow-md"
                    >
                      <Camera className="h-4 w-4" />
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
        </div>
        
        {/* Designer info centralizado e social links */}
        <div className="pt-20 px-4 flex flex-col items-center justify-center">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-2">
              <div className="flex justify-center items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {data.name || data.username}
                </h1>
                {getRoleBadge(data.role)}
                {data.role === 'admin' && (
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">@{data.username}</p>

              {/* Botão de seguir centralizado para qualquer usuário exceto o próprio */}
              {user && user.id !== data.id && (
                <Button
                  onClick={handleFollowToggle}
                  variant={data.isFollowing ? "outline" : "default"}
                  className={`mt-3 px-8 h-10 ${data.isFollowing ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UsersRound className="h-4 w-4 mr-2" />
                  )}
                  {data.isFollowing ? "Seguindo" : "Seguir"}
                </Button>
              )}
              
              {/* Redes sociais minimalistas */}
              <div className="flex justify-center gap-4 mt-4">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 7v6a3 3 0 0 1-3 3H5l-4 4V4a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z"></path><path d="M13 7c0 5 3 5 3 9v3c0 1.7-1.3 3-3 3h-2c-1.7 0-3-1.3-3-3v-1"></path></svg>
                </a>
              </div>
            </div>
            
            {data.bio && (
              <div className="mb-6 mt-4">
                <p className="whitespace-pre-line text-gray-700">{data.bio}</p>
              </div>
            )}
            
            {/* Estatísticas em cards elegantes */}
            <div className="grid grid-cols-3 gap-4 mt-6 md:px-10">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <p className="text-2xl font-bold text-blue-600">{data.followers}</p>
                <p className="text-xs text-gray-500 mt-1">Seguidores</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <p className="text-2xl font-bold text-blue-600">{data.statistics.totalArts}</p>
                <p className="text-xs text-gray-500 mt-1">Artes</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                <p className="text-2xl font-bold text-blue-600">{data.statistics.totalDownloads}</p>
                <p className="text-xs text-gray-500 mt-1">Downloads</p>
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
            <Button variant="outline" size="sm" className="rounded-full px-4 h-8 bg-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>
              Filtros
            </Button>
            <Button variant="outline" size="sm" className="rounded-full px-4 h-8 bg-white border-blue-200 text-blue-700 shadow-sm">
              Todos
            </Button>
            <Button variant="outline" size="sm" className="rounded-full px-4 h-8 bg-white shadow-sm hover:border-blue-200">
              Premium
            </Button>
            <Button variant="outline" size="sm" className="rounded-full px-4 h-8 bg-white shadow-sm hover:border-blue-200">
              Instagram
            </Button>
          </div>
        </div>
        
        {data.arts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-medium text-gray-800">Nenhuma arte encontrada</h3>
            <p className="text-gray-500 mt-2">
              Este designer ainda não publicou nenhuma arte.
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