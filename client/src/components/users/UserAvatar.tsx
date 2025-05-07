import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  name?: string | null;
  profileimageurl?: string | null;
  nivelacesso?: string;
}

interface UserAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  linkToProfile?: boolean;
}

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

export default UserAvatar;