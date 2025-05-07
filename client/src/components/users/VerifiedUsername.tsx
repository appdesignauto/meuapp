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
 * para administradores, similar às redes sociais (Twitter/X)
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
        
        {/* Selo de verificação X/Twitter para administradores */}
        {isAdmin && (
          <svg 
            className={cn(
              "flex-shrink-0 ml-1",
              badgeSizes[badgeSize],
              badgeClassName
            )} 
            viewBox="0 0 22 22" 
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            <path fill="#1D9BF0" d="M10.7729 0C4.8371 0 0 4.9223 0 10.9552C0 15.1302 2.5343 18.7697 6.1114 20.3199C6.3321 20.4109 6.5 20.2367 6.5 20.0299V18.16C4.1 18.6716 3.5729 16.7448 3.5729 16.7448C3.1657 15.5335 2.6271 15.2059 2.6271 15.2059C1.8214 14.5671 2.6714 14.586 2.6714 14.586C3.5407 14.6515 3.9957 15.649 3.9957 15.649C4.7571 17.2553 6.0429 16.8151 6.5143 16.5333C6.5929 15.8568 6.8136 15.3978 7.0543 15.148C5.1307 14.8981 3.1157 13.9992 3.1157 9.9691C3.1157 8.8143 3.4664 7.8594 4.02 7.0911C3.9636 6.8287 3.6357 5.7862 4.11 4.3414C4.11 4.3414 4.8364 4.0602 6.4864 5.4113C7.1871 5.1799 7.9364 5.0523 8.6929 5.0523C9.4421 5.0523 10.1921 5.1799 10.8929 5.4113C12.5429 4.0602 13.2664 4.3414 13.2664 4.3414C13.7443 5.7862 13.4164 6.8287 13.3579 7.0911C13.9293 7.8594 14.2721 8.8143 14.2721 9.9691C14.2721 13.9992 12.25 14.8981 10.3264 15.148C10.6243 15.4421 10.8929 16.0184 10.8929 16.8956V20.0299C10.8929 20.2367 11.0607 20.4109 11.2814 20.3199C14.8586 18.7697 17.3929 15.1302 17.3929 10.9552C17.3857 4.9223 12.5486 0 10.7729 0Z" />
            <path fill="#1D9BF0" d="M21.5 10.5C21.5 16.299 16.799 21 11 21C5.20101 21 0.5 16.299 0.5 10.5C0.5 4.70101 5.20101 0 11 0C16.799 0 21.5 4.70101 21.5 10.5ZM16.1475 8.24848L10.3664 14.0296C10.3254 14.0705 10.2767 14.1029 10.2234 14.1246C10.1701 14.1463 10.1133 14.1569 10.056 14.1558C9.99866 14.1547 9.94237 14.1421 9.89 14.1186C9.83763 14.0951 9.79034 14.061 9.75114 14.0186L5.84937 10.1169C5.80752 10.0759 5.77402 10.0273 5.75076 9.97398C5.72751 9.92063 5.71505 9.86366 5.71416 9.80596C5.71327 9.74825 5.72397 9.69092 5.74561 9.6368C5.76726 9.58268 5.79933 9.53297 5.84008 9.49088C5.88083 9.4488 5.92952 9.41516 5.98296 9.39183C6.03641 9.3685 6.09345 9.3559 6.15122 9.35487C6.20899 9.35385 6.26645 9.36442 6.32072 9.38594C6.37499 9.40745 6.42497 9.43944 6.46775 9.48L10.0465 13.059L15.5253 7.58024C15.6132 7.49235 15.7312 7.44336 15.854 7.44336C15.9769 7.44336 16.0949 7.49235 16.1827 7.58024C16.2706 7.66814 16.3196 7.7861 16.3196 7.90896C16.3196 8.03182 16.2706 8.14978 16.1827 8.23767L16.1475 8.24848Z" />
          </svg>
        )}
      </span>
    </div>
  );
};

export default VerifiedUsername;