import React, { useState, useEffect } from 'react';
import { useOptimizedImage } from '@/hooks/useOptimizedImage';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  showPlaceholder?: boolean;
  placeholderClassName?: string;
}

/**
 * Componente para exibição otimizada de imagens
 * 
 * Características:
 * - Carregamento progressivo
 * - Animação suave ao carregar
 * - Placeholder de carregamento
 * - Tratamento de erros
 * - Suporte a prioridade
 */
export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  quality = 90,
  onLoad,
  showPlaceholder = true,
  placeholderClassName,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { imgAttributes, loaded, error } = useOptimizedImage(src, {
    quality,
    priority,
  });

  // Efeito para detectar quando a imagem carregou
  useEffect(() => {
    if (loaded) {
      setIsLoaded(true);
      onLoad && onLoad();
    }
  }, [loaded, onLoad]);

  // Tratamento de erro
  if (error) {
    return (
      <div 
        className={cn(
          "bg-gray-100 text-gray-500 flex items-center justify-center rounded-lg", 
          className
        )}
        style={{ 
          width: width || '100%',
          height: height || 200,
          ...style
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400"
        >
          <path d="M12 5v9M12 19h.01" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
    );
  }

  // Estrutura final com carregamento progressivo
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        width: width || "100%",
        height: height || "auto",
        ...style,
      }}
    >
      {/* Placeholder pulsante durante o carregamento */}
      {showPlaceholder && !isLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-gray-100 animate-pulse rounded",
            placeholderClassName
          )}
        />
      )}

      {/* Imagem com fade-in ao carregar */}
      <img
        {...props}
        src={imgAttributes.src}
        loading={imgAttributes.loading as "eager" | "lazy"}
        decoding={imgAttributes.decoding}
        alt={alt}
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        width={width}
        height={height}
        onLoad={() => {
          setIsLoaded(true);
          onLoad && onLoad();
        }}
      />
    </div>
  );
}

export default OptimizedImage;