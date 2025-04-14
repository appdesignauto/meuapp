import { useState } from 'react';
import { Link } from 'wouter';
import { Bookmark } from 'lucide-react';
import { Collection } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CollectionCardProps {
  collection: Collection;
}

const CollectionCard = ({ collection }: CollectionCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  return (
    <Link href={`/collections/${collection.id}`}>
      <div className="group relative rounded-lg overflow-hidden shadow-sm border border-neutral-200 hover:shadow-md transition cursor-pointer">
        <div className="aspect-video bg-neutral-100 relative">
          <img 
            src={collection.imageUrl} 
            alt={collection.title} 
            className="object-cover w-full h-full rounded-t-lg" 
            loading="lazy"
          />
          
          {/* Premium Badge */}
          {collection.isPremium && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-secondary-500 text-white text-xs px-2 py-1 rounded-full">
                Premium
              </Badge>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-neutral-800 mb-1">{collection.title}</h3>
          <p className="text-neutral-600 text-sm mb-3">{collection.artCount} artes • {collection.formats}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">{formatDate(collection.updatedAt)}</span>
            <button 
              className="text-primary hover:text-primary/80"
              onClick={toggleBookmark}
              aria-label={isBookmarked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CollectionCard;
