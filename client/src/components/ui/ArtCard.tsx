import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Art, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

interface ArtCardProps {
  art: Art;
  userRole: UserRole;
}

const ArtCard = ({ art, userRole }: ArtCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleArtClick = () => {
    // For premium content, check if user has access
    if (art.isPremium && userRole !== 'premium') {
      toast({
        title: "Conteúdo Premium",
        description: "Assine o plano Premium para acessar este conteúdo",
        variant: "destructive",
      });
      return;
    }

    // If not authenticated, prompt to log in
    if (!isAuthenticated) {
      toast({
        title: "Login Necessário",
        description: "Faça login para acessar e editar esta arte",
        variant: "destructive",
      });
      return;
    }

    // Otherwise, open the edit URL in a new tab
    window.open(art.editUrl, '_blank');
  };

  // Determinar a classe correta baseada na proporção da imagem
  const getAspectRatioClass = () => {
    if (!art.aspectRatio) return "aspect-1"; // padrão é 1:1
    
    switch (art.aspectRatio) {
      case "1:1": return "aspect-1";
      case "4:5": return "aspect-[4/5]"; 
      case "9:16": return "aspect-[9/16]";
      default: return "aspect-1";
    }
  };

  return (
    <div 
      className="group relative overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleArtClick}
    >
      <div className={`${getAspectRatioClass()} bg-neutral-100 relative`}>
        <img 
          src={art.imageUrl} 
          alt={art.title} 
          className="object-cover w-full h-full"
          loading="lazy"
        />
        
        {/* Premium Badge */}
        {art.isPremium && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-secondary-500 text-white text-xs px-2 py-1 rounded-full">
              Premium
            </Badge>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div 
          className={`absolute inset-0 bg-neutral-900 transition-all duration-300 flex items-center justify-center ${
            isHovered ? 'bg-opacity-20' : 'bg-opacity-0'
          }`}
        >
          <div 
            className={`transform transition-all duration-300 ${
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <button className="bg-white text-neutral-800 rounded-full p-3">
              <ExternalLink className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtCard;
