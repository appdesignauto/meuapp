import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

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

const FeaturedCategoriesVariant2 = ({ selectedCategory, onCategorySelect }: FeaturedCategoriesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  
  const { data: sampleArtsData, isLoading } = useQuery<{ categories: CategoryWithSamples[] }>({
    queryKey: ['/api/categories/sample-arts'],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const categoriesWithSamples = sampleArtsData?.categories || [];

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

  const getCategoryIcon = (slug: string): string => {
    const icons: { [key: string]: string } = {
      'vendas': '🚗',
      'lavagem': '🧽',
      'mecanica': '🔧',
      'locacao': '🏎️',
      'seminovos': '🚙',
      'promocoes': '🏷️',
      'lancamentos': '✨',
      'feirao': '🎪',
      'consorcio': '🤝',
      'seguro': '🛡️',
    };
    
    return icons[slug] || '🚗';
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.8;
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.8;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-blue-600 font-medium mb-4">
            <Sparkles className="h-5 w-5" />
            <span>Explore por categoria</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Categorias Principais
          </h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="relative">
          {/* Navigation */}
          {!isLoading && categoriesWithSamples.length > 0 && (
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-2">
                <button 
                  onClick={scrollLeft}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button 
                  onClick={scrollRight}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              <Link 
                href="/categorias"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
              >
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl h-64"></div>
                  <div className="mt-4">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Categories Grid */}
          {!isLoading && categoriesWithSamples.length > 0 && (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-4 space-x-6 hide-scrollbar snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categoriesWithSamples.map((category) => {
                const isHovered = hoveredCategory === category.categoryId;
                const icon = getCategoryIcon(category.categorySlug);
                
                return (
                  <div 
                    key={category.categoryId} 
                    className="flex-none w-72 snap-start"
                    onMouseEnter={() => setHoveredCategory(category.categoryId)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <div 
                      onClick={() => handleCategorySelect(category.categoryId)}
                      className={`group relative cursor-pointer transition-all duration-300 ${
                        selectedCategory === category.categoryId ? 'scale-105' : ''
                      }`}
                    >
                      {/* Main Image */}
                      <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-100">
                        {category.sampleArts.length > 0 ? (
                          <img 
                            src={category.sampleArts[0].imageUrl} 
                            alt={category.sampleArts[0].title} 
                            className={`object-cover w-full h-full transition-all duration-500 ${
                              isHovered ? 'scale-110 brightness-75' : 'scale-100'
                            }`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-200">
                            <span className="text-gray-400">Em breve</span>
                          </div>
                        )}
                        
                        {/* Overlay */}
                        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}></div>
                        
                        {/* Category Icon */}
                        <div className={`absolute top-4 left-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                          isHovered ? 'scale-110' : 'scale-100'
                        }`}>
                          {icon}
                        </div>
                        
                        {/* Sample Images Preview */}
                        {category.sampleArts.length > 1 && (
                          <div className={`absolute bottom-4 right-4 flex gap-1 transition-all duration-300 ${
                            isHovered ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2'
                          }`}>
                            {category.sampleArts.slice(1, 4).map((art, i) => (
                              <div key={i} className="w-8 h-8 rounded border-2 border-white/80 overflow-hidden">
                                <img 
                                  src={art.imageUrl} 
                                  alt={art.title} 
                                  className="object-cover w-full h-full"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                            {category.sampleArts.length > 4 && (
                              <div className="w-8 h-8 rounded border-2 border-white/80 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  +{category.sampleArts.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Hover Action */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-medium text-gray-900 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            Explorar categoria
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Category Info */}
                      <div className="mt-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {category.categoryName}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {category.sampleArts.length > 0 && `${category.sampleArts.length} templates disponíveis`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && categoriesWithSamples.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-gray-500">As categorias aparecerão aqui em breve</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategoriesVariant2;