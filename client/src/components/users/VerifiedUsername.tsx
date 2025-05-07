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
 * para administradores, similar às redes sociais
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
      <span className="flex items-center mr-1">
        {user.name || user.username}
        
        {/* Selo de verificação preenchido para administradores */}
        {isAdmin && (
          <svg 
            className={cn(
              "flex-shrink-0 ml-1",
              badgeSizes[badgeSize],
              badgeClassName
            )} 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="#1d9bf0" />
            <path 
              d="M9.5 15.5l-3.5-3.5 1.5-1.5 2 2 5-5 1.5 1.5-6.5 6.5z" 
              fill="white" 
            />
          </svg>
        )}
      </span>
    </div>
  );
};

export default VerifiedUsername;