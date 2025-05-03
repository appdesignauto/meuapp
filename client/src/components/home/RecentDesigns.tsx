import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Clock, ExternalLink, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

interface RecentDesign {
  id: number;
  createdAt: string;
  art: {
    id: number;
    title: string;
    imageUrl: string;
    format: string;
    fileType: string;
    editUrl: string;
    isPremium: boolean;
    categoryId: number;
  }
}

export default function RecentDesigns() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Event handlers
  const handleViewAll = () => {
    setLocation('/painel/downloads');
  };
  
  const handleClickDesign = (id: number) => {
    setLocation(`/arts/${id}`);
  };
  
  // Cálculo de tempo relativo (Editado há X dias/horas)
  const getRelativeTimeString = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return `Editado há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else if (diffHours > 0) {
      return `Editado há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffMinutes > 0) {
      return `Editado há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    } else {
      return 'Editado agora';
    }
  };
  
  // Fetch downloads (o que representa os designs editados pelo usuário)
  const { data: downloadsData, isLoading } = useQuery<{ downloads: RecentDesign[]; totalCount: number }>({
    queryKey: ['/api/downloads'],
    enabled: !!user?.id, // Só busca se o usuário estiver logado
  });
  
  // Se o usuário não estiver logado, não renderiza nada
  if (!user) {
    return null;
  }
  
  // Ordenar por data de download mais recente e limitar a 6 itens
  const recentDesigns = downloadsData?.downloads
    ? [...downloadsData.downloads]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
    : [];
    
  // Se não houver designs recentes, não renderiza nada
  if (!downloadsData?.downloads || downloadsData.downloads.length === 0 || recentDesigns.length === 0) {
    return null;
  }
  
  return (
    <section className="py-8 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Seus designs recentes</h2>
          </div>
          <Button 
            onClick={handleViewAll}
            variant="ghost" 
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recentDesigns.map((download: RecentDesign) => (
            <motion.div
              key={download.id}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer relative group"
              onClick={() => handleClickDesign(download.art.id)}
            >
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={download.art.imageUrl} 
                  alt={download.art.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                {download.art.isPremium && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-amber-400 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.59 9.35L15.83 8.35L13.5 4.1C13.34 3.78 13.01 3.58 12.65 3.58C12.29 3.58 11.96 3.78 11.81 4.1L9.5 8.35L4.72 9.35C4.1 9.47 3.56 9.92 3.5 10.56C3.46 10.94 3.61 11.32 3.89 11.59L7.33 14.95L6.67 19.77C6.58 20.17 6.68 20.54 6.93 20.82C7.18 21.1 7.56 21.26 7.95 21.26C8.21 21.26 8.46 21.19 8.66 21.06L13 18.68L17.32 21.05C17.52 21.18 17.77 21.25 18.03 21.25H18.04C18.42 21.25 18.79 21.09 19.04 20.82C19.29 20.55 19.39 20.17 19.3 19.79L18.63 14.97L22.07 11.61C22.35 11.34 22.5 10.96 22.46 10.58C22.39 9.93 21.85 9.47 20.59 9.35Z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">{download.art.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-50 text-blue-700 border-blue-200">
                    {download.art.format}
                  </Badge>
                  <span className="text-xs text-gray-500">{getRelativeTimeString(download.createdAt)}</span>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button variant="secondary" size="sm" className="shadow-md">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}