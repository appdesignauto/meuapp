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
      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 flex flex-col items-center">
            <Avatar className="h-24 w-24 md:h-36 md:w-36 border">
              <AvatarImage 
                src={data.profileImageUrl || ""} 
                alt={data.name || data.username} 
              />
              <AvatarFallback className="text-2xl">
                {data.name ? data.name.charAt(0).toUpperCase() : data.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {user && user.id !== data.id && (
              <Button
                onClick={handleFollowToggle}
                variant={data.isFollowing ? "outline" : "default"}
                className="mt-4 w-full"
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
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center">
              <h1 className="text-3xl font-bold">
                {data.name || data.username}
              </h1>
              {getRoleBadge(data.role)}
              {data.role === 'admin' && (
                <ShieldCheck className="w-5 h-5 ml-2 text-primary" />
              )}
            </div>
            
            <p className="text-muted-foreground">@{data.username}</p>
            
            {data.bio && (
              <p className="mt-4 whitespace-pre-line">{data.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6">
              <div className="flex items-center">
                <UsersRound className="w-5 h-5 mr-2 text-muted-foreground" />
                <span><strong>{data.followers}</strong> seguidores</span>
              </div>
              
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-muted-foreground" />
                <span><strong>{data.statistics.totalViews}</strong> visualizações</span>
              </div>
              
              <div className="flex items-center">
                <Download className="w-5 h-5 mr-2 text-muted-foreground" />
                <span><strong>{data.statistics.totalDownloads}</strong> downloads</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
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