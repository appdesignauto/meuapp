import { useState, useEffect } from "react";
import { X, Heart, MessageCircle, Download, Share2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Art {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  isPremium: boolean;
  downloads: number;
  views: number;
  likes: number;
  createdAt: string;
  tags?: string[];
}

interface ArtModalProps {
  art: Art | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function ArtModal({ 
  art, 
  isOpen, 
  onClose, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious 
}: ArtModalProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (art) {
      setLikesCount(art.likes || 0);
      setIsLiked(false); // Resetar ao abrir nova arte
    }
  }, [art]);

  const handleLike = async () => {
    if (!art) return;
    
    try {
      const response = await fetch(`/api/arts/${art.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Erro ao curtir arte:', error);
    }
  };

  const handleDownload = async () => {
    if (!art || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/arts/${art.id}/download`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${art.title}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao baixar arte:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!art) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: art.title,
          text: `Confira esta arte incrível: ${art.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para navegadores sem Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        if (hasPrevious && onPrevious) onPrevious();
        break;
      case 'ArrowRight':
        if (hasNext && onNext) onNext();
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrevious]);

  if (!art) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Imagem da Arte */}
          <div className="flex-1 relative bg-gray-100 flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
            <img
              src={art.imageUrl}
              alt={art.title}
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
            
            {/* Botão Fechar */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navegação */}
            {hasPrevious && onPrevious && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                onClick={onPrevious}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            )}

            {hasNext && onNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
                onClick={onNext}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )}
          </div>

          {/* Informações da Arte */}
          <div className="w-full lg:w-80 p-6 bg-white overflow-y-auto">
            <DialogHeader className="space-y-4 pb-4">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{art.title}</h2>
                {art.isPremium && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    Premium
                  </Badge>
                )}
              </div>
              
              <Badge variant="outline" className="w-fit">
                {art.category}
              </Badge>
            </DialogHeader>

            <Separator className="my-4" />

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div className="space-y-1">
                <Eye className="h-4 w-4 mx-auto text-gray-500" />
                <div className="text-sm font-medium">{art.views}</div>
                <div className="text-xs text-gray-500">Views</div>
              </div>
              <div className="space-y-1">
                <Download className="h-4 w-4 mx-auto text-gray-500" />
                <div className="text-sm font-medium">{art.downloads}</div>
                <div className="text-xs text-gray-500">Downloads</div>
              </div>
              <div className="space-y-1">
                <Heart className="h-4 w-4 mx-auto text-gray-500" />
                <div className="text-sm font-medium">{likesCount}</div>
                <div className="text-xs text-gray-500">Curtidas</div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Descrição */}
            {art.description && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Descrição</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{art.description}</p>
              </div>
            )}

            {/* Tags */}
            {art.tags && art.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {art.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Baixando...' : 'Baixar Arte'}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleLike}
                  className={isLiked ? 'text-red-600 border-red-200 bg-red-50' : ''}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Curtido' : 'Curtir'}
                </Button>

                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Data de Criação */}
            <div className="mt-6 pt-4 border-t text-xs text-gray-500">
              Criado em {new Date(art.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}