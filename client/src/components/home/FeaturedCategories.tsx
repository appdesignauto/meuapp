import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Filter } from 'lucide-react';
import { Category } from '@/types';

interface FeaturedCategoriesProps {
  selectedCategory?: number | null;
  onCategorySelect?: (categoryId: number | null) => void;
}

const FeaturedCategories = ({ selectedCategory, onCategorySelect }: FeaturedCategoriesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [showArrows, setShowArrows] = useState(false);
  
  // Mostrar as setas de navegação após um pequeno delay para uma entrada mais suave
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowArrows(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Handler para a seleção de categoria
  const handleCategorySelect = (categoryId: number | null) => {
    // Sempre redirecionar para a página da categoria específica
    if (categoryId !== null) {
      const category = categories?.find(c => c.id === categoryId);
      if (category) {
        // Redirecionar para a página da categoria específica
        setLocation(`/categorias/${category.slug}`);
      }
    } else if (onCategorySelect) {
      // Se não for uma categoria específica, usar o onCategorySelect apenas como fallback
      onCategorySelect(categoryId);
    }
  };
  
  // Função para obter imagens relacionadas à categoria específica
  const getCategoryImagePaths = (category: Category): string[] => {
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

  // Função para determinar a cor de destaque da categoria
  const getCategoryColor = (slug: string): string => {
    const colors: { [key: string]: string } = {
      'vendas': 'from-blue-500 to-blue-600',
      'lavagem': 'from-green-500 to-green-600',
      'mecanica': 'from-red-500 to-red-600',
      'locacao': 'from-yellow-500 to-yellow-600',
      'seminovos': 'from-purple-500 to-purple-600',
      'promocoes': 'from-orange-500 to-orange-600',
      'lancamentos': 'from-indigo-500 to-indigo-600',
    };
    
    return colors[slug] || 'from-blue-500 to-blue-600';
  };

  // Função para rolar o carrossel para a esquerda
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.75;
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  // Função para rolar o carrossel para a direita
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.75;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-1 sm:py-2 md:py-4">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-xs sm:text-sm font-medium text-neutral-800 whitespace-nowrap">Categorias em destaque</h2>
          </div>
          <Link 
            href="/categorias" 
            className="text-blue-600 hover:text-blue-500 font-medium text-[10px] sm:text-xs flex items-center px-2 py-1 transition-all"
          >
            Ver todos
            <ArrowRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3" />
          </Link>
        </div>
        
        <div className="relative overflow-hidden">
          {/* Botões de navegação do carrossel com animação */}
          {!isLoading && categories && categories.length > 0 && showArrows && (
            <>
              <button 
                onClick={scrollLeft}
                className="absolute left-1 md:left-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-full p-2 sm:p-3.5 shadow-lg sm:shadow-xl hover:bg-blue-500 hover:text-white focus:outline-none transition-all duration-300 border border-blue-100 animate-fade-in"
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button 
                onClick={scrollRight}
                className="absolute right-1 md:right-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-full p-2 sm:p-3.5 shadow-lg sm:shadow-xl hover:bg-blue-500 hover:text-white focus:outline-none transition-all duration-300 border border-blue-100 animate-fade-in"
                aria-label="Rolar para a direita"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          )}
          
          {/* Gradientes para indicar continuação */}
          <div className="absolute top-0 left-0 h-full w-12 sm:w-20 bg-gradient-to-r from-white via-white/90 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 h-full w-12 sm:w-20 bg-gradient-to-l from-white via-white/90 to-transparent z-10 pointer-events-none"></div>
          
          {/* Carrossel de categorias */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-neutral-200">
                    <div className="grid grid-cols-2 h-full">
                      <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                      <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                      <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                      <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="h-5 bg-neutral-200 rounded mb-2 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-6 sm:pb-8 hide-scrollbar snap-x snap-mandatory pl-2 sm:pl-4 pt-1 sm:pt-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories?.map((category) => {
                const imagePaths = getCategoryImagePaths(category);
                const categoryColor = getCategoryColor(category.slug);
                const isHovered = hoveredCategory === category.id;
                
                return (
                  <div 
                    key={category.id} 
                    className="flex-none w-[220px] sm:w-[250px] md:w-[300px] pr-4 sm:pr-5 snap-start"
                    style={{ scrollSnapAlign: 'start' }}
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div 
                      onClick={() => handleCategorySelect(category.id)}
                      className={`group relative bg-white rounded-2xl overflow-hidden cursor-pointer h-full transition-all duration-300 
                        ${isHovered ? 'shadow-2xl scale-[1.02] -translate-y-1' : 'shadow-lg hover:shadow-xl hover:-translate-y-1'} 
                        ${selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Imagens em Grid 2x2 */}
                      <div className="aspect-square relative">
                        <div className="grid grid-cols-2 h-full">
                          {imagePaths.map((path, i) => (
                            <div key={i} className="overflow-hidden border-[1.5px] border-white">
                              <img 
                                src={path} 
                                alt="" 
                                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Overlay com gradiente na parte inferior para nome da categoria */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Badge de selecionado */}
                        {selectedCategory === category.id && (
                          <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-medium rounded-full px-3 py-1 z-10 shadow-lg">
                            Selecionado
                          </div>
                        )}
                      </div>
                      
                      {/* Nome da categoria com estilo especial */}
                      <div className="relative px-3 py-2 text-center">
                        {/* Badge de categoria com estilo minimalista */}
                        <div className={`absolute -top-[18px] left-1/2 transform -translate-x-1/2 rounded-md bg-gradient-to-r ${categoryColor} px-2 sm:px-3 py-[2px] sm:py-1`}>
                          <h3 className="text-[10px] sm:text-xs font-medium text-white">{category.name}</h3>
                        </div>
                        
                        {/* Espaço para o nome da categoria */}
                        <div className="h-2"></div>
                      </div>
                      
                      {/* Ícone "Ver" que aparece ao passar o mouse */}
                      <div className={`absolute bottom-3 right-3 bg-white rounded-full p-2 shadow-md 
                        transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Indicadores de paginação (bolinhas) */}
          {!isLoading && categories && categories.length > 4 && (
            <div className="flex justify-center mt-2 sm:mt-4 space-x-1 sm:space-x-1.5">
              {Array.from({ length: Math.ceil((categories.length || 0) / 4) }).map((_, index) => (
                <div 
                  key={index}
                  className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all duration-300 
                    ${index === 0 ? 'bg-blue-500 w-3 sm:w-4' : 'bg-blue-200 hover:bg-blue-300'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;