import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArtCard from '@/components/ui/ArtCard';
import { createSeoUrl } from '@/lib/utils/slug';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Art {
  id: number;
  title: string;
  imageUrl: string;
  isPremium: boolean;
  createdAt: string;
}

const CategorySections = () => {
  // Buscar todas as categorias
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Buscar artes para cada categoria (5 por categoria)
  const { data: artsData } = useQuery({
    queryKey: ['/api/arts', { limit: 100, isVisible: true }], // Buscar um número maior para ter artes de todas as categorias
    select: (data: { arts: Art[] }) => data.arts
  });

  // Agrupar artes por categoria
  const getArtsByCategory = (categoryId: number) => {
    if (!artsData) return [];
    return artsData
      .filter((art: any) => art.categoryId === categoryId)
      .slice(0, 5); // Limitar a 5 artes por categoria
  };

  if (!categories.length) return null;

  return (
    <div className="py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {categories.map((category) => {
          const categoryArts = getArtsByCategory(category.id);
          
          // Só renderiza a seção se houver artes
          if (categoryArts.length === 0) return null;

          return (
            <div key={category.id} className="mb-16 last:mb-0">
              {/* Cabeçalho da Seção */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {category.name}
                  </h2>
                  <p className="text-muted-foreground">
                    Artes mais recentes de {category.name.toLowerCase()}
                  </p>
                </div>
                <Link href={`/categorias/${category.slug}`}>
                  <Button variant="outline" className="group">
                    Ver todas
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Grid de Artes */}
              <div className="pinterest-grid">
                {categoryArts.map((art) => {
                  const seoUrl = createSeoUrl(art.id, art.title);
                  return (
                    <Link key={art.id} href={`/artes/${seoUrl}`}>
                      <div className="block cursor-pointer">
                        <ArtCard
                          id={art.id}
                          title={art.title}
                          imageUrl={art.imageUrl}
                          isPremium={art.isPremium}
                          createdAt={art.createdAt}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySections;