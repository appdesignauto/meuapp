import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { UserPlus, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  userId: number; // ID do usuário a ser seguido
  isFollowing: boolean; // Estado inicial de seguimento
  variant?: 'default' | 'outline' | 'link' | 'destructive' | 'secondary' | 'ghost';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function FollowButton({ 
  userId, 
  isFollowing: initialIsFollowing, 
  variant = 'default',
  className = '',
  size = 'default'
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      return await apiRequest('POST', `/api/users/follow/${userId}`, { action });
    },
    onMutate: (action) => {
      setIsLoading(true);
      // Otimisticamente atualizar o estado local
      setIsFollowing(action === 'follow');
    },
    onSettled: () => {
      setIsLoading(false);
    },
    onSuccess: () => {
      // Invalidar consultas relacionadas para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/users/following'] });
      queryClient.invalidateQueries({ queryKey: ['/api/designers/popular'] });
      queryClient.invalidateQueries({ queryKey: ['/api/following/arts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
    onError: (error) => {
      // Reverter o estado otimista em caso de erro
      setIsFollowing(!isFollowing);
      toast({
        title: "Erro",
        description: `Não foi possível ${isFollowing ? 'deixar de seguir' : 'seguir'} o usuário. ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleFollowToggle = async () => {
    if (isLoading) return;
    
    try {
      const action = isFollowing ? 'unfollow' : 'follow';
      await followMutation.mutateAsync(action);
    } catch (error) {
      console.error('Erro ao alterar estado de seguimento:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${isFollowing ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-2" />
          Seguindo
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Seguir
        </>
      )}
    </Button>
  );
}