import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FerramentaCard from './FerramentaCard';

type FerramentaItem = {
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

type CategoriaItem = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  ordem?: number;
  ativo?: boolean;
};

type CategoriasCarouselProps = {
  categoria: CategoriaItem;
  ferramentas: FerramentaItem[];
  onCategoriaClick: (slug: string) => void;
  isActive: boolean;
};

export const CategoriasCarousel: React.FC<CategoriasCarouselProps> = ({
  categoria,
  ferramentas,
  onCategoriaClick,
  isActive,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  // Função para verificar a necessidade de exibir os botões de navegação
  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10); // 10px de margem
  };

  // Funções para scroll
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -800, behavior: 'smooth' });
    setTimeout(checkScrollButtons, 500);
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 800, behavior: 'smooth' });
    setTimeout(checkScrollButtons, 500);
  };

  // Se não houver ferramentas nesta categoria, não renderizar
  if (ferramentas.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 relative">
      {/* Título da categoria e ação de visualizar todas */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-6">
        <h2 
          className={cn(
            "text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center cursor-pointer transition-colors hover:text-primary",
            isActive && "text-primary"
          )}
          onClick={() => onCategoriaClick(categoria.slug)}
        >
          {categoria.icone && (
            <span className="mr-2 text-primary">
              {/* Aqui poderia renderizar um ícone dinâmico com base no nome do ícone */}
              {categoria.icone}
            </span>
          )}
          {categoria.nome}
        </h2>
        <Button 
          variant="link" 
          className="text-sm text-primary hover:text-primary/90"
          onClick={() => onCategoriaClick(categoria.slug)}
        >
          Ver todas
        </Button>
      </div>

      {/* Container do carrossel */}
      <div className="relative group">
        {/* Botão de navegação esquerdo */}
        {showLeftButton && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-white dark:hover:bg-gray-800 transition-opacity opacity-0 group-hover:opacity-100"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Anterior</span>
          </Button>
        )}

        {/* Container de scroll horizontal */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-4 scrollbar-hide snap-x"
          onScroll={checkScrollButtons}
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Estilo CSS para esconder a scrollbar no Chrome */}
          <style>
            {`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          {/* Cards de ferramentas */}
          {ferramentas.map((ferramenta) => (
            <div 
              key={ferramenta.id} 
              className="w-[280px] md:w-[300px] flex-shrink-0 px-2 md:px-3 snap-start"
            >
              <FerramentaCard {...ferramenta} />
            </div>
          ))}
        </div>

        {/* Botão de navegação direito */}
        {showRightButton && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-white dark:hover:bg-gray-800 transition-opacity opacity-0 group-hover:opacity-100"
            onClick={scrollRight}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Próximo</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CategoriasCarousel;