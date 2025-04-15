import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(limit).fill(0).map((_, index) => (
          <div key={index} className="rounded-md overflow-hidden">
            <Skeleton className="w-full aspect-square" />
            <div className="p-3">
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
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {error ? 'Erro ao carregar artes relacionadas' : 'Nenhuma arte relacionada encontrada'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {relatedArts.map((art: any) => (
        <ArtCard 
          key={art.id} 
          art={art} 
          onClick={() => setLocation(`/arts/${art.id}`)}
        />
      ))}
    </div>
  );
}