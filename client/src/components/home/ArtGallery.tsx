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
  const initialLimit = 20; // Mostra 20 itens na home
  const [, setLocation] = useLocation();
  const galleryRef = useRef<HTMLDivElement>(null); // Referência para a galeria principal
  const { user } = useAuth();

  // Build the URL with query parameters
  const getArtsUrl = () => {
    const url = new URL('/api/arts', window.location.origin);
    url.searchParams.append('page', '1');
    url.searchParams.append('limit', initialLimit.toString());
    
    if (categoryId) url.searchParams.append('categoryId', categoryId.toString());
    if (formatId) url.searchParams.append('formatId', formatId.toString());
    if (fileTypeId) url.searchParams.append('fileTypeId', fileTypeId.toString());
    
    // Sempre exibe apenas artes visíveis na home
    url.searchParams.append('isVisible', 'true');
    
    return url.pathname + url.search;
  };

  // Build query key based on filters
  const queryKey = [
    '/api/artes',
    { 
      page: 1, 
      limit: initialLimit, 
      categoryId, 
      formatId, 
      fileTypeId,
      isVisible: true
    }
  ];

  const { data, isLoading } = useQuery<{
    arts: any[];
    totalCount: number;
  }>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(getArtsUrl());
      if (!res.ok) throw new Error('Erro ao carregar artes');
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache por 30 segundos
  });

  // Force re-fetch when filters change
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/artes'] });
  }, [categoryId, formatId, fileTypeId]);

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
  }, [data?.arts]);

  return (
    <section className="py-8 md:py-10 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex w-full sm:w-auto items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <h2 className="sm:text-sm font-medium text-neutral-800 whitespace-nowrap text-[15px]">Designs Profissionais</h2>
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
              <AnimatePresence>
                {data?.arts?.map((art, index) => (
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
            
            {/* Ver mais artes link */}
            {data?.arts && data.arts.length > 0 && (
              <motion.div 
                className="flex justify-center mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Link 
                  href="/artes"
                  className="inline-flex items-center px-6 py-3 text-blue-600 hover:text-blue-700 font-medium text-sm rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  Ver todas as artes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ArtGallery;
