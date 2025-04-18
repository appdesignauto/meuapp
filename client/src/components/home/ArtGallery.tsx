import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArtCard from '@/components/ui/ArtCard';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';

interface ArtGalleryProps {
  categoryId: number | null;
  formatId: number | null;
  fileTypeId: number | null;
}

const ArtGallery = ({ categoryId, formatId, fileTypeId }: ArtGalleryProps) => {
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();
  const limit = 8; // Items per page
  const { user } = useAuth();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryId, formatId, fileTypeId]);

  // Build the URL with query parameters
  const getArtsUrl = () => {
    const url = new URL('/api/arts', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    
    if (categoryId) url.searchParams.append('categoryId', categoryId.toString());
    if (formatId) url.searchParams.append('formatId', formatId.toString());
    if (fileTypeId) url.searchParams.append('fileTypeId', fileTypeId.toString());
    
    return url.pathname + url.search;
  };

  // Build query key based on filters
  const queryKey = [
    '/api/arts',
    { page, limit, categoryId, formatId, fileTypeId }
  ];

  const { data, isLoading, isFetching } = useQuery<{
    arts: any[];
    totalCount: number;
  }>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(getArtsUrl());
      if (!res.ok) throw new Error('Erro ao carregar artes');
      return res.json();
    },
  });

  // Force re-fetch when filters change
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
  }, [categoryId, formatId, fileTypeId]);

  const arts = data?.arts || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = page * limit < totalCount;

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">Artes em Destaque</h2>
            <p className="text-neutral-600 max-w-2xl">Designs profissionais prontos para impulsionar suas vendas</p>
          </div>
          <Link 
            href="/painel/artes" 
            className="text-blue-600 hover:text-blue-500 font-medium text-sm flex items-center border border-blue-200 rounded-full px-4 py-2 transition-all hover:bg-blue-50"
          >
            Ver todos os designs
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="columns-2 xs:columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-2 xs:gap-3 md:gap-4 space-y-0">
            {[...Array(8)].map((_, index) => (
              <div 
                key={index} 
                className="block overflow-hidden animate-pulse break-inside-avoid mb-3 xs:mb-4 rounded-xl shadow-sm"
              >
                <div className={`${index % 3 === 0 ? 'aspect-1' : (index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[9/16]')} bg-neutral-200 rounded-xl`} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="columns-2 xs:columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-2 xs:gap-3 md:gap-4 space-y-0">
              {arts.map((art) => (
                <div 
                  key={art.id} 
                  className="break-inside-avoid mb-3 xs:mb-4 transform hover:-translate-y-1 transition-transform duration-300"
                  style={{ 
                    display: 'inline-block',
                    width: '100%'
                  }}
                >
                  <ArtCard 
                    art={art} 
                    onClick={() => setLocation(`/arts/${art.id}`)}
                  />
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-8 py-6 flex items-center rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                >
                  {isFetching ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Carregando...
                    </span>
                  ) : (
                    <>
                      <span>Carregar mais designs</span>
                      <ArrowDown className="ml-2 h-5 w-5" />
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
