import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Collection } from '../types';
import CollectionCard from '../components/ui/CollectionCard';
import { Input } from '@/components/ui/input';
import { Search, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Collections = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12; // Items per page

  const queryKey = [
    '/api/collections',
    { page, limit, search: searchQuery }
  ];

  const { data, isLoading, isFetching } = useQuery<{
    collections: Collection[];
    totalCount: number;
  }>({
    queryKey,
  });

  const collections = data?.collections || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = page * limit < totalCount;

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
            Coleções de Artes Automotivas
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Explore nossas coleções organizadas por temas, formatos e categorias para encontrar exatamente o que você precisa.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-10">
          <div className="flex">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Buscar coleções..."
                className="w-full pl-4 pr-10 py-6 rounded-lg md:rounded-r-none border border-neutral-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
                <Search className="h-5 w-5" />
              </div>
            </div>
            <Button 
              type="submit" 
              className="md:w-auto bg-primary hover:bg-primary/90 text-white px-6 py-6 rounded-lg md:rounded-l-none font-medium"
            >
              Buscar
            </Button>
          </div>
        </form>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div 
                key={index} 
                className="rounded-lg overflow-hidden shadow-sm border border-neutral-200 animate-pulse"
              >
                <div className="aspect-video bg-neutral-200" />
                <div className="p-4">
                  <div className="h-5 bg-neutral-200 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-neutral-200 rounded mb-3 w-1/2" />
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-neutral-200 rounded w-1/3" />
                    <div className="h-4 w-4 bg-neutral-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-neutral-700 mb-2">Nenhuma coleção encontrada</h3>
            <p className="text-neutral-500">
              Tente buscar por outros termos ou remover os filtros.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-6 py-3 flex items-center"
                >
                  {isFetching ? 'Carregando...' : (
                    <>
                      <span>Carregar mais</span>
                      <ArrowDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Collections;
