import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FerramentaCategoria } from '@shared/schema';

interface CategoriasCarouselProps {
  categorias: FerramentaCategoria[];
  categoriaSelecionada: string | null;
  onCategoriaChange: (slug: string | null) => void;
}

const CategoriasCarousel: React.FC<CategoriasCarouselProps> = ({
  categorias,
  categoriaSelecionada,
  onCategoriaChange
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  // Função para rolar para a esquerda
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  // Função para rolar para a direita
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Detectar quando a rolagem é necessária e controlar a visibilidade dos botões
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  // Handler para seleção de categoria
  const handleCategoriaClick = (slug: string) => {
    onCategoriaChange(categoriaSelecionada === slug ? null : slug);
  };

  // Adicionar categoria "Todas" no início
  const todasCategorias = [
    { id: -1, nome: 'Todas', slug: null, ordem: -1 } as unknown as FerramentaCategoria
  ].concat(categorias);

  return (
    <div className="relative mb-6 mt-2">
      {/* Botão de rolagem esquerda */}
      {showLeftButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 dark:bg-black/80 shadow-md rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      {/* Contêiner de rolagem horizontal */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-2 overflow-x-auto hide-scrollbar py-2 px-1"
        onScroll={handleScroll}
      >
        {todasCategorias.map((categoria) => (
          <Button
            key={categoria.id}
            onClick={() => handleCategoriaClick(categoria.slug!)}
            variant={categoriaSelecionada === categoria.slug ? "default" : "outline"}
            className="whitespace-nowrap"
          >
            {categoria.nome}
          </Button>
        ))}
      </div>

      {/* Botão de rolagem direita */}
      {showRightButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 dark:bg-black/80 shadow-md rounded-full"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* CSS para esconder a barra de rolagem */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CategoriasCarousel;