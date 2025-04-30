import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArtCard from '@/components/ui/ArtCard';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import MinimalCategoryFilters from './MinimalCategoryFilters';

interface ArtGalleryProps {
  categoryId: number | null;
  formatId: number | null;
  fileTypeId: number | null;
  onCategorySelect?: (categoryId: number | null) => void;
}

const ArtGallery = ({ categoryId, formatId, fileTypeId, onCategorySelect }: ArtGalleryProps) => {
  const initialLimit = 12; // Sempre mostra 12 itens inicialmente
  const [, setLocation] = useLocation();
  const [loadCounter, setLoadCounter] = useState(0); // Contador para controlar redirecionamento
  const [allArts, setAllArts] = useState<any[]>([]); // Estado para armazenar todas as artes carregadas
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreArts, setHasMoreArts] = useState(true);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null); // Referência para o botão carregar mais
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

  // Verifica se o usuário é admin para aplicação dos filtros
  const isAdmin = user?.nivelacesso === 'admin' || user?.nivelacesso === 'designer_adm' || user?.nivelacesso === 'designer';
  
  // Build query key based on filters including visibility
  const queryKey = [
    '/api/arts',
    { 
      page: currentPage, 
      limit: initialLimit, 
      categoryId, 
      formatId, 
      fileTypeId,
      // Na vitrine, sempre exibimos apenas artes visíveis, independente do nível de acesso do usuário
      isVisible: true
    }
  ];

  const { data, isLoading, isFetching } = useQuery<{
    arts: any[];
    totalCount: number;
  }>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(getArtsUrl(currentPage));
      if (!res.ok) throw new Error('Erro ao carregar artes');
      return res.json();
    },
    // Desabilita recargas automáticas para controlarmos manualmente
    refetchOnWindowFocus: false,
    refetchOnMount: currentPage === 1, // Carrega apenas na primeira montagem
    staleTime: 30000, // Cache por 30 segundos
  });

  // Atualiza o estado das artes quando novos dados são carregados
  useEffect(() => {
    if (data?.arts) {
      if (currentPage === 1) {
        // Se é a primeira página, apenas substitui as artes
        setAllArts(data.arts);
      } else {
        // Se não, adiciona às artes existentes
        setAllArts(prev => [...prev, ...data.arts]);
      }
      
      // Verifica se ainda há mais artes para carregar
      setHasMoreArts(currentPage * initialLimit < (data.totalCount || 0));
    }
  }, [data, currentPage]);

  // Force re-fetch when filters or user authentication/role change
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/arts'] });
  }, [categoryId, formatId, fileTypeId, user?.nivelacesso]);

  const loadMore = () => {
    if (isFetching) return;

    // Se já clicou uma vez (loadCounter = 1)
    if (loadCounter >= 1) {
      // Na segunda vez, redireciona para a página de artes com filtros
      setLocation('/arts');
      return;
    }

    // Na primeira vez, carrega mais artes
    if (hasMoreArts) {
      // Guardar a posição do botão para manter o scroll
      const buttonPosition = loadMoreButtonRef.current?.getBoundingClientRect();
      const scrollY = window.scrollY;
      
      // Incrementa o contador e a página
      setLoadCounter(prev => prev + 1);
      setCurrentPage(prev => prev + 1);
      
      // Manter a posição do scroll após carregar
      if (buttonPosition) {
        // Usando requestAnimationFrame para garantir que o scroll aconteça após a renderização
        setTimeout(() => {
          window.scrollTo({
            top: scrollY,
            behavior: 'auto'
          });
        }, 100);
      }
    }
  };

  return (
    <section className="py-8 md:py-10 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-2 sm:mb-4">
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex w-full sm:w-auto items-center justify-between">
              <h2 className="text-xs sm:text-sm font-medium text-neutral-800 whitespace-nowrap">Artes em Destaque</h2>
              <Link 
                href="/arts" 
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
            {onCategorySelect && (
              <div className="w-full">
                <MinimalCategoryFilters
                  selectedCategory={categoryId}
                  onCategorySelect={onCategorySelect}
                />
              </div>
            )}
          </div>
          <Link 
            href="/arts" 
            className="text-blue-600 hover:text-blue-500 font-medium text-xs flex items-center px-2 py-1 transition-all hidden sm:flex"
          >
            Ver todos
            <ArrowRight className="ml-1 h-3 w-3" />
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
              {allArts.map((art) => (
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
            {hasMoreArts && (
              <div className="flex justify-center mt-12">
                <Button 
                  ref={loadMoreButtonRef}
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-8 py-6 flex items-center rounded-full border-2 border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                  id="load-more-button"
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
                      <span>{loadCounter === 0 ? 'Carregar mais designs' : 'Ver todos os designs'}</span>
                      {loadCounter === 0 ? <ArrowDown className="ml-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
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
