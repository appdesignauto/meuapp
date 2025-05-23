import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { 
  Settings, Plus, Filter, User, Trophy, Clock, Info, Award, Medal, 
  Sparkles, Users, ImageIcon, ExternalLink, FileEdit, RefreshCw, 
  Loader2, ZoomIn, X, MessageSquare, XCircle, FileQuestion, Globe, 
  Share, MoreHorizontal, Trash2, MessageCircle, Heart, ThumbsUp, Pin, Star,
  PlusCircle, Bookmark, Check, CheckCircle2, ThumbsUp as ThumbsUpIcon,
  AlertCircle, CheckCircle, Share2, Eye, FileText
} from 'lucide-react';
import { differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths } from 'date-fns';

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
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
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

// Interface para usuário
interface User {
  id: number;
  username: string;
  name: string | null;
  profileimageurl: string | null;
  nivelacesso: string;
  email?: string;
  role?: string;
  isFollowing?: boolean;
}

// Interface para post na comunidade
interface CommunityPost {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isApproved: boolean;
  userId: number;
  isLikedByUser?: boolean;
  isPinned?: boolean;
  editLink?: string;
  user: User;
  formattedDate?: string; // Campo para armazenar a data já formatada
}

// Interface para ranking na comunidade
interface RankingUser {
  id: number;
  username: string;
  name: string | null;
  profileimageurl: string | null;
  nivelacesso: string;
  points: number;
  rank: number;
}

