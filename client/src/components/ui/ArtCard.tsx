import { useState } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

interface ArtCardProps {
  art: any;
  onClick?: () => void;
  showEditAction?: boolean;
}

const ArtCard = ({ art, onClick, showEditAction = true }: ArtCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleArtClick = () => {
    // Se onClick foi fornecido, chamar a função
    if (onClick) {
      onClick();
      return;
    }
    
    // Se não, continuar com o comportamento padrão de verificar acesso
    // For premium content, check if user has access
    if (art.isPremium && (!user || user.role !== 'premium')) {
      toast({
        title: "Conteúdo Premium",
        description: "Assine o plano Premium para acessar este conteúdo",
        variant: "destructive",
      });
      return;
    }

    // If not authenticated, prompt to log in
    if (!user) {
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
      className="group relative overflow-hidden cursor-pointer rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
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
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
              Premium
            </Badge>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-blue-600/80 via-blue-500/30 to-transparent transition-all duration-300 flex items-center justify-center ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className={`transform transition-all duration-300 ${
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-3 shadow-lg transform transition-all duration-200 hover:scale-110">
                {onClick ? (
                  // Se onClick foi fornecido, mostra ícone de visualização
                  <Eye className="h-5 w-5" />
                ) : (
                  // Senão, mostra ícone de edição
                  <ExternalLink className="h-5 w-5" />
                )}
              </div>
              <span className="text-white text-sm font-medium px-4 py-1.5 bg-black/40 backdrop-blur-sm rounded-full shadow-md">
                {onClick ? 'Ver Detalhes' : 'Editar Arte'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Type indicator at bottom - apenas visível ao passar o mouse */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="bg-white/80 backdrop-blur-sm text-xs text-blue-600 px-2 py-1 rounded opacity-0 group-hover:opacity-80 transition-opacity duration-300">
            {art.format} • {art.fileType}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArtCard;
