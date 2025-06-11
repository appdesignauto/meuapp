import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, SlidersHorizontal, Loader2, Filter, X, Plus, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SimpleFormMultiDialog from "@/components/admin/SimpleFormMultiDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Componente ArtCard para exibir cada arte
const ArtCard = ({ art, isPremium }: { art: any; isPremium: boolean }) => {
  const { toast } = useToast();
  
  // Função para lidar com o clique no botão de download
  const handleDownload = () => {
    if (!isPremium && art.isPremium) {
      toast({
        title: "Acesso restrito",
        description: "Faça upgrade para o plano Premium para baixar esta arte.",
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
        <h3 className="font-semibold text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis">{art.title}</h3>
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
            onClick={handleDownload}
          >
            {art.isPremium && !isPremium ? "Ver Planos" : "Usar Template"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default function PainelArtes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isMultiFormOpen, setIsMultiFormOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    format: "",
    fileType: "",
    isPremium: "",
  });

  // Verificar se o usuário é premium
  const isPremium = user && 
    (user.role === "premium" || 
     user.role === "designer" || 
     user.role === "designer_adm" || 
     user.role === "admin" ||
     (user.nivelacesso && 
      user.nivelacesso !== "free" && 
      user.nivelacesso !== "usuario"));

  // Consulta para listar todas as artes
  const { data: artsData, isLoading: artsLoading } = useQuery({
    queryKey: ["/api/artes"],
  });

  // Consulta para obter categorias para filtros
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Consulta para obter formatos para filtros  
  const { data: formatsData } = useQuery({
    queryKey: ["/api/formats"],
  });

  // Consulta para obter tipos de arquivo para filtros
  const { data: fileTypesData } = useQuery({
    queryKey: ["/api/fileTypes"],
  });

  // Filtrar artes com base nos critérios
  const filteredArts = artsData?.arts
    ? artsData.arts.filter((art: any) => {
        // Filtro de pesquisa
        if (
          searchTerm &&
          !art.title.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        // Filtro de categoria
        if (filters.category && art.categoryId !== parseInt(filters.category)) {
          return false;
        }

        // Filtro de formato
        if (filters.format && art.format !== filters.format) {
          return false;
        }

        // Filtro de tipo de arquivo
        if (filters.fileType && art.fileType !== filters.fileType) {
          return false;
        }

        // Filtro de premium
        if (filters.isPremium === "premium" && !art.isPremium) {
          return false;
        } else if (filters.isPremium === "free" && art.isPremium) {
          return false;
        }

        return true;
      })
    : [];

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      category: "",
      format: "",
      fileType: "",
      isPremium: "",
    });
    setSearchTerm("");
  };

  // Verificar se há filtros ativos
  const hasActiveFilters =
    filters.category !== "" ||
    filters.format !== "" ||
    filters.fileType !== "" ||
    filters.isPremium !== "" ||
    searchTerm !== "";

  // Verifica se o usuário é um designer ou administrador para habilitar a adição de artes
  const canAddArts = user && (
    user.role === "designer" || 
    user.role === "designer_adm" || 
    user.role === "admin" ||
    (user.nivelacesso && 
     (user.nivelacesso === "design" || 
      user.nivelacesso === "admin"))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Artes</h1>

        </div>
        
        {/* Barra de pesquisa e filtros */}
        <div className="flex items-center w-full sm:w-auto gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar artes..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filtrar Artes</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Filtro de Categoria */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) =>
                      setFilters({ ...filters, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categoriesData?.map((category: any) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Formato */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Formato</label>
                  <Select
                    value={filters.format}
                    onValueChange={(value) =>
                      setFilters({ ...filters, format: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os formatos</SelectItem>
                      {formatsData?.map((format: any) => (
                        <SelectItem key={format.id} value={format.name}>
                          {format.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Tipo de Arquivo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Arquivo</label>
                  <Select
                    value={filters.fileType}
                    onValueChange={(value) =>
                      setFilters({ ...filters, fileType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      {fileTypesData?.map((fileType: any) => (
                        <SelectItem key={fileType.id} value={fileType.name}>
                          {fileType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Premium */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Acesso</label>
                  <Select
                    value={filters.isPremium}
                    onValueChange={(value) =>
                      setFilters({ ...filters, isPremium: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="free">Gratuitos</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
                <Button onClick={() => setFilterOpen(false)}>Aplicar</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Menu de ordenação */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem>Mais recentes</DropdownMenuItem>
                <DropdownMenuItem>Mais antigos</DropdownMenuItem>
                <DropdownMenuItem>A-Z</DropdownMenuItem>
                <DropdownMenuItem>Z-A</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros:</span>
          {searchTerm && (
            <Badge variant="outline" className="flex items-center gap-1">
              Busca: {searchTerm}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSearchTerm("")}
              />
            </Badge>
          )}
          {filters.category && categoriesData && (
            <Badge variant="outline" className="flex items-center gap-1">
              Categoria: {
                categoriesData.find((c: any) => c.id === parseInt(filters.category))?.name
              }
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, category: "" })}
              />
            </Badge>
          )}
          {filters.format && (
            <Badge variant="outline" className="flex items-center gap-1">
              Formato: {filters.format}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, format: "" })}
              />
            </Badge>
          )}
          {filters.fileType && (
            <Badge variant="outline" className="flex items-center gap-1">
              Tipo: {filters.fileType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, fileType: "" })}
              />
            </Badge>
          )}
          {filters.isPremium && (
            <Badge variant="outline" className="flex items-center gap-1">
              Acesso: {filters.isPremium === "premium" ? "Premium" : "Gratuito"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, isPremium: "" })}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={clearFilters}
          >
            Limpar todos
          </Button>
        </div>
      )}

      {/* Mensagem de filtros sem resultados */}
      {!artsLoading && filteredArts.length === 0 && (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">
            Nenhuma arte encontrada com os filtros selecionados.
          </p>
          <Button
            variant="link"
            onClick={clearFilters}
            className="mt-2"
          >
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Grade de artes */}
      {artsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredArts.map((art: any) => (
            <ArtCard key={art.id} art={art} isPremium={!!isPremium} />
          ))}
        </div>
      )}
      
      {/* Formulário Multi-Formato (como diálogo) */}
      <SimpleFormMultiDialog 
        isOpen={isMultiFormOpen} 
        onClose={() => setIsMultiFormOpen(false)} 
      />
    </div>
  );
}