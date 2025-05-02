import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import ArtCard from '@/components/ui/ArtCard';

interface RelatedArtsProps {
  artId: number;
  limit?: number;
  originalCategory?: {
    id: number;
    name: string;
    slug?: string;
  } | null;
  designerName?: string;
}

export default function RelatedArts({ 
  artId, 
  limit = 4, 
  originalCategory = null,
  designerName = "Design Auto" 
}: RelatedArtsProps) {
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
  
  // Loading state
  if (isLoading) {
    return (
      <div className="masonry-grid">
        {Array(limit).fill(0).map((_, index) => (
          <div key={index} className="rounded-lg overflow-hidden bg-neutral-50 shadow-sm">
            <Skeleton className="w-full aspect-square" />
          </div>
        ))}
      </div>
    );
  }
  
  // Error or empty state
  if (error || !relatedArts || relatedArts.length === 0) {
    return (
      <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
        <p className="text-neutral-500">
          {error ? 'Erro ao carregar artes relacionadas' : 'Nenhuma arte relacionada encontrada'}
        </p>
      </div>
    );
  }
  
  // Success state com o componente ArtCard reutilizado
  return (
    <div className="masonry-grid">
      {relatedArts.map((art: any) => (
        <ArtCard 
          key={art.id}
          art={art}
          onClick={() => setLocation(`/arts/${art.id}`)}
          showEditAction={false}
          showDesigner={false}
        />
      ))}
    </div>
  );
}