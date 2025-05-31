import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Link } from 'wouter';

interface Art {
  id: number;
  title: string;
  imageUrl: string;
  isPremium: boolean;
  categoryName: string;
  downloadCount: number;
  viewCount: number;
}

interface ApiResponse {
  arts: Art[];
}

const TrendingPopular = () => {
  const { data: popularData, isLoading } = useQuery<ApiResponse>({
    queryKey: ['/api/arts/popular']
  });

  const currentArts = popularData?.arts || [];

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-300 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (currentArts.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Trending & Popular
            </h2>
            <p className="text-gray-600 mb-8">
              Descubra os designs que estão fazendo sucesso
            </p>
            <div className="text-gray-500">
              <Download size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum design encontrado</p>
              <p className="text-sm">Não há designs disponíveis nesta categoria no momento.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-1 sm:py-2 md:py-4">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="sm:text-sm font-medium text-neutral-800 whitespace-nowrap text-[15px]">Top 6 - Artes em Alta</h2>
          </div>
        </div>

        {/* Arts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {currentArts.map((art, index) => (
            <motion.div
              key={art.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link href={`/art/${art.id}`}>
                <div className="relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  {/* Imagem */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Efeito "Em Alta" - mantido conforme solicitado */}
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium shadow-lg">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          🔥
                        </motion.div>
                        Em alta
                      </div>
                    </div>
                  </div>

                  {/* Informações compactas */}
                  <div className="p-2">
                    <h3 className="font-medium text-gray-900 text-xs line-clamp-1 mb-1">
                      {art.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="text-xs truncate">{art.categoryName}</span>
                      <div className="flex items-center gap-1">
                        <Download size={10} />
                        <span>{art.downloadCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingPopular;