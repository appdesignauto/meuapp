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
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Trending & Popular
          </h2>
          <p className="text-gray-600">
            Descubra os designs que estão fazendo sucesso
          </p>
        </div>

        {/* Tab Header - Apenas visual */}
        <div className="flex gap-2 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white shadow-lg">
            <Download size={16} />
            Mais Baixados
          </div>
        </div>

        {/* Arts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentArts.map((art, index) => (
            <motion.div
              key={art.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link href={`/art/${art.id}`}>
                <div className="relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Imagem */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Efeito "Em Alta" - mantido conforme solicitado */}
                    <div className="absolute top-3 left-3">
                      <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
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

                  {/* Informações do card */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {art.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                        {art.categoryName}
                      </span>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Download size={14} />
                          <span>{art.downloadCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
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