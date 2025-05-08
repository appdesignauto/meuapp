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
 * para administradores, reproduzindo exatamente o selo oficial do Facebook
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
        
        {/* Selo de verificação oficial do Facebook para administradores */}
        {isAdmin && (
          <svg 
            className={cn(
              "flex-shrink-0 ml-1",
              badgeSizes[badgeSize],
              badgeClassName
            )} 
            viewBox="0 0 512 512" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="blue-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3578E5" />
                <stop offset="100%" stopColor="#9013FE" />
              </linearGradient>
            </defs>
            <path 
              d="M256 48L216 99l-59 18-37 51-58 19 4 63-37 51 37 51-4 62 58 20 37 51 59 19 40 50 40-50 59-19 37-51 58-20-4-62 37-51-37-51 4-63-58-19-37-51-59-18z"
              fill="url(#blue-purple)" 
            />
            <path 
              d="M224 330l-70-70c-6-6-6-16 0-22 6-6 16-6 22 0l48 48 99-99c6-6 16-6 22 0 6 6 6 16 0 22L224 330z" 
              fill="white" 
            />
          </svg>
        )}
      </span>
    </div>
  );
};

export default VerifiedUsername;