import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface FeaturedCategoriesProps {
  selectedCategory?: number | null;
  onCategorySelect?: (categoryId: number) => void;
}

const FeaturedCategories = ({ selectedCategory, onCategorySelect }: FeaturedCategoriesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Função para rolar o carrossel para a esquerda (uma categoria completa)
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.7; // Rolagem de aproximadamente uma categoria
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  // Função para rolar o carrossel para a direita (uma categoria completa)
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.7; // Rolagem de aproximadamente uma categoria
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handler para a seleção de categoria
  const handleCategorySelect = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category.id);
    } else {
      // Redirecionar para a página da categoria específica
      console.log(`Navegando para categoria: /categories/${category.slug}`);
      setLocation(`/categories/${category.slug}`);
    }
  };


  return (
    <section className="py-16 bg-blue-50/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">Escolha sua categoria</h2>
            <p className="text-neutral-600 max-w-2xl">Encontre os melhores designs para impulsionar suas vendas</p>
          </div>
          <Link 
            href="/categories" 
            className="text-blue-600 hover:text-blue-500 font-medium text-sm flex items-center border border-blue-200 rounded-full px-4 py-2 transition-all hover:bg-blue-50"
          >
            Ver todas as categorias
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="relative">
          {/* Botões de navegação do carrossel */}
          {!isMobile && !isLoading && categories && categories.length > 0 && (
            <>
              <button 
                onClick={scrollLeft}
                className="absolute -left-5 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-blue-500 hover:text-white focus:outline-none transition-all duration-300 border border-blue-100 hover:scale-110"
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={scrollRight}
                className="absolute -right-5 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-blue-500 hover:text-white focus:outline-none transition-all duration-300 border border-blue-100 hover:scale-110"
                aria-label="Rolar para a direita"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          
          {/* Carrossel de categorias */}
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="rounded-md overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-neutral-200">
                    <div className="grid grid-cols-2 h-full">
                      <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                      <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                      <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                      <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                    </div>
                  </div>
                  <div className="p-2 flex justify-center">
                    <div className="h-3 bg-neutral-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-5 hide-scrollbar snap-x snap-mandatory pl-1 -mx-0 md:-mx-4"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                paddingRight: '5%' // Reduzindo o espaço para mostrar mais categorias
              }}
            >
              {categories?.map((category, index) => (
                <div 
                  key={category.id} 
                  className="flex-none w-[47%] sm:w-[32%] md:w-[23%] lg:w-[18%] pr-2 snap-start"
                  style={{ 
                    scrollSnapAlign: 'start',
                    marginRight: '8px' // Espaço entre as categorias
                  }}
                >
                  <div 
                    onClick={() => handleCategorySelect(category)}
                    className={`group rounded-md overflow-hidden cursor-pointer transition-all hover:shadow-md h-full border ${
                      selectedCategory === category.id 
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
                        : 'border-neutral-100'
                    } bg-white`}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <div className="grid grid-cols-2 h-full">
                        {/* Exibindo 4 imagens em um grid para cada categoria (2x2) */}
                        {[...Array(4)].map((_, imgIndex) => (
                          <div key={imgIndex} className="overflow-hidden border-[0.5px] border-white">
                            <img 
                              src={`/assets/${
                                category.slug === 'vendas' && imgIndex === 0 ? 'VENDAS 04.png' : 
                                category.slug === 'vendas' && imgIndex === 1 ? 'VENDAS 10.png' : 
                                category.slug === 'vendas' && imgIndex === 2 ? 'VENDAS 17.png' : 
                                category.slug === 'vendas' && imgIndex === 3 ? 'VENDAS 32.png' : 
                                category.slug === 'lavagem' && imgIndex === 0 ? 'LAVAGEM 01.png' : 
                                category.slug === 'lavagem' && imgIndex === 1 ? 'LAVAGEM 03.png' : 
                                category.slug === 'lavagem' && imgIndex === 2 ? 'LAVAGEM 04.png' : 
                                category.slug === 'lavagem' && imgIndex === 3 ? 'LAVAGEM 10.png' : 
                                category.slug === 'mecanica' && imgIndex === 0 ? 'MECÂNICA 08.png' : 
                                category.slug === 'mecanica' && imgIndex === 1 ? 'MECÂNICA MOTO 01.png' : 
                                category.slug === 'mecanica' && imgIndex === 2 ? 'MECÂNICA 08.png' : 
                                category.slug === 'mecanica' && imgIndex === 3 ? 'MECÂNICA MOTO 01.png' : 
                                category.slug === 'locacao' ? 'LOCAÇÃO 06.png' : 
                                category.slug === 'seminovos' && imgIndex === 0 ? 'VENDAS 36.png' : 
                                category.slug === 'seminovos' && imgIndex === 1 ? 'VENDAS 10.png' : 
                                category.slug === 'seminovos' && imgIndex === 2 ? 'VENDAS 17.png' : 
                                category.slug === 'seminovos' && imgIndex === 3 ? 'VENDAS 32.png' : 
                                category.slug === 'promocoes' && imgIndex === 0 ? 'VENDAS 54.png' : 
                                category.slug === 'promocoes' && imgIndex === 1 ? 'VENDAS 57.png' : 
                                category.slug === 'promocoes' && imgIndex === 2 ? 'VENDAS 10.png' : 
                                category.slug === 'promocoes' && imgIndex === 3 ? 'VENDAS 17.png' : 
                                category.slug === 'lancamentos' && imgIndex === 0 ? 'VENDAS 32.png' : 
                                category.slug === 'lancamentos' && imgIndex === 1 ? 'VENDAS 17.png' : 
                                category.slug === 'lancamentos' && imgIndex === 2 ? 'VENDAS 10.png' : 
                                category.slug === 'lancamentos' && imgIndex === 3 ? 'VENDAS 04.png' : 
                                'VENDAS 32.png'
                              }`} 
                              alt="" 
                              className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                      <div className={`absolute inset-0 bg-gradient-to-t from-blue-600/40 to-transparent ${
                        selectedCategory === category.id ? 'opacity-20' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity duration-300`}></div>
                    </div>
                    <div className="p-2 bg-white relative">
                      <h3 className={`font-medium text-xs text-center ${
                        selectedCategory === category.id 
                          ? 'text-blue-600 font-semibold' 
                          : 'text-neutral-800 group-hover:text-blue-600'
                      } transition-colors`}>
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;