import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ArrowDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArtCard from '@/components/ui/ArtCard';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { createSeoUrl } from '@/lib/utils/slug';

interface ArtGalleryProps {
  categoryId: number | null;
  formatId: number | null;
  fileTypeId: number | null;
  onCategorySelect?: (categoryId: number | null) => void;
}

const ArtGallery = ({ categoryId, formatId, fileTypeId, onCategorySelect }: ArtGalleryProps) => {
  const initialLimit = 20; // Sempre mostra 20 itens inicialmente
  const [, setLocation] = useLocation();
  const [loadCounter, setLoadCounter] = useState(0); // Contador para controlar redirecionamento
  const [allArts, setAllArts] = useState<any[]>([]); // Estado para armazenar todas as artes carregadas
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreArts, setHasMoreArts] = useState(true);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null); // Referência para o botão carregar mais
  const galleryRef = useRef<HTMLDivElement>(null); // Referência para a galeria principal
  const { user } = useAuth();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setLoadCounter(0);
    setAllArts([]);
  }, [categoryId, formatId, fileTypeId]);

  // Build the URL with query parameters
  const getArtsUrl = (page: number) => {
    const url = new URL('/api/arts', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', initialLimit.toString());
    
    if (categoryId) url.searchParams.append('categoryId', categoryId.toString());
    if (formatId) url.searchParams.append('formatId', formatId.toString());
    if (fileTypeId) url.searchParams.append('fileTypeId', fileTypeId.toString());
    
    // Adiciona explicitamente o filtro de visibilidade para TODOS os usuários na vitrine pública
    // Apenas no painel admin as artes ocultas devem aparecer
    url.searchParams.append('isVisible', 'true');
    
    return url.pathname + url.search;
  };

  // Build query key based on filters including visibility
  const queryKey = [
    '/api/artes',
    { 
      page: currentPage, 
      limit: initialLimit, 
      categoryId, 
      formatId, 
      fileTypeId,
      isVisible: true 
    }
  ];

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetch(getArtsUrl(currentPage)).then(res => res.json()),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Process data when it arrives
  useEffect(() => {
    if (data?.arts) {
      if (currentPage === 1) {
        // First page, replace all
        setAllArts(data.arts);
      } else {
        // Subsequent pages, append
        setAllArts(prev => [...prev, ...data.arts]);
      }
      
      // Update hasMoreArts based on returned data
      setHasMoreArts(data.arts.length === initialLimit);
    }
  }, [data, currentPage]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!isFetching && hasMoreArts) {
      setCurrentPage(prev => prev + 1);
      setLoadCounter(prev => prev + 1);
    }
  }, [isFetching, hasMoreArts]);

  // Auto redirect to main arts page after several loads
  useEffect(() => {
    if (loadCounter >= 3 && !isLoading && !isFetching) {
      // Só redireciona se não está carregando
      const timer = setTimeout(() => {
        setLocation('/artes');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loadCounter, hasMoreArts, isFetching, setLocation]);

  return (
    <section className="py-8 md:py-10 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex w-full sm:w-auto items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <h2 className="sm:text-sm font-medium text-neutral-800 whitespace-nowrap text-[15px]">Artes em Destaque</h2>
              </div>
              <Link 
                href="/artes" 
                className="text-blue-600 hover:text-blue-500 font-medium text-[10px] sm:text-xs flex items-center px-2 py-1 transition-all sm:hidden"
              >
                Ver todos
                <ArrowRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3" />
              </Link>
            </div>
            {categoryId && (
              <div className="bg-blue-600 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-md shadow-sm">
                Filtrado por categoria
              </div>
            )}
          </div>
          <Link 
            href="/artes" 
            className="text-blue-600 hover:text-blue-500 font-medium text-xs flex items-center px-2 py-1 transition-all hidden sm:flex"
          >
            Ver todos
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
        
        {isLoading ? (
          <div 
            className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 space-y-0"
            style={{ columnGap: '8px' }}
          >
            {Array.from({ length: 15 }).map((_, index) => (
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
            <div 
              ref={galleryRef}
              className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 space-y-0"
              style={{ columnGap: '8px' }}
            >
              {allArts.map((art, index) => (
                <div 
                  key={`${art.id}-${index}`}
                  className="block overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 break-inside-avoid mb-3 xs:mb-4"
                  onClick={() => {
                    const artUrl = createSeoUrl(art.title, art.id);
                    setLocation(`/artes/${artUrl}`);
                  }}
                >
                  <ArtCard art={art} />
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMoreArts && !isFetching && allArts.length > 0 && (
              <div className="text-center mt-8">
                {loadCounter >= 2 ? (
                  <div className="space-y-4">
                    <p className="text-neutral-600 text-sm">
                      Você já carregou várias artes! Para ver todas as opções disponíveis, visite nossa galeria completa.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <Button 
                        ref={loadMoreButtonRef}
                        onClick={loadMore}
                        variant="outline"
                        className="min-w-[140px] flex items-center gap-2"
                        disabled={isFetching}
                      >
                        {isFetching ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-4 w-4" />
                            Carregar mais
                          </>
                        )}
                      </Button>
                      <Link href="/artes">
                        <Button className="min-w-[140px] flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Ver galeria completa
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Button 
                    ref={loadMoreButtonRef}
                    onClick={loadMore}
                    variant="outline"
                    size="lg"
                    className="min-w-[200px] flex items-center gap-2"
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Carregando mais artes...
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4" />
                        Carregar mais artes
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {/* No More Arts Message */}
            {!hasMoreArts && allArts.length > 0 && !isFetching && (
              <div className="text-center mt-8">
                <p className="text-neutral-600 text-sm mb-4">
                  Você viu todas as artes disponíveis nesta categoria! Explore outras categorias ou visite nossa galeria completa.
                </p>
                <Link href="/artes">
                  <Button className="min-w-[200px] flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Explorar galeria completa
                  </Button>
                </Link>
              </div>
            )}
            
            {/* No Arts Found */}
            {allArts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-neutral-600 text-lg mb-4">
                  Nenhuma arte encontrada para os filtros selecionados.
                </p>
                <Link href="/artes">
                  <Button variant="outline">
                    Ver todas as artes
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ArtGallery;