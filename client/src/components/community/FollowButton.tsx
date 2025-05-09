import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { UserPlus, UserCheck, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export interface FollowButtonProps {
  userId?: number; // ID do usuário a ser seguido
  designerId?: number; // ID do designer a ser seguido (alias para userId)
  isFollowing: boolean; // Estado inicial de seguimento
  variant?: 'default' | 'outline' | 'link' | 'destructive' | 'secondary' | 'ghost';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  compact?: boolean; // Versão compacta do botão
  onFollowChange?: () => void; // Callback após alteração do estado de seguimento
}

export function FollowButton({ 
  userId, 
  designerId,
  isFollowing: initialIsFollowing, 
  variant = 'default',
  className = '',
  size = 'default',
  compact = false,
  onFollowChange
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Verificar se o usuário está logado
  const { data: user } = useQuery<any>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/user');
        if (res.status === 401) return null;
        return await res.json();
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
  
  // Verificar se o usuário está logado
  const isLoggedIn = !!user;
  
  // Usar designerId se fornecido, caso contrário usar userId
  const targetId = designerId || userId;
  
  if (!targetId) {
    console.error("FollowButton requer userId ou designerId");
    return null;
  }

  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      return await apiRequest('POST', `/api/users/follow/${targetId}`, { action });
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
      // Invalidar consultas de posts da comunidade
      queryClient.invalidateQueries({ queryKey: ['/api/community/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/community/populares'] });
      
      // Executar callback se fornecido
      if (onFollowChange) {
        onFollowChange();
      }
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
    
    // Se o usuário não estiver logado, redirecionar para login
    if (!isLoggedIn) {
      toast({
        title: "Login necessário",
        description: "Faça login para seguir designers",
        variant: "default",
      });
      // Salvar a URL atual para retornar após o login
      localStorage.setItem('returnUrl', window.location.pathname);
      setLocation('/login');
      return;
    }
    
    try {
      const action = isFollowing ? 'unfollow' : 'follow';
      await followMutation.mutateAsync(action);
    } catch (error) {
      console.error('Erro ao alterar estado de seguimento:', error);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'secondary' : variant}
      size={size}
      className={`${className} ${isFollowing 
        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700' 
        : ''}`}
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      {!isLoggedIn ? (
        compact ? (
          <LogIn className="w-4 h-4" />
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" />
            Seguir
          </>
        )
      ) : isFollowing ? (
        compact ? (
          <UserCheck className="w-4 h-4" />
        ) : (
          <>
            <UserCheck className="w-4 h-4 mr-2" />
            Seguindo
          </>
        )
      ) : (
        compact ? (
          <UserPlus className="w-4 h-4" />
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Seguir
          </>
        )
      )}
    </Button>
  );
}