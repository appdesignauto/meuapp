import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

const FeaturedCategories = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="rounded-xl overflow-hidden animate-pulse border border-blue-50">
                  <div className="aspect-video bg-blue-50 relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100/70"></div>
                    <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                      <div className="h-5 bg-blue-100/70 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-8 hide-scrollbar snap-x snap-mandatory pl-1 -mx-0 md:-mx-4"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                paddingRight: '15%' // Espaço extra para mostrar parte da próxima categoria 
              }}
            >
              {categories?.map((category, index) => (
                <div 
                  key={category.id} 
                  className="flex-none w-[85%] sm:w-[70%] md:w-[65%] lg:w-[58%] pr-4 sm:pr-6 snap-start"
                  style={{ 
                    scrollSnapAlign: 'start',
                    marginRight: '10px' // Espaço entre as categorias
                  }}
                >
                  <Link href={`/?category=${category.id}`}>
                    <div className="group rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg h-full border border-blue-100 bg-white">
                      <div className="aspect-video relative overflow-hidden bg-blue-50/50">
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <div className="flex flex-col items-center gap-3">
                            <div className="bg-blue-500/10 backdrop-blur-sm p-3 rounded-full">
                              <img 
                                src={`/assets/${category.slug === 'vendas' ? 'VENDAS 32.png' : 
                                       category.slug === 'lavagem' ? 'LAVAGEM 01.png' : 
                                       category.slug === 'mecanica' ? 'MECÂNICA 08.png' : 
                                       category.slug === 'locacao' ? 'LOCAÇÃO 06.png' : 
                                       category.slug === 'seminovos' ? 'VENDAS 36.png' : 
                                       category.slug === 'promocoes' ? 'VENDAS 54.png' : 
                                       category.slug === 'lancamentos' ? 'VENDAS 17.png' : 
                                       'LOGO DESIGNAUTO.png'}`} 
                                alt=""
                                className="w-10 h-10 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                            <h3 className="font-medium text-center text-neutral-700 group-hover:text-blue-600 transition-colors">
                              {category.name}
                            </h3>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  </Link>
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