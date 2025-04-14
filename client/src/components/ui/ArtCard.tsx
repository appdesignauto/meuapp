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

  return (
    <div 
      className="group relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleArtClick}
    >
      <div className="aspect-1 bg-neutral-100 relative">
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
      
      <div className="p-3">
        <h3 className="text-base font-medium text-neutral-800 truncate">{art.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center">
            <Badge variant="outline" className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              {art.format}
            </Badge>
          </div>
          <span className="text-xs text-neutral-500">{art.fileType}</span>
        </div>
      </div>
    </div>
  );
};

export default ArtCard;
