import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Zap, Star, Download, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface TrendingArt {
  id: number;
  title: string;
  imageUrl: string;
  downloadCount: number;
  viewCount: number;
  categoryName: string;
  isNew?: boolean;
  isPremium?: boolean;
}

export default function TrendingPopular() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trending' | 'popular' | 'new'>('trending');

  // Buscar artes em alta da semana
  const { data: trendingArts, isLoading: trendingLoading } = useQuery({
    queryKey: ['/api/arts/trending'],
    queryFn: async () => {
      const res = await fetch('/api/arts/trending');
      if (!res.ok) throw new Error('Erro ao buscar artes em alta');
      return res.json();
    },
  });

  // Buscar artes mais populares
  const { data: popularArts, isLoading: popularLoading } = useQuery({
    queryKey: ['/api/arts/popular'],
    queryFn: async () => {
      const res = await fetch('/api/arts/popular');
      if (!res.ok) throw new Error('Erro ao buscar artes populares');
      return res.json();
    },
  });

  // Buscar novidades da semana
  const { data: newArts, isLoading: newLoading } = useQuery({
    queryKey: ['/api/arts/new'],
    queryFn: async () => {
      const res = await fetch('/api/arts/new');
      if (!res.ok) throw new Error('Erro ao buscar novidades');
      return res.json();
    },
  });

  const isLoading = trendingLoading || popularLoading || newLoading;

  const getCurrentData = () => {
    switch (activeTab) {
      case 'trending':
        return trendingArts?.arts || [];
      case 'popular':
        return popularArts?.arts || [];
      case 'new':
        return newArts?.arts || [];
      default:
        return [];
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'popular':
        return <Zap className="w-4 h-4" />;
      case 'new':
        return <Star className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'trending':
        return 'Em Alta';
      case 'popular':
        return 'Mais Baixados';
      case 'new':
        return 'Novidades';
      default:
        return '';
    }
  };

  if (!user) return null;

  return (
    <section className="py-8 bg-gradient-to-b from-white to-gray-50/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trending & Popular</h2>
            <p className="text-gray-600">Descubra os designs que estão fazendo sucesso</p>
          </div>
          
          <Link href="/arts?sort=trending">
            <Button variant="outline" className="flex items-center gap-2">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['trending', 'popular', 'new'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab as any)}
              className={`flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'hover:bg-blue-50'
              }`}
            >
              {getTabIcon(tab)}
              {getTabLabel(tab)}
            </Button>
          ))}
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {getCurrentData().slice(0, 6).map((art: TrendingArt, index: number) => (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/art/${art.id}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-white">
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden rounded-t-lg">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {art.isPremium && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1">
                              Premium
                            </Badge>
                          )}
                          {art.isNew && (
                            <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs px-2 py-1">
                              Novo
                            </Badge>
                          )}
                        </div>

                        {/* Stats overlay */}
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          <div className="bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                            <Download className="w-3 h-3 text-white" />
                            <span className="text-xs text-white font-medium">
                              {art.downloadCount > 999 
                                ? `${(art.downloadCount / 1000).toFixed(1)}k` 
                                : art.downloadCount
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
                          {art.title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {art.categoryName}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>
                              {art.viewCount > 999 
                                ? `${(art.viewCount / 1000).toFixed(1)}k` 
                                : art.viewCount
                              }
                            </span>
                          </div>
                          
                          {activeTab === 'trending' && (
                            <div className="flex items-center gap-1 text-orange-500">
                              <TrendingUp className="w-3 h-3" />
                              <span className="font-medium">Em alta</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && getCurrentData().length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum design encontrado
            </h3>
            <p className="text-gray-500">
              Não há designs disponíveis nesta categoria no momento.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}