import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  slideClassName?: string;
  slidesPerView?: number;
  spacing?: number;
  title?: string;
  subtitle?: string;
  titleIcon?: React.ReactNode;
  gradient?: boolean;
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  slideClassName,
  slidesPerView = 1,
  spacing = 16,
  title,
  subtitle,
  titleIcon,
  gradient = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);

  const childrenCount = React.Children.count(children);

  // Calcular o tamanho dos slides e atualizar ao redimensionar
  useEffect(() => {
    if (!containerRef.current) return;

    const calculateSlideWidth = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const slideSize = (containerWidth - (spacing * (slidesPerView - 1))) / slidesPerView;
      setSlideWidth(slideSize);
    };

    // Calcular inicialmente
    calculateSlideWidth();

    // Recalcular ao redimensionar
    const handleResize = () => {
      calculateSlideWidth();
      checkButtons();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [slidesPerView, spacing]);

  // Checar se deve mostrar os botões de navegação
  const checkButtons = () => {
    if (!containerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    
    // Mostrar botão esquerdo apenas se houver conteúdo à esquerda
    setShowLeftButton(scrollLeft > 0);
    
    // Mostrar botão direito apenas se houver conteúdo à direita
    setShowRightButton(scrollLeft + clientWidth < scrollWidth - 5);
  };

  // Atualizar botões ao rolar
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkButtons();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Funções de navegação
  const scrollPrev = () => {
    if (!containerRef.current) return;
    const scrollAmount = slideWidth + spacing;
    containerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollNext = () => {
    if (!containerRef.current) return;
    const scrollAmount = slideWidth + spacing;
    containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Manipuladores de arrastar
  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  // Renderizar slides com o espaçamento correto
  const renderChildren = () => {
    return React.Children.map(children, (child, index) => (
      <div
        className={cn(
          "flex-shrink-0 transition-transform duration-300",
          slideClassName
        )}
        style={{
          width: `${slideWidth}px`,
          marginRight: index < childrenCount - 1 ? `${spacing}px` : 0,
        }}
      >
        {child}
      </div>
    ));
  };

  return (
    <div className={cn("relative mb-12", className)}>
      {/* Cabeçalho do carrossel */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <div className="flex items-center mb-1">
              {titleIcon && <div className="mr-2">{titleIcon}</div>}
              <h2 className="text-xl font-semibold text-neutral-800">{title}</h2>
            </div>
          )}
          {subtitle && <p className="text-neutral-600">{subtitle}</p>}
        </div>
      )}

      {/* Container do carrossel */}
      <div className="relative group">
        {/* Gradiente esquerdo */}
        {gradient && showLeftButton && (
          <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        )}
        
        {/* Botão de navegação esquerdo */}
        {showLeftButton && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md opacity-90 hover:opacity-100 bg-white hover:bg-white border border-neutral-100"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-6 w-6 text-neutral-700" />
          </Button>
        )}

        {/* Container de slides */}
        <div
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={checkButtons}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          {renderChildren()}
        </div>

        {/* Botão de navegação direito */}
        {showRightButton && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md opacity-90 hover:opacity-100 bg-white hover:bg-white border border-neutral-100"
            onClick={scrollNext}
          >
            <ChevronRight className="h-6 w-6 text-neutral-700" />
          </Button>
        )}

        {/* Gradiente direito */}
        {gradient && showRightButton && (
          <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        )}
      </div>
    </div>
  );
};