import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  ordem?: number;
  ativo?: boolean;
};

type CategoriasCarouselProps = {
  categorias: Categoria[];
  categoriaSelecionada: string | null;
  onCategoriaChange: (slug: string | null) => void;
  className?: string;
};

const CategoriasCarousel: React.FC<CategoriasCarouselProps> = ({
  categorias,
  categoriaSelecionada,
  onCategoriaChange,
  className
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const updateArrowVisibility = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateArrowVisibility);
      // Initial check
      updateArrowVisibility();
      
      return () => {
        scrollContainer.removeEventListener('scroll', updateArrowVisibility);
      };
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updateArrowVisibility();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    const newPosition = direction === 'left'
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  const handleCategoriaClick = (slug: string) => {
    onCategoriaChange(categoriaSelecionada === slug ? null : slug);
  };

  if (!categorias || categorias.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative w-full", className)}>
      {showLeftArrow && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 shadow-md rounded-full"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Rolar para a esquerda</span>
        </Button>
      )}
      
      <div
        ref={scrollContainerRef}
        className="flex space-x-2 overflow-x-auto scrollbar-hide pb-3 pl-2 pr-16 pt-2"
      >
        <Button
          variant={categoriaSelecionada === null ? "default" : "outline"}
          className="rounded-full whitespace-nowrap h-9 px-4"
          onClick={() => onCategoriaChange(null)}
        >
          Todas
        </Button>
        
        {categorias.map((categoria) => (
          <Button
            key={categoria.id}
            variant={categoriaSelecionada === categoria.slug ? "default" : "outline"}
            className="rounded-full whitespace-nowrap h-9 px-4"
            onClick={() => handleCategoriaClick(categoria.slug)}
          >
            {categoria.nome}
          </Button>
        ))}
      </div>
      
      {showRightArrow && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 shadow-md rounded-full"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Rolar para a direita</span>
        </Button>
      )}
    </div>
  );
};

export default CategoriasCarousel;