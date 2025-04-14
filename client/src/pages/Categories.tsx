import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/types';
import { generatePlaceholderImage } from '@/lib/utils';

const Categories = () => {
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
      "https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&q=80"
    ];
    
    return placeholderImages[index % placeholderImages.length];
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
            Escolha sua categoria
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Encontre as melhores artes e modelos para seu negócio automotivo. 
            Todas as artes são editáveis em Canva ou Google Drive.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-neutral-100 rounded-lg animate-pulse">
                <div className="aspect-square rounded-lg overflow-hidden bg-neutral-200" />
                <div className="p-3 flex flex-col items-center">
                  <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories?.map((category, index) => (
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

            <div className="mt-8 text-center">
              <Link href="/" className="text-primary hover:text-primary/80 font-medium inline-flex items-center">
                <span>Ver todas as artes</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Categories;