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

const FeaturedCategoriesVariant1 = ({ selectedCategory, onCategorySelect }: FeaturedCategoriesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [showArrows, setShowArrows] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowArrows(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
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

  const getCategoryGradient = (slug: string): string => {
    const gradients: { [key: string]: string } = {
      'vendas': 'from-blue-500 via-blue-600 to-indigo-700',
      'lavagem': 'from-emerald-500 via-green-600 to-teal-700',
      'mecanica': 'from-red-500 via-red-600 to-rose-700',
      'locacao': 'from-yellow-500 via-orange-600 to-amber-700',
      'seminovos': 'from-purple-500 via-violet-600 to-purple-700',
      'promocoes': 'from-pink-500 via-pink-600 to-rose-700',
      'lancamentos': 'from-indigo-500 via-blue-600 to-cyan-700',
      'feirao': 'from-orange-500 via-red-600 to-pink-700',
      'consorcio': 'from-teal-500 via-cyan-600 to-blue-700',
      'seguro': 'from-green-500 via-emerald-600 to-teal-700',
    };
    
    return gradients[slug] || 'from-blue-500 via-blue-600 to-indigo-700';
  };

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
    <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Grid3X3 className="h-4 w-4" />
            Explore por categoria
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Categorias em <span className="text-blue-600">Destaque</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Descubra nossa seleção premium de templates organizados por categoria
          </p>
        </div>
        
        <div className="relative">
          {/* Navigation Arrows */}
          {!isLoading && categoriesWithSamples.length > 0 && showArrows && (
            <>
              <button 
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-xl border hover:shadow-2xl hover:scale-110 transition-all duration-300"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </button>
              <button 
                onClick={scrollRight}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-xl border hover:shadow-2xl hover:scale-110 transition-all duration-300"
                aria-label="Próximo"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </button>
            </>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex overflow-x-auto pb-6 space-x-6 hide-scrollbar">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex-none w-80">
                  <div className="bg-gray-200 rounded-3xl overflow-hidden h-96 animate-pulse">
                    <div className="h-64 bg-gray-300"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-300 rounded mb-3"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Categories Grid */}
          {!isLoading && categoriesWithSamples.length > 0 && (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-6 space-x-6 hide-scrollbar snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categoriesWithSamples.map((category) => {
                const gradient = getCategoryGradient(category.categorySlug);
                
                return (
                  <div 
                    key={category.categoryId} 
                    className="flex-none w-80 snap-start"
                  >
                    <div 
                      onClick={() => handleCategorySelect(category.categoryId)}
                      className={`group relative bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 transform-gpu ${
                        selectedCategory === category.categoryId ? 'ring-4 ring-blue-500 shadow-2xl -translate-y-2' : 'shadow-lg'
                      }`}
                    >
                      {/* Image Grid */}
                      <div className="h-64 relative overflow-hidden">
                        <div className="grid grid-cols-2 h-full">
                          {category.sampleArts.slice(0, 4).map((art, i) => (
                            <div key={i} className="overflow-hidden relative">
                              <img 
                                src={art.imageUrl} 
                                alt={art.title} 
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
                            </div>
                          ))}
                          {Array.from({ length: Math.max(0, 4 - category.sampleArts.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">Em breve</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Gradient Overlay */}
                        <div className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t ${gradient} opacity-80`}></div>
                        
                        {/* Category Badge */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-white font-bold text-xl drop-shadow-lg">
                            {category.categoryName}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Action Section */}
                      <div className="p-6 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="text-gray-600 text-sm">
                            {category.sampleArts.length > 0 && `${category.sampleArts.length} templates`}
                          </div>
                          <div className="flex items-center text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors">
                            Explorar
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <Link 
              href="/categorias" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Ver todas as categorias
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          
          {/* Empty State */}
          {!isLoading && categoriesWithSamples.length === 0 && (
            <div className="text-center py-20">
              <Grid3X3 className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Nenhuma categoria encontrada</h3>
              <p className="text-gray-500 text-lg">As categorias aparecerão aqui em breve</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategoriesVariant1;