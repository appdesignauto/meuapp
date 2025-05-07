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
  showVerification?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className,
  linkToProfile = false,
  showVerification = true
}) => {
  // Tamanhos de avatar para diferentes opções
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-16 w-16 text-xl',
  };
  
  // Verificar se o usuário é administrador
  const isAdmin = user.nivelacesso === 'admin' || user.role === 'admin';
  
  // Tamanhos do selo de verificação com base no tamanho do avatar
  const badgeSizeClasses = {
    xs: 'h-3 w-3 -right-0.5 -bottom-0.5',
    sm: 'h-4 w-4 -right-1 -bottom-1',
    md: 'h-5 w-5 -right-1 -bottom-1',
    lg: 'h-6 w-6 -right-1.5 -bottom-1',
  };
  
  // O componente Avatar em si, com selo de verificação para administradores
  const AvatarComponent = (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage 
          src={user.profileimageurl || undefined} 
          alt={user.name || user.username} 
        />
        <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
      </Avatar>
      
      {/* Selo de verificação para administradores */}
      {showVerification && isAdmin && (
        <div className={cn(
          "absolute bg-blue-500 rounded-full flex items-center justify-center text-white",
          badgeSizeClasses[size]
        )}>
          <BadgeCheck className="w-full h-full p-0.5" />
        </div>
      )}
    </div>
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

export default UserAvatar;