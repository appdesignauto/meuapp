import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Clock, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import useEmblaCarousel from 'embla-carousel-react';

interface RecentDesign {
  id: number;
  createdAt: string;
  art: {
    id: number;
    title: string;
    imageUrl: string;
    format: string;
    fileType: string;
    editUrl: string;
    isPremium: boolean;
    categoryId: number;
  }
}

export default function RecentDesigns() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Configuração do carrossel Embla 
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  });
  
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true);
  
  // Callbacks para navegação
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  
  // Atualiza os estados dos botões de navegação
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);
  
  // Detecta se está em mobile
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  
  // Inicializa embla
  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', onSelect);
      onSelect();
    }
    return () => {
      if (emblaApi) emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);
  
  // Event handlers
  const handleViewAll = () => {
    setLocation('/painel/downloads');
  };
  
  const handleClickDesign = (id: number) => {
    setLocation(`/arts/${id}`);
  };
  
  // Cálculo de tempo relativo (Editado há X dias/horas)
  const getRelativeTimeString = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return `Editado há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else if (diffHours > 0) {
      return `Editado há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffMinutes > 0) {
      return `Editado há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    } else {
      return 'Editado agora';
    }
  };
  
  // Fetch downloads (o que representa os designs editados pelo usuário)
  const { data: downloadsData, isLoading } = useQuery<{ downloads: RecentDesign[]; totalCount: number }>({
    queryKey: ['/api/downloads'],
    enabled: !!user?.id, // Só busca se o usuário estiver logado
  });
  
  // Se o usuário não estiver logado, não renderiza nada
  if (!user) {
    return null;
  }
  
  // Ordenar por data de download mais recente e limitar a 6 itens
  const recentDesigns = downloadsData?.downloads
    ? [...downloadsData.downloads]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
    : [];
    
  // Se não houver designs recentes, não renderiza nada
  if (!downloadsData?.downloads || downloadsData.downloads.length === 0 || recentDesigns.length === 0) {
    return null;
  }
  
  return (
    <section className="py-5 bg-gradient-to-b from-white via-white to-blue-50/30 relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xs sm:text-sm font-medium text-neutral-800">Seus designs recentes</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Botões de navegação no mobile */}
            {isMobile && (
              <>
                <Button 
                  onClick={scrollPrev}
                  variant="ghost" 
                  size="icon"
                  className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 ${!prevBtnEnabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-100'}`}
                  disabled={!prevBtnEnabled}
                >
                  <ChevronLeft className="h-4 w-4 text-blue-600" />
                </Button>
                <Button 
                  onClick={scrollNext}
                  variant="ghost" 
                  size="icon"
                  className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 ${!nextBtnEnabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-100'}`}
                  disabled={!nextBtnEnabled}
                >
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                </Button>
              </>
            )}
            <Button 
              onClick={handleViewAll}
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 h-auto flex items-center gap-1 text-xs font-medium rounded-full border border-transparent hover:border-blue-100"
            >
              Ver todos
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Carrossel para mobile */}
        {isMobile ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {recentDesigns.map((download: RecentDesign) => (
                <div className="flex-[0_0_36%] min-w-0 mr-3 last:mr-0" key={download.id}>
                  <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer relative group h-full"
                    onClick={() => handleClickDesign(download.art.id)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img 
                        src={download.art.imageUrl} 
                        alt={download.art.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                      {download.art.isPremium && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-4 h-4 text-amber-400 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.59 9.35L15.83 8.35L13.5 4.1C13.34 3.78 13.01 3.58 12.65 3.58C12.29 3.58 11.96 3.78 11.81 4.1L9.5 8.35L4.72 9.35C4.1 9.47 3.56 9.92 3.5 10.56C3.46 10.94 3.61 11.32 3.89 11.59L7.33 14.95L6.67 19.77C6.58 20.17 6.68 20.54 6.93 20.82C7.18 21.1 7.56 21.26 7.95 21.26C8.21 21.26 8.46 21.19 8.66 21.06L13 18.68L17.32 21.05C17.52 21.18 17.77 21.25 18.03 21.25H18.04C18.42 21.25 18.79 21.09 19.04 20.82C19.29 20.55 19.39 20.17 19.3 19.79L18.63 14.97L22.07 11.61C22.35 11.34 22.5 10.96 22.46 10.58C22.39 9.93 21.85 9.47 20.59 9.35Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 truncate">{download.art.title}</p>
                      <div className="flex items-center justify-center mt-1.5">
                        <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{getRelativeTimeString(download.createdAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Grade normal para desktop
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentDesigns.map((download: RecentDesign) => (
              <motion.div
                key={download.id}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer relative group"
                onClick={() => handleClickDesign(download.art.id)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={download.art.imageUrl} 
                    alt={download.art.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  {download.art.isPremium && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-amber-400 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.59 9.35L15.83 8.35L13.5 4.1C13.34 3.78 13.01 3.58 12.65 3.58C12.29 3.58 11.96 3.78 11.81 4.1L9.5 8.35L4.72 9.35C4.1 9.47 3.56 9.92 3.5 10.56C3.46 10.94 3.61 11.32 3.89 11.59L7.33 14.95L6.67 19.77C6.58 20.17 6.68 20.54 6.93 20.82C7.18 21.1 7.56 21.26 7.95 21.26C8.21 21.26 8.46 21.19 8.66 21.06L13 18.68L17.32 21.05C17.52 21.18 17.77 21.25 18.03 21.25H18.04C18.42 21.25 18.79 21.09 19.04 20.82C19.29 20.55 19.39 20.17 19.3 19.79L18.63 14.97L22.07 11.61C22.35 11.34 22.5 10.96 22.46 10.58C22.39 9.93 21.85 9.47 20.59 9.35Z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{download.art.title}</p>
                  <div className="flex items-center justify-center mt-1.5">
                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{getRelativeTimeString(download.createdAt)}</span>
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button variant="secondary" size="sm" className="shadow-md">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}