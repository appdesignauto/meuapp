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
  
  // Efeito para scrollar para a categoria selecionada quando mudar
  useEffect(() => {
    if (categoriaSelecionada && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selectedButton = container.querySelector(`[data-slug="${categoriaSelecionada}"]`) as HTMLElement;
      
      if (selectedButton) {
        console.log('Botão da categoria encontrado:', categoriaSelecionada);
        
        // Esperar um momento antes de scrollar para garantir que tudo foi renderizado
        setTimeout(() => {
          const containerRect = container.getBoundingClientRect();
          const buttonRect = selectedButton.getBoundingClientRect();
          
          // Verificar se o botão está visível
          if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
            // Centralizar o botão
            console.log('Scrollando para categoria:', categoriaSelecionada);
            const scrollLeft = selectedButton.offsetLeft - container.clientWidth / 2 + selectedButton.offsetWidth / 2;
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
          }
        }, 300);
      }
    }
  }, [categoriaSelecionada]);

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
    console.log('Clicado em categoria:', slug);
    console.log('Categoria atual:', categoriaSelecionada);
    onCategoriaChange(slug);
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-950 shadow-md rounded-full h-9 w-9 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="sr-only">Rolar para a esquerda</span>
        </Button>
      )}
      
      <div
        ref={scrollContainerRef}
        className="flex space-x-3 overflow-x-auto scrollbar-hide pb-3 pl-2 pr-16 pt-1"
      >
        <Button
          variant={categoriaSelecionada === null ? "default" : "outline"}
          className={cn(
            "rounded-full whitespace-nowrap h-9 px-4 font-medium transition-all",
            categoriaSelecionada === null 
              ? "bg-primary text-white shadow-md" 
              : "border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          )}
          onClick={() => {
            console.log('Clicado em Todas');
            onCategoriaChange(null);
          }}
        >
          Todas
        </Button>
        
        {categorias.map((categoria) => (
          <Button
            key={categoria.id}
            data-slug={categoria.slug}
            data-category={categoria.id}
            variant={categoriaSelecionada === categoria.slug ? "default" : "outline"}
            className={cn(
              "rounded-full whitespace-nowrap h-9 px-4 font-medium transition-all",
              categoriaSelecionada === categoria.slug
                ? "bg-primary text-white shadow-md" 
                : "border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
            onClick={() => handleCategoriaClick(categoria.slug)}
          >
            {categoria.nome}
          </Button>
        ))}
      </div>
      
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 h-full flex items-center justify-center">
          <div className="w-16 h-full bg-gradient-to-r from-transparent to-white/90 dark:to-gray-900/90"></div>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 z-20 bg-white dark:bg-gray-950 shadow-md rounded-full h-9 w-9 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="sr-only">Rolar para a direita</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoriasCarousel;