import React from 'react';
import { BadgeCheck } from 'lucide-react';
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
    <div className={cn("flex items-center gap-1", className)}>
      <span>{user.name || user.username}</span>
      
      {isAdmin && (
        <BadgeCheck 
          className={cn(
            "flex-shrink-0",
            "text-[#1877F2] fill-[#1877F2] stroke-white",
            badgeSizes[badgeSize],
            badgeClassName
          )} 
        />
      )}
    </div>
  );
};

export default VerifiedUsername;