import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  label = 'Carregando...', 
  size = 'md' 
}) => {
  // Definir tamanhos do loader com base no prop size
  const loaderSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  // Definir tamanhos do texto
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={`${loaderSizes[size]} text-blue-600 dark:text-blue-400 animate-spin mb-3`} />
      {label && (
        <p className={`${textSizes[size]} text-zinc-600 dark:text-zinc-400 font-medium`}>
          {label}
        </p>
      )}
    </div>
  );
};

export default LoadingScreen;