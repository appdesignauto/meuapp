/**
 * Componente que fornece um botão de link direto para o painel de assinaturas
 */

import React from 'react';
import { Link } from 'wouter';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssinaturasLinkProps {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
}

const AssinaturasLink: React.FC<AssinaturasLinkProps> = ({ 
  variant = 'default', 
  size = 'default',
  className = '',
  showIcon = true,
  fullWidth = false
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${fullWidth ? 'w-full' : ''}`}
      asChild
    >
      <Link href="/painel-de-assinaturas">
        <span className="flex items-center gap-2">
          {showIcon && <CreditCard className="h-4 w-4" />}
          <span>Gerenciar Assinaturas</span>
        </span>
      </Link>
    </Button>
  );
};

export default AssinaturasLink;