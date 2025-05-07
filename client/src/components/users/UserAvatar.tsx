import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { BadgeCheck } from 'lucide-react';

interface User {
  id: number;
  username: string;
  name?: string | null;
  profileimageurl?: string | null;
  nivelacesso?: string;
  role?: string;  // Pode ser 'admin' ou outros valores
}

interface UserAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  linkToProfile?: boolean;
}

// O componente Avatar básico para o usuário
const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className,
  linkToProfile = false
}) => {
  // Tamanhos de avatar para diferentes opções
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-16 w-16 text-xl',
  };
  
  // O componente Avatar em si
  const AvatarComponent = (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={user.profileimageurl || undefined} 
        alt={user.name || user.username} 
      />
      <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
    </Avatar>
  );
  
  // Retornar com ou sem link, dependendo da prop
  if (linkToProfile && user.id) {
    return (
      <Link href={`/designers/${user.username}`}>
        {AvatarComponent}
      </Link>
    );
  }
  
  return AvatarComponent;
};

// Exportação do componente principal
export default UserAvatar;

// Interface para o nome do usuário com verificação
interface UserNameWithVerificationProps {
  user: User;
  className?: string;
  showVerificationBadge?: boolean;
}

// Componente para mostrar o nome do usuário com selo de verificação para administradores
export const UserNameWithVerification: React.FC<UserNameWithVerificationProps> = ({
  user,
  className,
  showVerificationBadge = true
}) => {
  // Verificar se o usuário é administrador
  const isAdmin = user.nivelacesso === 'admin' || user.role === 'admin';
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="font-medium">{user.name || user.username}</span>
      
      {showVerificationBadge && isAdmin && (
        <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
      )}
    </div>
  );
};