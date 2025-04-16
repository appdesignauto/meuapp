import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

function ArtCard({ art, onClick }: ArtCardProps) {
  // Formato a data relativa - ex: "há 2 dias"
  const formattedDate = art.createdAt 
    ? formatDistanceToNow(new Date(art.createdAt), { 
        addSuffix: true, 
        locale: ptBR 
      })
    : null;
  
  const renderCard = () => (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer h-full flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={art.imageUrl}
          alt={art.title}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        
        {art.isPremium && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              <span>Premium</span>
            </Badge>
          </div>
        )}
        
        {art.format && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {art.format}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-3 flex-grow flex flex-col justify-between">
        <h3 className="font-medium line-clamp-2 mb-1" title={art.title}>
          {art.title}
        </h3>
        
        {formattedDate && (
          <p className="text-xs text-muted-foreground mt-auto">
            {formattedDate}
          </p>
        )}
      </CardContent>
    </Card>
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