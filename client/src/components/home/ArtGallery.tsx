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
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-3 space-y-2 md:space-y-3">
            {[...Array(8)].map((_, index) => (
              <div 
                key={index} 
                className="block overflow-hidden animate-pulse break-inside-avoid mb-3"
              >
                <div className={`${index % 3 === 0 ? 'aspect-1' : (index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[9/16]')} bg-neutral-200`} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-3">
              {arts.map((art) => (
                <div key={art.id} className="break-inside-avoid mb-3">
                  <ArtCard 
                    art={art} 
                    userRole={userRole}
                  />
                </div>
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
