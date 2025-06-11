import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';

interface SampleArt {
  id: string;
  title: string;
  imageUrl: string;
}

interface CategoryWithSamples {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  sampleArts: SampleArt[];
}

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
  
  // Buscar categorias com artes de amostra (endpoint otimizado)
  const { data: sampleArtsData, isLoading } = useQuery<{ categories: CategoryWithSamples[] }>({
    queryKey: ['/api/categories/sample-arts'],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Usar os dados do endpoint otimizado
  const categoriesWithSamples = sampleArtsData?.categories || [];

  // Handler para a seleção de categoria
  const handleCategorySelect = (categoryId: number | null) => {
    // Sempre redirecionar para a página da categoria específica
    if (categoryId) {
      const category = categoriesWithSamples.find(c => c.categoryId === categoryId);
      if (category) {
        setLocation(`/categoria/${category.categorySlug}`);
      }
    }
    
    // Chamar o callback se fornecido
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
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
      'feirao': 'from-pink-500 to-pink-600',
      'consorcio': 'from-teal-500 to-teal-600',
      'seguro': 'from-emerald-500 to-emerald-600',
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
            <Grid3X3 className="h-4 w-4 text-blue-600" />
            <h2 className="sm:text-sm font-medium text-neutral-800 whitespace-nowrap text-[15px]">Categorias em destaque</h2>
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
          {!isLoading && categoriesWithSamples && categoriesWithSamples.length > 0 && showArrows && (
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
          
          {/* Skeleton Loading State */}
          {isLoading && (
            <div className="flex overflow-x-auto pb-6 sm:pb-8 hide-scrollbar snap-x snap-mandatory pl-2 sm:pl-4 pt-1 sm:pt-2 space-x-3 sm:space-x-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex-none w-[220px] sm:w-[250px] md:w-[300px] snap-start">
                  <div className="bg-gray-200 rounded-2xl overflow-hidden h-full animate-pulse">
                    <div className="aspect-square bg-gray-300"></div>
                    <div className="p-3 sm:p-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Carrossel de categorias */}
          {!isLoading && categoriesWithSamples && categoriesWithSamples.length > 0 && (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-6 sm:pb-8 hide-scrollbar snap-x snap-mandatory pl-2 sm:pl-4 pt-1 sm:pt-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categoriesWithSamples.map((category) => {
                const categoryColor = getCategoryColor(category.categorySlug);
                const isHovered = hoveredCategory === category.categoryId;
                
                return (
                  <div 
                    key={category.categoryId} 
                    className="flex-none w-[220px] sm:w-[250px] md:w-[300px] pr-4 sm:pr-5 snap-start"
                    onMouseEnter={() => setHoveredCategory(category.categoryId)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div 
                      onClick={() => handleCategorySelect(category.categoryId)}
                      className={`group relative bg-white rounded-2xl overflow-hidden cursor-pointer h-full transition-all duration-300 
                        ${isHovered ? 'shadow-2xl scale-[1.02] -translate-y-1' : 'shadow-lg hover:shadow-xl hover:-translate-y-1'} 
                        ${selectedCategory === category.categoryId ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Imagens em Grid 2x2 */}
                      <div className="aspect-square relative">
                        <div className="grid grid-cols-2 h-full">
                          {category.sampleArts.slice(0, 4).map((art, i) => (
                            <div key={i} className="overflow-hidden border-[1.5px] border-white">
                              <img 
                                src={art.imageUrl} 
                                alt={art.title} 
                                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700"
                                loading="lazy"
                              />
                            </div>
                          ))}
                          {/* Fill empty slots if less than 4 images */}
                          {Array.from({ length: Math.max(0, 4 - category.sampleArts.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-gray-100 border-[1.5px] border-white flex items-center justify-center">
                              <div className="text-gray-400 text-xs">Em breve</div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Overlay com gradiente na parte inferior para nome da categoria */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Badge da categoria com gradiente dinâmico */}
                        <div className={`absolute bottom-3 left-3 right-3 bg-gradient-to-r ${categoryColor} 
                          text-white px-3 py-2 rounded-lg text-sm font-medium text-center shadow-lg 
                          transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300`}>
                          {category.categoryName}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && (!categoriesWithSamples || categoriesWithSamples.length === 0) && (
            <div className="text-center py-12">
              <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma categoria encontrada</p>
              <p className="text-gray-400 text-sm mt-2">As categorias aparecerão aqui em breve</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;