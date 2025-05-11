import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Copy, Crown, Layers, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createSeoUrl } from "@/lib/utils/slug";

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

  // Estilo Pinterest com aparência premium e minimalista, apenas imagem com badges opcionais
  const renderCard = () => (
    <div className={`overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg cursor-pointer bg-white ${isSameGroup ? 'ring-1 ring-blue-400' : ''}`}>
      <div className="relative overflow-hidden w-full">
        <img
          src={art.imageUrl}
          alt={art.title}
          className="object-cover w-full transition-all duration-300 hover:scale-[1.03]"
          loading="lazy"
          title={art.title} // Mostra o título no hover
        />
        
        {/* Overlay escuro sutil no hover para melhorar legibilidade */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors duration-300"></div>
        
        {/* Badges minimalistas no canto superior direito */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {/* Ícone de coroa para Premium com efeito de brilho sutil */}
          {art.isPremium && (
            <div className="bg-gradient-to-r from-amber-400/90 to-amber-500/90 p-1.5 rounded-full shadow-sm hover:shadow-amber-300/50 transition-all duration-300 hover:scale-110">
              <Crown className="h-3.5 w-3.5 text-white drop-shadow-sm" />
            </div>
          )}
          
          {/* Indicador de mesmo grupo - apenas ícone com mesmo efeito visual */}
          {isSameGroup && (
            <div className="bg-gradient-to-r from-blue-500/90 to-blue-600/90 p-1.5 rounded-full shadow-sm hover:shadow-blue-300/50 transition-all duration-300 hover:scale-110">
              <Layers className="h-3.5 w-3.5 text-white drop-shadow-sm" />
            </div>
          )}
        </div>
        
        {/* Formato da arte removido para interface mais limpa */}
        
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

  // Gera URL amigável para SEO com formato "id-slug"
  const seoUrl = createSeoUrl(art.id, art.title);

  return onClick ? (
    <div onClick={onClick} className="cursor-pointer">
      {renderCard()}
    </div>
  ) : (
    <Link href={`/artes/${seoUrl}`}>
      {renderCard()}
    </Link>
  );
}

export { ArtCard };
export default ArtCard;