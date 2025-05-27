import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserX, User, UsersRound, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

// Tipo para o designer
interface Designer {
  id: number;
  username: string;
  name: string;
  profileimageurl: string | null;
  bio: string | null;
  role: string;
  artsCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
}

export default function PainelSeguindo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("seguindo");
  const [followingDesigners, setFollowingDesigners] = useState<Designer[]>([]);
  const [popularDesigners, setPopularDesigners] = useState<Designer[]>([]);
  const [isFollowingAction, setIsFollowingAction] = useState(false);

  // Buscar os designers que o usuário segue
  const { data: followingData, isLoading: isLoadingFollowing, refetch: refetchFollowing } = useQuery({
    queryKey: ["/api/users/following"],
    queryFn: async () => {
      if (!user) return { following: [] };
      const res = await fetch("/api/users/following");
      if (!res.ok) {
        throw new Error("Erro ao buscar designers seguidos");
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Buscar designers populares
  const { data: designersData, isLoading: isLoadingDesigners } = useQuery({
    queryKey: ["/api/designers/popular"],
    queryFn: async () => {
      if (!user) return { designers: [] };
      const res = await fetch("/api/designers/popular");
      if (!res.ok) {
        throw new Error("Erro ao buscar designers populares");
      }
      return res.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (followingData && followingData.following) {
      setFollowingDesigners(followingData.following);
    }
  }, [followingData]);

  useEffect(() => {
    if (designersData && designersData.designers) {
      setPopularDesigners(designersData.designers);
    }
  }, [designersData]);
  
  // Função para seguir/deixar de seguir um designer
  const handleToggleFollow = async (designerId: number, isCurrentlyFollowing: boolean) => {
    if (isFollowingAction) return;

    try {
      setIsFollowingAction(true);
      // Usar a API de follow/unfollow
      const action = isCurrentlyFollowing ? "unfollow" : "follow";
      const response = await fetch(`/api/users/follow/${designerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao ${isCurrentlyFollowing ? "deixar de seguir" : "seguir"} o designer`);
      }

      // Atualizar a lista de designers seguidos
      await refetchFollowing();

      // Atualizar o estado local dos designers populares
      setPopularDesigners((prevDesigners) =>
        prevDesigners.map((designer) =>
          designer.id === designerId
            ? { ...designer, isFollowing: !isCurrentlyFollowing }
            : designer
        )
      );

      toast({
        title: isCurrentlyFollowing ? "Deixou de seguir" : "Seguindo",
        description: isCurrentlyFollowing
          ? "Você deixou de seguir este designer com sucesso."
          : "Você está seguindo este designer agora.",
        variant: isCurrentlyFollowing ? "default" : "default",
      });
    } catch (error) {
      console.error("Erro ao modificar seguir:", error);
      toast({
        title: "Erro",
        description: `Não foi possível ${isCurrentlyFollowing ? "deixar de seguir" : "seguir"} o designer. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setIsFollowingAction(false);
    }
  };

  // Componente de card para um designer
  const DesignerCard = ({ designer }: { designer: Designer }) => {
    const getInitials = (name: string) => {
      const nameParts = name.split(" ");
      if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
      return (
        nameParts[0].charAt(0).toUpperCase() +
        nameParts[nameParts.length - 1].charAt(0).toUpperCase()
      );
    };

    return (
      <Card className="overflow-hidden h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={designer.profileimageurl || ""}
                alt={designer.name}
              />
              <AvatarFallback>{getInitials(designer.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base truncate">{designer.name}</CardTitle>
                {designer.role === "designer" && (
                  <Badge variant="outline" className="text-xs">Designer</Badge>
                )}
                {designer.role === "designer_adm" && (
                  <Badge variant="default" className="text-xs bg-blue-600">Designer ADM</Badge>
                )}
              </div>
              <CardDescription className="text-xs truncate">
                @{designer.username}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
            {designer.bio && designer.bio !== "" ? designer.bio : "Este designer ainda não adicionou uma bio."}
          </p>
          
          <div className="flex items-center justify-center space-x-6 py-2 border-t border-border">
            <div className="text-center">
              <div className="font-semibold text-lg">{designer.artsCount || 0}</div>
              <div className="text-xs text-muted-foreground">Artes</div>
            </div>
            
            <div className="text-center">
              <div className="font-semibold text-lg">{designer.followersCount || 0}</div>
              <div className="text-xs text-muted-foreground">Seguidores</div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 flex flex-col space-y-2">
          <Button
            className={`w-full ${designer.isFollowing ? "" : "bg-blue-600 hover:bg-blue-700"}`}
            variant={designer.isFollowing ? "outline" : "default"}
            onClick={() => handleToggleFollow(designer.id, !!designer.isFollowing)}
            disabled={isFollowingAction}
          >
            {isFollowingAction ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : designer.isFollowing ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Deixar de seguir
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Seguir
              </>
            )}
          </Button>
          
          <Link href={`/designer/${designer.username}`} className="w-full">
            <Button size="sm" variant="outline" className="w-full">
              Ver Perfil
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  };

  // Esqueleto de carregamento para designers
  const DesignerCardSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter className="flex justify-between py-3">
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardFooter>
    </Card>
  );

  const handleTabChange = (value: string) => {
    setTab(value);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Seguindo</h1>
          <p className="text-muted-foreground">
            Acompanhe seus designers favoritos e descubra novos talentos
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="seguindo" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Designers que sigo
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center">
            <UsersRound className="h-4 w-4 mr-2" />
            Designers Populares
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seguindo" className="space-y-4">
          {isLoadingFollowing ? (
            // Exibir skeletons durante o carregamento
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <DesignerCardSkeleton key={i} />
              ))}
            </div>
          ) : followingDesigners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followingDesigners.map((designer) => (
                <DesignerCard key={designer.id} designer={designer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">Você ainda não segue ninguém</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Encontre designers talentosos para seguir e acompanhar suas criações
              </p>
              <Button
                onClick={() => setTab("popular")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Encontrar designers para seguir
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          {isLoadingDesigners ? (
            // Exibir skeletons durante o carregamento
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <DesignerCardSkeleton key={i} />
              ))}
            </div>
          ) : popularDesigners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularDesigners.map((designer) => (
                <DesignerCard key={designer.id} designer={{...designer, isFollowing: followingDesigners.some(d => d.id === designer.id)}} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">Nenhum designer disponível</h3>
              <p className="text-muted-foreground mt-2">
                Os designers estarão disponíveis em breve. Volte mais tarde.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}