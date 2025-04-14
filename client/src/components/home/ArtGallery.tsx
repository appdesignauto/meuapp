import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Art } from '@/types';
import ArtCard from '@/components/ui/ArtCard';
import { useAuth } from '@/context/AuthContext';

interface ArtGalleryProps {
  categoryId: number | null;
  formatId: number | null;
  fileTypeId: number | null;
}

const ArtGallery = ({ categoryId, formatId, fileTypeId }: ArtGalleryProps) => {
  const [page, setPage] = useState(1);
  const limit = 8; // Items per page
  const { userRole } = useAuth();

  // Build query key based on filters
  const queryKey = [
    '/api/arts',
    { page, limit, categoryId, formatId, fileTypeId }
  ];

  const { data, isLoading, isFetching } = useQuery<{
    arts: Art[];
    totalCount: number;
  }>({
    queryKey,
  });

  const arts = data?.arts || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = page * limit < totalCount;

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  return (
    <section className="py-10 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-800">Artes em Destaque</h2>
          <Link href="/arts" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center">
            Ver todos os designs
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, index) => (
              <div 
                key={index} 
                className="rounded-lg overflow-hidden shadow-sm animate-pulse"
              >
                <div className="aspect-1 bg-neutral-200" />
                <div className="p-3">
                  <div className="h-5 bg-neutral-200 rounded mb-2" />
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-neutral-200 rounded w-1/3" />
                    <div className="h-4 bg-neutral-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {arts.map((art) => (
                <ArtCard 
                  key={art.id} 
                  art={art} 
                  userRole={userRole} 
                />
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
    </section>
  );
};

export default ArtGallery;
