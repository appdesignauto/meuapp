import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Copy, Crown, Layers, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Art {
  id: number;
  title: string;
  imageUrl: string;
  format?: string;
  isPremium?: boolean;
  createdAt?: string;
  viewCount?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  fileType?: string;
  editUrl?: string;
  groupId?: string | null;
  designer?: {
    id: number;
    username: string;
    name: string;
    profileimageurl: string | null;
  };
}

interface ArtCardProps {
  art: Art;
  onClick?: () => void;
  showEditAction?: boolean;
  showDesigner?: boolean;
  isSameGroup?: boolean; // Nova prop para indicar se pertence ao mesmo grupo
}

function ArtCard({ 
  art, 
  onClick, 
  showEditAction = true, 
  showDesigner = false,
  isSameGroup = false 
}: ArtCardProps) {
  // Função para obter as iniciais do nome do designer
  const getInitials = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Estilo Pinterest: sem rodapé com informações, apenas imagem com badges opcionais
  const renderCard = () => (
    <div className={`overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer bg-muted ${isSameGroup ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="relative overflow-hidden w-full">
        <img
          src={art.imageUrl}
          alt={art.title}
          className="object-cover w-full transition-transform duration-300 hover:scale-105"
          loading="lazy"
          title={art.title} // Mostra o título no hover
        />
        
        {/* Overlay escuro sutil no hover para melhorar legibilidade */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300"></div>
        
        {/* Badges no canto superior direito - versão minimalista */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {/* Coroa Premium minimalista - versão aprimorada */}
          {art.isPremium && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 blur-[1px] opacity-70 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-1.5 shadow-md transition-all duration-300 hover:scale-110 border border-amber-300/50">
                <Crown className="h-2.5 w-2.5 text-white drop-shadow-sm" />
              </div>
            </div>
          )}
          
          {/* Indicador de mesmo grupo - versão mais sutil e consistente */}
          {isSameGroup && (
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-300 via-blue-400 to-blue-600 blur-[1px] opacity-70 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-1.5 shadow-md transition-all duration-300 hover:scale-110 border border-blue-300/50">
                <Layers className="h-2.5 w-2.5 text-white drop-shadow-sm" />
              </div>
            </div>
          )}
        </div>
        
        {/* Mostrar informações do designer no canto inferior */}
        {showDesigner && art.designer && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6 border border-white/30">
                <AvatarImage
                  src={art.designer.profileimageurl || ""}
                  alt={art.designer.name}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(art.designer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-medium truncate">
                  {art.designer.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return onClick ? (
    <div onClick={onClick} className="cursor-pointer">
      {renderCard()}
    </div>
  ) : (
    <Link href={`/arts/${art.id}`}>
      {renderCard()}
    </Link>
  );
}

export { ArtCard };
export default ArtCard;