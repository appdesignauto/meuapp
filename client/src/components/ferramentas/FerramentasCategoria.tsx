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
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {categoria.nome}
          </h2>
          {categoria.descricao && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {categoria.descricao}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Ver todos em categoria:', categoria.slug);
              onCategoriaClick(categoria.slug);
            }}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Button>
          {showLeftArrow && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Anterior</span>
            </Button>
          )}
          {showRightArrow && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próximo</span>
            </Button>
          )}
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
        onScroll={updateArrowVisibility}
      >
        {ferramentas.map((ferramenta) => (
          <div key={ferramenta.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
            <FerramentaCard {...ferramenta} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FerramentasCategoria;