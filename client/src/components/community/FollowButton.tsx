import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  isFollowing,
  size = "md",
  variant = "default",
  className = "",
  onFollowChange
}: FollowButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentlyFollowing, setCurrentlyFollowing] = useState(isFollowing);
  
  // Tamanhos do botão
  const sizeClasses = {
    sm: "text-xs px-3 h-7 rounded-full",
    md: "text-sm px-4 h-9 rounded-full",
    lg: "text-base px-5 h-10 rounded-full",
  };

  // Estilos do botão baseados no estado
  const getButtonStyles = () => {
    if (variant === "default") {
      return currentlyFollowing
        ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
        : "bg-blue-600 hover:bg-blue-700 text-white";
    } else { // subtle
      return currentlyFollowing
        ? "bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-200"
        : "bg-blue-50 hover:bg-blue-100 text-blue-600";
    }
  };

  // Mutação para seguir usuário
  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/follows`, { followedId: userId });
      return await res.json();
    },
    onSuccess: () => {
      setCurrentlyFollowing(true);
      if (onFollowChange) onFollowChange(true);
      
      // Invalidar queries que possam conter informações de usuários seguidos
      queryClient.invalidateQueries({ queryKey: ["/api/follows/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/check", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      
      // Invalidar queries relacionadas a posts/perfis que mostram status de "seguindo"
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/users"] });
      
      toast({
        title: "Seguindo agora",
        description: "Você agora receberá notificações sobre as atividades deste usuário.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao seguir",
        description: error.message || "Não foi possível seguir este usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutação para deixar de seguir usuário
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/follows/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      setCurrentlyFollowing(false);
      if (onFollowChange) onFollowChange(false);
      
      // Invalidar as mesmas queries que na ação de seguir
      queryClient.invalidateQueries({ queryKey: ["/api/follows/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/check", userId] });
      
      // Invalidar queries relacionadas a posts/perfis que mostram status de "seguindo"
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/users"] });
      
      toast({
        title: "Deixou de seguir",
        description: "Você não receberá mais notificações sobre as atividades deste usuário.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deixar de seguir",
        description: error.message || "Não foi possível deixar de seguir este usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (isLoading) return;
    
    if (currentlyFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <Button
      className={`${sizeClasses[size]} ${getButtonStyles()} ${className}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
      ) : (
        <>
          {currentlyFollowing ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1 h-3.5 w-3.5"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <path d="m9 11 3 3L23 3" />
              </svg>
              <span>Seguindo</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1 h-3.5 w-3.5"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Seguir</span>
            </>
          )}
        </>
      )}
    </Button>
  );
}