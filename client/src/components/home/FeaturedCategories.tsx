import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/types';

const FeaturedCategories = () => {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Função para gerar uma URL de imagem para categorias
  const getCategoryImageUrl = (category: Category, index: number) => {
    // Na implementação real, você teria imagens específicas da categoria
    // Por enquanto, usamos um placeholder ou uma imagem de carro aleatória
    const placeholderImages = [
      "https://images.unsplash.com/photo-1549399542-7e8f2e928464?w=500&q=80", 
      "https://images.unsplash.com/photo-1592840062661-a5a7f2bc6b56?w=500&q=80",
      "https://images.unsplash.com/photo-1570733577524-3a047079e80d?w=500&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&q=80",
      "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=500&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80",
      "https://images.unsplash.com/photo-1534093607318-f025413f49cb?w=500&q=80"
    ];
    
    return placeholderImages[index % placeholderImages.length];
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-800">Escolha sua categoria</h2>
          <Link href="/categories" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center">
            Ver todas as categorias
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square bg-neutral-200" />
                <div className="p-3 flex flex-col items-center">
                  <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {categories?.slice(0, 8).map((category, index) => (
              <Link key={category.id} href={`/?category=${category.id}`}>
                <div className="group rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md">
                  <div className="aspect-square relative overflow-hidden">
                    <div className="grid grid-cols-2 h-full">
                      {/* Simulando múltiplas imagens em um grid para cada categoria */}
                      {[...Array(4)].map((_, imgIndex) => (
                        <div key={imgIndex} className="overflow-hidden">
                          <img 
                            src={getCategoryImageUrl(category, index + imgIndex)} 
                            alt="" 
                            className="object-cover w-full h-full transform transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-white text-center">
                    <h3 className="font-medium text-neutral-800">
                      Artes de {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;