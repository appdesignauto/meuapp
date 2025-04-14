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

  // Função para rolar o carrossel para a esquerda
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  // Função para rolar o carrossel para a direita
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // Função para gerar uma URL de imagem para categorias
  const getCategoryImageUrl = (category: Category, index: number) => {
    // Na implementação real, você teria imagens específicas da categoria
    // Por enquanto, usamos um placeholder ou uma imagem de carro aleatória
    const placeholderImages = [
      "https://images.unsplash.com/photo-1549399542-7e8f2e928464?w=500&q=80", 
      "https://images.unsplash.com/photo-1592840062661-a5a7f2bc6b56?w=500&q=80",
      "https://images.unsplash.com/photo-1570733577524-3a047079e80d?w=500&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&q=80",
      "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=500&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80",
      "https://images.unsplash.com/photo-1534093607318-f025413f49cb?w=500&q=80"
    ];
    
    return placeholderImages[index % placeholderImages.length];
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">Escolha sua categoria</h2>
            <p className="text-neutral-600 max-w-2xl">Encontre os melhores designs para impulsionar suas vendas</p>
          </div>
          <Link 
            href="/categories" 
            className="text-primary hover:text-primary/80 font-medium text-sm flex items-center border border-primary/20 rounded-full px-4 py-2 transition-all hover:bg-primary/5"
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
                className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-primary hover:text-white focus:outline-none transition-colors duration-200"
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={scrollRight}
                className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-primary hover:text-white focus:outline-none transition-colors duration-200"
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
                <div key={index} className="rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="aspect-square bg-neutral-200" />
                  <div className="p-4 flex flex-col items-center">
                    <div className="h-5 bg-neutral-200 rounded w-2/3 mb-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-8 hide-scrollbar snap-x snap-mandatory pl-4 -mx-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories?.map((category, index) => (
                <div key={category.id} className="flex-none w-[75%] sm:w-[45%] md:w-[32%] lg:w-[24%] pr-3 sm:pr-5 snap-start">
                  <Link href={`/?category=${category.id}`}>
                    <div className="group rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg h-full border border-neutral-200 bg-white">
                      <div className="aspect-square relative overflow-hidden">
                        <div className="grid grid-cols-2 h-full">
                          {/* Simulando múltiplas imagens em um grid para cada categoria */}
                          {[...Array(4)].map((_, imgIndex) => (
                            <div key={imgIndex} className="overflow-hidden border border-white">
                              <img 
                                src={getCategoryImageUrl(category, index + imgIndex)} 
                                alt="" 
                                className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-4 bg-white relative">
                        <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-secondary text-white h-8 w-8 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-neutral-800 group-hover:text-primary transition-colors">
                          Artes de {category.name}
                        </h3>
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