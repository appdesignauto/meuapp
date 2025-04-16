import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Users, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pagination } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useScrollTop from "@/hooks/useScrollTop";

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
  arts: {
    id: number;
    title: string;
    imageUrl: string;
    isPremium: boolean;
  }[];
};

type DesignersResponse = {
  designers: Designer[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function Designers() {
  useScrollTop();
  
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("followers"); // 'followers', 'activity', 'recent'
  
  // Buscar designers com paginação
  const { data, isLoading, error } = useQuery<DesignersResponse>({
    queryKey: ["/api/designers", page, sort],
    queryFn: async () => {
      const response = await fetch(`/api/designers?page=${page}&sort=${sort}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar designers");
      }
      return response.json();
    },
  });
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1); // Resetar para a primeira página ao mudar o tipo de ordenação
  };
  
  if (error) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Falha ao carregar designers
        </h1>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Designers</h1>
          <p className="text-muted-foreground mt-1">
            Descubra e siga os melhores designers automotivos
          </p>
        </div>
      </div>
      
      <Tabs value={sort} onValueChange={handleSortChange} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="followers">Mais Seguidos</TabsTrigger>
          <TabsTrigger value="activity">Mais Ativos</TabsTrigger>
          <TabsTrigger value="recent">Mais Recentes</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.designers.map((designer) => (
              <DesignerCard key={designer.id} designer={designer} />
            ))}
          </div>
          
          {data && data.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
          
          {data?.designers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">
                Nenhum designer encontrado
              </h3>
              <p className="text-muted-foreground mt-2">
                Não há designers disponíveis no momento
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DesignerCard({ designer }: { designer: Designer }) {
  // Pegar apenas as primeiras 4 artes
  const displayArts = designer.arts.slice(0, 4);
  
  return (
    <Card className="overflow-hidden">
      <div className="p-6 flex items-center gap-4">
        <Avatar className="h-16 w-16 border">
          <AvatarImage 
            src={designer.profileImageUrl || ""} 
            alt={designer.name || designer.username} 
          />
          <AvatarFallback className="text-lg">
            {designer.name ? designer.name.charAt(0).toUpperCase() : designer.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold truncate">
            {designer.name || designer.username}
          </h3>
          <p className="text-muted-foreground text-sm">
            @{designer.username}
          </p>
          <div className="flex gap-4 mt-1 text-sm">
            <span><strong>{designer.followers}</strong> seguidores</span>
            <span><strong>{displayArts.length}</strong> artes</span>
          </div>
        </div>
      </div>
      
      {displayArts.length > 0 && (
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-1">
            {displayArts.map((art) => (
              <Link key={art.id} href={`/arts/${art.id}`}>
                <div className="relative block aspect-square overflow-hidden hover:opacity-90 transition-opacity">
                  <img 
                    src={art.imageUrl} 
                    alt={art.title} 
                    className="object-cover w-full h-full"
                  />
                  {art.isPremium && (
                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                      Premium
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      )}
      
      <CardFooter className="p-4">
        <Link href={`/designers/${designer.username}`}>
          <Button variant="outline" className="w-full">
            <span>Ver perfil</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}