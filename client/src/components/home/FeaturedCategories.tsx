import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/types';

interface FeaturedCategoriesProps {
  selectedCategory?: number | null;
  onCategorySelect?: (categoryId: number) => void;
}

const FeaturedCategories = ({ selectedCategory, onCategorySelect }: FeaturedCategoriesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Handler para a seleção de categoria
  const handleCategorySelect = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category.id);
    } else {
      // Redirecionar para a página da categoria específica
      setLocation(`/categories/${category.slug}`);
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
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">Categorias Populares</h2>
            <p className="text-neutral-600 max-w-2xl">Navegue por categoria para encontrar designs específicos para seu negócio</p>
          </div>
          <Link 
            href="/categories" 
            className="text-blue-600 hover:text-blue-500 font-medium text-sm flex items-center border border-blue-200 rounded-full px-4 py-2 transition-all hover:bg-blue-50"
          >
            Ver todas as categorias
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="relative overflow-hidden">
          {/* Botões de navegação do carrossel */}
          {!isLoading && categories && categories.length > 0 && (
            <>
              <button 
                onClick={scrollLeft}
                className="absolute left-1 md:left-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-blue-500 hover:text-white focus:outline-none transition-all duration-300 border border-blue-100"
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={scrollRight}
                className="absolute right-1 md:right-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-blue-500 hover:text-white focus:outline-none transition-all duration-300 border border-blue-100"
                aria-label="Rolar para a direita"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          
          {/* Gradientes para indicar continuação */}
          <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Carrossel de categorias */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
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
              className="flex overflow-x-auto pb-5 hide-scrollbar snap-x snap-mandatory pl-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories?.map((category) => {
                const imagePaths = getCategoryImagePaths(category);
                
                return (
                  <div 
                    key={category.id} 
                    className="flex-none w-[250px] md:w-[280px] pr-4 snap-start"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div 
                      onClick={() => handleCategorySelect(category)}
                      className={`group relative bg-white rounded-xl overflow-hidden cursor-pointer h-full transition-all duration-300 hover:shadow-lg ${
                        selectedCategory === category.id ? 'ring-2 ring-blue-500' : 'shadow-md'
                      }`}
                    >
                      {/* Imagens em Grid 2x2 */}
                      <div className="aspect-square relative">
                        <div className="grid grid-cols-2 h-full">
                          {imagePaths.map((path, i) => (
                            <div key={i} className="overflow-hidden border border-white">
                              <img 
                                src={path} 
                                alt="" 
                                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Apenas o nome da categoria */}
                      <div className="p-3 text-center">
                        <h3 className="text-lg font-semibold text-neutral-800">{category.name}</h3>
                      </div>
                      
                      {/* Badge de selecionado */}
                      {selectedCategory === category.id && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 z-10">
                          Selecionado
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;