import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ArtCard from '@/components/ui/ArtCard';

interface RelatedArtsProps {
  artId: number;
  limit?: number;
}

export default function RelatedArts({ artId, limit = 4 }: RelatedArtsProps) {
  const [, setLocation] = useLocation();
  
  const { data: relatedArts, isLoading, error } = useQuery({
    queryKey: ['/api/arts', artId, 'related'],
    queryFn: async () => {
      const res = await fetch(`/api/arts/${artId}/related?limit=${limit}`);
      if (!res.ok) {
        throw new Error('Erro ao carregar artes relacionadas');
      }
      return res.json();
    },
    retry: 1,
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array(limit).fill(0).map((_, index) => (
          <div key={index} className="rounded-lg overflow-hidden bg-neutral-50 shadow-sm border border-neutral-100">
            <Skeleton className="w-full aspect-square" />
            <div className="p-3 border-t border-neutral-100">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error || !relatedArts || relatedArts.length === 0) {
    return (
      <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
        <p className="text-neutral-500">
          {error ? 'Erro ao carregar artes relacionadas' : 'Nenhuma arte relacionada encontrada'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {relatedArts.map((art: any) => (
        <div 
          key={art.id}
          className="rounded-lg overflow-hidden bg-neutral-50 shadow-sm border border-neutral-100 hover:shadow-md transition-all cursor-pointer group"
          onClick={() => setLocation(`/arts/${art.id}`)}
        >
          <div className="relative">
            <img 
              src={art.imageUrl} 
              alt={art.title}
              className="w-full aspect-square object-cover"
            />
            
            {art.isPremium && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2 py-0.5 rounded-full">
                  Premium
                </Badge>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-start p-3">
              <div className="bg-white text-blue-600 rounded-full p-1.5 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          <div className="p-3">
            <h3 className="font-medium text-gray-800 line-clamp-1 leading-tight">{art.title}</h3>
            <p className="text-sm text-neutral-500 mt-1">{art.format}</p>
          </div>
        </div>
      ))}
    </div>
  );
}