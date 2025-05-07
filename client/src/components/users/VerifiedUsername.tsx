import React from 'react';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  name?: string | null;
  nivelacesso?: string;
  role?: string;
}

interface VerifiedUsernameProps {
  user: User;
  className?: string;
  badgeSize?: 'xs' | 'sm' | 'md';
  badgeClassName?: string;
}

/**
 * Componente que exibe o nome do usuário com um selo de verificação azul 
 * para administradores, similar ao Facebook (formato de estrela/flor azul)
 */
const VerifiedUsername: React.FC<VerifiedUsernameProps> = ({
  user,
  className,
  badgeSize = 'sm',
  badgeClassName
}) => {
  // Verificar se o usuário é administrador
  const isAdmin = user.nivelacesso === 'admin' || user.role === 'admin';
  
  // Tamanhos diferentes para o ícone de verificação
  const badgeSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      {/* Exibe o nome do usuário */}
      <span className="flex items-center">
        {user.name || user.username}
        
        {/* Selo de verificação Facebook para administradores */}
        {isAdmin && (
          <svg 
            className={cn(
              "flex-shrink-0 ml-1",
              badgeSizes[badgeSize],
              badgeClassName
            )} 
            viewBox="0 0 512 512" 
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <path 
              d="M256 48l-30.3 41.6-47.8 15.9-30.3 41.6-47.8 15.8 3.9 50.4-30.4 41.6 30.4 41.5-3.9 50.5 47.8 15.8 30.3 41.6 47.8 15.8L256 464l30.3-41.6 47.8-15.8 30.3-41.6 47.8-15.8-3.9-50.5 30.4-41.5-30.4-41.6 3.9-50.4-47.8-15.8-30.3-41.6-47.8-15.9z" 
              fill="#1877F2" 
            />
            <path 
              d="M225.8 317.7l-52.1-52.1c-4.3-4.3-4.3-11.3 0-15.6 4.3-4.3 11.3-4.3 15.6 0l36.6 36.6 97.2-97.2c4.3-4.3 11.3-4.3 15.6 0 4.3 4.3 4.3 11.3 0 15.6l-112.6 112.7c-4.4 4.3-11.4 4.3-15.7 0z" 
              fill="white" 
            />
          </svg>
        )}
      </span>
    </div>
  );
};

export default VerifiedUsername;