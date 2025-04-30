import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface Art {
  id: number;
  title: string;
  imageUrl: string;
  format?: string;
  isPremium?: boolean;
  createdAt?: string;
}

interface ArtCardProps {
  art: Art;
  onClick?: () => void;
  showEditAction?: boolean;
}

function ArtCard({ art, onClick, showEditAction = true }: ArtCardProps) {
  // Estilo Pinterest: sem rodapé com informações, apenas imagem com badges opcionais
  const renderCard = () => (
    <div className="overflow-hidden rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer h-full bg-muted">
      <div className="relative overflow-hidden w-full h-full">
        <img
          src={art.imageUrl}
          alt={art.title}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          loading="lazy"
          title={art.title} // Mostra o título no hover
        />
        
        {/* Overlay escuro sutil no hover para melhorar legibilidade */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300"></div>
        
        {art.isPremium && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="flex items-center gap-1 shadow-sm">
              <Crown className="h-3 w-3" />
              <span>Premium</span>
            </Badge>
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