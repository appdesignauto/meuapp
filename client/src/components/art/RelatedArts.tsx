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
  currentGroupId?: string | null; // Adicionar groupId atual para comparação
}

export default function RelatedArts({ 
  artId, 
  limit = 12, // Alterado para 12 por padrão
  originalCategory = null,
  designerName = "Design Auto",
  currentGroupId = null // Valor padrão null
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
      <div 
        className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-4 vitrine-8px space-y-0"
        style={{ 
          columnGap: '8px'
        }}
      >
        {Array.from({ length: limit }).map((_, index) => (
          <div 
            key={`skeleton-${index}`} 
            className="block overflow-hidden animate-pulse break-inside-avoid rounded-xl shadow-sm"
            style={{ 
              marginBottom: '8px'
            }}
          >
            <div className={`${index % 3 === 0 ? 'aspect-[3/4]' : (index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[1/1]')} bg-neutral-200 rounded-xl`} />
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
  
  // Success state com layout harmonioso igual à home
  return (
    <div 
      className="columns-2 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-4 vitrine-8px space-y-0"
      style={{ 
        columnGap: '8px'
      }}
    >
      {relatedArts.map((art: any, index: number) => (
        <div 
          key={`art-${art.id}`} 
          className="break-inside-avoid group animate-fadeIn"
          style={{
            marginBottom: '8px',
            animationDelay: `${index * 50}ms`,
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          <div className="relative transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/10 rounded-2xl overflow-hidden bg-white border border-gray-100/50 shadow-sm">
            <div className="relative overflow-hidden">
              <ArtCard 
                art={art}
                onClick={() => setLocation(`/artes/${art.id}`)}
                showEditAction={false}
                showDesigner={false}
                isSameGroup={currentGroupId !== null && art.groupId === currentGroupId}
              />
            </div>
            
            {/* Overlay sutil no hover para melhor UX */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 rounded-2xl pointer-events-none" />
          </div>
        </div>
      ))}
    </div>
  );
}