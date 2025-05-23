import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { 
  Settings, Plus, Filter, Trophy, Clock, Info, Award, Medal, 
  Sparkles, Users, ImageIcon, ExternalLink, FileEdit, RefreshCw, 
  Loader2, ZoomIn, X, MessageSquare, XCircle, FileQuestion, Globe, 
  Share, MoreHorizontal, Trash2, MessageCircle, Heart, ThumbsUp, Pin, Star,
  PlusCircle, Bookmark, Check, CheckCircle2, UserIcon,
  AlertCircle, CheckCircle, Share2, Eye, FileText, Flame, AlertTriangle
} from 'lucide-react';
import { differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';

import TopBar from '@/components/TopBar';
import FooterMenu from '@/components/FooterMenu';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorContainer from '@/components/ErrorContainer';
import UserAvatar from '@/components/users/UserAvatar';
import VerifiedUsername from '@/components/users/VerifiedUsername';
import RankingList from '@/components/community/RankingList';
import MonthlyWinners from '@/components/community/MonthlyWinners';
import { CreatePostDialog } from '@/components/community/CreatePostDialog';
import PostViewDialog from '@/components/community/PostViewDialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FollowButton } from '@/components/community/FollowButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Pagination } from '@/components/ui/pagination';

// Importar tipos da comunidade
import type { CommunityPost, Comment, RankingUser, DesignerPopular, CommunityUser } from '@/types/community';
import type { User, UserRole } from '@/types';

// Interface para o usuário autenticado na comunidade
interface CommunityAuthUser extends User {
  nivelacesso: UserRole;
  isFollowing?: boolean;
}

// Componente de Card do Post
interface CommentItemProps {
  comment: {
    comment: Comment;
    user: CommunityUser;
    isLikedByUser?: boolean;
    likesCount?: number;
  };
  refetchComments?: () => void;
}

// Função para formatar tempo relativo de comentários
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const minutesDiff = differenceInMinutes(now, date);
  if (minutesDiff < 60) {
    return minutesDiff <= 1 ? 'agora mesmo' : `${minutesDiff} min`;
  }
  
  const hoursDiff = differenceInHours(now, date);
  if (hoursDiff < 24) {
    return `${hoursDiff}h`;
  }
  
  const daysDiff = differenceInDays(now, date);
  if (daysDiff < 30) {
    return `${daysDiff}d`;
  }
  
  const monthsDiff = differenceInMonths(now, date);
  return `${monthsDiff}m`;
};

