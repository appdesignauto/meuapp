import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import useScrollTop from '@/hooks/useScrollTop';
import { ArrowLeft, Search, Filter, SlidersHorizontal, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ArtCard from '@/components/ui/ArtCard';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function CategoryPage() {
  // Garantir rolagem para o topo ao navegar para esta página
  useScrollTop();
  
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    formatId: null as number | null,
    fileTypeId: null as number | null,
  });
  const limit = 12;

  // Verifique se o slug está presente e é válido
  const isValidSlug = typeof slug === 'string' && slug.length > 0;

  // Fetch category by slug
  const { 
    data: category, 
    isLoading: categoryLoading,
    error: categoryError
  } = useQuery({
    queryKey: ['/api/categories/slug', slug],
    queryFn: async () => {
      console.log("Buscando categoria com slug:", slug);
      const res = await fetch(`/api/categories/slug/${slug}`);
      if (!res.ok) {
        console.error("Erro ao carregar categoria:", res.status, res.statusText);
        
        // Se não encontrar categoria por slug, vamos tentar buscar todas as categorias
        // e encontrar manualmente pelo slug (para fins de desenvolvimento/teste)
        if (res.status === 404) {
          console.log("Tentando obter todas as categorias...");
          const allCatsRes = await fetch('/api/categories');
          if (allCatsRes.ok) {
            const allCategories = await allCatsRes.json();
            const foundCategory = allCategories.find((cat: any) => cat.slug === slug);
            if (foundCategory) {
              console.log("Categoria encontrada manualmente:", foundCategory);
              return foundCategory;
            }
          }
        }
        
        throw new Error(`Erro ao carregar categoria: ${res.status}`);
      }
      const data = await res.json();
      console.log("Categoria carregada:", data);
      return data;
    },
    // Só execute a consulta se o slug for válido
    enabled: isValidSlug,
  });

  // Fetch formats
  const { data: formats } = useQuery({
    queryKey: ['/api/formats'],
    queryFn: async () => {
      const res = await fetch('/api/formats');
      if (!res.ok) throw new Error('Erro ao carregar formatos');
      return res.json();
    },
  });

  // Fetch file types
  const { data: fileTypes } = useQuery({
    queryKey: ['/api/fileTypes'],
    queryFn: async () => {
      const res = await fetch('/api/fileTypes');
      if (!res.ok) throw new Error('Erro ao carregar tipos de arquivo');
      return res.json();
    },
  });

  // Build filters for API query
  const getApiUrl = () => {
    const url = new URL('/api/arts', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    
    if (category?.id) {
      url.searchParams.append('categoryId', category.id.toString());
    }
    
    if (filters.formatId) {
      url.searchParams.append('formatId', filters.formatId.toString());
    }
    
    if (filters.fileTypeId) {
      url.searchParams.append('fileTypeId', filters.fileTypeId.toString());
    }
    
    if (search) {
      url.searchParams.append('search', search);
    }
    
    return url.pathname + url.search;
  };

  // Query key based on filters
  const queryKey = [
    '/api/arts',
    { page, limit, categoryId: category?.id, formatId: filters.formatId, fileTypeId: filters.fileTypeId, search }
  ];

  // Fetch arts with filters - só executar quando categoria estiver carregada
  const { 
    data, 
    isLoading: artsLoading, 
    isFetching,
    error: artsError 
  } = useQuery<{
    arts: any[];
    totalCount: number;
  }>({
    queryKey,
    queryFn: async () => {
      const apiUrl = getApiUrl();
      console.log("Buscando artes com URL:", apiUrl);
      console.log("Categoria ID:", category?.id);
      const res = await fetch(apiUrl);
      if (!res.ok) {
        console.error("Erro ao buscar artes:", res.status, res.statusText);
        throw new Error('Erro ao carregar artes');
      }
      const data = await res.json();
      console.log("Artes carregadas:", data);
      return data;
    },
    // Só execute a consulta quando tivermos o ID da categoria
    enabled: !!category?.id,
  });

  const arts = data?.arts || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = page * limit < totalCount;
  
  // Status geral de carregamento
  const isLoading = categoryLoading || (artsLoading && !isFetching);
  
  // Verificar erro
  const hasError = categoryError || artsError;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handleFormatChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      formatId: value && value !== "_all" ? parseInt(value) : null
    }));
  };

  const handleFileTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      fileTypeId: value && value !== "_all" ? parseInt(value) : null
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already set by the input onChange
  };

  const clearFilters = () => {
    setFilters({
      formatId: null,
      fileTypeId: null,
    });
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação */}
      <header className="bg-white border-b border-gray-200 py-3 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-blue-600"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1 border-blue-200 text-blue-600"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </Button>
          </div>
        </div>
      </header>

      {/* Mensagem de erro */}
      {hasError && (
        <div className="container mx-auto px-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Área de busca centralizada */}
      <div className="container mx-auto px-4 py-8 text-center">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-52 mx-auto mb-3" />
            <Skeleton className="h-4 w-1/4 mx-auto mb-6" />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              BUSCAR
            </h1>
            <h2 className="text-2xl font-medium text-blue-600 mb-2">
              {category?.name || 'Categoria'}
            </h2>
            <p className="text-neutral-600 mb-6">
              Sua pesquisa retornou <span className="font-medium">{totalCount}</span> resultados
            </p>
          </>
        )}
        
        <div className="max-w-xl mx-auto mb-6">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Buscar design..."
              className="pr-12 py-6 text-center rounded-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
      
      {/* Filtros horizontais centralizados */}
      <div className="container mx-auto px-4 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-full shadow-sm border border-gray-100 p-1.5 flex items-center justify-between">
            <div className="flex-1 flex justify-center gap-2">
              <Select 
                value={filters.formatId?.toString() || "_all"} 
                onValueChange={handleFormatChange}
                defaultValue="_all"
              >
                <SelectTrigger className="border-none bg-transparent shadow-none h-9 text-sm">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos os formatos</SelectItem>
                  {formats?.map((format: any) => (
                    <SelectItem key={format.id} value={format.id.toString()}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="h-6 border-r border-gray-200 my-1.5"></div>
              
              <Select 
                value={filters.fileTypeId?.toString() || "_all"} 
                onValueChange={handleFileTypeChange}
                defaultValue="_all"
              >
                <SelectTrigger className="border-none bg-transparent shadow-none h-9 text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos os tipos</SelectItem>
                  {fileTypes?.map((fileType: any) => (
                    <SelectItem key={fileType.id} value={fileType.id.toString()}>
                      {fileType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="h-6 border-r border-gray-200 my-1.5"></div>
              
              <Select defaultValue="newest">
                <SelectTrigger className="border-none bg-transparent shadow-none h-9 text-sm">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="popular">Mais populares</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="h-6 border-r border-gray-200 my-1.5 last:hidden"></div>
            </div>
            
            {(filters.formatId || filters.fileTypeId || search) && (
              <Button 
                variant="ghost"
                size="sm" 
                onClick={clearFilters}
                className="mr-2 text-xs text-blue-600"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 pb-16">
        {/* Galeria de imagens estilo Pinterest */}
        {isLoading ? (
          <div className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-0">
            {[...Array(15)].map((_, index) => (
              <div 
                key={index} 
                className="block overflow-hidden animate-pulse break-inside-avoid mb-4 rounded-xl shadow-sm"
              >
                <div className={`${index % 3 === 0 ? 'aspect-[3/4]' : (index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[1/1]')} bg-neutral-200 rounded-xl`} />
              </div>
            ))}
          </div>
        ) : arts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-5 flex justify-center">
                <div className="rounded-full bg-blue-50 p-4">
                  <Search className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma arte encontrada</h3>
              <p className="text-neutral-500 mb-6">
                {filters.formatId || filters.fileTypeId || search 
                  ? 'Tente ajustar seus filtros ou realizar uma busca diferente.'
                  : 'Esta categoria ainda não possui artes disponíveis. Confira outras categorias.'}
              </p>
              {(filters.formatId || filters.fileTypeId || search) && (
                <Button 
                  variant="default" 
                  onClick={clearFilters} 
                  className="mr-2"
                >
                  Limpar filtros
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setLocation('/')}
              >
                Voltar para a página inicial
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-0">
              {arts.map((art) => (
                <div 
                  key={art.id} 
                  className="break-inside-avoid mb-4 transform hover:-translate-y-1 transition-transform duration-300"
                  style={{ 
                    display: 'inline-block',
                    width: '100%'
                  }}
                >
                  <ArtCard 
                    art={art} 
                    onClick={() => setLocation(`/arts/${art.id}`)}
                  />
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-8 py-6 flex items-center rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                >
                  {isFetching ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Carregando...
                    </span>
                  ) : (
                    <span>Carregar mais designs</span>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}