// Componente de Card do Post
interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  postId: number;
  isHidden: boolean;
  user: {
    id: number;
    username: string;
    name: string | null;
    profileimageurl: string | null;
    nivelacesso: string;
  };
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
const CommentItem: React.FC<{ 
  comment: any;
  refetchComments?: () => void;
}> = ({ comment, refetchComments }) => {
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

const PostCard: React.FC<{ 
  post: CommunityPost; 
  refetch?: () => void;
  refetchPopularPosts?: () => void; // Adicionado para atualizar posts populares
  user?: User | null; // Permite passar usuário explicitamente 
  setSelectedPostId?: (id: number | null) => void;
  setIsPostViewOpen?: (open: boolean) => void;
  id?: string; // ID para o elemento DOM, usado para rolagem e destacamento
}> = ({ post, refetch, refetchPopularPosts, user: propUser, setSelectedPostId, setIsPostViewOpen, id }) => {
  const { user: authUser } = useAuth();
  // Usar o usuário passado via props ou o usuário da autenticação
  const user = propUser || authUser;
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [allCommentsData, setAllCommentsData] = useState<any[]>([]);
  const [isPinning, setIsPinning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
  const handlePinPost = async (postId: number) => {
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
      const isPinned = post.isPinned || false;
      const action = isPinned ? 'unpin' : 'pin';
      
      const response = await apiRequest('PUT', `/api/community/posts/${postId}/${action}`);
      
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
      
      toast({
        title: isPinned ? "Post desafixado" : "Post fixado",
        description: isPinned 
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
  const handleDeletePost = async (postId: number) => {
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
      const response = await apiRequest('DELETE', `/api/community/posts/${postId}`);
      
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
  
  // Função para compartilhar um post
  const handleShare = () => {
    if (!navigator.share) {
      // Fallback para dispositivos que não suportam Web Share API
      toast({
        title: "Compartilhar",
        description: "Copie o link e compartilhe: " + window.location.origin + `/comunidade/post/${post.id}`,
      });
      
      // Copiar para a área de transferência
      navigator.clipboard.writeText(window.location.origin + `/comunidade/post/${post.id}`)
        .then(() => {
          toast({
            title: "Link copiado",
            description: "Link copiado para a área de transferência!",
          });
        })
        .catch(() => {
          toast({
            title: "Erro",
            description: "Não foi possível copiar o link",
            variant: "destructive",
          });
        });
      return;
    }

    // Web Share API
    navigator.share({
      title: post.title,
      text: post.content || "Confira este post na comunidade DesignAuto!",
      url: window.location.origin + `/comunidade/post/${post.id}`,
    }).catch((error) => {
      console.error("Erro ao compartilhar:", error);
    });
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
      className={`mb-5 overflow-hidden ${isPinned 
        ? 'border-2 border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-amber-900/10 shadow-lg' 
        : 'border-0 border-b border-b-zinc-200 dark:border-b-zinc-800 sm:border-b-0 sm:border sm:border-zinc-100 sm:dark:border-zinc-800'
      } shadow-none sm:shadow-md hover:shadow-lg transition-all duration-300 ease-in-out w-full sm:max-w-[470px] md:max-w-full mx-0 sm:mx-auto relative`}>
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
            <div className="flex items-center gap-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{post.formattedDate}</p>
              {/* Badge de status - visível apenas na seção "Meus Posts" */}
              {user && user.id === post.user.id && (
                <>
                  {(() => {
                    // 🎯 DEBUG: Verificar dados completos do status do post
                    console.log(`🎯 [STATUS DEBUG] Post ID ${post.id} - "${post.title}":`, {
                      postCompleto: post,
                      isApproved: post.isApproved,
                      isApprovedType: typeof post.isApproved,
                      status: post.status,
                      statusType: typeof post.status,
                      resultadoFinal: post.isApproved ? 'APROVADO' : 'PENDENTE'
                    });
                    
                    return post.isApproved;
                  })() ? (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Aprovado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pendente
                    </span>
                  )}
                  {post.isPinned && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full flex items-center gap-1">
                      <Pin className="h-3 w-3" />
                      Fixado
                    </span>
                  )}
                </>
              )}
            </div>
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
              <button className="text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400 h-8 w-8 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Opções do Post</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.nivelacesso === 'admin' && (
                <>
                  <DropdownMenuItem 
                    onClick={() => handlePinPost(post.id)}
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
                className="cursor-pointer"
              >
                <Share className="mr-2 h-4 w-4" />
                <span>Compartilhar</span>
              </DropdownMenuItem>
              {user?.nivelacesso === 'admin' && (
                <DropdownMenuItem
                  onClick={() => handleDeletePost(post.id)}
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
      
      {/* Título e conteúdo abaixo da imagem (estilo Instagram) */}
      <div className="px-3 pt-2 pb-1">
        {isPinned && (
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
      
      {/* Conteúdo/descrição abaixo do título (estilo Instagram) */}
      {post.content && (
        <div className="px-3 pt-0 pb-2">
          <p className="text-sm text-zinc-800 dark:text-zinc-200">
            {post.content}
          </p>
        </div>
      )}
      
      {/* Estatísticas de interação - estilo exato do Facebook */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </div>
          </div>
          <span className="truncate">{likesCount === 1 ? '1 curtida' : `${likesCount} curtidas`}</span>
        </div>
        
        <div className="flex">
          {post.commentsCount > 0 && (
            <span className="truncate">
              {post.commentsCount === 1 ? '1 comentário' : `${post.commentsCount} comentários`}
            </span>
          )}
          {post.sharesCount > 0 && (
            <span className="ml-3 truncate">
              {post.sharesCount === 1 ? '1 compartilhamento' : `${post.sharesCount} compartilhamentos`}
            </span>
          )}
        </div>
      </div>
      
      {/* Botões de ação - estilo Facebook */}
      <div className="px-2 py-1 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
        <button 
          className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors ${
            isLiked 
              ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
              : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          onClick={handleLike}
          disabled={isLoading}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ${isLoading ? "animate-pulse" : ""}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <span className="text-sm font-medium">
            {isLiked ? "Curtido" : "Curtir"}
          </span>
        </button>
        
        <button 
          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          onClick={() => setShowCommentInput(!showCommentInput)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">
            Comentar
          </span>
        </button>
        
        <button 
          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          onClick={handleShare}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span className="text-sm font-medium">Compartilhar</span>
        </button>
      </div>
      
      {/* Seção de comentários abaixo dos botões (estilo Instagram) */}
      {showCommentInput && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
          {/* Lista de comentários recentes */}
          {comments.length > 0 && (
            <div className="mb-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              ) : (
                <>
                  {comments.map((comment, index) => (
                    <CommentItem 
                      key={comment.comment.id + "-" + index} 
                      comment={comment} 
                      refetchComments={fetchComments} 
                    />
                  ))}
                  
                  {post.commentsCount > comments.length && !showAllComments && (
                    <button 
                      onClick={handleShowAllComments}
                      className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 hover:underline cursor-pointer"
                    >
                      Ver {post.commentsCount === 1 
                        ? 'o comentário' 
                        : `todos os ${post.commentsCount} comentários`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Formulário para adicionar comentário */}
          {user ? (
            <div className="flex gap-2 items-start">
              <UserAvatar user={user} size="sm" />
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Adicione um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-zinc-500">Mantenha o respeito na comunidade.</p>
                  <Button 
                    size="sm" 
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !commentText.trim()}
                  >
                    {isSubmittingComment ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <span>Comentar</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 space-y-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Faça login para comentar.</p>
              <Link href="/login">
                <Button size="sm" variant="outline">Fazer Login</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// Interface para usuário no ranking
interface RankingUser {
  id: number;
  userId: number;
  totalPoints: number;
  rank: number;
  level: string;
  postCount: number;
  likesReceived: number;
  savesReceived: number;
  featuredCount: number;
  user: {
    id: number;
    username: string;
    name: string | null;
    profileimageurl: string | null;
    nivelacesso: string;
  };
}

// Componente de Card do Usuário no Ranking
const RankingUserCard: React.FC<{ user: RankingUser }> = ({ user }) => {

  return (
    <div className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className={cn(
        "flex items-center justify-center text-lg font-bold w-7 h-7 rounded-full shrink-0",
        user.rank <= 3 
          ? user.rank === 1 
            ? "bg-amber-100 text-amber-800 border-amber-300" 
            : user.rank === 2
              ? "bg-gray-100 text-gray-800 border-gray-300"
              : "bg-orange-100 text-orange-800 border-orange-300"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      )}>
        {user.rank}
      </div>
      <UserAvatar user={user.user} size="sm" linkToProfile={true} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
          <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">{user.user.name || user.user.username}</p>
          <Badge variant="outline" className={`text-xs py-0 h-5 gap-1 shrink-0 ${
            user.level.includes('Pro') ? 'border-red-200 text-red-600 dark:border-red-800/50' :
            user.level.includes('Referência') ? 'border-orange-200 text-orange-500 dark:border-orange-800/50' :
            user.level.includes('Destaque') ? 'border-purple-200 text-purple-600 dark:border-purple-800/50' :
            user.level.includes('Cooperador') ? 'border-blue-200 text-blue-500 dark:border-blue-800/50' :
            user.level.includes('Voluntário') ? 'border-green-200 text-green-500 dark:border-green-800/50' :
            'border-amber-200 text-amber-800 dark:border-amber-800/50'
          }`}>
            {getLevelIcon(user.level)}
            <span className="truncate">{user.level.replace(' D.Auto', '')}</span>
          </Badge>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {user.totalPoints} pts • {user.postCount} posts • {user.likesReceived} ❤️
        </p>
      </div>
    </div>
  );
};

// Componente para post em loading
const PostCardSkeleton: React.FC = () => {
  return (
    <Card className="mb-4 overflow-hidden">
      <Skeleton className="w-full h-56 sm:h-64" />
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Skeleton className="h-8 w-8 rounded-full mr-2" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </CardFooter>
    </Card>
  );
};

// Função global para obter o ícone baseado no nível
const getLevelIcon = (level: string): React.ReactNode => {
  if (level.includes('Pro')) return <Sparkles className="h-3 w-3 text-red-600" />;
  if (level.includes('Referência')) return <Trophy className="h-3 w-3 text-orange-500" />;
  if (level.includes('Destaque')) return <Medal className="h-3 w-3 text-purple-600" />;
  if (level.includes('Cooperador')) return <Award className="h-3 w-3 text-blue-500" />;
  if (level.includes('Voluntário')) return <User className="h-3 w-3 text-green-500" />;
  return <User className="h-3 w-3 text-amber-800" />; // Membro (padrão)
};

// Página principal da comunidade
const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('posts');
  const [rankingPeriod, setRankingPeriod] = useState('month');
  const [monthSelector, setMonthSelector] = useState(() => {
    // Pegar o mês e ano atuais para o seletor padrão
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [showDAutoInfo, setShowDAutoInfo] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isPostViewOpen, setIsPostViewOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Verificar se usuário é administrador
  const isAdmin = user && (user.nivelacesso === 'admin' || user.nivelacesso === 'designer_adm');
  
  // Função para recalcular o ranking D.Auto
  const [isRecalculatingRanking, setIsRecalculatingRanking] = useState(false);
  
  const handleRecalculateRanking = async () => {
    if (!isAdmin) return;
    
    setIsRecalculatingRanking(true);
    try {
      const response = await apiRequest('POST', '/api/community/recalcular-ranking');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status} ao recalcular ranking`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Ranking recalculado",
        description: data.message || "Ranking D.Auto recalculado com sucesso!",
      });
      
      // Recarregar os dados do ranking
      refetchRanking();
    } catch (error) {
      console.error("Erro ao recalcular ranking:", error);
      toast({
        title: "Erro ao recalcular ranking",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao recalcular o ranking D.Auto.",
        variant: "destructive"
      });
    } finally {
      setIsRecalculatingRanking(false);
    }
  };
  
  // Tamanho da página para paginação
  const pageSize = 10;
  
  // Buscar posts da comunidade com paginação
  const { 
    data: posts, 
    isLoading: postsLoading, 
    error: postsError, 
    refetch: refetchPosts,
    isFetching
  } = useQuery({
    queryKey: ['/api/community/posts', { page, limit: pageSize }],
    refetchOnWindowFocus: false,
    refetchInterval: 0, // Desativamos o recarregamento automático para controlar manualmente
  });

  // Query NOVA e FUNCIONAL para buscar os posts do usuário logado
  const {
    data: userPosts,
    isLoading: userPostsLoading,
    error: userPostsError,
    refetch: refetchUserPosts
  } = useQuery({
    queryKey: ['/api/community/my-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log(`[FRONTEND] Buscando posts para usuário ${user.id}`);
      
      try {
        const response = await fetch(`/api/community/my-posts/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[FRONTEND] Resposta do servidor: ${response.status}`);
        
        if (!response.ok) {
          console.error(`[FRONTEND] Erro na resposta: ${response.status} ${response.statusText}`);
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[FRONTEND] Dados recebidos:`, data);
        
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('[FRONTEND] Erro ao buscar posts do usuário:', error);
        throw error;
      }
    },
    enabled: !!user && activeTab === 'meus-posts',
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  });
  
  // Efeito para adicionar novos posts ao array de posts existentes
  useEffect(() => {
    if (posts && Array.isArray(posts)) {
      if (page === 1) {
        setAllPosts(posts);
      } else if (posts.length > 0) {
        // Verificar se já temos algum dos posts novos (para evitar duplicatas)
        const newPosts = posts.filter(
          newPost => !allPosts.some(existingPost => existingPost.post.id === newPost.post.id)
        );
        setAllPosts(prev => [...prev, ...newPosts]);
      }
      
      // Verificar se existem mais posts para carregar
      setHasMorePosts(posts.length === 10);
      setIsLoadingMore(false);
    }
  }, [posts, page]);
  
  // Configurar o observador da interseção para detectar quando o usuário atinge o final da lista
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMorePosts && !isFetching && !isLoadingMore) {
          setIsLoadingMore(true);
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );
    
    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }
    
    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [hasMorePosts, isFetching, isLoadingMore]);
  
  // Função para encontrar o elemento de post com ID específico e rolar até ele
  const scrollToPost = (postId: number) => {
    // Certificar-se de que a aba de "Posts" esteja selecionada
    setActiveTab("posts");
    
    // Tentar encontrar o post no feed principal
    setTimeout(() => {
      const postElement = document.getElementById(`post-item-${postId}`);
      
      if (postElement) {
        // Adicionar classe de destaque para evidenciar o post
        postElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-70', 'ring-offset-4', 'dark:ring-offset-zinc-900', 'z-10', 'relative');
        
        // Animação de pulsação suave para destacar ainda mais o post
        postElement.classList.add('animate-pulse-subtle');
        
        // Rolar suavemente até o post
        postElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        
        // Remover animação de pulsação primeiro, para fazer uma transição suave
        setTimeout(() => {
          postElement.classList.remove('animate-pulse-subtle');
        }, 3000);
        
        // Remover destaque após alguns segundos
        setTimeout(() => {
          postElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-70', 'ring-offset-4', 'dark:ring-offset-zinc-900', 'z-10', 'relative');
        }, 5000);
        
        console.log('Post encontrado e rolagem realizada para:', postId);
      } else {
        // Se não encontrar o post no feed atual, primeiro tentar carregar mais posts
        if (hasMorePosts && !isFetching && !isLoadingMore) {
          console.log('Post não encontrado, carregando mais posts...');
          // Tenta carregar mais posts incrementando a página
          setIsLoadingMore(true);
          setPage(prev => prev + 1);
          
          // Esperar o efeito ser acionado e os novos posts carregados
          setTimeout(() => {
            // Tentar novamente após carregar mais posts
            scrollToPost(postId);
          }, 1500);
        } else {
          // Se não puder carregar mais posts, abrir em modal
          console.log('Post não encontrado no feed, abrindo modal para:', postId);
          setSelectedPostId(postId);
          setIsPostViewOpen(true);
        }
      }
    }, 500); // Pequeno atraso para garantir que o conteúdo já foi renderizado
  };

  // Verificar se há um parâmetro postId na URL e processar adequadamente
  useEffect(() => {
    try {
      // Obter a string de consulta da URL atual
      const currentUrl = window.location.href;
      console.log('URL completa:', currentUrl);
      
      // Verificar se há um parâmetro postId na URL
      if (currentUrl.includes('postId=')) {
        // Extrair o valor do parâmetro postId
        const postIdMatch = currentUrl.match(/postId=(\d+)/);
        console.log('Match de postId:', postIdMatch);
        
        if (postIdMatch && postIdMatch[1]) {
          const postId = parseInt(postIdMatch[1], 10);
          console.log('postId extraído:', postId);
          
          // Limpar o parâmetro da URL para evitar loops contínuos
          window.history.replaceState({}, document.title, window.location.pathname);
          
          if (!isNaN(postId)) {
            // Buscar apenas o post específico diretamente pela API
            fetch(`/api/community/posts/${postId}`)
              .then(res => {
                if (res.ok) {
                  return res.json();
                }
                throw new Error('Post não encontrado');
              })
              .then(data => {
                if (data && data.post) {
                  console.log('Post encontrado via API:', data.post);
                  
                  // Verificar se o post já está carregado na lista atual
                  const postExists = allPosts.some(item => item.post.id === postId);
                  
                  if (postExists) {
                    // Se o post estiver no feed atual, rolar até ele
                    scrollToPost(postId);
                  } else {
                    // Abordagem mais eficiente: Carregar a página que contém o post
                    // Para isso, vamos calcular em qual página o post deve estar
                    // Consulta para saber quantos posts existem antes deste post
                    fetch(`/api/community/posts/position/${postId}`)
                      .then(res => res.json())
                      .then(positionData => {
                        if (positionData && positionData.position) {
                          // Calcular a página baseado na posição do post
                          const targetPage = Math.floor(positionData.position / pageSize) + 1;
                          console.log(`Post encontrado na posição ${positionData.position}, página ${targetPage}`);
                          
                          if (targetPage !== page) {
                            // Resetar os posts atuais
                            setAllPosts([]);
                            // Definir a nova página
                            setPage(targetPage);
                            
                            // Exibir informações ao usuário
                            toast({
                              title: "Carregando post...",
                              description: `Buscando a página ${targetPage} que contém a publicação`,
                              variant: "default"
                            });
                            
                            // Destacar o post quando estiver disponível
                            // Usamos um timeout maior para garantir que a página seja carregada
                            setTimeout(() => scrollToPost(postId), 2000);
                          } else {
                            // Se estiver na mesma página, apenas rolar para o post
                            scrollToPost(postId);
                          }
                        } else {
                          // Fallback para o método antigo se não conseguir determinar a posição
                          fallbackMethodForFindingPost(postId);
                        }
                      })
                      .catch(error => {
                        console.error("Erro ao buscar posição do post:", error);
                        // Fallback para o método antigo
                        fallbackMethodForFindingPost(postId);
                      });
                  }
                }
              })
              .catch(error => {
                console.error('Erro ao buscar post específico:', error);
                toast({
                  title: "Post não encontrado",
                  description: "Não foi possível encontrar a publicação solicitada",
                  variant: "destructive"
                });
              });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar parâmetros da URL:', error);
    }
  }, []);
  
  // Método alternativo caso o método primário falhe
  const fallbackMethodForFindingPost = (postId: number) => {
    // Verificar se o post já existe na lista atual
    const postExists = allPosts.some(item => item.post.id === postId);
    
    if (postExists) {
      // Se já existir, apenas rolar para ele
      scrollToPost(postId);
    } else {
      toast({
        title: "Buscando post...",
        description: "Carregando mais posts para encontrar a publicação",
        variant: "default"
      });
      
      // Tentar carregar mais posts (abordagem incremental)
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
      
      // Adicionar o ID do post para que seja destacado quando carregar
      setTimeout(() => {
        // Verificar novamente após o carregamento
        const postFound = allPosts.some(item => item.post.id === postId);
        if (postFound) {
          scrollToPost(postId);
        } else {
          // Se ainda não encontrou, tentar mais uma vez
          setIsLoadingMore(true);
          setPage(prev => prev + 1);
          setTimeout(() => scrollToPost(postId), 1500);
        }
      }, 1500);
    }
  };
  
  // Função para recarregar todos os posts (reset)
  const handleRefreshPosts = async () => {
    setPage(1);
    
    // Adiciona classe de animação ao ícone e efeito de pulsação no botão
    const refreshIcon = document.getElementById('refresh-posts-icon');
    const refreshButton = refreshIcon?.closest('button');
    
    if (refreshIcon) {
      refreshIcon.classList.add('animate-spin');
      
      if (refreshButton) {
        refreshButton.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-600', 'dark:text-blue-400', 'border-blue-200', 'dark:border-blue-800');
      }
      
      // Mostrar toast de "atualizando"
      toast({
        title: "Atualizando posts...",
        description: "Buscando as postagens mais recentes",
        variant: "default",
      });
    }
    
    try {
      // Aguardar a conclusão da refetch antes de continuar
      const result = await refetchPosts();
      
      // Também atualizar posts populares
      refetchPopularPosts();
      
      if (result.data && Array.isArray(result.data)) {
        // Atualizar os posts diretamente para evitar estado vazio temporário
        setAllPosts(result.data);
        
        // Mostrar toast de sucesso
        toast({
          title: "Posts atualizados!",
          description: "Feed atualizado com sucesso",
          variant: "success",
        });
      } else {
        // Se result.data não existir ou não for um array, mantenha os posts existentes
        const postsData = await fetch('/api/community/posts?page=1&limit=10');
        if (postsData.ok) {
          const freshPosts = await postsData.json();
          if (freshPosts && Array.isArray(freshPosts)) {
            setAllPosts(freshPosts);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao recarregar posts:", error);
      toast({
        title: "Erro ao recarregar posts",
        description: "Não foi possível atualizar os posts. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      // Remover animação e estilos após conclusão (sucesso ou erro)
      setTimeout(() => {
        if (refreshIcon) {
          refreshIcon.classList.remove('animate-spin');
        }
        
        if (refreshButton) {
          refreshButton.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-600', 
            'dark:text-blue-400', 'border-blue-200', 'dark:border-blue-800');
          
          // Adicionar e remover classe de pulsar rapidamente para dar feedback visual
          refreshButton.classList.add('scale-105');
          setTimeout(() => {
            refreshButton?.classList.remove('scale-105');
          }, 200);
        }
      }, 1000);
    }
  };
  
  // Buscar posts populares
  const { 
    data: popularPosts, 
    isLoading: popularPostsLoading, 
    error: popularPostsError,
    refetch: refetchPopularPosts
  } = useQuery<any[]>({
    queryKey: ['/api/community/populares'], // NOVA ROTA COM NOME DIFERENTE
    refetchOnWindowFocus: true, // Recarregar ao focar na janela
    refetchInterval: 60000, // Recarrega a cada 1 minuto para manter mais atualizado
    retry: 3, // Tenta até 3 vezes em caso de falha
    retryDelay: 3000, // Espera 3 segundos entre as tentativas
  });
  
  // Buscar ranking dos usuários
  const { data: rankingData, isLoading: rankingLoading, error: rankingError, refetch: refetchRanking } = useQuery({
    queryKey: ['/api/community/ranking'],
    queryFn: async () => {
      console.log(`Buscando ranking para período: ${rankingPeriod}`);
      const response = await fetch(`/api/community/ranking?period=${rankingPeriod}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar o ranking');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });
  
  // Extrair os dados do ranking formatados
  const ranking = rankingData?.users || [];
  
  // Interface para estatísticas da comunidade
  interface CommunityStats {
    totalPosts: number;
    totalCreators: number;
  }
  
  // Buscar estatísticas da comunidade
  const { 
    data: communityStats, 
    isLoading: communityStatsLoading,
    refetch: refetchCommunityStats 
  } = useQuery<CommunityStats>({
    queryKey: ['/api/community/stats'],
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  // Buscar designers populares
  interface DesignerPopular {
    id: number;
    username: string;
    name: string | null;
    profileimageurl: string | null;
    bio: string | null;
    nivelacesso: string;
    role: string | null;
    artsCount: number;
    followersCount: number;
    isFollowing: boolean;
    postsCount?: number; // Adicionado para compatibilidade com o componente
  }
  
  interface DesignersPopularesResponse {
    designers: DesignerPopular[];
  }
  
  const { 
    data: popularDesignersData, 
    isLoading: popularDesignersLoading, 
    error: popularDesignersError,
    refetch: refetchPopularDesigners
  } = useQuery<DesignersPopularesResponse>({
    queryKey: ['/api/designers/popular'],
    refetchOnWindowFocus: false,
    refetchInterval: 180000, // Recarrega a cada 3 minutos
    retry: 2
  });
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-16 md:pb-0">
      <TopBar title="Comunidade">
        {user && (
          <Link href="/painel/comunidade">
            <Button variant="ghost" size="icon" className="text-zinc-500">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </TopBar>
      
      <div className="container max-w-6xl px-0 md:px-4 py-4 md:py-6 mx-auto">
        <div className="md:hidden flex justify-between items-center mb-4 px-4">
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Comunidade</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
                  <Info className="h-4 w-4 text-blue-500" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">Sobre o Sistema D.Auto</DialogTitle>
                  <DialogDescription>
                    Sistema de pontuação e recompensas para designers ativos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    O sistema D.Auto premia os criadores mais ativos da comunidade com base em pontos ganhos por
                    contribuições, curtidas e destaques recebidos.
                  </p>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Como Ganhar Pontos:</h5>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-sm">
                        <PlusCircle className="h-4 w-4 text-green-500" /> 
                        <span className="font-medium">Arte Aprovada:</span> 
                        <span className="text-zinc-500">5 pontos</span>
                      </div>
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
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Níveis e Pontos:</h5>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-4 w-4 text-amber-800" /> 
                        <span className="font-medium">Membro D.Auto:</span> 
                        <span className="text-zinc-500">0-199 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-4 w-4 text-green-500" /> 
                        <span className="font-medium">Voluntário D.Auto:</span> 
                        <span className="text-zinc-500">200-699 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Award className="h-4 w-4 text-blue-500" /> 
                        <span className="font-medium">Cooperador D.Auto:</span> 
                        <span className="text-zinc-500">700-1.499 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Medal className="h-4 w-4 text-purple-600" /> 
                        <span className="font-medium">Destaque D.Auto:</span> 
                        <span className="text-zinc-500">1.500-2.999 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Trophy className="h-4 w-4 text-orange-500" /> 
                        <span className="font-medium">Referência D.Auto:</span> 
                        <span className="text-zinc-500">3.000-4.999 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Sparkles className="h-4 w-4 text-red-600" /> 
                        <span className="font-medium">Pro D.Auto:</span> 
                        <span className="text-zinc-500">5.000+ pontos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <h5 className="text-sm font-medium">Premiação Mensal:</h5>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Todo mês, os 3 primeiros colocados do ranking recebem prêmios em dinheiro:
                    </p>
                    <div className="flex items-start gap-4 mt-2">
                      <div className="text-center">
                        <div className="bg-amber-100 dark:bg-amber-900/30 w-14 h-14 mx-auto rounded-full flex items-center justify-center">
                          <Trophy className="h-7 w-7 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div className="mt-1">
                          <p className="font-semibold text-amber-600 dark:text-amber-500">1º Lugar</p>
                          <p className="text-sm">R$ 300,00</p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="bg-gray-100 dark:bg-gray-800 w-14 h-14 mx-auto rounded-full flex items-center justify-center">
                          <Trophy className="h-7 w-7 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="mt-1">
                          <p className="font-semibold text-gray-600 dark:text-gray-400">2º Lugar</p>
                          <p className="text-sm">R$ 200,00</p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="bg-amber-50 dark:bg-amber-900/20 w-14 h-14 mx-auto rounded-full flex items-center justify-center">
                          <Trophy className="h-7 w-7 text-amber-800 dark:text-amber-700" />
                        </div>
                        <div className="mt-1">
                          <p className="font-semibold text-amber-800 dark:text-amber-700">3º Lugar</p>
                          <p className="text-sm">R$ 100,00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {user && (
            <Button 
              size="sm" 
              className="gap-2"
              onClick={() => setIsCreatePostOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Criar Post
            </Button>
          )}
        </div>
        
        {/* Layout centralizado com colunas laterais */}
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* Sidebar esquerda - similar ao Facebook */}
          <div className="hidden md:block w-full md:w-72 lg:w-80 shrink-0">
            <div className="sticky top-20">
              <Card className="overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Comunidade DesignAuto</CardTitle>
                  <CardDescription>Compartilhe suas criações e inspirações</CardDescription>
                </CardHeader>
                
                <Separator className="mb-2" />
                
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-1">

                    <div 
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      onClick={() => {
                        setActiveTab('ranking');
                        // Role para a seção de ranking
                        setTimeout(() => {
                          const rankingSection = document.getElementById('ranking-completo');
                          if (rankingSection) {
                            rankingSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 100);
                      }}
                    >
                      <div className="bg-amber-100 dark:bg-amber-900 w-10 h-10 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-300">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Ranking D.Auto</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Criadores em destaque</p>
                      </div>
                    </div>
                    
                    <div 
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      onClick={() => {
                        // Se não estiver na aba de posts, mude para ela primeiro
                        if (activeTab !== 'posts') {
                          setActiveTab('posts');
                        }
                        // Role para a seção de posts populares
                        setTimeout(() => {
                          const popularPostsSection = document.getElementById('popular-posts-section');
                          if (popularPostsSection) {
                            popularPostsSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 100);
                      }}
                    >
                      <div className="bg-green-100 dark:bg-green-900 w-10 h-10 rounded-full flex items-center justify-center text-green-600 dark:text-green-300">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Destaques da Semana</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Posts mais populares</p>
                      </div>
                    </div>
                    
                    {/* Meus Posts - Nova seção */}
                    {user && (
                      <div 
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        onClick={() => {
                          setActiveTab('meus-posts');
                        }}
                      >
                        <div className="bg-blue-100 dark:bg-blue-900 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Meus Posts</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Minhas publicações</p>
                        </div>
                      </div>
                    )}

                    <a 
                      href="https://chat.whatsapp.com/GJoCJTnJNCBGQT3NvsmZ4R" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <div className="bg-emerald-100 dark:bg-emerald-900 w-10 h-10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Comunidade WhatsApp</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Participe do nosso grupo</p>
                      </div>
                    </a>
                  </div>
                  
                  {user && (
                    <Button 
                      className="w-full gap-2"
                      onClick={() => setIsCreatePostOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Criar Post
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              {/* Card de informações do sistema D.Auto */}
              <Card className="overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Sobre o Sistema D.Auto</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3 text-sm">
                  <p className="text-zinc-600 dark:text-zinc-300">
                    O sistema D.Auto premia os criadores mais ativos da comunidade com base em pontos ganhos por
                    contribuições, curtidas e destaques recebidos.
                  </p>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Como Ganhar Pontos:</h5>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-xs">
                        <PlusCircle className="h-3 w-3 text-green-500" /> <span className="font-medium">Arte Aprovada:</span> <span className="text-zinc-500">5 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <ThumbsUp className="h-3 w-3 text-blue-500" /> <span className="font-medium">Curtida Recebida:</span> <span className="text-zinc-500">1 ponto</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Bookmark className="h-3 w-3 text-amber-500" /> <span className="font-medium">Salvamento:</span> <span className="text-zinc-500">2 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-yellow-500" /> <span className="font-medium">Post em Destaque:</span> <span className="text-zinc-500">5 pontos extras</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Níveis e Pontos:</h5>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-xs">
                        <User className="h-3 w-3 text-amber-800" /> <span className="font-medium">Membro D.Auto:</span> <span className="text-zinc-500">0-199 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <User className="h-3 w-3 text-green-500" /> <span className="font-medium">Voluntário D.Auto:</span> <span className="text-zinc-500">200-699 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Award className="h-3 w-3 text-blue-500" /> <span className="font-medium">Cooperador D.Auto:</span> <span className="text-zinc-500">700-1.499 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Medal className="h-3 w-3 text-purple-600" /> <span className="font-medium">Destaque D.Auto:</span> <span className="text-zinc-500">1.500-2.999 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Trophy className="h-3 w-3 text-orange-500" /> <span className="font-medium">Referência D.Auto:</span> <span className="text-zinc-500">3.000-4.999 pontos</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Sparkles className="h-3 w-3 text-red-600" /> <span className="font-medium">Pro D.Auto:</span> <span className="text-zinc-500">5.000+ pontos</span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="mt-2 text-xs py-0 px-2 h-6 gap-1">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    Premiação mensal
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Área principal de conteúdo - feed central (estilo Instagram) */}
          <div className="w-full md:w-[470px] flex-shrink-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 px-4 md:px-0">
                <TabsTrigger value="posts">
                  <Filter className="h-4 w-4 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="ranking">
                  <Trophy className="h-4 w-4 mr-2" />
                  Ranking
                </TabsTrigger>
                {user && (
                  <TabsTrigger value="meus-posts">
                    <FileText className="h-4 w-4 mr-2" />
                    Meus Posts
                    {!userPostsLoading && userPosts && userPosts.length > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs py-0 px-1.5 h-4 rounded-full"
                      >
                        {userPosts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
              
              {/* Tab de Posts */}
              <TabsContent value="posts" className="space-y-0 px-4 md:px-0">
                {/* Botão de atualização para mostrar posts mais recentes */}
                <div className="mb-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-lg font-semibold">Posts Recentes</h2>
                    </div>
                    {!communityStatsLoading && communityStats && (
                      <Badge 
                        variant="outline" 
                        className="bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs py-0.5 h-5 px-2 flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3 w-3 text-zinc-400" />
                        <span>{communityStats.totalPosts} posts</span>
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshPosts}
                    className="gap-1"
                  >
                    <RefreshCw id="refresh-posts-icon" className="h-3.5 w-3.5" />
                    Atualizar
                  </Button>
                </div>
                
                {/* Caixa de criação de post - estilo Facebook (visível apenas em desktop) */}
                {user && (
                  <Card className="mb-6 overflow-hidden border border-zinc-100 dark:border-zinc-800 hidden md:block">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="sm" />
                        <button 
                          className="flex-1 text-left p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          onClick={() => setIsCreatePostOpen(true)}
                        >
                          Já compartilhou sua arte hoje?
                        </button>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-around">
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                          onClick={() => setIsCreatePostOpen(true)}
                        >
                          <ImageIcon className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium">Foto</span>
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                          onClick={() => setIsCreatePostOpen(true)}
                        >
                          <ExternalLink className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium">Link</span>
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center gap-2 p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                          onClick={() => setIsCreatePostOpen(true)}
                        >
                          <FileEdit className="h-5 w-5 text-purple-500" />
                          <span className="text-sm font-medium">Arte</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <PostCardSkeleton key={i} />
                    ))}
                  </div>
                ) : postsError ? (
                  <ErrorContainer 
                    title="Erro ao carregar posts" 
                    description="Não foi possível carregar os posts da comunidade."
                    onAction={() => refetchPosts()}
                  />
                ) : allPosts.length > 0 ? (
                  <div className="space-y-4 mx-[-16px] sm:mx-0">
                    {allPosts.map((item) => {
                      // Mapear a estrutura da API para o formato esperado pelo PostCard
                      // Calcular a data formatada aqui, apenas uma vez
                      // Usar a data pré-formatada se disponível, caso contrário, calcular
                      const formattedDate = item.post.formattedDate || `há ${formatRelativeTime(item.post.createdAt)}`;
                      
                      const formattedPost: CommunityPost = {
                        id: item.post.id,
                        title: item.post.title,
                        content: item.post.content,
                        imageUrl: item.post.imageUrl,
                        createdAt: item.post.createdAt,
                        likesCount: item.likesCount || 0,
                        commentsCount: item.commentsCount || 0,
                        sharesCount: 0,
                        isApproved: item.post.status === 'approved',
                        userId: item.post.userId,
                        isLikedByUser: item.isLikedByUser || item.userHasLiked || false,
                        isPinned: item.post.isPinned === true, // Forçar conversão para boolean
                        editLink: item.post.editLink || '',
                        user: item.user,
                        formattedDate: formattedDate // Armazenar a data já formatada
                      };
                      return <PostCard 
                        key={item.post.id}
                        id={`post-item-${item.post.id}`}
                        post={formattedPost} 
                        refetch={handleRefreshPosts} 
                        refetchPopularPosts={refetchPopularPosts}
                        setSelectedPostId={setSelectedPostId}
                        setIsPostViewOpen={setIsPostViewOpen}
                      />;
                    })}
                    
                    {/* Elemento observador para carregar mais quando o usuário rolar até aqui */}
                    {hasMorePosts && (
                      <div 
                        ref={loaderRef} 
                        className="py-4 flex justify-center"
                      >
                        {isLoadingMore && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                            <p className="text-sm text-zinc-500">Carregando mais posts...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <User className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                    <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nenhum post disponível
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">
                      Não há posts publicados na comunidade no momento. Seja o primeiro a compartilhar uma criação!
                    </p>
                    {user && (
                      <Button onClick={() => setIsCreatePostOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Post
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab de Ranking */}
              <TabsContent value="ranking" className="space-y-4 px-4 md:px-0">
                {/* Seção de Vencedores Mensais */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Premiação mensal D.Auto</h2>
                  <MonthlyWinners />
                </div>
                
                {/* Ranking completo */}
                <div id="ranking-completo" className="mt-8">
                  <h2 className="text-lg font-semibold mb-4">Ranking completo</h2>
                  <RankingList 
                    initialPeriod="month"
                    showPeriodSelector
                  />
                </div>
              </TabsContent>

              {/* Tab de Meus Posts */}
              {user && (
                <TabsContent value="meus-posts" className="space-y-4 px-4 md:px-0">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">Meus Posts</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Todos os seus posts publicados e pendentes de aprovação
                    </p>
                  </div>

                  {userPostsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="border border-zinc-100 dark:border-zinc-800">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-10 h-10 rounded-full" />
                              <div className="flex-1">
                                <Skeleton className="h-4 w-32 mb-1" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4 mb-4" />
                            <Skeleton className="h-32 w-full rounded-md" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : userPostsError ? (
                    <div className="text-center py-10">
                      <AlertCircle className="h-12 w-12 mx-auto text-red-300 mb-3" />
                      <h3 className="text-lg font-semibold text-red-600 mb-1">
                        Erro ao carregar posts
                      </h3>
                      <p className="text-red-500 mb-4">
                        {userPostsError.message || 'Ocorreu um erro ao carregar seus posts'}
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => refetchUserPosts()}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : userPosts && userPosts.length > 0 ? (
                    <div className="space-y-4 mx-[-16px] sm:mx-0">
                      {userPosts.map((postData: any) => {
                        const post = postData.post || postData;
                        
                        // Mapear a estrutura para o formato esperado pelo PostCard
                        const formattedDate = post.formattedDate || `há ${formatRelativeTime(post.createdAt)}`;
                        
                        // DEBUG: Verificar os dados recebidos do backend
                        console.log(`[MEUS POSTS DEBUG] Post ID ${post.id}:`, {
                          isApproved: post.isApproved,
                          status: post.status,
                          dadosCompletos: post
                        });
                        
                        const postCardData: CommunityPost = {
                          id: post.id,
                          title: post.title,
                          content: post.content,
                          imageUrl: post.imageUrl,
                          createdAt: post.createdAt,
                          likesCount: post.likesCount || 0,
                          commentsCount: post.commentsCount || 0,
                          sharesCount: post.sharesCount || 0,
                          isApproved: post.isApproved, // Agora deve estar correto do backend
                          userId: post.userId,
                          isLikedByUser: post.isLikedByUser,
                          isPinned: post.isPinned,
                          editLink: post.editLink,
                          user: {
                            id: post.user?.id || 0,
                            username: post.user?.username || '',
                            name: post.user?.name,
                            profileimageurl: post.user?.profileimageurl,
                            nivelacesso: post.user?.nivelacesso || 'free',
                            role: post.user?.role
                          },
                          formattedDate: formattedDate
                        };
                        
                        return (
                          <PostCard
                            key={post.id}
                            post={postCardData}
                            refetch={refetchUserPosts}
                            user={user}
                            setSelectedPostId={setSelectedPostId}
                            setIsPostViewOpen={setIsPostViewOpen}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                      <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Nenhum post criado
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">
                        Você ainda não criou nenhum post na comunidade. Compartilhe suas criações e ideias!
                      </p>
                      <Button 
                        onClick={() => setIsCreatePostOpen(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Criar Primeiro Post
                      </Button>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
          
          {/* Coluna Direita - Conteúdo adicional similar ao Facebook/Instagram */}
          <div className="hidden md:block w-full md:w-72 lg:w-80 shrink-0">
            <div className="sticky top-20">
              {/* Card de usuários populares */}
              <Card className="overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Membros em Destaque</CardTitle>
                  <CardDescription>Criadores populares para seguir</CardDescription>
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* Lista de designers populares */}
                  {popularDesignersLoading ? (
                    // Estado de loading
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </>
                  ) : popularDesignersError ? (
                    // Estado de erro
                    <div className="p-4 text-center">
                      <Info className="h-8 w-8 mx-auto text-red-500 mb-2" />
                      <p className="text-sm font-medium text-red-500">Erro ao carregar designers</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          refetchPopularDesigners();
                          // Adiciona classe de animação ao ícone
                          const refreshIcon = document.getElementById('refresh-designers-icon');
                          if (refreshIcon) {
                            refreshIcon.classList.add('animate-spin');
                            setTimeout(() => {
                              refreshIcon.classList.remove('animate-spin');
                            }, 1000);
                          }
                        }}
                      >
                        <RefreshCw id="refresh-designers-icon" className="h-3.5 w-3.5 mr-1.5" />
                        Tentar novamente
                      </Button>
                    </div>
                  ) : !popularDesignersData?.designers || popularDesignersData.designers.length === 0 ? (
                    // Estado vazio
                    <div className="p-4 text-center">
                      <Users className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum designer encontrado</p>
                    </div>
                  ) : (
                    // Designers populares carregados com sucesso
                    <>
                      {popularDesignersData.designers.slice(0, 5).map((designer) => (
                        <div key={designer.id} className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                          <UserAvatar 
                            user={{
                              id: designer.id,
                              username: designer.username,
                              name: designer.name,
                              profileimageurl: designer.profileimageurl,
                              nivelacesso: designer.nivelacesso,
                              role: designer.role || undefined
                            }} 
                            size="sm" 
                            linkToProfile={true} 
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{designer.name || designer.username}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {designer.followersCount} {designer.followersCount === 1 ? 'seguidor' : 'seguidores'} • {designer.postsCount} {designer.postsCount === 1 ? 'post' : 'posts'}
                            </p>
                          </div>
                          <FollowButton 
                            designerId={designer.id}
                            isFollowing={designer.isFollowing}
                            size="sm" 
                            variant="outline" 
                            compact={true}
                            onFollowChange={() => refetchPopularDesigners()}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Card de posts populares */}
              <Card id="popular-posts-section" className="overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Posts Populares</CardTitle>
                      <CardDescription>Conteúdo mais engajado</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 p-4">
                  {popularPostsLoading ? (
                    // Skeleton loading state
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="w-16 h-16 rounded-md shrink-0" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : popularPostsError ? (
                    // Erro ao carregar
                    <div className="text-center py-4">
                      <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Erro ao carregar posts populares
                      </p>
                    </div>
                  ) : !popularPosts || popularPosts.length === 0 ? (
                    // Nenhum post encontrado
                    <div className="text-center py-4">
                      <FileQuestion className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Nenhum post popular disponível
                      </p>
                    </div>
                  ) : (
                    // Lista de posts populares
                    <>
                      {Array.isArray(popularPosts) && popularPosts.map((item: any) => {
                        // Verificar se o objeto e suas propriedades existem antes de renderizar
                        if (!item || !item.post) {
                          console.log('Item de post popular inválido:', item);
                          return null;
                        }
                        
                        const postId = item.post?.id || 0;
                        const imageUrl = item.post?.imageUrl || '';
                        const title = item.post?.title || 'Post sem título';
                        const likes = item.likesCount || 0;
                        const comments = item.commentsCount || 0;
                        const postUserId = item.user?.id;
                        const isFollowing = item.user?.isFollowing || false;
                        // Pré-calcular a data formatada para evitar problemas de atualização
                        // Usar a data pré-formatada se disponível, caso contrário, calcular
                        const formattedDate = item.post?.formattedDate || `há ${formatRelativeTime(item.post?.createdAt)}`;
                        
                        return (
                          <div 
                            key={postId} 
                            onClick={() => {
                              setSelectedPostId(postId);
                              setIsPostViewOpen(true);
                            }}
                            className="flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 p-2 rounded-md transition-colors cursor-pointer"
                          >
                            <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                              {imageUrl ? (
                                <img 
                                  src={imageUrl} 
                                  alt={title} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://placehold.co/200x200/gray/white?text=DesignAuto";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                  <ImageIcon className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-2">
                                {title}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                {likes === 1 ? '1 curtida' : `${likes} curtidas`} • {comments === 1 ? '1 comentário' : `${comments} comentários`}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  por <span className="font-medium">{item.user?.name || 'Design Auto'}</span> • {formattedDate}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Card de dicas e tutoriais */}
              <Card className="overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Dicas & Tutoriais</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="rounded-md p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Dica do dia:</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Use cores contrastantes para destacar as informações principais em seus anúncios.
                    </p>
                  </div>
                  
                  <p className="text-sm">
                    Confira nossos recursos para melhorar suas artes:
                  </p>
                  
                  <div className="space-y-2">
                    <Link href="/videoaulas" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">1</span>
                      <span>Curso de Artes para Instagram</span>
                    </Link>
                    
                    <Link href="/videoaulas" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">2</span>
                      <span>Como criar anúncios atrativos</span>
                    </Link>
                    
                    <Link href="/videoaulas" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">3</span>
                      <span>Edição rápida no Canva</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <FooterMenu />
      
      {/* Dialog de criação de post */}
      <CreatePostDialog
        open={isCreatePostOpen}
        onOpenChange={setIsCreatePostOpen}
      />
      
      {/* Dialog de visualização de post */}
      <PostViewDialog
        postId={selectedPostId}
        open={isPostViewOpen}
        onOpenChange={setIsPostViewOpen}
      />
    </div>
  );
};

export default CommunityPage;