import { useState, useEffect } from "react";
import { X, Heart, MessageCircle, Share2, Eye, Pin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from '@/lib/utils';
import UserAvatar from '@/components/users/UserAvatar';
import VerifiedUsername from '@/components/users/VerifiedUsername';

interface CommunityPost {
  id: number;
  userId: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  isApproved: boolean;
  isPinned: boolean;
  editLink?: string;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  featuredUntil?: string;
  isWeeklyFeatured: boolean;
  user: {
    id: number;
    username: string;
    name: string;
    profileimageurl: string;
    nivelacesso: string;
    acessovitalicio: boolean;
  };
}

interface CommunityPostModalProps {
  post: CommunityPost | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function CommunityPostModal({ 
  post, 
  isOpen, 
  onClose, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious 
}: CommunityPostModalProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (post) {
      setLikesCount(post.likesCount || 0);
      setIsLiked(false); // Resetar ao abrir novo post
    }
  }, [post]);

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const response = await fetch(`/api/community/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Confira este post da comunidade: ${post.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
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

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Imagem do Post */}
          <div className="flex-1 relative bg-gray-100 flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
            <img
              src={post.imageUrl}
              alt={post.title}
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

          {/* Informações do Post */}
          <div className="w-full lg:w-80 p-6 bg-white overflow-y-auto">
            {/* Cabeçalho com usuário */}
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar user={post.user} size="sm" linkToProfile={true} />
              <div className="flex-1">
                <VerifiedUsername 
                  user={post.user} 
                  showBadge={true}
                  className="font-medium text-sm"
                />
                <p className="text-xs text-gray-500">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Status do post */}
            {post.isPinned && (
              <div className="mb-4">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Star className="h-3 w-3 mr-1" fill="white" />
                  Post Fixado
                </Badge>
              </div>
            )}

            {/* Título e conteúdo */}
            <DialogHeader className="space-y-4 pb-4">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{post.title}</h2>
              {post.content && (
                <p className="text-sm text-gray-600 leading-relaxed">{post.content}</p>
              )}
            </DialogHeader>

            <Separator className="my-4" />

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div className="space-y-1">
                <Eye className="h-4 w-4 mx-auto text-gray-500" />
                <div className="text-sm font-medium">{post.viewCount}</div>
                <div className="text-xs text-gray-500">Views</div>
              </div>
              <div className="space-y-1">
                <Heart className="h-4 w-4 mx-auto text-gray-500" />
                <div className="text-sm font-medium">{likesCount}</div>
                <div className="text-xs text-gray-500">Curtidas</div>
              </div>
              <div className="space-y-1">
                <MessageCircle className="h-4 w-4 mx-auto text-gray-500" />
                <div className="text-sm font-medium">{post.commentsCount}</div>
                <div className="text-xs text-gray-500">Comentários</div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Link externo se existir */}
            {post.editLink && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Link Externo</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(post.editLink, '_blank')}
                  className="w-full"
                >
                  Abrir Link
                </Button>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
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

            {/* Status de aprovação */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Status: {post.status}</span>
                {post.isApproved && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Aprovado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}