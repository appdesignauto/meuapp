import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Category } from '@/types';
import { ArrowLeft, Search, Bookmark, ChevronRight, Eye, FilterX, Star, Clock, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useState, useEffect } from 'react';
import useScrollTop from '@/hooks/useScrollTop';
import { Badge } from '@/components/ui/badge';

interface EnhancedCategory extends Category {
  artCount: number;
  lastUpdate: string | Date;
  formats: string[];
}

type FilterType = 'all' | 'popular' | 'recent' | 'premium' | 'social';

const Categories = () => {
  // Garantir rolagem para o topo ao navegar para esta página
  useScrollTop();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [, setLocation] = useLocation();
  
  const { data: categories, isLoading } = useQuery<EnhancedCategory[]>({
    queryKey: ['/api/categories'],
  });
  
  // Armazenar a URL atual para navegação de retorno
  useEffect(() => {
    const currentUrl = window.location.pathname + window.location.search;
    localStorage.setItem('lastGalleryPage', currentUrl);
  }, [searchQuery, activeFilter]);

  // Função para obter imagens relacionadas à categoria específica (usando imagens locais)
  const getCategoryImagePaths = (category: EnhancedCategory): string[] => {
    const imagePaths: { [key: string]: string[] } = {
      'vendas': ['/assets/VENDAS 04.png', '/assets/VENDAS 10.png', '/assets/VENDAS 17.png', '/assets/VENDAS 32.png'],
      'lavagem': ['/assets/LAVAGEM 01.png', '/assets/LAVAGEM 03.png', '/assets/LAVAGEM 04.png', '/assets/LAVAGEM 10.png'],
      'mecanica': ['/assets/MECÂNICA 08.png', '/assets/MECÂNICA MOTO 01.png', '/assets/MECÂNICA 08.png', '/assets/MECÂNICA MOTO 01.png'],
      'locacao': ['/assets/LOCAÇÃO 06.png', '/assets/LOCAÇÃO 06.png', '/assets/LOCAÇÃO 06.png', '/assets/LOCAÇÃO 06.png'],
      'seminovos': ['/assets/VENDAS 36.png', '/assets/VENDAS 10.png', '/assets/VENDAS 17.png', '/assets/VENDAS 32.png'],
      'promocoes': ['/assets/VENDAS 54.png', '/assets/VENDAS 57.png', '/assets/VENDAS 10.png', '/assets/VENDAS 17.png'],
      'lancamentos': ['/assets/VENDAS 32.png', '/assets/VENDAS 17.png', '/assets/VENDAS 10.png', '/assets/VENDAS 04.png'],
    };
    
    // Se encontrar imagens para a categoria, use-as; caso contrário, use uma lista padrão
    return imagePaths[category.slug] || ['/assets/VENDAS 04.png', '/assets/VENDAS 10.png', '/assets/VENDAS 17.png', '/assets/VENDAS 32.png'];
  };
  
  // Função para obter o esquema de cores específico de cada categoria
  const getCategoryColorScheme = (slug: string): { primary: string, gradient: string, hover: string, light: string } => {
    const colorSchemes: { [key: string]: { primary: string, gradient: string, hover: string, light: string } } = {
      'vendas': { 
        primary: 'text-blue-600', 
        gradient: 'from-blue-500 to-blue-600', 
        hover: 'group-hover:bg-blue-50',
        light: 'bg-blue-50' 
      },
      'lavagem': { 
        primary: 'text-emerald-600', 
        gradient: 'from-emerald-500 to-emerald-600', 
        hover: 'group-hover:bg-emerald-50',
        light: 'bg-emerald-50' 
      },
      'mecanica': { 
        primary: 'text-red-600', 
        gradient: 'from-red-500 to-red-600', 
        hover: 'group-hover:bg-red-50',
        light: 'bg-red-50' 
      },
      'locacao': { 
        primary: 'text-amber-600', 
        gradient: 'from-amber-500 to-amber-600', 
        hover: 'group-hover:bg-amber-50',
        light: 'bg-amber-50' 
      },
      'seminovos': { 
        primary: 'text-purple-600', 
        gradient: 'from-purple-500 to-purple-600', 
        hover: 'group-hover:bg-purple-50',
        light: 'bg-purple-50' 
      },
      'promocoes': { 
        primary: 'text-orange-600', 
        gradient: 'from-orange-500 to-orange-600', 
        hover: 'group-hover:bg-orange-50',
        light: 'bg-orange-50' 
      },
      'lancamentos': { 
        primary: 'text-indigo-600', 
        gradient: 'from-indigo-500 to-indigo-600', 
        hover: 'group-hover:bg-indigo-50',
        light: 'bg-indigo-50' 
      },
      // Cores para outras categorias possíveis
      'default': { 
        primary: 'text-blue-600', 
        gradient: 'from-blue-500 to-blue-600', 
        hover: 'group-hover:bg-blue-50',
        light: 'bg-blue-50' 
      }
    };
    
    return colorSchemes[slug] || colorSchemes.default;
  };

  // Filtrar categorias com base na busca e no filtro ativo
  const filteredCategories = categories?.filter(category => {
    // Aplicar filtro de busca
    const matchesSearch = searchQuery === '' || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Se não corresponde à busca, retorna falso independentemente do filtro
    if (!matchesSearch) return false;
    
    // Aplicar filtro de tipo
    switch (activeFilter) {
      case 'popular':
        return category.artCount > 25; // Categorias com mais artes
      case 'recent':
        // Verificar se a categoria foi atualizada nos últimos 7 dias
        if (typeof category.lastUpdate === 'string') {
          const updateDate = new Date(category.lastUpdate);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return updateDate > sevenDaysAgo;
        }
        return false;
      case 'premium':
        // Categorias que contêm artes premium
        return !!category.formats?.includes('premium');
      case 'social':
        // Categorias mais adequadas para redes sociais
        return category.slug.includes('social') || 
               category.slug.includes('promocoes') || 
               category.slug.includes('vendas');
      case 'all':
      default:
        return true;
    }
  });

  // Manipular a busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Busca já foi aplicada via state
  };

  // Função para mudar o filtro ativo
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Área de busca centralizada */}
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          CATEGORIAS
        </h1>
        <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
          Escolha uma categoria para encontrar centenas de artes automotivas para seu negócio
        </p>
        
        <div className="max-w-xl mx-auto mb-6">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Buscar categoria..."
              className="w-full py-3 pl-12 pr-10 text-center rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-neutral-400">
              <Search className="h-5 w-5" />
            </div>
          </form>
        </div>
        
        {/* Filtros rápidos */}
        <div className="flex flex-wrap justify-center gap-2 my-6">
          <Badge 
            variant={activeFilter === 'all' ? 'default' : 'outline'} 
            className={`px-4 py-2 cursor-pointer text-sm transition-all ${activeFilter === 'all' ? 'bg-blue-600' : 'hover:bg-blue-50'}`}
            onClick={() => handleFilterChange('all')}
          >
            <Zap className="w-4 h-4 mr-1" />
            Todas
          </Badge>
          
          <Badge 
            variant={activeFilter === 'popular' ? 'default' : 'outline'} 
            className={`px-4 py-2 cursor-pointer text-sm transition-all ${activeFilter === 'popular' ? 'bg-amber-600' : 'hover:bg-amber-50'}`}
            onClick={() => handleFilterChange('popular')}
          >
            <Star className="w-4 h-4 mr-1" />
            Mais populares
          </Badge>
          
          <Badge 
            variant={activeFilter === 'recent' ? 'default' : 'outline'} 
            className={`px-4 py-2 cursor-pointer text-sm transition-all ${activeFilter === 'recent' ? 'bg-emerald-600' : 'hover:bg-emerald-50'}`}
            onClick={() => handleFilterChange('recent')}
          >
            <Clock className="w-4 h-4 mr-1" />
            Atualizadas recentemente
          </Badge>
          
          <Badge 
            variant={activeFilter === 'premium' ? 'default' : 'outline'} 
            className={`px-4 py-2 cursor-pointer text-sm transition-all ${activeFilter === 'premium' ? 'bg-purple-600' : 'hover:bg-purple-50'}`}
            onClick={() => handleFilterChange('premium')}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Premium
          </Badge>
          
          <Badge 
            variant={activeFilter === 'social' ? 'default' : 'outline'} 
            className={`px-4 py-2 cursor-pointer text-sm transition-all ${activeFilter === 'social' ? 'bg-red-600' : 'hover:bg-red-50'}`}
            onClick={() => handleFilterChange('social')}
          >
            <Bookmark className="w-4 h-4 mr-1" />
            Redes sociais
          </Badge>
        </div>
      </div>
      
      {/* Conteúdo principal - Grid de categorias */}
      <div className="container mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-32 mx-auto" />
                  <Skeleton className="h-4 w-48 mx-auto mt-2" />
                  <Skeleton className="h-4 w-20 mx-auto mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories?.length === 0 ? (
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-5 flex justify-center">
                <div className="rounded-full bg-blue-50 p-4">
                  <FilterX className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-neutral-500 mb-6">
                {searchQuery ? 
                  'Tente ajustar sua busca ou verificar se digitou corretamente.' : 
                  'Nenhuma categoria corresponde ao filtro selecionado.'}
              </p>
              <div className="flex gap-2 justify-center">
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')}
                  >
                    Limpar busca
                  </Button>
                )}
                {activeFilter !== 'all' && (
                  <Button 
                    variant="default" 
                    onClick={() => setActiveFilter('all')}
                  >
                    Mostrar todas
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCategories?.map((category) => {
              const imagePaths = getCategoryImagePaths(category);
              
              return (
                <Link key={category.id} href={`/categorias/${category.slug}`}>
                  <div className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer h-full transform hover:-translate-y-1">
                    {/* Componente de categoria colorido */}
                    {(() => {
                      const colorScheme = getCategoryColorScheme(category.slug);
                      
                      return (
                        <>
                        {/* Faixa de cor superior */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorScheme.gradient} transform origin-left transition-all duration-500 group-hover:h-2`}></div>

                        {/* Imagens em Grid */}
                        <div className="aspect-square relative">
                          <div className="grid grid-cols-2 h-full">
                            {imagePaths.map((path, i) => (
                              <div key={i} className="overflow-hidden border border-white relative">
                                <img 
                                  src={path} 
                                  alt="" 
                                  className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700"
                                  loading="lazy"
                                />
                                {/* Overlay para efeito de hover */}
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Badge de quantidade */}
                          <div className={`absolute top-3 left-3 ${colorScheme.light} ${colorScheme.primary} text-xs font-medium rounded-full px-2.5 py-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100`}>
                            {category.artCount} {category.artCount === 1 ? 'arte' : 'artes'}
                          </div>

                          {/* Overlay com gradiente na parte inferior */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                        
                        {/* Informações da Categoria */}
                        <div className="p-4 relative">
                          {/* Ícone do tipo circle pulse em hover */}
                          <div className={`absolute -top-6 right-4 flex items-center justify-center ${colorScheme.light} rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 shadow-lg transition-all duration-500 transform -translate-y-4 group-hover:translate-y-0`}>
                            <div className={`absolute inset-0 ${colorScheme.light} rounded-full animate-ping opacity-30`}></div>
                            <Eye className={`h-5 w-5 ${colorScheme.primary} relative z-10`} />
                          </div>

                          <h3 className="text-lg font-semibold text-neutral-800 mb-1 group-hover:text-neutral-900 transition-colors duration-300">{category.name}</h3>
                          
                          <p className="text-sm text-neutral-600 group-hover:text-neutral-700 mb-2 transition-colors duration-300">
                            <span className="font-medium">{category.artCount}</span> {category.artCount === 1 ? 'arte disponível' : 'artes disponíveis'}
                          </p>
                          
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-xs text-neutral-500">
                              {category.lastUpdate && (
                                typeof category.lastUpdate === 'string' 
                                  ? formatDate(category.lastUpdate)
                                  : formatDate(new Date(category.lastUpdate).toISOString())
                              )}
                            </span>
                            
                            <div className={`flex items-center ${colorScheme.primary} text-xs font-medium`}>
                              <span>Ver artes</span>
                              <ChevronRight className={`h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-0.5`} />
                            </div>
                          </div>
                        </div>
                        </>
                      );
                    })()}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;