import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
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
      formatId: value ? parseInt(value) : null
    }));
  };

  const handleFileTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      fileTypeId: value ? parseInt(value) : null
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
    <div className="container mx-auto px-4 py-8">
      {/* Header com navegação de volta */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-blue-600"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a página inicial
        </Button>
      </div>

      {/* Mensagem de erro */}
      {hasError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Título da categoria e estatísticas */}
      {isLoading ? (
        <div className="mb-8">
          <Skeleton className="h-12 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {category?.name || 'Categoria'}
          </h1>
          <p className="text-neutral-600">
            {totalCount} designs disponíveis para personalização
          </p>
        </div>
      )}

      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Buscar design..."
              className="pr-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-blue-600"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
        
        <div className="flex gap-3">
          <div className="w-40 hidden md:block">
            <Select 
              value={filters.formatId?.toString() || ""} 
              onValueChange={handleFormatChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os formatos</SelectItem>
                {formats?.map((format: any) => (
                  <SelectItem key={format.id} value={format.id.toString()}>
                    {format.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40 hidden md:block">
            <Select 
              value={filters.fileTypeId?.toString() || ""} 
              onValueChange={handleFileTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de arquivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {fileTypes?.map((fileType: any) => (
                  <SelectItem key={fileType.id} value={fileType.id.toString()}>
                    {fileType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtros em dispositivos móveis */}
          <div className="block md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>
                    Refine sua busca usando os filtros abaixo
                  </SheetDescription>
                </SheetHeader>
                
                <div className="py-6 space-y-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="formats">
                      <AccordionTrigger>Formato</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div 
                            className={`px-4 py-2 rounded-lg cursor-pointer ${!filters.formatId ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-neutral-50'}`}
                            onClick={() => handleFormatChange("")}
                          >
                            Todos os formatos
                          </div>
                          {formats?.map((format: any) => (
                            <div 
                              key={format.id} 
                              className={`px-4 py-2 rounded-lg cursor-pointer ${filters.formatId === format.id ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-neutral-50'}`}
                              onClick={() => handleFormatChange(format.id.toString())}
                            >
                              {format.name}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="fileTypes">
                      <AccordionTrigger>Tipo de Arquivo</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div 
                            className={`px-4 py-2 rounded-lg cursor-pointer ${!filters.fileTypeId ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-neutral-50'}`}
                            onClick={() => handleFileTypeChange("")}
                          >
                            Todos os tipos
                          </div>
                          {fileTypes?.map((fileType: any) => (
                            <div 
                              key={fileType.id} 
                              className={`px-4 py-2 rounded-lg cursor-pointer ${filters.fileTypeId === fileType.id ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-neutral-50'}`}
                              onClick={() => handleFileTypeChange(fileType.id.toString())}
                            >
                              {fileType.name}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                  <SheetTrigger asChild>
                    <Button variant="default">Aplicar</Button>
                  </SheetTrigger>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Botão para ordenação */}
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden md:inline">Ordenar</span>
          </Button>
          
          {/* Botão para limpar filtros em desktop */}
          {(filters.formatId || filters.fileTypeId || search) && (
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              className="hidden md:block"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Galeria de imagens estilo Pinterest */}
      {isLoading ? (
        <div className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-0">
          {[...Array(10)].map((_, index) => (
            <div 
              key={index} 
              className="block overflow-hidden animate-pulse break-inside-avoid mb-3 rounded-xl shadow-sm"
            >
              <div className={`${index % 3 === 0 ? 'aspect-1' : (index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[9/16]')} bg-neutral-200 rounded-xl`} />
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
            <h3 className="text-xl font-semibold mb-2">Nenhum design encontrado</h3>
            <p className="text-neutral-500 mb-6">
              {filters.formatId || filters.fileTypeId || search 
                ? 'Tente ajustar seus filtros ou realizar uma busca diferente.'
                : 'Esta categoria ainda não possui designs disponíveis. Confira outras categorias.'}
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
          <div className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-0">
            {arts.map((art) => (
              <div 
                key={art.id} 
                className="break-inside-avoid mb-3 transform hover:-translate-y-1 transition-transform duration-300"
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
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
  );
}