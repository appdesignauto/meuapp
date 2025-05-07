import React, { useState, useEffect } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CourseRatingProps {
  courseId?: number;
  lessonId?: number | null;
  className?: string;
  showCount?: boolean;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CourseRating: React.FC<CourseRatingProps> = ({
  courseId = 2, // ID padrão do curso principal
  lessonId = null,
  className = '',
  showCount = true,
  interactive = false,
  size = 'md',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  
  const isAuthenticated = !!user;
  
  // Tamanhos das estrelas
  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  // Consulta para obter avaliações do curso ou da aula
  const { data: ratingData, isLoading } = useQuery({
    queryKey: ['/api/course-ratings', courseId, lessonId],
    queryFn: async () => {
      // Se tiver lessonId, busca avaliações da aula específica
      if (lessonId) {
        const response = await fetch(`/api/lesson-ratings/${lessonId}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar avaliações da aula');
        }
        return response.json();
      } else {
        // Caso contrário, busca avaliações do curso inteiro
        const response = await fetch(`/api/course-ratings/${courseId}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar avaliações do curso');
        }
        return response.json();
      }
    },
    enabled: !!courseId,
    refetchOnWindowFocus: false,
  });
  
  // Consulta para obter a avaliação do usuário atual
  const { data: userRating } = useQuery({
    queryKey: ['/api/user-rating', courseId, lessonId, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('courseId', courseId.toString());
      if (lessonId) {
        params.append('lessonId', lessonId.toString());
      }
      
      const response = await fetch(`/api/user-rating?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar avaliação do usuário');
      }
      return response.json();
    },
    enabled: !!courseId && !!user?.id,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (data?.rating?.rating) {
        setSelectedRating(data.rating.rating);
      }
    }
  });
  
  // Mutação para enviar a avaliação do usuário
  const ratingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const response = await fetch('/api/course-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          courseId, 
          rating,
          lessonId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar avaliação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      const itemType = lessonId ? 'aula' : 'curso';
      
      toast({
        title: 'Avaliação enviada',
        description: `Obrigado pela sua avaliação deste ${itemType}!`,
      });
      
      // Invalidar consultas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/course-ratings', courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-rating', courseId, lessonId, user?.id] });
      
      // Também invalidar consultas relacionadas
      if (lessonId) {
        queryClient.invalidateQueries({ queryKey: ['/api/lesson-ratings', lessonId] });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar avaliação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao enviar sua avaliação',
        variant: 'destructive',
      });
    },
  });
  
  // Valores padrão caso não haja dados
  const averageRating = ratingData?.stats?.averageRating || 0;
  const ratingsCount = ratingData?.stats?.totalRatings || 0;
  
  // Calcula as estrelas completas e metade
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;
  
  // Manipulador para clicar em uma estrela
  const handleRatingClick = (rating: number) => {
    if (!interactive || !isAuthenticated) return;
    
    setSelectedRating(rating);
    ratingMutation.mutate(rating);
  };
  
  // Formatar o número de avaliações
  const formatRatingsCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };
  
  // Renderizar as estrelas
  const renderStars = () => {
    // Se for interativo, usar a classificação selecionada ou padrão
    const ratingToShow = interactive 
      ? (hoverRating || selectedRating || averageRating) 
      : averageRating;
    
    const fullStars = Math.floor(ratingToShow);
    const hasHalfStar = ratingToShow % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= fullStars;
          const isHalf = !isFilled && star === fullStars + 1 && hasHalfStar;
          
          return (
            <span 
              key={star}
              className={cn(
                "cursor-default transition-colors", 
                interactive && isAuthenticated ? "cursor-pointer" : "",
                ratingMutation.isPending ? "opacity-70" : ""
              )}
              onMouseEnter={() => interactive && isAuthenticated && setHoverRating(star)}
              onMouseLeave={() => interactive && isAuthenticated && setHoverRating(null)}
              onClick={() => handleRatingClick(star)}
            >
              {isFilled ? (
                <Star 
                  className={cn(
                    starSizes[size], 
                    "fill-yellow-400 text-yellow-400 transition-transform",
                    interactive && "hover:scale-110"
                  )} 
                />
              ) : isHalf ? (
                <StarHalf 
                  className={cn(
                    starSizes[size], 
                    "fill-yellow-400 text-yellow-400 transition-transform",
                    interactive && "hover:scale-110"
                  )} 
                />
              ) : (
                <Star 
                  className={cn(
                    starSizes[size], 
                    "text-gray-300 transition-transform",
                    interactive && "hover:scale-110 hover:text-yellow-300"
                  )} 
                />
              )}
            </span>
          );
        })}
        
        {showCount && (
          <span className={cn(
            "ml-2 font-medium",
            className.includes("text-white") ? "text-white/90" : "text-gray-700",
            size === 'sm' ? "text-xs" : size === 'md' ? "text-sm" : "text-base"
          )}>
            {!isLoading ? (
              <>
                {averageRating.toFixed(1)}
                <span className={cn(
                  "ml-1",
                  className.includes("text-white") ? "text-white/70" : "text-gray-500"
                )}>
                  ({formatRatingsCount(ratingsCount)})
                </span>
              </>
            ) : (
              <span className="opacity-70">Carregando...</span>
            )}
          </span>
        )}
      </div>
    );
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      {renderStars()}
    </div>
  );
};

export default CourseRating;