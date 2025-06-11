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
  const [showArrows, setShowArrows] = useState(false);
  
  // Mostrar setas após delay
  useEffect(() => {
    const timer = setTimeout(() => setShowArrows(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Buscar categorias com artes de amostra
  const { data: sampleArtsData, isLoading } = useQuery<{ categories: CategoryWithSamples[] }>({
    queryKey: ['/api/categories/sample-arts'],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const categoriesWithSamples = sampleArtsData?.categories || [];

  // Handler para seleção de categoria
  const handleCategorySelect = (categoryId: number | null) => {
    if (categoryId) {
      const category = categoriesWithSamples.find(c => c.categoryId === categoryId);
      if (category) {
        setLocation(`/categoria/${category.categorySlug}`);
      }
    }
    
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  // Função para rolar o carrossel
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.75;
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.75;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header da seção */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Grid3X3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Categorias em destaque</h2>
          </div>
          <Link 
            href="/categorias" 
            className="text-blue-600 hover:text-blue-500 font-medium text-sm flex items-center gap-1 transition-colors"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="relative">
          {/* Botões de navegação */}
          {!isLoading && categoriesWithSamples.length > 0 && showArrows && (
            <>
              <button 
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 z-10 bg-white rounded-full p-2 shadow-lg border hover:shadow-xl transition-all duration-200"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button 
                onClick={scrollRight}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 z-10 bg-white rounded-full p-2 shadow-lg border hover:shadow-xl transition-all duration-200"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </>
          )}
          
          {/* Skeleton Loading */}
          {isLoading && (
            <div className="flex overflow-x-auto pb-4 space-x-4 hide-scrollbar">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex-none w-64">
                  <div className="bg-gray-200 rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Grid de categorias */}
          {!isLoading && categoriesWithSamples.length > 0 && (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-4 space-x-4 hide-scrollbar snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categoriesWithSamples.map((category) => (
                <div 
                  key={category.categoryId} 
                  className="flex-none w-64 snap-start"
                >
                  <div 
                    onClick={() => handleCategorySelect(category.categoryId)}
                    className={`group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg border ${
                      selectedCategory === category.categoryId ? 'ring-2 ring-blue-500' : 'hover:border-gray-300'
                    }`}
                  >
                    {/* Grid 2x2 de imagens */}
                    <div className="aspect-[4/3] relative">
                      <div className="grid grid-cols-2 h-full">
                        {category.sampleArts.slice(0, 4).map((art, i) => (
                          <div key={i} className="overflow-hidden">
                            <img 
                              src={art.imageUrl} 
                              alt={art.title} 
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        ))}
                        {/* Preencher slots vazios se houver menos de 4 imagens */}
                        {Array.from({ length: Math.max(0, 4 - category.sampleArts.length) }).map((_, i) => (
                          <div key={`empty-${i}`} className="bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Em breve</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Informações da categoria */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900">{category.categoryName}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && categoriesWithSamples.length === 0 && (
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