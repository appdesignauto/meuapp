import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Category } from '@/types';
import { ArrowLeft, Search, Calendar, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

interface EnhancedCategory extends Category {
  artCount: number;
  lastUpdate: string | Date;
}

const Categories = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: categories, isLoading } = useQuery<EnhancedCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Função para obter imagens relacionadas à categoria específica (usando imagens locais)
  const getCategoryImagePaths = (category: EnhancedCategory): string[] => {
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

  // Filtrar categorias com base na busca
  const filteredCategories = categories?.filter(category => 
    searchQuery === '' || category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manipular a busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Busca já foi aplicada via state
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Área de busca centralizada */}
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          CATEGORIAS
        </h1>
        <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
          Escolha uma categoria para encontrar centenas de designs automotivos para seu negócio
        </p>
        
        <div className="max-w-xl mx-auto mb-6">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Buscar categoria..."
              className="w-full py-6 pl-14 pr-12 text-center rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-neutral-400">
              <Search className="h-5 w-5" />
            </div>
          </form>
        </div>
      </div>
      
      {/* Conteúdo principal - Grid de categorias */}
      <div className="container mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <Skeleton className="h-64 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-32 mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories?.length === 0 ? (
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-5 flex justify-center">
                <div className="rounded-full bg-blue-50 p-4">
                  <Search className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-neutral-500 mb-6">
                Tente ajustar sua busca ou verificar se digitou corretamente.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
              >
                Limpar busca
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCategories?.map((category) => {
              const imagePaths = getCategoryImagePaths(category);
              
              return (
                <Link key={category.id} href={`/categories/${category.slug}`}>
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                    <div className="aspect-square">
                      <div className="grid grid-cols-2 h-full">
                        {imagePaths.map((path, i) => (
                          <div key={i} className="overflow-hidden border border-white">
                            <img 
                              src={path} 
                              alt="" 
                              className="object-cover w-full h-full"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center">{category.name}</h3>
                      
                      <div className="flex items-center justify-center text-xs text-neutral-500 mb-2">
                        <div className="flex items-center mr-3">
                          <Image className="h-3.5 w-3.5 mr-1 text-blue-500" />
                          <span>{category.artCount || 0} designs</span>
                        </div>
                        {category.lastUpdate && (
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-blue-500" />
                            <span>Atualizado {formatDate(category.lastUpdate)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <span className="text-sm text-blue-600 font-medium">Ver todos os designs</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;