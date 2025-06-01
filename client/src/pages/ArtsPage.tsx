import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import useScrollTop from '@/hooks/useScrollTop';
import { ArrowLeft, Search, Filter, SlidersHorizontal, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';

export default function ArtsPage() {
  // Garantir rolagem para o topo ao navegar para esta página
  useScrollTop();


  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    categoryId: null as number | null,
    formatId: null as number | null,
    fileTypeId: null as number | null,
    isPremium: null as boolean | null,
  });
  const limit = 24; // Mais itens por página para galeria estilo Pinterest

  // Buscar categorias
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  // Buscar formatos
  const { data: formats = [], isLoading: formatsLoading } = useQuery<any[]>({
    queryKey: ['/api/formats'],
  });

  // Buscar tipos de arquivo
  const { data: fileTypes = [], isLoading: fileTypesLoading } = useQuery<any[]>({
    queryKey: ['/api/fileTypes'],
  });

  // Gerar URL da API
  const getApiUrl = () => {
    const url = new URL('/api/artes', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    
    if (filters.categoryId) url.searchParams.append('categoryId', filters.categoryId.toString());
    if (filters.formatId) url.searchParams.append('formatId', filters.formatId.toString());
    if (filters.fileTypeId) url.searchParams.append('fileTypeId', filters.fileTypeId.toString());
    if (filters.isPremium !== null) url.searchParams.append('isPremium', filters.isPremium.toString());
    if (search) url.searchParams.append('search', search);
    
    return url.pathname + url.search;
  };

  // Chave de consulta para React Query
  const queryKey = [
    '/api/artes',
    { page, limit, ...filters, search }
  ];

  // Buscar artes com filtros
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
      const res = await fetch(getApiUrl());
      if (!res.ok) {
        throw new Error('Erro ao carregar artes');
      }
      return await res.json();
    },
  });

  const arts = data?.arts || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = page < totalPages;

  // Força o espaçamento correto na galeria após renderização
  useEffect(() => {
    const forceGallerySpacing = () => {
      if (galleryRef.current) {
        galleryRef.current.style.setProperty('column-gap', '8px', 'important');
        galleryRef.current.style.setProperty('-webkit-column-gap', '8px', 'important');
        galleryRef.current.style.setProperty('-moz-column-gap', '8px', 'important');
      }
    };

    // Aplicar imediatamente
    forceGallerySpacing();

    // Aplicar após um pequeno delay para garantir que o DOM esteja totalmente carregado
    const timeoutId = setTimeout(forceGallerySpacing, 100);

    return () => clearTimeout(timeoutId);
  }, [data]);
  
  // Carregar parâmetros de busca da URL quando a página é carregada
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    
    if (searchParam) {
      setSearch(searchParam);
    }

    const categoryParam = params.get('categoryId');
    if (categoryParam) {
      setFilters(prev => ({
        ...prev,
        categoryId: parseInt(categoryParam)
      }));
    }
    
    const formatParam = params.get('formatId');
    if (formatParam) {
      setFilters(prev => ({
        ...prev,
        formatId: parseInt(formatParam)
      }));
    }
    
    const fileTypeParam = params.get('fileTypeId');
    if (fileTypeParam) {
      setFilters(prev => ({
        ...prev,
        fileTypeId: parseInt(fileTypeParam)
      }));
    }
  }, []);
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, search]);
  
  // Armazenar a URL atual para navegação de retorno
  useEffect(() => {
    const currentUrl = window.location.pathname + window.location.search;
    localStorage.setItem('lastGalleryPage', currentUrl);
  }, [page, filters, search]);

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      categoryId: value && value !== "_all" ? parseInt(value) : null
    }));
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

  const handleLicenseChange = (value: string) => {
    setPage(1);
    setFilters(prev => ({
      ...prev,
      isPremium: value === "_all" ? null : value === "premium"
    }));
  };

  const clearFilters = () => {
    setFilters({
      categoryId: null,
      formatId: null,
      fileTypeId: null,
      isPremium: null
    });
    setSearch('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // A pesquisa já está sendo tratada pelo estado
  };

  const isFiltersLoading = categoriesLoading || formatsLoading || fileTypesLoading;
  const isAnyFilterActive = search || filters.categoryId || filters.formatId || filters.fileTypeId || filters.isPremium !== null;

  return (
    <>
      {/* Cabeçalho com navegação */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-6 border-b border-neutral-200">
        <div className="container mx-auto px-4">
          {/* Título e navegação de volta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <div className="flex items-center mb-2">
                <Button 
                  variant="ghost" 
                  className="p-0 mr-2 hover:bg-transparent" 
                  onClick={() => setLocation('/')}
                >
                  <ArrowLeft className="h-5 w-5 text-blue-600" />
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Todos os Designs</h1>
              </div>
              <p className="text-neutral-600 max-w-3xl">
                Explore nossa coleção completa de templates profissionais para impulsionar seu negócio
              </p>
            </div>

            {/* Barra de pesquisa */}
            <div className="mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Pesquisar designs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10 rounded-full border-blue-200"
                />
                <Button 
                  size="icon"
                  type="submit"
                  variant="ghost"
                  className="absolute right-0 rounded-full"
                >
                  <Search className="h-4 w-4 text-blue-500" />
                </Button>
              </form>
            </div>
          </div>

          {/* Filtros para Desktop */}
          <div className="hidden md:flex flex-wrap items-center gap-2 mb-1">
            {/* Filtro por Categoria */}
            <Select
              value={filters.categoryId?.toString() || "_all"}
              onValueChange={handleCategoryChange}
              disabled={isFiltersLoading}
            >
              <SelectTrigger className="h-9 px-3 w-[150px] border-blue-200 bg-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas categorias</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Formato */}
            <Select
              value={filters.formatId?.toString() || "_all"}
              onValueChange={handleFormatChange}
              disabled={isFiltersLoading}
            >
              <SelectTrigger className="h-9 px-3 w-[150px] border-blue-200 bg-white">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos formatos</SelectItem>
                {formats?.map((format: any) => (
                  <SelectItem key={format.id} value={format.id.toString()}>
                    {format.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Tipo de Arquivo */}
            <Select
              value={filters.fileTypeId?.toString() || "_all"}
              onValueChange={handleFileTypeChange}
              disabled={isFiltersLoading}
            >
              <SelectTrigger className="h-9 px-3 w-[150px] border-blue-200 bg-white">
                <SelectValue placeholder="Tipo de Arquivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos tipos</SelectItem>
                {fileTypes?.map((fileType: any) => (
                  <SelectItem key={fileType.id} value={fileType.id.toString()}>
                    {fileType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botão para limpar filtros (só aparece quando há filtros ativos) */}
            {isAnyFilterActive && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-9 text-blue-600 px-3"
              >
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Filtros para Mobile - Externos */}
          <div className="md:hidden space-y-3">
            {/* Filtros em uma linha */}
            <div className="flex gap-1 overflow-x-auto">
              {/* Filtro por Categoria */}
              <Select
                value={filters.categoryId?.toString() || "_all"}
                onValueChange={handleCategoryChange}
                disabled={isFiltersLoading}
              >
                <SelectTrigger className="h-9 px-2 min-w-[85px] border-blue-200 bg-white text-xs flex-shrink-0">
                  <span className="text-gray-700 truncate">Categorias</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas categorias</SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Formato */}
              <Select
                value={filters.formatId?.toString() || "_all"}
                onValueChange={handleFormatChange}
                disabled={isFiltersLoading}
              >
                <SelectTrigger className="h-9 px-2 min-w-[75px] border-blue-200 bg-white text-xs flex-shrink-0">
                  <span className="text-gray-700 truncate">Formatos</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos formatos</SelectItem>
                  {formats?.map((format: any) => (
                    <SelectItem key={format.id} value={format.id.toString()}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Tipo de Arquivo */}
              <Select
                value={filters.fileTypeId?.toString() || "_all"}
                onValueChange={handleFileTypeChange}
                disabled={isFiltersLoading}
              >
                <SelectTrigger className="h-9 px-2 min-w-[60px] border-blue-200 bg-white text-xs flex-shrink-0">
                  <span className="text-gray-700 truncate">Tipos</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos tipos</SelectItem>
                  {fileTypes?.map((fileType: any) => (
                    <SelectItem key={fileType.id} value={fileType.id.toString()}>
                      {fileType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Licença */}
              <Select
                value={filters.isPremium === null ? "_all" : filters.isPremium ? "premium" : "free"}
                onValueChange={handleLicenseChange}
                disabled={isFiltersLoading}
              >
                <SelectTrigger className="h-9 px-2 min-w-[65px] border-blue-200 bg-white text-xs flex-shrink-0">
                  <span className="text-gray-700 truncate">Licença</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas</SelectItem>
                  <SelectItem value="free">Grátis</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Linha inferior com botão limpar e contador */}
            <div className="flex items-center justify-between">
              {isAnyFilterActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-blue-600 px-3"
                >
                  Limpar filtros
                </Button>
              )}

              {/* Indicador de filtros ativos */}
              {isAnyFilterActive && (
                <div className="text-sm text-neutral-500">
                  {totalCount} designs encontrados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-8 pb-16">
        {/* Mensagem de erro */}
        {artsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Ocorreu um erro ao carregar os designs. Por favor, tente novamente.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Galeria de imagens estilo Pinterest */}
        {artsLoading && page === 1 ? (
          <div 
            className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 space-y-0"
            style={{ 
              columnGap: '8px'
            }}
          >
            {Array.from({ length: 15 }).map((_, index) => (
              <div 
                key={index} 
                className="block overflow-hidden animate-pulse break-inside-avoid rounded-xl shadow-sm"
                style={{ 
                  marginBottom: '8px'
                }}
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
              <h3 className="text-xl font-semibold mb-2">Nenhum design encontrado</h3>
              <p className="text-neutral-500 mb-6">
                {isAnyFilterActive
                  ? 'Tente ajustar seus filtros ou realizar uma busca diferente.'
                  : 'No momento não há designs disponíveis. Confira mais tarde.'}
              </p>
              {isAnyFilterActive && (
                <Button onClick={clearFilters} variant="outline">
                  Limpar todos os filtros
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div 
              ref={galleryRef}
              className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5"
              style={{
                columnGap: '8px'
              }}
            >
              {arts.map((art) => (
                <div 
                  key={art.id} 
                  className="break-inside-avoid transform hover:-translate-y-1 transition-transform duration-300"
                  style={{ 
                    display: 'inline-block',
                    width: '100%',
                    marginBottom: '8px'
                  }}
                >
                  <ArtCard 
                    art={art} 
                    onClick={() => setLocation(`/artes/${art.id}`)}
                  />
                </div>
              ))}
            </div>
            
            {/* Botões de Paginação Modernos */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-4 mt-12 mb-8">
                {/* Indicador de página atual - visível no mobile */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-600 font-medium">
                      Página {page} de {totalPages}
                    </span>
                  </div>
                </div>

                {/* Botões de navegação - sempre na mesma linha */}
                <div className="flex justify-center items-center gap-3">
                  {/* Botão Página Anterior */}
                  <Button
                    onClick={goToPreviousPage}
                    disabled={page === 1 || isFetching}
                    variant="outline"
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm
                      ${page === 1 || isFetching 
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:shadow-md'
                      }
                    `}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden xs:inline">Página anterior</span>
                    <span className="xs:hidden">Anterior</span>
                  </Button>

                  {/* Botão Próxima Página */}
                  <Button
                    onClick={goToNextPage}
                    disabled={page === totalPages || isFetching}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm
                      ${page === totalPages || isFetching
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                      }
                    `}
                  >
                    <span className="hidden xs:inline">Próxima página</span>
                    <span className="xs:hidden">Próxima</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Loading indicator apenas durante mudança de página */}
            {isFetching && page > 1 && (
              <div className="flex justify-center my-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                  <span className="text-neutral-500">Carregando designs...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}