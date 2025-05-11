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
import { useLocation } from 'wouter';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Extrair a categoria da URL se presente
  useEffect(() => {
    const match = location.match(/\/ferramentas\/categoria\/(.+)/);
    if (match) {
      setCategoriaSelecionada(match[1]);
    } else if (location === '/ferramentas') {
      setCategoriaSelecionada(null);
    }
  }, [location]);

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
    console.log('Categoria selecionada:', slug);
    
    if (categoriaSelecionada === slug) {
      // Se clicar na mesma categoria, remove o filtro
      console.log('Removendo filtro de categoria');
      setCategoriaSelecionada(null);
      setLocation('/ferramentas');
    } else {
      console.log('Mudando para categoria:', slug);
      setCategoriaSelecionada(slug);
      if (slug) {
        setLocation(`/ferramentas/categoria/${slug}`);
      } else {
        setLocation('/ferramentas');
      }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (debouncedSearchTerm || categoriaSelecionada) {
      const listaFerramentas = ferramentas || [];
      
      if (listaFerramentas.length === 0) {
        return (
          <div className="mt-10 text-center">
            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Nenhuma ferramenta encontrada</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {debouncedSearchTerm 
                ? `Não encontramos resultados para "${debouncedSearchTerm}".` 
                : 'Não há ferramentas disponíveis na categoria selecionada.'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setCategoriaSelecionada(null);
                setLocation('/ferramentas');
              }}
            >
              Ver todas as ferramentas
            </Button>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ferramentas Úteis</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Acesse ferramentas que facilitarão seu trabalho com design automotivo
          </p>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar ferramentas..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Filtro de categorias para mobile/tablet */}
        {categorias && categorias.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Categorias
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem 
                className="cursor-pointer"
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
                  className="cursor-pointer"
                  onClick={() => handleCategoriaChange(categoria.slug)}
                >
                  {categoria.nome}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Lista de categorias horizontal (filters) */}
      {categorias && categorias.length > 0 && (
        <div className="mb-8">
          <CategoriasCarousel 
            categorias={categorias}
            categoriaSelecionada={categoriaSelecionada}
            onCategoriaChange={handleCategoriaChange}
            className="w-full"
          />
        </div>
      )}

      {/* Mostrar filtros ativos */}
      {(debouncedSearchTerm || categoriaSelecionada) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {debouncedSearchTerm && (
            <Badge variant="outline" className="flex items-center gap-1">
              Busca: {debouncedSearchTerm}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0 hover:bg-transparent"
                onClick={() => setSearchTerm('')}
              >
                <span className="sr-only">Remover filtro</span>
                &times;
              </Button>
            </Badge>
          )}
          
          {categoriaSelecionada && categorias && (
            <Badge variant="outline" className="flex items-center gap-1">
              Categoria: {categorias.find(c => c.slug === categoriaSelecionada)?.nome || categoriaSelecionada}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0 hover:bg-transparent"
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
        </div>
      )}

      {/* Conteúdo principal */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-6 hidden md:flex">
          <TabsTrigger value="carousel" className="flex items-center">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Navegação por categoria
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoadingFerramentas ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FerramentasPage;