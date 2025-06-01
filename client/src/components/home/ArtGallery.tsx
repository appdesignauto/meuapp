import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowRight, ArrowDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArtCard from '@/components/ui/ArtCard';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { createSeoUrl } from '@/lib/utils/slug';
import MinimalCategoryFilters from './MinimalCategoryFilters';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Verifica se o usuário é admin para aplicação dos filtros
  const isAdmin = user?.nivelacesso === 'admin' || user?.nivelacesso === 'designer_adm' || user?.nivelacesso === 'designer';
  
  // Build query key based on filters including visibility
  const queryKey = [
    '/api/artes',
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
  
  // Função para verificar se ainda há mais artes a serem carregadas
  const checkHasMoreArts = useCallback((totalCount: number) => {
    return (currentPage * initialLimit) < totalCount;
  }, [currentPage, initialLimit]);

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

  // Função para pré-carregar as imagens
  const preloadImages = useCallback((arts: any[]) => {
    const promises = arts.map(art => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // Continue mesmo se falhar o carregamento
        img.src = art.imageUrl;
      });
    });
    
    return Promise.all(promises);
  }, []);

  // Atualiza o estado das artes quando novos dados são carregados
  useEffect(() => {
    if (data?.arts) {
      console.log(`Carregando página ${currentPage}, total de artes: ${data.totalCount}, hasMoreArts: ${checkHasMoreArts(data.totalCount)}`);
      
      // Pré-carrega as imagens antes de exibir
      preloadImages(data.arts).then(() => {
        if (currentPage === 1) {
          // Se é a primeira página, apenas substitui as artes
          setAllArts(data.arts);
        } else {
          // Se não, adiciona às artes existentes
          setAllArts(prev => [...prev, ...data.arts]);
        }
        
        // Atualiza o estado hasMoreArts após o carregamento
        const moreArtsAvailable = checkHasMoreArts(data.totalCount);
        setHasMoreArts(moreArtsAvailable);
        console.log(`Após carregar página ${currentPage}, hasMoreArts atualizado para: ${moreArtsAvailable}`);
      });
    }
  }, [data, currentPage, preloadImages, checkHasMoreArts]);

  // Force re-fetch when filters or user authentication/role change
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/artes'] });
  }, [categoryId, formatId, fileTypeId, user?.nivelacesso]);

  // Força o espaçamento correto na galeria da home
  useEffect(() => {
    const forceGallerySpacing = () => {
      if (galleryRef.current) {
        galleryRef.current.style.setProperty('column-gap', '8px', 'important');
        galleryRef.current.style.setProperty('-webkit-column-gap', '8px', 'important');
        galleryRef.current.style.setProperty('-moz-column-gap', '8px', 'important');
      }
    };

    forceGallerySpacing();
    const timeoutId = setTimeout(forceGallerySpacing, 100);
    return () => clearTimeout(timeoutId);
  }, [allArts]);

  const loadMore = useCallback(() => {
    if (isFetching) return;

    // Se já clicou duas vezes (loadCounter = 2)
    if (loadCounter >= 2) {
      // Na terceira vez, redireciona para a página de artes com filtros
      setLocation('/artes');
      return;
    }

    // Na primeira e segunda vez, carrega mais artes
    if (hasMoreArts) {
      // Guardar a posição do botão para manter o scroll
      const buttonPosition = loadMoreButtonRef.current?.getBoundingClientRect();
      const scrollY = window.scrollY;
      
      // Incrementa o contador e a página
      setLoadCounter(prev => prev + 1);
      setCurrentPage(prev => prev + 1);
      
      // Começar a pré-carregar as próximas imagens imediatamente
      // enquanto outras animações ainda estão acontecendo
      
      // Manter a posição do scroll após carregar
      if (buttonPosition) {
        // Usando setTimeout para garantir que o scroll aconteça após a renderização
        setTimeout(() => {
          window.scrollTo({
            top: scrollY,
            behavior: 'auto'
          });
        }, 100);
      }
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
            {onCategorySelect && (
              <div className="w-full mt-2">
                <MinimalCategoryFilters
                  selectedCategory={categoryId}
                  onCategorySelect={onCategorySelect}
                />
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
            {Array.from({ length: 8 }).map((_, index) => (
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
              <AnimatePresence>
                {allArts.map((art, index) => (
                  <motion.div
                    key={art.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.05 * (index % 8), // Usa index em vez de art.id para consistência
                      ease: [0.25, 0.1, 0.25, 1.0]
                    }}
                    className="break-inside-avoid transform hover:-translate-y-1 transition-transform duration-300"
                    style={{ 
                      display: 'inline-block',
                      width: '100%',
                      marginBottom: '8px' // Espaçamento fixo e consistente
                    }}
                  >
                    <ArtCard 
                      art={art} 
                      onClick={() => setLocation(`/artes/${createSeoUrl(art.id, art.title)}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Load More Button - sempre visível, apenas desabilitado quando não há mais artes */}
            {(
              <motion.div 
                className="flex justify-center mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                key="load-more-container"
              >
                <Button 
                  ref={loadMoreButtonRef}
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isFetching || !hasMoreArts}
                  className={`px-8 py-6 flex items-center rounded-full border-2 ${hasMoreArts ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'border-gray-200 text-gray-400'} font-medium transform transition-all duration-300 hover:scale-105 active:scale-95`}
                  id="load-more-button"
                >
                  {isFetching ? (
                    <motion.span 
                      className="flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className={`animate-spin -ml-1 mr-2 h-5 w-5 ${hasMoreArts ? 'text-blue-600' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Carregando...
                    </motion.span>
                  ) : (
                    <motion.div 
                      className="flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className={hasMoreArts ? '' : 'text-gray-400'}>
                        {!hasMoreArts 
                          ? 'Não há mais designs'
                          : (loadCounter === 0 
                              ? 'Carregar mais designs' 
                              : (loadCounter === 1 
                                ? 'Carregar mais designs' 
                                : 'Ver todos os designs'
                              )
                            )
                        }
                      </span>
                      {hasMoreArts 
                        ? (loadCounter < 2 ? <ArrowDown className="ml-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />)
                        : null
                      }
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ArtGallery;
