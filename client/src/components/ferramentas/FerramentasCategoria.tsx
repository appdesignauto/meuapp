import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FerramentaCard from './FerramentaCard';

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  ordem?: number;
  ativo?: boolean;
};

type Ferramenta = {
  id: number;
  nome: string;
  descricao?: string;
  imageUrl?: string;
  websiteUrl: string;
  isExterno: boolean;
  isNovo: boolean;
  categoriaId: number;
  categoria?: {
    id: number;
    nome: string;
    slug: string;
  };
  ordem?: number;
  ativo?: boolean;
  criadoEm?: string;
};

type FerramentasCategoriaProps = {
  categoria: Categoria;
  ferramentas: Ferramenta[];
  onCategoriaClick: (slug: string) => void;
  isActive: boolean;
};

const FerramentasCategoria: React.FC<FerramentasCategoriaProps> = ({
  categoria,
  ferramentas,
  onCategoriaClick,
  isActive
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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    const newPosition = direction === 'left'
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  if (!ferramentas || ferramentas.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden pb-6">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {categoria.nome}
            </h2>
            {categoria.descricao && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {categoria.descricao}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showLeftArrow && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                onClick={() => scroll('left')}
              >
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="sr-only">Anterior</span>
              </Button>
            )}
            {showRightArrow && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                onClick={() => scroll('right')}
              >
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="sr-only">Próximo</span>
              </Button>
            )}
          </div>
        </div>

        <div className="relative px-5">
          <div 
            ref={scrollContainerRef}
            className="flex space-x-5 overflow-x-auto pb-3 scrollbar-hide"
            onScroll={updateArrowVisibility}
          >
            {ferramentas.map((ferramenta) => (
              <div key={ferramenta.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
                <FerramentaCard {...ferramenta} />
              </div>
            ))}
          </div>
          
          {/* Gradient fadeout on the right side */}
          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 h-full flex items-center pointer-events-none">
              <div className="w-16 h-full bg-gradient-to-r from-transparent to-white/90 dark:to-gray-900/90"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FerramentasCategoria;