import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Interface copiada de ArtDetail para manter a compatibilidade
interface Designer {
  id: number;
  name: string | null;
  username: string;
  profileImageUrl: string | null;
  bio: string | null;
  followers: number;
  isFollowing: boolean;
  totalArts?: number;
  recentArts?: Array<{
    id: number;
    title: string;
    imageUrl: string;
  }>;
}

interface DesignerSectionProps {
  designer: Designer;
  userId?: number | null;
}

export function DesignerSection({ designer, userId }: DesignerSectionProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita o redirecionamento para o perfil ao clicar no botão
    
    if (!userId) {
      toast({
        title: "Login Necessário",
        description: "Faça login para seguir este designer",
        variant: "destructive",
      });
      return;
    }
    
    const isCurrentlyFollowing = designer.isFollowing;
    
    // Otimistic UI update
    const updatedDesigner = {...designer};
    updatedDesigner.isFollowing = !isCurrentlyFollowing;
    if (isCurrentlyFollowing) {
      updatedDesigner.followers = (updatedDesigner.followers || 1) - 1;
    } else {
      updatedDesigner.followers = (updatedDesigner.followers || 0) + 1;
    }
    
    // API call
    fetch(`/api/${isCurrentlyFollowing ? 'unfollow' : 'follow'}/${designer.id}`, {
      method: isCurrentlyFollowing ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) throw new Error('Falha na operação de seguir');
      return response.json();
    })
    .then(() => {
      toast({
        title: isCurrentlyFollowing ? "Deixou de seguir" : "Designer seguido",
        description: isCurrentlyFollowing 
          ? `Você deixou de seguir ${designer.name || designer.username}`
          : `Você está seguindo ${designer.name || designer.username}`,
      });
    })
    .catch(error => {
      toast({
        title: "Erro na operação",
        description: error.message,
        variant: "destructive",
      });
    });
  };
  
  return (
    <div className="mb-4 py-3 border-t border-b border-neutral-100">
      {/* Header: Nome, imagem e botão seguir agrupados */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-grow cursor-pointer" onClick={() => setLocation(`/designers/${designer.username}`)}>
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0">
              {designer.profileImageUrl ? (
                <img 
                  src={designer.profileImageUrl}
                  alt={designer.name || designer.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-medium">
                  {(designer.name?.[0] || designer.username[0]).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="ml-3">
              <p className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors">
                {designer.name || designer.username}
              </p>
              {/* Total de artes destacado abaixo do nome */}
              <p className="text-xs text-neutral-500">
                {designer.totalArts ? 
                  designer.totalArts > 1000 
                    ? `${Math.floor(designer.totalArts / 1000)}k artes` 
                    : `${designer.totalArts} artes` 
                  : '0 artes'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Botão de seguir próximo ao perfil */}
        {userId && userId !== designer.id && (
          <Button
            variant={designer.isFollowing ? "default" : "outline"}
            size="sm"
            className={`text-xs h-8 min-w-[90px] ${
              designer.isFollowing 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "border-blue-300 text-blue-600 hover:bg-blue-50"
            }`}
            onClick={handleFollowClick}
          >
            {designer.isFollowing ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 6 9 17l-5-5"></path></svg>
                Seguindo
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Seguir
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Estatísticas e bio do designer */}
      <div 
        className="cursor-pointer"
        onClick={() => setLocation(`/designers/${designer.username}`)}
      >
        {/* Estatísticas - Apenas seguidores */}
        <div className="flex items-center mb-2 text-xs text-neutral-500">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <strong>{designer.followers || '0'}</strong> seguidores
          </span>
        </div>
        
        {/* Bio */}
        {designer.bio && (
          <p className="text-xs text-neutral-500 line-clamp-2">
            {designer.bio}
          </p>
        )}
      </div>
    </div>
  );
}