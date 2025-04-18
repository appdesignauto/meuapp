import { useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { Category } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

interface FeaturedCategoriesProps {
  selectedCategory?: number | null;
  onCategorySelect?: (categoryId: number) => void;
}

const FeaturedCategories = ({ selectedCategory, onCategorySelect }: FeaturedCategoriesProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Obter estatísticas de artes para cada categoria
  const { data: artsStats } = useQuery<any>({
    queryKey: ['/api/categories/stats'],
    queryFn: async () => {
      try {
        // API fictícia - os números reais viriam do backend
        return {
          totalArts: {
            1: 523, // Categoria ID 1: 523 artes
            2: 188,
            3: 276,
            4: 92,
            5: 154,
            6: 341,
            7: 89,
          },
          lastUpdates: {
            1: '2025-04-16',
            2: '2025-04-15',
            3: '2025-04-17',
            4: '2025-04-10',
            5: '2025-04-14',
            6: '2025-04-16',
            7: '2025-04-12',
          }
        };
      } catch (error) {
        console.error('Erro ao buscar estatísticas de categorias:', error);
        return { totalArts: {}, lastUpdates: {} };
      }
    },
  });

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Função para rolar o carrossel para a esquerda (uma categoria completa)
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.75; // Rolagem de aproximadamente uma categoria
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  // Função para rolar o carrossel para a direita (uma categoria completa)
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.75; // Rolagem de aproximadamente uma categoria
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handler para a seleção de categoria
  const handleCategorySelect = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category.id);
    } else {
      // Redirecionar para a página da categoria específica
      setLocation(`/categories/${category.slug}`);
    }
  };
  
  // Calcular valor para a visualização parcial das categorias (estilo Netflix)
  const categoryWidth = useMemo(() => {
    if (isMobile) return 'w-[75%]';
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'w-[45%]';
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return 'w-[33%]';
    return 'w-[27%]'; // Desktop
  }, [isMobile]);

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-blue-50/30">
      <div className="mx-auto px-2 md:px-4 relative">
        <div className="container mx-auto">
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
        </div>
        
        <div className="relative overflow-hidden">
          {/* Botões de navegação do carrossel */}
          {!isMobile && !isLoading && categories && categories.length > 0 && (
            <>
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={scrollLeft}
                className="absolute left-1 md:left-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-blue-500 hover:text-white focus:outline-none transition-all duration-300 border border-blue-100"
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={scrollRight}
                className="absolute right-1 md:right-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-blue-500 hover:text-white focus:outline-none transition-all duration-300 border border-blue-100"
                aria-label="Rolar para a direita"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </>
          )}
          
          {/* Gradiente para indicar continuação (esquerda) */}
          <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Gradiente para indicar continuação (direita) */}
          <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          {/* Carrossel de categorias */}
          {isLoading ? (
            <div className="container mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="rounded-xl overflow-hidden shadow-sm animate-pulse">
                    <div className="aspect-video bg-neutral-200">
                      <div className="grid grid-cols-2 h-full">
                        <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                        <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                        <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                        <div className="bg-neutral-100 border-[0.5px] border-white"></div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="h-5 bg-neutral-200 rounded mb-2 w-2/3" />
                      <div className="h-3 bg-neutral-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-5 hide-scrollbar snap-x snap-mandatory pl-[6%] md:pl-[12%]"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
              }}
            >
              {categories?.map((category, index) => (
                <motion.div 
                  key={category.id} 
                  className={`flex-none ${categoryWidth} pr-2 snap-start`}
                  style={{ 
                    scrollSnapAlign: 'start',
                    marginRight: '12px', // Espaço entre as categorias
                    padding: '0 4px',
                    zIndex: hoveredCategory === category.id ? 5 : 1
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <motion.div 
                    onClick={() => handleCategorySelect(category)}
                    className={`group rounded-xl overflow-hidden cursor-pointer h-full transition-all ${
                      hoveredCategory === category.id || selectedCategory === category.id 
                        ? 'shadow-xl scale-[1.05] -translate-y-1'
                        : 'shadow-md hover:shadow-lg hover:-translate-y-1'
                    }`}
                    whileHover={{ scale: 1.05, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="aspect-video md:aspect-[16/9] relative overflow-hidden">
                      {/* Imagem de capa da categoria */}
                      <img 
                        src={`/assets/${
                          category.slug === 'vendas' ? 'VENDAS.png' : 
                          category.slug === 'lavagem' ? 'LAVAGEM 01.png' : 
                          category.slug === 'mecanica' ? 'MECÂNICA 08.png' : 
                          category.slug === 'locacao' ? 'LOCAÇÃO 06.png' : 
                          category.slug === 'seminovos' ? 'VENDAS 36.png' : 
                          category.slug === 'promocoes' ? 'VENDAS 54.png' : 
                          category.slug === 'lancamentos' ? 'VENDAS 32.png' : 
                          'VENDAS.png'
                        }`} 
                        alt={category.name} 
                        className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Overlay com detalhes */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold text-lg md:text-xl">
                            {category.name}
                          </h3>
                          
                          {/* Estatísticas da categoria */}
                          <div className="flex items-center mt-1 text-white/80 text-xs space-x-4">
                            {artsStats?.totalArts[category.id] && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{artsStats.totalArts[category.id]} artes</span>
                              </div>
                            )}
                            {artsStats?.lastUpdates[category.id] && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Atualizado em {formatDate(artsStats.lastUpdates[category.id])}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Badge de selecionado */}
                    {selectedCategory === category.id && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        Selecionado
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;