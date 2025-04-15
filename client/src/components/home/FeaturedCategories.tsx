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

  // Função para gerar uma URL de imagem para categorias
  const getCategoryImageUrl = (category: Category, index: number) => {
    // Esta função retorna uma URL de imagem com base na categoria
    // Usamos imagens reais para cada categoria, agrupadas em 4 para formar o grid
    const categoryImages: Record<string, string[]> = {
      'vendas': [
        '/assets/VENDAS 04.png',
        '/assets/VENDAS 10.png',
        '/assets/VENDAS 17.png',
        '/assets/VENDAS 32.png'
      ],
      'lavagem': [
        '/assets/LAVAGEM 01.png',
        '/assets/LAVAGEM 03.png',
        '/assets/LAVAGEM 04.png',
        '/assets/LAVAGEM 10.png'
      ],
      'mecanica': [
        '/assets/MECÂNICA 08.png',
        '/assets/MECÂNICA MOTO 01.png',
        '/assets/MECÂNICA 08.png',
        '/assets/MECÂNICA MOTO 01.png'
      ],
      'locacao': [
        '/assets/LOCAÇÃO 06.png',
        '/assets/LOCAÇÃO 06.png',
        '/assets/LOCAÇÃO 06.png',
        '/assets/LOCAÇÃO 06.png'
      ],
      'seminovos': [
        '/assets/VENDAS 36.png',
        '/assets/VENDAS 10.png',
        '/assets/VENDAS 17.png',
        '/assets/VENDAS 32.png'
      ],
      'promocoes': [
        '/assets/VENDAS 54.png',
        '/assets/VENDAS 57.png',
        '/assets/VENDAS 10.png',
        '/assets/VENDAS 17.png'
      ],
      'lancamentos': [
        '/assets/VENDAS 32.png',
        '/assets/VENDAS 17.png',
        '/assets/VENDAS 10.png',
        '/assets/VENDAS 04.png'
      ]
    };
    
    // Pega a lista de imagens para a categoria ou usa uma lista padrão
    const imagesList = categoryImages[category.slug] || categoryImages['vendas'];
    
    // Garante que o índice esteja entre 0-3 para as 4 imagens da grade
    const imageIndex = index % 4;
    return imagesList[imageIndex];
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
                    <div className="group rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg h-full border border-neutral-200 bg-white">
                      <div className="aspect-square relative overflow-hidden">
                        <div className="grid grid-cols-2 h-full">
                          {/* Exibindo 4 imagens em um grid para cada categoria (2x2) */}
                          {[...Array(4)].map((_, imgIndex) => (
                            <div key={imgIndex} className="overflow-hidden border border-white">
                              <img 
                                src={getCategoryImageUrl(category, imgIndex)} 
                                alt="" 
                                className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-4 bg-white relative">
                        <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-blue-500 text-white h-8 w-8 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-neutral-800 group-hover:text-blue-600 transition-colors">
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