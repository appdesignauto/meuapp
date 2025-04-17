import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, Loader2, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PainelFavoritas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Verificar se o usuário é premium
  const isPremium = user && 
    (user.role === "premium" || 
     user.role === "designer" || 
     user.role === "designer_adm" || 
     user.role === "admin" ||
     (user.nivelacesso && 
      user.nivelacesso !== "free" && 
      user.nivelacesso !== "usuario"));

  // Consultar favoritos do usuário
  const { data: favoritesData, isLoading: favoritesLoading } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: !!user?.id,
  });

  // Mutação para remover favorito
  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: number) => {
      const res = await apiRequest("DELETE", `/api/favorites/${favoriteId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Favorito removido",
        description: "Arte removida dos favoritos com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o favorito. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Filtrar favoritos com base na pesquisa
  const filteredFavorites = favoritesData?.favorites
    ? favoritesData.favorites.filter((favorite: any) =>
        favorite.art.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Função para remover favorito
  const handleRemoveFavorite = (favoriteId: number) => {
    removeFavoriteMutation.mutate(favoriteId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Favoritas</h1>
        
        {/* Barra de pesquisa */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar favoritas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Mensagem para usuários sem favoritos */}
      {!favoritesLoading && (!filteredFavorites || filteredFavorites.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold">Nenhuma arte favorita</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Você ainda não adicionou nenhuma arte aos favoritos.
            {searchTerm && " Ou nenhuma arte corresponde à sua pesquisa."}
          </p>
          <Button className="mt-4" asChild>
            <a href="/painel/artes">Explorar artes</a>
          </Button>
        </div>
      )}

      {/* Grade de favoritos */}
      {favoritesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFavorites.map((favorite: any) => (
            <FavoriteCard
              key={favorite.id}
              favorite={favorite}
              isPremium={!!isPremium}
              onRemove={() => handleRemoveFavorite(favorite.id)}
              isRemoving={removeFavoriteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente FavoriteCard para exibir cada arte favorita
interface FavoriteCardProps {
  favorite: any;
  isPremium: boolean;
  onRemove: () => void;
  isRemoving: boolean;
}

function FavoriteCard({ favorite, isPremium, onRemove, isRemoving }: FavoriteCardProps) {
  const { toast } = useToast();
  const art = favorite.art;
  
  // Função para lidar com o clique no botão de uso
  const handleUseArt = () => {
    if (!isPremium && art.isPremium) {
      toast({
        title: "Acesso restrito",
        description: "Faça upgrade para o plano Premium para usar esta arte.",
        variant: "destructive",
      });
      return;
    }
    
    // Aqui seria o código para download ou redirecionamento
    window.open(art.editUrl, '_blank');
  };

  return (
    <Card className="overflow-hidden group h-full flex flex-col">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={art.imageUrl}
          alt={art.title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        {art.isPremium && (
          <Badge variant="premium" className="absolute top-2 right-2">
            Premium
          </Badge>
        )}
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="font-semibold text-sm truncate">{art.title}</h3>
        <div className="flex items-center mt-1 text-xs text-muted-foreground">
          <span>{art.format}</span>
          <span className="mx-1">•</span>
          <span>{art.fileType}</span>
        </div>
        <div className="mt-auto pt-3 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleUseArt}
          >
            {art.isPremium && !isPremium ? "Ver Planos" : "Usar Template"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover dos favoritos</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover esta arte dos seus favoritos?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>Remover</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}