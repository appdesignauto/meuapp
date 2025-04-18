import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Clock, Calendar, Bookmark, ChevronRight } from 'lucide-react';
import { Category } from '@/types';

interface FeaturedCategoriesProps {
  selectedCategory?: number | null;
  onCategorySelect?: (categoryId: number) => void;
}

const FeaturedCategories = ({ selectedCategory, onCategorySelect }: FeaturedCategoriesProps) => {
  const [, setLocation] = useLocation();
  
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

  // Função para determinar a cor de fundo do card da categoria
  const getCategoryCardStyle = (slug: string): string => {
    const styles: { [key: string]: string } = {
      'vendas': 'bg-blue-50',
      'lavagem': 'bg-green-50',
      'mecanica': 'bg-red-50',
      'locacao': 'bg-yellow-50',
      'seminovos': 'bg-purple-50',
      'promocoes': 'bg-orange-50',
      'lancamentos': 'bg-indigo-50',
    };
    
    return styles[slug] || 'bg-gray-50';
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
        
        {/* Grid de categorias */}
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
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories?.map((category) => {
              const imagePaths = getCategoryImagePaths(category);
              const cardBgColor = getCategoryCardStyle(category.slug);
              
              return (
                <div 
                  key={category.id} 
                  onClick={() => handleCategorySelect(category)}
                  className={`group relative ${cardBgColor} rounded-xl overflow-hidden cursor-pointer h-full transition-all duration-300 hover:shadow-lg ${
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
                  
                  {/* Informações da Categoria */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-1 text-center">{category.name}</h3>
                    
                    {/* Estatísticas da categoria */}
                    <p className="text-sm text-neutral-600 mb-2 text-center">
                      {artsStats?.totalArts[category.id] && (
                        <><span className="font-medium">{artsStats.totalArts[category.id]}</span> designs</>
                      )}
                    </p>
                    
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-neutral-500">
                        {artsStats?.lastUpdates[category.id] && (
                          <>Atualizado em {formatDate(artsStats.lastUpdates[category.id])}</>
                        )}
                      </span>
                      
                      <div className="flex items-center text-blue-600 text-xs font-medium">
                        <span>Ver designs</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge de selecionado */}
                  {selectedCategory === category.id && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 z-10">
                      Selecionado
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;