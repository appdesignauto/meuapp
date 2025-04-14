import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

const Categories = () => {
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
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
            Escolha sua categoria
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Encontre as melhores artes e modelos para seu negócio automotivo. 
            Todas as artes são editáveis em Canva ou Google Drive.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-neutral-100 rounded-lg animate-pulse">
                <div className="aspect-square rounded-lg overflow-hidden bg-neutral-200" />
                <div className="p-3 flex flex-col items-center">
                  <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="relative mb-8">
              {/* Botões de navegação do carrossel (apenas no desktop) */}
              {!isMobile && !isLoading && categories && categories.length > 0 && (
                <>
                  <button 
                    onClick={scrollLeft}
                    className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-neutral-50 focus:outline-none"
                    aria-label="Rolar para a esquerda"
                  >
                    <ChevronLeft className="h-5 w-5 text-neutral-700" />
                  </button>
                  <button 
                    onClick={scrollRight}
                    className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-neutral-50 focus:outline-none"
                    aria-label="Rolar para a direita"
                  >
                    <ChevronRight className="h-5 w-5 text-neutral-700" />
                  </button>
                </>
              )}
              
              {/* Carrossel de categorias */}
              <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory pl-4 -mx-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories?.map((category, index) => (
                  <div key={category.id} className="flex-none w-[75%] sm:w-[45%] md:w-[32%] lg:w-[24%] pr-2 sm:pr-4 snap-start">
                    <Link href={`/?category=${category.id}`}>
                      <div className="group rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md h-full">
                        <div className="aspect-square relative overflow-hidden">
                          <div className="grid grid-cols-2 h-full">
                            {/* Simulando múltiplas imagens em um grid para cada categoria */}
                            {[...Array(4)].map((_, imgIndex) => (
                              <div key={imgIndex} className="overflow-hidden">
                                <img 
                                  src={getCategoryImageUrl(category, index + imgIndex)} 
                                  alt="" 
                                  className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 bg-white text-center">
                          <h3 className="font-medium text-neutral-800">
                            Artes de {category.name}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/" className="text-primary hover:text-primary/80 font-medium inline-flex items-center">
                <span>Ver todas as artes</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Categories;