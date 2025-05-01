import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import ArtCard from '@/components/ui/ArtCard';
import { Tag } from 'lucide-react';

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
  
  // Verifica se existem artes da mesma categoria
  const hasSameCategoryArts = relatedArts?.some((art: any) => 
    art.category?.id === originalCategory?.id
  );
  
  // Define o título da seção com base nas categorias das artes relacionadas
  const getSectionTitle = () => {
    if (originalCategory && hasSameCategoryArts) {
      return (
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-xl font-bold text-gray-800">Artes relacionadas - Categoria </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Tag className="h-4 w-4 mr-1" />
            {originalCategory.name}
          </span>
        </div>
      );
    }
    return <h2 className="text-xl font-bold text-gray-800 mb-5">Artes relacionadas</h2>;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <h2 className="text-xl font-bold text-gray-800 mb-5">Artes relacionadas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array(limit).fill(0).map((_, index) => (
            <div key={index} className="rounded-lg overflow-hidden bg-neutral-50 shadow-sm">
              <Skeleton className="w-full aspect-square" />
            </div>
          ))}
        </div>
      </>
    );
  }
  
  // Error or empty state
  if (error || !relatedArts || relatedArts.length === 0) {
    return (
      <>
        <h2 className="text-xl font-bold text-gray-800 mb-5">Artes relacionadas</h2>
        <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
          <p className="text-neutral-500">
            {error ? 'Erro ao carregar artes relacionadas' : 'Nenhuma arte relacionada encontrada'}
          </p>
        </div>
      </>
    );
  }
  
  // Success state com o componente ArtCard reutilizado
  return (
    <>
      {getSectionTitle()}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {relatedArts.map((art: any) => (
          <ArtCard 
            key={art.id}
            art={art}
            onClick={() => setLocation(`/arts/${art.id}`)}
            showEditAction={false}
          />
        ))}
      </div>
    </>
  );
}