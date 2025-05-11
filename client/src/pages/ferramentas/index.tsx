import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Wrench, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FerramentaCard from '@/components/ferramentas/FerramentaCard';
import CategoriasCarousel from '@/components/ferramentas/CategoriasCarousel';
import FerramentasCategoria from '@/components/ferramentas/FerramentasCategoria';
import { useLocation, useRoute } from 'wouter';
import useDebounce from '@/hooks/use-debounce';

type Ferramenta = {
  id: number;
  nome: string;
  descricao?: string;
  imageUrl?: string;
  websiteUrl: string;
  isExterno: boolean;
  isNovo: boolean;
  categoriaId: number;
  categoria?: {
    id: number;
    nome: string;
    slug: string;
  };
  ordem?: number;
  ativo?: boolean;
  criadoEm?: string;
};

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  ordem?: number;
  ativo?: boolean;
};

const FerramentasPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute<{ slug: string }>('/ferramentas/categoria/:slug');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Verificar se estamos em uma rota de categoria específica 
  console.log('Route match:', match, 'params:', params);

  // Usar o valor de params.slug quando o route match for válido
  useEffect(() => {
    if (match && params && params.slug) {
      console.log('Categoria detectada via useRoute:', params.slug);
      if (categoriaSelecionada !== params.slug) {
        setCategoriaSelecionada(params.slug);
      }
    } else if (!match && location === '/ferramentas' && categoriaSelecionada !== null) {
      console.log('Rota base detectada, removendo filtro de categoria');
      setCategoriaSelecionada(null);
    }
  }, [match, params, location, categoriaSelecionada]);

  // Buscar categorias
  const { data: categorias, isLoading: isLoadingCategorias } = useQuery<Categoria[]>({
    queryKey: ['/api/ferramentas/categorias'],
  });

  // Buscar ferramentas com filtros
  const { data: ferramentas, isLoading: isLoadingFerramentas } = useQuery<Ferramenta[]>({
    queryKey: ['/api/ferramentas', { categoria: categoriaSelecionada, busca: debouncedSearchTerm }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, { categoria: string | null, busca: string }];
      const url = new URL('/api/ferramentas', window.location.origin);
      
      if (params.categoria) {
        url.searchParams.append('categoria', params.categoria);
        console.log('Filtrando por categoria:', params.categoria);
      }
      
      if (params.busca) {
        url.searchParams.append('busca', params.busca);
      }
      
      console.log('Fetching URL:', url.toString());
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Erro ao buscar ferramentas');
      }
      return response.json();
    },
    // Força recarregar ao mudar a categoria ou termo de busca
    refetchOnWindowFocus: false,
  });

  // Função para mudar a categoria selecionada
  const handleCategoriaChange = (slug: string | null) => {
    console.log('Categoria selecionada no clique:', slug);
    
    // Lógica simplificada - sempre mudamos para a categoria ou para "todas"
    if (slug) {
      console.log('Navegando para categoria:', slug);
      setLocation(`/ferramentas/categoria/${slug}`);
    } else {
      console.log('Navegando para todas as categorias');
      setLocation('/ferramentas');
    }
    
    // Resetar busca ao mudar categoria
    if (searchTerm) {
      setSearchTerm('');
    }
  };

  // Agrupar ferramentas por categoria
  const ferramentasPorCategoria = React.useMemo(() => {
    if (!ferramentas || !categorias) return {};

    // Se houver um termo de busca ou categoria selecionada, não agrupar
    if (debouncedSearchTerm || categoriaSelecionada) {
      return {
        [categoriaSelecionada || 'Resultados da busca']: ferramentas
      };
    }

    // Caso contrário, agrupar por categoria
    return ferramentas.reduce((acc, ferramenta) => {
      const categoria = categorias.find(c => c.id === ferramenta.categoriaId);
      if (categoria) {
        if (!acc[categoria.slug]) {
          acc[categoria.slug] = [];
        }
        acc[categoria.slug].push(ferramenta);
      }
      return acc;
    }, {} as Record<string, Ferramenta[]>);
  }, [ferramentas, categorias, debouncedSearchTerm, categoriaSelecionada]);

  // Renderizar cards de ferramentas no modo de grade
  const renderFerramentasGrid = () => {
    if (isLoadingFerramentas) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-full">
              <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl h-full shadow-md">
                <Skeleton className="h-[180px] w-full" />
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </CardContent>
                <CardContent className="p-5 pt-0 mt-auto">
                  <Skeleton className="h-9 w-full rounded-md" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      );
    }

    if (debouncedSearchTerm || categoriaSelecionada) {
      const listaFerramentas = ferramentas || [];
      
      if (listaFerramentas.length === 0) {
        const tipoFiltro = debouncedSearchTerm ? 'busca' : 'categoria';
        const termoFiltro = debouncedSearchTerm || 
          (categoriaSelecionada && categorias?.find(c => c.slug === categoriaSelecionada)?.nome);
          
        return (
          <div className="mt-10 text-center py-16 px-4">
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-8 rounded-2xl inline-flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm">
              <div>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nenhuma ferramenta encontrada</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {debouncedSearchTerm 
                    ? `Não encontramos resultados para "${debouncedSearchTerm}".` 
                    : `Não há ferramentas disponíveis na categoria "${termoFiltro}".`}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoriaSelecionada(null);
                    setLocation('/ferramentas');
                  }}
                >
                  Ver todas as ferramentas
                </Button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {listaFerramentas.map((ferramenta) => (
            <FerramentaCard 
              key={ferramenta.id} 
              {...ferramenta}
            />
          ))}
        </div>
      );
    }

    return null;
  };

  // Renderizar carrosséis por categoria
  const renderCategoriasCarousels = () => {
    if (isLoadingCategorias || isLoadingFerramentas) {
      return (
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <div className="flex space-x-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-48 w-[280px] rounded-lg flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (debouncedSearchTerm || categoriaSelecionada) {
      return null;
    }

    return (
      <div className="space-y-6">
        {categorias?.map((categoria) => {
          const ferramentasCategoria = ferramentasPorCategoria[categoria.slug] || [];
          
          // Não mostrar categorias vazias
          if (ferramentasCategoria.length === 0) return null;
          
          return (
            <FerramentasCategoria
              key={categoria.id}
              categoria={categoria}
              ferramentas={ferramentasCategoria}
              onCategoriaClick={handleCategoriaChange}
              isActive={categoria.slug === categoriaSelecionada}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="relative mb-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl blur-3xl opacity-50"></div>
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col space-y-6 md:flex-row md:items-start md:justify-between md:space-y-0">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Ferramentas Úteis</h1>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Explore nossa coleção de ferramentas para potencializar sua criatividade e produtividade no mundo do design automotivo.
              </p>
            </div>
          </div>

          {/* Barra de pesquisa integrada no cabeçalho */}
          <div className="mt-6 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-auto flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar ferramentas..."
                className="pl-10 pr-4 py-6 h-12 w-full rounded-lg border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary/30 transition-all bg-white/90 dark:bg-gray-900/90"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filtro de categorias para mobile/tablet */}
            {categorias && categorias.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="md:hidden h-12 border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90">
                    <Filter className="h-4 w-4 mr-2" />
                    Categorias
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                  <DropdownMenuItem 
                    className="cursor-pointer focus:text-primary focus:bg-primary/10"
                    onClick={() => {
                      setCategoriaSelecionada(null);
                      setLocation('/ferramentas');
                    }}
                  >
                    Todas as categorias
                  </DropdownMenuItem>
                  {categorias.map((categoria) => (
                    <DropdownMenuItem 
                      key={categoria.id}
                      className="cursor-pointer focus:text-primary focus:bg-primary/10"
                      onClick={() => handleCategoriaChange(categoria.slug)}
                    >
                      {categoria.nome}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Lista de categorias horizontal (filters) */}
      {categorias && categorias.length > 0 && (
        <div className="mb-8">
          <CategoriasCarousel 
            categorias={categorias}
            categoriaSelecionada={categoriaSelecionada}
            onCategoriaChange={handleCategoriaChange}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-3 px-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
          />
        </div>
      )}

      {/* Mostrar filtros ativos */}
      {(debouncedSearchTerm || categoriaSelecionada) && (
        <div className="flex flex-wrap gap-2 mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-3 px-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex flex-wrap gap-2 items-center w-full">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Filtros ativos:</span>
            
            {debouncedSearchTerm && (
              <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 px-3 py-1.5 h-8">
                <Search className="h-3.5 w-3.5 mr-1 text-blue-500 dark:text-blue-400" />
                {debouncedSearchTerm}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 p-0 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full"
                  onClick={() => setSearchTerm('')}
                >
                  <span className="sr-only">Remover filtro</span>
                  &times;
                </Button>
              </Badge>
            )}
            
            {categoriaSelecionada && categorias && (
              <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 px-3 py-1.5 h-8">
                <Filter className="h-3.5 w-3.5 mr-1 text-purple-500 dark:text-purple-400" />
                {categorias.find(c => c.slug === categoriaSelecionada)?.nome || categoriaSelecionada}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 p-0 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-full"
                  onClick={() => {
                    setCategoriaSelecionada(null);
                    setLocation('/ferramentas');
                  }}
                >
                  <span className="sr-only">Remover filtro</span>
                  &times;
                </Button>
              </Badge>
            )}
            
            {(debouncedSearchTerm || categoriaSelecionada) && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  setSearchTerm('');
                  setCategoriaSelecionada(null);
                  setLocation('/ferramentas');
                }}
              >
                Limpar todos os filtros
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-6 hidden md:flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-1 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <TabsTrigger value="carousel" className="flex items-center data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Navegação por categoria
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Filter className="h-4 w-4 mr-2" />
            Listar todas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="carousel">
          {/* Carrosséis de categorias */}
          {renderCategoriasCarousels()}
          
          {/* Grade para resultados de busca ou categoria selecionada */}
          {renderFerramentasGrid()}
        </TabsContent>
        
        <TabsContent value="grid">
          {/* Sempre mostra todas as ferramentas em grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {isLoadingFerramentas ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-full">
                  <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl h-full shadow-md">
                    <Skeleton className="h-[180px] w-full" />
                    <CardContent className="p-5">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-1" />
                    </CardContent>
                    <CardContent className="p-5 pt-0 mt-auto">
                      <Skeleton className="h-9 w-full rounded-md" />
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              ferramentas?.map((ferramenta) => (
                <FerramentaCard 
                  key={ferramenta.id} 
                  {...ferramenta}
                />
              ))
            )}
          </div>
          
          {/* Estado vazio */}
          {!isLoadingFerramentas && (!ferramentas || ferramentas.length === 0) && (
            <div className="text-center py-16 px-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl inline-flex items-center justify-center">
                <div>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nenhuma ferramenta encontrada</h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Tente modificar os filtros ou use termos de busca diferentes para encontrar o que procura.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6 border-gray-300 dark:border-gray-700"
                    onClick={() => {
                      setCategoriaSelecionada(null);
                      setSearchTerm('');
                      setLocation('/ferramentas');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FerramentasPage;