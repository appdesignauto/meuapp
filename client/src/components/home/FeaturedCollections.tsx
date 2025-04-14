import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Collection } from '@/types';
import CollectionCard from '@/components/ui/CollectionCard';

const FeaturedCollections = () => {
  const { data: collections, isLoading } = useQuery<Collection[]>({
    queryKey: ['/api/collections/featured'],
  });

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-800">Coleções em Destaque</h2>
          <Link href="/collections" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center">
            Ver todas as coleções
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div 
                key={index} 
                className="rounded-lg overflow-hidden shadow-sm border border-neutral-200 animate-pulse"
              >
                <div className="aspect-video bg-neutral-200" />
                <div className="p-4">
                  <div className="h-5 bg-neutral-200 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-neutral-200 rounded mb-3 w-1/2" />
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-neutral-200 rounded w-1/3" />
                    <div className="h-4 w-4 bg-neutral-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {collections?.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCollections;
