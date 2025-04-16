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
      {/* Profile Header - Estilo Pinterest moderno */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 h-44 md:h-60 rounded-lg overflow-hidden relative">
          {/* Cover photo background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-blue-400/10"></div>
          
          {/* Profile info overlayed */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container px-4 md:px-8 pb-4 md:pb-6 flex flex-col md:flex-row items-center md:items-end gap-3">
              <div className="relative -mt-14 md:-mt-20 z-10">
                <Avatar className="h-28 w-28 md:h-40 md:w-40 border-4 border-white shadow-lg">
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
                        className="absolute bottom-2 right-2 rounded-full h-9 w-9 shadow-md"
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
              
              <div className="md:ml-4 flex-1 text-center md:text-left mt-2 md:mt-0">
                <div className="flex flex-col md:flex-row md:items-end gap-4 md:justify-between">
                  <div>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {data.name || data.username}
                      </h1>
                      {getRoleBadge(data.role)}
                      {data.role === 'admin' && (
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">@{data.username}</p>
                  </div>
                  
                  {user && user.id !== data.id && (
                    <Button
                      onClick={handleFollowToggle}
                      variant={data.isFollowing ? "outline" : "default"}
                      className={`px-6 h-10 ${data.isFollowing ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                    >
                      {followMutation.isPending || unfollowMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UsersRound className="h-4 w-4 mr-2" />
                      )}
                      {data.isFollowing ? (
                        <>
                          <span className="hidden md:inline">Seguindo</span>
                          <span className="md:hidden">Seguindo</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden md:inline">Seguir</span>
                          <span className="md:hidden">Seguir</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Designer info and stats */}
        <div className="pt-16 md:pt-4 px-4 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
          <div className="w-full max-w-3xl mx-auto">
            {data.bio && (
              <div className="mb-6 text-center md:text-left">
                <p className="whitespace-pre-line text-gray-700">{data.bio}</p>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-blue-600">{data.followers}</p>
                <p className="text-xs text-gray-500 mt-1">Seguidores</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-blue-600">{data.statistics.totalArts}</p>
                <p className="text-xs text-gray-500 mt-1">Artes</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-blue-600">{data.statistics.totalDownloads}</p>
                <p className="text-xs text-gray-500 mt-1">Downloads</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        Artes do Designer
        <span className="ml-2 text-muted-foreground font-normal text-base">
          ({data.statistics.totalArts})
        </span>
      </h2>
      
      {data.arts.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-medium">Nenhuma arte encontrada</h3>
          <p className="text-muted-foreground mt-2">
            Este designer ainda não publicou nenhuma arte.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedArts(data).map((art) => (
              <ArtCard key={art.id} art={art} />
            ))}
          </div>
          
          {totalArtsPages(data) > 1 && (
            <Pagination
              currentPage={artsPage}
              totalPages={totalArtsPages(data)}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </>
      )}
    </div>
  );
}