import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, UserPlus } from 'lucide-react';

interface FollowButtonProps {
  designerId: number;
  isFollowing: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onFollowChange?: (isFollowing: boolean) => void;
  showIcon?: boolean;
  showText?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  designerId,
  isFollowing: initialIsFollowing,
  className = '',
  variant = 'default',
  size = 'default',
  onFollowChange,
  showIcon = true,
  showText = true,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mutation para seguir/deixar de seguir um designer
  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      setIsProcessing(true);
      try {
        const response = await apiRequest(
          'POST',
          `/api/users/follow/${designerId}`,
          { action }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao processar ação de seguir');
        }
        
        return response.json();
      } catch (error) {
        console.error('Erro na ação de seguir:', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: (_, variables) => {
      const newIsFollowing = variables === 'follow';
      setIsFollowing(newIsFollowing);
      
      // Notificar o componente pai sobre a mudança
      if (onFollowChange) {
        onFollowChange(newIsFollowing);
      }
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/users/following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/designers/popular'] });
      
      // Atualizar a página de perfil do designer se estiver visualizando
      queryClient.invalidateQueries({ queryKey: [`/api/users/${designerId}`] });
      
      toast({
        title: newIsFollowing ? 'Seguindo' : 'Deixou de seguir',
        description: newIsFollowing 
          ? 'Você agora está seguindo este designer' 
          : 'Você deixou de seguir este designer',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar sua solicitação',
        variant: 'destructive',
      });
    }
  });

  const handleFollowClick = () => {
    if (isProcessing) return;
    
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para seguir designers',
        variant: 'default',
      });
      return;
    }
    
    // Evitar seguir a si mesmo
    if (user.id === designerId) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode seguir a si mesmo',
        variant: 'default',
      });
      return;
    }
    
    // Alternar entre seguir e deixar de seguir
    followMutation.mutate(isFollowing ? 'unfollow' : 'follow');
  };

  return (
    <Button
      onClick={handleFollowClick}
      variant={isFollowing ? 'secondary' : variant}
      size={size}
      className={`${className} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled={isProcessing || user?.id === designerId}
    >
      {showIcon && (
        isFollowing 
          ? <UserCheck className="h-4 w-4 mr-1.5" /> 
          : <UserPlus className="h-4 w-4 mr-1.5" />
      )}
      {showText && (isFollowing ? 'Seguindo' : 'Seguir')}
    </Button>
  );
};

export default FollowButton;