import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import useScrollTop from '@/hooks/useScrollTop';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, Search, Filter, AlertCircle, Loader2, 
  LayoutGrid, LayoutList, Calendar, Star, Eye, Clock, Sparkles, 
  BookMarked, ChevronRight, Info, Tag, FileImage
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CategoryPage() {
  // Garantir rolagem para o topo ao navegar para esta página
  useScrollTop();
  
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'popular' | 'recent' | 'premium' | 'free'>('all');
  const [filters, setFilters] = useState({
    formatId: null as number | null,
    fileTypeId: null as number | null,
    isPremium: null as boolean | null,
    sortBy: null as 'recent' | 'popular' | null,
  });
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);
  const limit = 12;
  
  // Função para obter o esquema de cores específico da categoria
  const getCategoryColorScheme = (slug: string): { primary: string, gradient: string, light: string, darkBg: string } => {
    const colorSchemes: { [key: string]: { primary: string, gradient: string, light: string, darkBg: string } } = {
      'vendas': { 
        primary: 'text-blue-600', 
        gradient: 'from-blue-500 to-blue-600',
        light: 'bg-blue-50',
        darkBg: 'bg-blue-600'
      },
      'lavagem': { 
        primary: 'text-emerald-600', 
        gradient: 'from-emerald-500 to-emerald-600',
        light: 'bg-emerald-50',
        darkBg: 'bg-emerald-600'
      },
      'mecanica': { 
        primary: 'text-red-600', 
        gradient: 'from-red-500 to-red-600',
        light: 'bg-red-50',
        darkBg: 'bg-red-600'
      },
      'locacao': { 
        primary: 'text-amber-600', 
        gradient: 'from-amber-500 to-amber-600',
        light: 'bg-amber-50',
        darkBg: 'bg-amber-600'
      },
      'seminovos': { 
        primary: 'text-purple-600', 
        gradient: 'from-purple-500 to-purple-600',
        light: 'bg-purple-50',
        darkBg: 'bg-purple-600'
      },
      'promocoes': { 
        primary: 'text-orange-600', 
        gradient: 'from-orange-500 to-orange-600',
        light: 'bg-orange-50',
        darkBg: 'bg-orange-600'
      },
      'lancamentos': { 
        primary: 'text-indigo-600', 
        gradient: 'from-indigo-500 to-indigo-600',
        light: 'bg-indigo-50',
        darkBg: 'bg-indigo-600'
      },
      // Default colors
      'default': { 
        primary: 'text-blue-600', 
        gradient: 'from-blue-500 to-blue-600',
        light: 'bg-blue-50',
        darkBg: 'bg-blue-600'
      }
    };
    
    return colorSchemes[slug] || colorSchemes.default;
  };

  // Verifique se o slug está presente e é válido
  const isValidSlug = typeof slug === 'string' && slug.length > 0;

  // Fetch category by slug
  const { 
    data: category, 
    isLoading: categoryLoading,
    error: categoryError
  } = useQuery({
    queryKey: ['/api/categorias/slug', slug],
    queryFn: async () => {
      console.log("Buscando categoria com slug:", slug);
      const res = await fetch(`/api/categorias/slug/${slug}`);
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
      
      // Log detalhado com informações sobre datas
      console.log("Detalhes da categoria:", {
        id: data.id,
        name: data.name,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        tipoCreatedAt: typeof data.createdAt,
        tipoUpdatedAt: typeof data.updatedAt
      });
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
    
    // Adiciona filtro de premium/grátis se existir
    if (filters.isPremium !== null) {
      url.searchParams.append('isPremium', filters.isPremium.toString());
    }
    
    // Adiciona filtro de ordenação
    if (filters.sortBy) {
      url.searchParams.append('sortBy', filters.sortBy);
    }
    
    if (search) {
      url.searchParams.append('search', search);
    }
    
    return url.pathname + url.search;
  };

  // Query key based on filters
  const queryKey = [
    '/api/arts',
    { 
      page, 
      limit, 
      categoryId: category?.id, 
      formatId: filters.formatId, 
      fileTypeId: filters.fileTypeId, 
      isPremium: filters.isPremium,
      sortBy: filters.sortBy, 
      search 
    }
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
  
  // Armazenar a URL atual para navegação de retorno
  useEffect(() => {
    const currentUrl = window.location.pathname + window.location.search;
    localStorage.setItem('lastGalleryPage', currentUrl);
  }, [page, filters, search, slug]);

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
      isPremium: null,
      sortBy: null,
    });
    setSearch('');
    setActiveQuickFilter('all');
  };

  // Get the appropriate color scheme based on the category slug
  const colorScheme = slug ? getCategoryColorScheme(slug) : getCategoryColorScheme('default');
  
  const handleQuickFilterChange = (filter: 'all' | 'popular' | 'recent' | 'premium' | 'free') => {
    setActiveQuickFilter(filter);
    
    // Aplicar filtros baseados na seleção
    if (filter === 'premium') {
      // Filtro apenas de artes premium
      setFilters(prev => ({
        ...prev,
        isPremium: true,
        sortBy: null // Remover ordenação existente
      }));
    } else if (filter === 'free') {
      // Filtro apenas de artes gratuitas
      setFilters(prev => ({
        ...prev,
        isPremium: false,
        sortBy: null // Remover ordenação existente
      }));
    } else if (filter === 'popular') {
      // Filtro de artes mais populares (por visualizações)
      setFilters(prev => ({
        ...prev,
        sortBy: 'popular',
        // Remover filtro de premium caso exista
        isPremium: null
      }));
    } else if (filter === 'recent') {
      // Filtro de artes mais recentes (por data)
      setFilters(prev => ({
        ...prev,
        sortBy: 'recent',
        // Remover filtro de premium caso exista
        isPremium: null
      }));
    } else {
      // Filtro 'all' - remover todos os filtros especiais
      setFilters(prev => ({
        ...prev,
        isPremium: null,
        sortBy: null
      }));
    }
  };

  // Função para formatar a data no formato desejado
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Data não disponível";
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data não disponível";
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação */}
      <header className="bg-white border-b border-gray-200 py-3 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-600"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            {/* Breadcrumb de navegação */}
            {!categoryLoading && category && (
              <div className="hidden sm:flex items-center ml-2 text-sm">
                <span className="text-gray-400 mx-2">/</span>
                <Button 
                  variant="link" 
                  className="p-0 text-sm text-gray-500 h-auto"
                  onClick={() => setLocation('/categorias')}
                >
                  Categorias
                </Button>
                <span className="text-gray-400 mx-2">/</span>
                <span className={`text-sm font-medium ${colorScheme.primary}`}>{category.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              className={`h-8 text-xs px-3 sm:px-4 border-gray-300 ${showCategoryInfo ? `${colorScheme.primary} ${colorScheme.light}` : ''}`}
              onClick={() => setShowCategoryInfo(prev => !prev)}
            >
              {showCategoryInfo ? (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden xs:inline">Ocultar detalhes</span>
                  <span className="xs:hidden">Ocultar</span>
                </>
              ) : (
                <>
                  <Info className="h-3.5 w-3.5 mr-1" /> 
                  <span className="hidden xs:inline">Ver detalhes</span>
                  <span className="xs:hidden">Detalhes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Cabeçalho Minimalista da Categoria */}
      {!categoryLoading && category && (
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center">
                <div className={`h-10 w-1.5 rounded-full ${colorScheme.darkBg} mr-4`}></div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
                    <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">
                      {totalCount} {totalCount === 1 ? 'arte' : 'artes'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Designs profissionais para {category.name.toLowerCase()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                {category.isPremium && (
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${colorScheme.light} ${colorScheme.primary}`}>
                    Premium
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
      
      {/* Painel de Informações da Categoria (exibido quando showCategoryInfo é true) */}
      {showCategoryInfo && !isLoading && category && (
        <div className="container mx-auto px-4 py-6">
          <div className={`bg-white border border-gray-100 rounded-xl shadow-sm p-4 md:p-6 mb-8 relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${colorScheme.darkBg}`}></div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-3">Sobre esta categoria</h3>
                <p className="text-gray-600 mb-4 leading-relaxed text-sm md:text-base">
                  Esta categoria contém artes profissionais para {category.name.toLowerCase()}, 
                  otimizadas para mídias sociais, anúncios, e materiais promocionais. 
                  Todas as artes podem ser editadas facilmente nos aplicativos suportados.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 truncate">
                      Atualizada em: {category.updatedAt ? formatDateTime(category.updatedAt) : 'Data não disponível'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 truncate">Visualizações: {arts.reduce((total, art) => total + (art.viewCount || art.viewcount || 0), 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 truncate">Formatos disponíveis: {Array.from(new Set(arts.map(art => art.format))).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 truncate">
                      Adicionada: {category.createdAt ? formatDateTime(category.createdAt) : 'Data não disponível'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="md:w-64 flex flex-col justify-between mt-4 md:mt-0">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-500 uppercase">Estatísticas</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FileImage className="h-4 w-4 mr-2 text-gray-400" />
                        Total de artes
                      </div>
                      <span className="font-medium">{totalCount}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                        Artes premium
                      </div>
                      <span className="font-medium">{arts.filter(art => art.isPremium).length}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Tag className="h-4 w-4 mr-2 text-green-400" />
                        Artes gratuitas
                      </div>
                      <span className="font-medium">{arts.filter(art => !art.isPremium).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filtros Rápidos */}
      <div className="container mx-auto px-4 py-4 mb-8">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Badge 
            variant={activeQuickFilter === 'all' ? 'default' : 'outline'} 
            className={`px-4 py-2.5 cursor-pointer text-sm transition-all ${activeQuickFilter === 'all' ? 'bg-blue-600' : 'hover:bg-blue-50'}`}
            onClick={() => handleQuickFilterChange('all')}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Todas
          </Badge>
          
          <Badge 
            variant={activeQuickFilter === 'popular' ? 'default' : 'outline'} 
            className={`px-4 py-2.5 cursor-pointer text-sm transition-all ${activeQuickFilter === 'popular' ? 'bg-amber-600' : 'hover:bg-amber-50'}`}
            onClick={() => handleQuickFilterChange('popular')}
          >
            <Star className="w-4 h-4 mr-1.5" />
            Mais populares
          </Badge>
          
          <Badge 
            variant={activeQuickFilter === 'recent' ? 'default' : 'outline'} 
            className={`px-4 py-2.5 cursor-pointer text-sm transition-all ${activeQuickFilter === 'recent' ? 'bg-emerald-600' : 'hover:bg-emerald-50'}`}
            onClick={() => handleQuickFilterChange('recent')}
          >
            <Clock className="w-4 h-4 mr-1.5" />
            Recentes
          </Badge>
          
          <Badge 
            variant={activeQuickFilter === 'premium' ? 'default' : 'outline'} 
            className={`px-4 py-2.5 cursor-pointer text-sm transition-all ${activeQuickFilter === 'premium' ? 'bg-purple-600' : 'hover:bg-purple-50'}`}
            onClick={() => handleQuickFilterChange('premium')}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Premium
          </Badge>
          
          <Badge 
            variant={activeQuickFilter === 'free' ? 'default' : 'outline'} 
            className={`px-4 py-2.5 cursor-pointer text-sm transition-all ${activeQuickFilter === 'free' ? 'bg-green-600' : 'hover:bg-green-50'}`}
            onClick={() => handleQuickFilterChange('free')}
          >
            <Tag className="w-4 h-4 mr-1.5" />
            Grátis
          </Badge>
        </div>
      </div>
      
      {/* Filtros horizontais centralizados */}
      <div className="container mx-auto px-4 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl md:rounded-full shadow-sm border border-gray-100 p-1.5 flex flex-col md:flex-row items-center justify-between">
            <div className="w-full md:w-auto flex-1 grid grid-cols-2 md:flex justify-center gap-2 mb-2 md:mb-0">
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
              
              <div className="col-span-2 md:col-span-1">
                <Select 
                  value={filters.sortBy || 'default'}
                  onValueChange={(value) => {
                    if (value === 'default') {
                      setFilters(prev => ({ ...prev, sortBy: null }));
                      setActiveQuickFilter('all');
                    } else if (value === 'recent') {
                      setFilters(prev => ({ ...prev, sortBy: 'recent' }));
                      setActiveQuickFilter('recent');
                    } else if (value === 'popular') {
                      setFilters(prev => ({ ...prev, sortBy: 'popular' }));
                      setActiveQuickFilter('popular');
                    }
                  }}
                >
                  <SelectTrigger className="border-none bg-transparent shadow-none h-9 text-sm">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Ordenação padrão</SelectItem>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="popular">Mais populares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(filters.formatId || filters.fileTypeId || search) && (
              <Button 
                variant="ghost"
                size="sm" 
                onClick={clearFilters}
                className="w-full md:w-auto mb-1 md:mb-0 md:mr-2 text-xs text-blue-600"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 pb-16">
        {/* Galeria de imagens estilo Pinterest */}
        {isLoading ? (
          <div 
            className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 space-y-0"
            style={{ columnGap: '8px' }}
          >
            {Array.from({ length: 15 }).map((_, index) => (
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
            <div 
              className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 space-y-0"
              style={{ columnGap: '8px' }}
            >
              {arts.map((art) => (
                <div 
                  key={art.id} 
                  className="break-inside-avoid mb-3 xs:mb-4 transform hover:-translate-y-1 transition-transform duration-300"
                  style={{ 
                    display: 'inline-block',
                    width: '100%'
                  }}
                >
                  <ArtCard 
                    art={art} 
                    onClick={() => setLocation(`/artes/${art.id}`)}
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
                    <span>Carregar mais artes</span>
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