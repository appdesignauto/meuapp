import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Interface copiada de ArtDetail para manter a compatibilidade
interface Designer {
  id: number;
  name: string | null;
  username: string;
  profileimageurl: string | null; // nome exato que vem da API
  profileImageUrl?: string | null; // mantido para compatibilidade com outras partes do código
  bio: string | null;
  followers: number;
  isFollowing: boolean;
  totalArts?: number;
  recentArts?: Array<{
    id: number;
    title: string;
    imageUrl: string;
  }>;
}

interface DesignerSectionProps {
  designer: Designer;
  userId?: number | null;
}

export function DesignerSection({ designer: initialDesigner, userId }: DesignerSectionProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [designer, setDesigner] = useState(initialDesigner);
  
  // Log para debug das propriedades do designer
  console.log('Dados do designer:', designer);

  // Atualiza o estado local quando as props mudam
  useEffect(() => {
    setDesigner(initialDesigner);
  }, [initialDesigner]);

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita o redirecionamento para o perfil ao clicar no botão
    
    if (!userId) {
      toast({
        title: "Login Necessário",
        description: "Faça login para seguir este designer",
        variant: "destructive",
      });
      return;
    }
    
    const isCurrentlyFollowing = designer.isFollowing;
    
    // Otimistic UI update - atualiza o estado local imediatamente
    setDesigner(prev => ({
      ...prev,
      isFollowing: !isCurrentlyFollowing,
      followers: isCurrentlyFollowing
        ? (prev.followers || 1) - 1
        : (prev.followers || 0) + 1
    }));
    
    // API call - Usando o endpoint unificado
    fetch(`/api/users/follow/${designer.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: isCurrentlyFollowing ? 'unfollow' : 'follow' }),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        // Reverte a mudança em caso de erro
        setDesigner(prev => ({
          ...prev,
          isFollowing: isCurrentlyFollowing,
          followers: isCurrentlyFollowing
            ? (prev.followers || 0) + 1
            : Math.max(0, (prev.followers || 1) - 1)
        }));
        throw new Error('Falha na operação de seguir');
      }
      return response.json();
    })
    .then(() => {
      toast({
        title: isCurrentlyFollowing ? "Deixou de seguir" : "Designer seguido",
        description: isCurrentlyFollowing 
          ? `Você deixou de seguir ${designer.name || designer.username}`
          : `Você está seguindo ${designer.name || designer.username}`,
      });
    })
    .catch(error => {
      toast({
        title: "Erro na operação",
        description: error.message,
        variant: "destructive",
      });
    });
  };
  
  return (
    <motion.div 
      className="mb-0 py-3 px-1 border-t border-b border-neutral-100 bg-gradient-to-r from-white to-blue-50/20"
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Layout principal com flexbox para distribuição de espaço */}
      <div className="flex items-center justify-between">
        {/* Área do perfil do designer - Lado esquerdo */}
        <div 
          className="flex-grow cursor-pointer group" 
          onClick={() => setLocation(`/designers/${designer.username}`)}
        >
          <div className="flex items-center">
            {/* Avatar com sombreamento suave */}
            <motion.div 
              className="w-10 h-10 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0 border-2 border-white shadow-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {designer.profileimageurl ? (
                <img 
                  src={designer.profileimageurl}
                  alt={designer.name || designer.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-700 font-medium">
                  {(designer.name?.[0] || designer.username[0]).toUpperCase()}
                </div>
              )}
            </motion.div>
            
            {/* Informações do designer com melhor hierarquia */}
            <div className="ml-3">
              <div className="flex items-center">
                <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                  {designer.name || designer.username}
                </p>
                
                {/* Badge de verificação para designers oficiais */}
                {designer.id === 1 && (
                  <span className="ml-1 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              
              {/* Info de artes com ícone para melhor visualização */}
              <div className="flex items-center text-xs text-neutral-500 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1 text-blue-400">
                  <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
                  <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
                  <path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134-.001z" />
                </svg>
                {designer.totalArts ? 
                  designer.totalArts > 1000 
                    ? `${Math.floor(designer.totalArts / 1000)}k artes` 
                    : `${designer.totalArts} artes` 
                  : '0 artes'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Botão de seguir - Lado direito, com animação e visual moderno */}
        {userId && userId !== designer.id && (
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              variant="default"
              size="sm"
              className={`text-xs px-3 h-8 rounded-full ${
                designer.isFollowing 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50 shadow-sm"
              }`}
              onClick={handleFollowClick}
            >
              {designer.isFollowing ? (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M20 6 9 17l-5-5"></path></svg>
                  Seguindo
                </span>
              ) : (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  Seguir
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Bio do designer com estilização aprimorada */}
      {designer.bio && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 cursor-pointer"
          onClick={() => setLocation(`/designers/${designer.username}`)}
        >
          <p className="text-xs text-neutral-600 line-clamp-2 italic">
            "{designer.bio}"
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}