// Componente para exibir comentário individual
const CommentItem: React.FC<CommentItemProps> = ({ comment, refetchComments }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Verificar se o usuário atual pode excluir o comentário
  const canDelete = user && (
    user.id === comment.comment.userId || 
    user.nivelacesso === 'admin' || 
    user.nivelacesso === 'administrador' || 
    user.nivelacesso === 'designer_adm'
  );
  
  // Função para curtir/descurtir comentário
  const handleLikeComment = async () => {
    if (!user) {
      toast({
        title: "Ação não permitida",
        description: "Você precisa estar logado para curtir comentários.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLiking(true);
    try {
      const response = await apiRequest('POST', `/api/community/comments/${comment.comment.id}/like`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status} ao curtir comentário`);
      }
      
      const data = await response.json();
      
      // Atualizar estado local
      setIsLiked(data.liked);
      setLikeCount(data.likesCount);
      
      // Mostrar feedback
      if (data.liked) {
        toast({
          title: "Comentário curtido",
          description: "Você curtiu este comentário."
        });
      } else {
        toast({
          title: "Curtida removida",
          description: "Você removeu sua curtida deste comentário."
        });
      }
    } catch (error) {
      console.error("Erro ao curtir comentário:", error);
      toast({
        title: "Erro ao curtir comentário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao curtir este comentário.",
        variant: "destructive"
      });
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleDeleteComment = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await apiRequest('DELETE', `/api/community/comments/${comment.comment.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status} ao excluir comentário`);
      }
      
      toast({
        title: "Comentário excluído",
        description: "Seu comentário foi excluído com sucesso."
      });
      
      // Atualizar a lista de comentários
      if (refetchComments) {
        refetchComments();
      }
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
      toast({
        title: "Erro ao excluir comentário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir este comentário.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="flex gap-2 mb-2">
      <UserAvatar user={comment.user} size="xs" linkToProfile={true} />
      <div className="flex-1">
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 relative group">
          <div className="flex justify-between items-start">
            <span className="font-medium text-xs">
              {comment.user.name || comment.user.username}
            </span>
            
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleDeleteComment}
                    disabled={isDeleting}
                    className="text-red-500 dark:text-red-400"
                  >
                    {isDeleting ? 
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : 
                      <Trash2 className="h-3 w-3 mr-2" />
                    }
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <p className="text-xs mt-0.5">{comment.comment.content}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`p-0 h-auto text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary flex items-center gap-1 ${isLiked ? 'text-blue-500 dark:text-blue-400 font-medium' : ''}`}
            onClick={handleLikeComment}
            disabled={isLiking}
          >
            {isLiking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ThumbsUp className={`h-3 w-3 ${isLiked ? 'fill-blue-500 dark:fill-blue-400 text-blue-500 dark:text-blue-400' : ''}`} />
            )}
            {likeCount > 0 && <span>{likeCount}</span>}
          </Button>
          
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {formatRelativeTime(comment.comment.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Função para formatar o conteúdo do post
const formatPostContent = (content: string, showFull: boolean = false) => {
  if (!content) return '';
  if (showFull) return content;
  
  const maxLength = 280; // Limite de caracteres para exibição
  if (content.length <= maxLength) return content;
  
  return content.slice(0, maxLength) + '...';
};

// Atualizar a interface do PostCard
interface PostCardProps {
  post: CommunityPost;
  refetch?: () => void;
  refetchPopularPosts?: () => void;
  user?: CommunityAuthUser | null;
  setSelectedPostId?: (id: number | null) => void;
  setIsPostViewOpen?: (open: boolean) => void;
  id?: string;
  className?: string;
  showFullContent?: boolean;
  onShare?: (post: CommunityPost) => void;
  onDelete?: (post: CommunityPost) => void;
  onPin?: (post: CommunityPost) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  refetch, 
  refetchPopularPosts, 
  user: propUser, 
  setSelectedPostId, 
  setIsPostViewOpen, 
  id,
  className,
  showFullContent = false,
  onShare,
  onDelete,
  onPin
}) => {
  const { user: authUser } = useAuth() as { user: CommunityAuthUser | null };
  const user = propUser || authUser;
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<{
    comment: Comment;
    user: CommunityUser;
    isLikedByUser?: boolean;
    likesCount?: number;
  }[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [allCommentsData, setAllCommentsData] = useState<{
    comment: Comment;
    user: CommunityUser;
    isLikedByUser?: boolean;
    likesCount?: number;
  }[]>([]);
  const [isPinning, setIsPinning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Buscar comentários quando mostrar a área de comentários
  useEffect(() => {
    if (showCommentInput && comments.length === 0) {
      fetchComments();
    }
  }, [showCommentInput]);
  
  // Função para buscar comentários do post
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setAllCommentsData(data); // Armazenar todos os comentários
        setComments(data.slice(0, 3)); // Mostrar apenas os 3 comentários mais recentes inicialmente
      }
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  // Função para mostrar todos os comentários
  const handleShowAllComments = () => {
    setShowAllComments(true);
    setComments(allCommentsData); // Mostrar todos os comentários
  };

  // Função para curtir ou descurtir um post
  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para curtir posts",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        // Remover curtida
        const response = await apiRequest("DELETE", `/api/community/posts/${post.id}/like`);
        
        if (response.ok) {
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
          toast({
            title: "Curtida removida",
            description: "Você removeu sua curtida deste post",
          });
        } else {
          throw new Error("Não foi possível remover sua curtida");
        }
      } else {
        // Adicionar curtida
        const response = await apiRequest("POST", `/api/community/posts/${post.id}/like`);
        
        if (response.ok) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          toast({
            title: "Post curtido",
            description: "Você curtiu este post",
          });
        } else {
          throw new Error("Não foi possível curtir o post");
        }
      }

      // Atualizar lista de posts e posts populares se necessário
      if (refetch) {
        refetch();
      }
      
      // Atualizar posts populares após curtir/descurtir
      if (refetchPopularPosts) {
        refetchPopularPosts();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua ação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para adicionar um comentário
  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para comentar",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Por favor, digite um comentário",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await apiRequest("POST", `/api/community/posts/${post.id}/comments`, {
        content: commentText.trim()
      });
      
      if (response.ok) {
        toast({
          title: "Comentário adicionado",
          description: "Seu comentário foi publicado com sucesso",
        });
        
        // Atualizar a lista de comentários localmente
        const commentData = await response.json();
        if (commentData) {
          // Atualizar tanto os dados completos quanto os visíveis
          setAllCommentsData(prev => [commentData, ...prev]);
          
          if (showAllComments) {
            // Se todos os comentários estão sendo mostrados, adicionar o novo no topo
            setComments(prev => [commentData, ...prev]);
          } else {
            // Caso contrário, manter apenas os 3 mais recentes
            setComments(prev => [commentData, ...prev].slice(0, 3));
          }
        }
        
        setCommentText('');
        
        // Atualizar a lista de posts se necessário
        if (refetch) {
          refetch();
        }
      } else {
        throw new Error("Erro ao adicionar comentário");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao adicionar seu comentário",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Função para fixar ou desafixar um post
  const handlePinPost = async () => {
    if (isPinning) return;
    
    if (!user || user.nivelacesso !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem fixar posts",
        variant: "destructive",
      });
      return;
    }
    
    setIsPinning(true);
    try {
      if (onPin) {
        await onPin(post);
      } else {
        const isPinned = post.isPinned || false;
        const action = isPinned ? 'unpin' : 'pin';
        
        const response = await apiRequest('PUT', `/api/community/posts/${post.id}/${action}`);
        
        if (!response.ok) {
          throw new Error(`Não foi possível ${isPinned ? 'desafixar' : 'fixar'} o post`);
        }
        
        // Atualizar a lista de posts
        if (refetch) {
          refetch();
        }
        
        // Atualizar posts populares se necessário
        if (refetchPopularPosts) {
          refetchPopularPosts();
        }
      }
      
      toast({
        title: post.isPinned ? "Post desafixado" : "Post fixado",
        description: post.isPinned 
          ? "O post não será mais exibido no topo da comunidade" 
          : "O post será exibido no topo da comunidade",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua ação",
        variant: "destructive",
      });
    } finally {
      setIsPinning(false);
    }
  };
  
  // Função para excluir um post
  const handleDeletePost = async () => {
    if (isDeleting) return;
    
    if (!user || user.nivelacesso !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem excluir posts na comunidade",
        variant: "destructive",
      });
      return;
    }
    
    // Confirmação para exclusão
    if (!window.confirm("Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(post);
      } else {
        const response = await apiRequest('DELETE', `/api/community/posts/${post.id}`);
        
        if (!response.ok) {
          throw new Error("Não foi possível excluir o post");
        }
        
        // Atualizar a lista de posts
        if (refetch) {
          refetch();
        }
        
        // Atualizar posts populares se necessário
        if (refetchPopularPosts) {
          refetchPopularPosts();
        }
      }
      
      toast({
        title: "Post excluído",
        description: "O post foi excluído com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função melhorada para compartilhar um post
  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      if (onShare) {
        await onShare(post);
      } else {
        if (!navigator.share) {
          // Fallback para dispositivos que não suportam Web Share API
          const shareUrl = `${window.location.origin}/comunidade/post/${post.id}`;
          await navigator.clipboard.writeText(shareUrl);
          
          toast({
            title: "Link copiado",
            description: "Link copiado para a área de transferência!",
          });
        } else {
          // Web Share API
          await navigator.share({
            title: post.title,
            text: post.content || "Confira este post na comunidade DesignAuto!",
            url: `${window.location.origin}/comunidade/post/${post.id}`,
          });
          
          toast({
            title: "Post compartilhado",
            description: "Obrigado por compartilhar!",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o post",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Logging reduzido para depuração
  if (post.isPinned) {
    console.log(`Post ${post.id} está fixado: isPinned=${post.isPinned} (tipo: ${typeof post.isPinned})`);
  }

  // Aplica um estilo mais visível para posts fixados com verificação rigorosa
  // Essa conversão garante que null, undefined ou qualquer outro valor não booleano seja tratado como false
  const isPinned = post.isPinned === true; // Força conversão booleana

  return (
    <Card 
      id={id}
      className={cn(
        "mb-5 overflow-hidden",
        post.isPinned === true
          ? 'border-2 border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-amber-900/10 shadow-lg' 
          : 'border-0 border-b border-b-zinc-100 dark:border-b-zinc-800 sm:border-b-0 sm:border sm:border-zinc-100 sm:dark:border-zinc-800',
        "shadow-none sm:shadow-md hover:shadow-lg transition-all duration-300 ease-in-out w-full sm:max-w-[470px] md:max-w-full mx-0 sm:mx-auto relative",
        className
      )}
    >
      {/* Removido ícone de estrela sobreposto para evitar problemas de layout */}
      
      {/* Cabeçalho do post - estilo exato do Instagram */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserAvatar user={post.user} size="sm" linkToProfile={true} />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{post.user.name || post.user.username}</span>
              {post.user.nivelacesso === 'admin' && (
                <span className="text-blue-500">
                  <CheckCircle2 className="h-3.5 w-3.5 fill-blue-500 text-white" />
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{post.formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user && user.id !== post.user.id && (
            <FollowButton 
              userId={post.user.id} 
              isFollowing={post.user?.isFollowing || false} 
              size="sm"
              variant="outline" 
              className="text-xs px-2 h-8"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Opções do Post</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {user?.nivelacesso === 'admin' && (
                <>
                  <DropdownMenuItem 
                    onClick={handlePinPost}
                    disabled={isPinning}
                    className="cursor-pointer"
                  >
                    {isPinning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>{post.isPinned ? "Desafixando..." : "Fixando..."}</span>
                      </>
                    ) : (
                      <>
                        <Pin className="mr-2 h-4 w-4" />
                        <span>{post.isPinned ? "Desafixar post" : "Fixar post no topo"}</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {post.editLink && (
                <DropdownMenuItem 
                  onClick={() => window.open(post.editLink, '_blank')}
                  className="cursor-pointer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Abrir link externo</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem
                onClick={handleShare}
                disabled={isSharing}
                className="cursor-pointer"
              >
                <Share className="mr-2 h-4 w-4" />
                <span>{isSharing ? "Compartilhando..." : "Compartilhar"}</span>
              </DropdownMenuItem>
              
              {user && user.id !== post.user.id && (
                <DropdownMenuItem
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: "Faça login",
                        description: "Você precisa estar logado para reportar posts",
                        variant: "destructive"
                      });
                      return;
                    }

                    apiRequest('POST', `/api/community/posts/${post.id}/report`)
                      .then(response => {
                        if (!response.ok) throw new Error('Erro ao reportar post');
                        
                        toast({
                          title: "Post reportado",
                          description: "Obrigado por ajudar a manter a comunidade segura. Nossa equipe irá analisar o conteúdo.",
                        });
                      })
                      .catch(error => {
                        console.error('Erro ao reportar post:', error);
                        toast({
                          title: "Erro",
                          description: "Não foi possível reportar o post. Tente novamente mais tarde.",
                          variant: "destructive"
                        });
                      });
                  }}
                  className="cursor-pointer text-yellow-600 dark:text-yellow-500"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>Reportar post</span>
                </DropdownMenuItem>
              )}
              
              {user?.nivelacesso === 'admin' && (
                <DropdownMenuItem
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Excluir post</span>
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Imagem do post - estilo exato do Instagram */}
      <div 
        className="relative w-full overflow-hidden bg-black cursor-pointer"
        onClick={() => {
          if (setSelectedPostId && setIsPostViewOpen) {
            setSelectedPostId(post.id);
            setIsPostViewOpen(true);
          }
        }}
      >
        <div className="w-full max-h-[600px]">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="hover:scale-[1.02] transition-transform duration-500 cursor-pointer w-full h-full object-cover"
          />
        </div>
      </div>
      
      {/* Conteúdo do post */}
      <div className="px-3 pt-2 pb-1">
        {post.isPinned && (
          <div className="mb-1.5 flex items-center">
            <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white dark:from-yellow-600 dark:to-amber-600 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
              <Star className="h-3.5 w-3.5" fill="white" />
              <span className="font-bold">Post Fixado</span>
            </span>
          </div>
        )}
        
        <div className="flex gap-1">
          <h3 
            className="text-sm font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            onClick={() => {
              if (setSelectedPostId && setIsPostViewOpen) {
                setSelectedPostId(post.id);
                setIsPostViewOpen(true);
              }
            }}
          >
            {post.title}
          </h3>
        </div>
      </div>
      
      {/* Conteúdo/descrição do post */}
      {post.content && (
        <div className="px-3 pt-0 pb-2">
          <p className="text-sm text-zinc-800 dark:text-zinc-200">
            {post.content.length > 280 && !showFullContent
              ? post.content.slice(0, 280) + '...'
              : post.content}
            {post.content.length > 280 && !showFullContent && (
              <button 
                onClick={() => {
                  if (setSelectedPostId && setIsPostViewOpen) {
                    setSelectedPostId(post.id);
                    setIsPostViewOpen(true);
                  }
                }}
                className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver mais
              </button>
            )}
          </p>
        </div>
      )}
      
      {/* Estatísticas de interação - estilo exato do Facebook */}
      <div className="flex items-center gap-1 text-sm">
        <ThumbsUp className="h-4 w-4 text-blue-500" /> 
        <span className="font-medium">Curtida Recebida:</span> 
        <span className="text-zinc-500">1 ponto</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <Bookmark className="h-4 w-4 text-amber-500" /> 
        <span className="font-medium">Salvamento:</span> 
        <span className="text-zinc-500">2 pontos</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <Star className="h-4 w-4 text-yellow-500" /> 
        <span className="font-medium">Post em Destaque:</span> 
        <span className="text-zinc-500">5 pontos extras</span>
      </div>
    </div>
  </Card>
);

export default PostCard;