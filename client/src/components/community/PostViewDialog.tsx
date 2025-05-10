import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Bookmark, 
  ThumbsUp,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentItem } from "./CommentItem";
import { getInitials, formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import UserAvatar from "@/components/users/UserAvatar";
import LoadingScreen from "@/components/LoadingScreen";
import VerifiedUsername from "@/components/users/VerifiedUsername";

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  userId: number;
  user?: any;
  isLikedByUser?: boolean;
  likesCount?: number;
  commentsCount?: number;
  isPinned?: boolean;
  editLink?: string;
}

interface PostViewDialogProps {
  postId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostViewDialog({ postId, open, onOpenChange }: PostViewDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Reset comment input when modal closes
  useEffect(() => {
    if (!open) {
      setComment("");
    }
  }, [open]);

  // Fetch post data
  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
    refetch: refetchPost
  } = useQuery({
    queryKey: [`/api/community/posts/${postId}`],
    enabled: !!postId && open,
    queryFn: async () => {
      if (!postId) return null;
      const response = await apiRequest("GET", `/api/community/posts/${postId}`);
      return response.json();
    }
  });

  // Fetch comments
  const {
    data: comments = [],
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments
  } = useQuery({
    queryKey: [`/api/community/posts/${postId}/comments`],
    enabled: !!postId && open,
    queryFn: async () => {
      if (!postId) return [];
      const response = await apiRequest("GET", `/api/community/posts/${postId}/comments`);
      return response.json();
    }
  });

  // Like/unlike post mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!postId) throw new Error("ID do post inválido");
      const response = await apiRequest("POST", `/api/community/posts/${postId}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({
        title: data.liked ? "Post curtido" : "Curtida removida",
        description: data.liked ? "Você curtiu este post" : "Você removeu sua curtida deste post"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao curtir post",
        description: error.message || "Ocorreu um erro ao processar sua ação. Tente novamente."
      });
    }
  });

  // Save/unsave post mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!postId) throw new Error("ID do post inválido");
      const response = await apiRequest("POST", `/api/community/posts/${postId}/save`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
      toast({
        title: data.saved ? "Post salvo" : "Post removido dos salvos",
        description: data.saved ? "Post adicionado aos salvos" : "Post removido dos salvos"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar post",
        description: error.message || "Ocorreu um erro ao processar sua ação. Tente novamente."
      });
    }
  });

  // Comment submission mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!postId) throw new Error("ID do post inválido");
      const response = await apiRequest("POST", `/api/community/posts/${postId}/comments`, {
        content
      });
      return response.json();
    },
    onSuccess: () => {
      // Clear comment field
      setComment("");
      // Refresh comments
      refetchComments();
      refetchPost();
      
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi publicado com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar comentário",
        description: error.message || "Ocorreu um erro ao adicionar seu comentário. Tente novamente."
      });
    }
  });

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Ação não permitida",
        description: "Você precisa estar logado para comentar."
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        variant: "destructive",
        title: "Comentário vazio",
        description: "Escreva um comentário antes de enviar."
      });
      return;
    }

    setSubmittingComment(true);
    try {
      await commentMutation.mutateAsync(comment);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    if (!postId) return;
    
    setIsSharing(true);
    try {
      const shareUrl = `${window.location.origin}/comunidade/post/${postId}`;
      
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: post?.title || 'Post da Comunidade D.Auto',
          text: post?.content || 'Confira este post na Comunidade D.Auto',
          url: shareUrl
        });
        
        toast({
          title: "Link compartilhado",
          description: "Conteúdo compartilhado com sucesso!"
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        
        toast({
          title: "Link copiado",
          description: "Link copiado para a área de transferência."
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          variant: "destructive",
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar este conteúdo."
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Handle delete post (admin only)
  const handleDeletePost = async () => {
    if (!postId || !currentUser) return;
    
    const isAdmin = currentUser.nivelacesso === 'admin' || 
                    currentUser.nivelacesso === 'administrador' || 
                    currentUser.nivelacesso === 'designer_adm';
    
    const isAuthor = post?.userId === currentUser.id;
    
    if (!isAdmin && !isAuthor) {
      toast({
        variant: "destructive",
        title: "Ação não permitida",
        description: "Você não tem permissão para excluir este post."
      });
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/community/posts/${postId}`);
      
      // Close dialog and refetch posts list
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      
      toast({
        title: "Post excluído",
        description: "O post foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir post",
        description: error instanceof Error 
          ? error.message 
          : "Ocorreu um erro ao excluir o post. Tente novamente."
      });
    }
  };

  // Function to handle comment deletion
  const handleDeleteComment = async (commentId: number) => {
    if (!currentUser) return;
    
    try {
      const isAdmin = currentUser.nivelacesso === 'admin' || 
                      currentUser.nivelacesso === 'administrador' || 
                      currentUser.nivelacesso === 'designer_adm';
      
      let deleteUrl = `/api/community/comments/${commentId}`;
      
      // Admins can use the admin route if needed
      if (isAdmin) {
        deleteUrl = `/api/community/admin/comments/${commentId}`;
      }
      
      const response = await apiRequest('DELETE', deleteUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status} ao excluir comentário`);
      }
      
      // Refresh comments after deletion
      refetchComments();
      refetchPost();
      
      toast({
        title: "Comentário excluído",
        description: "O comentário foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir comentário",
        description: error instanceof Error 
          ? error.message 
          : "Ocorreu um erro ao excluir o comentário. Tente novamente."
      });
    }
  };

  // Renders post content conditionally
  const renderPostContent = () => {
    if (postLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingScreen size="md" label="Carregando post..." />
        </div>
      );
    }

    if (postError || !post) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-2">Não foi possível carregar este post.</p>
          <Button variant="outline" onClick={() => refetchPost()}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    return (
      <>
        {/* Cabeçalho com informações do autor */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-3">
            <UserAvatar user={post.user} size="md" linkToProfile={false} />
            <div>
              <div className="flex items-center gap-1">
                <VerifiedUsername user={post.user} />
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                {(currentUser.nivelacesso === 'admin' || 
                  currentUser.nivelacesso === 'administrador' || 
                  currentUser.nivelacesso === 'designer_adm' ||
                  post.userId === currentUser.id) && (
                  <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">
                    <X className="h-4 w-4 mr-2" />
                    Excluir post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Imagem principal do post */}
        <div className="mt-4 w-full">
          <img 
            src={post.imageUrl} 
            alt={post.title || "Imagem do post"} 
            className="w-full h-auto max-h-[540px] object-contain rounded-lg bg-black/5"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://placehold.co/600x400/gray/white?text=Imagem+indisponível";
            }} 
          />
        </div>

        {/* Informações do post */}
        <div className="mt-4">
          {post.title && (
            <h3 className="text-lg font-medium mb-2">{post.title}</h3>
          )}
          
          {post.content && (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {post.content}
            </p>
          )}
          
          {post.editLink && (
            <div className="mt-3">
              <a
                href={post.editLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>Editar no Canva</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Barra de interação */}
        <div className="flex items-center justify-between mt-4 py-3 border-t border-b">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center gap-1 px-2 ${
                post.isLikedByUser ? 'text-red-500 dark:text-red-400' : ''
              }`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className={`h-5 w-5 ${
                post.isLikedByUser ? 'fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400' : ''
              }`} />
              <span>{post.likesCount || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 px-2"
              onClick={() => {
                const commentsTab = document.getElementById('comments-tab');
                if (commentsTab) {
                  (commentsTab as HTMLButtonElement).click();
                }
              }}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.commentsCount || 0}</span>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 px-2"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Bookmark className={`h-5 w-5 ${
              post.userHasSaved ? 'fill-current' : ''
            }`} />
            <span className="sr-only">Salvar</span>
          </Button>
        </div>
        
        {/* Tabs para comentários e detalhes */}
        <Tabs defaultValue="comments" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="comments" id="comments-tab">Comentários</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comments" className="space-y-4 pt-4">
            {/* Seção de adicionar comentário */}
            {currentUser && (
              <div className="flex gap-3 mb-6">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.profileimageurl || undefined} alt={currentUser.name} />
                  <AvatarFallback>{getInitials(currentUser.name || currentUser.username)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Adicione um comentário..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={submittingComment || !comment.trim()}
                    >
                      {submittingComment ? (
                        <span className="flex items-center">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Enviando...
                        </span>
                      ) : (
                        'Publicar'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de comentários */}
            {commentsLoading ? (
              <div className="flex justify-center py-6">
                <LoadingScreen size="sm" label="Carregando comentários..." />
              </div>
            ) : commentsError ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-2">Não foi possível carregar os comentários.</p>
                <Button variant="outline" onClick={() => refetchComments()}>
                  Tentar novamente
                </Button>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((item: any) => (
                  <CommentItem
                    key={item.comment.id}
                    comment={item.comment}
                    user={item.user}
                    likesCount={item.likesCount || 0}
                    repliesCount={item.repliesCount || 0}
                    userHasLiked={item.userHasLiked || false}
                    onRefresh={() => {
                      refetchComments();
                      refetchPost();
                    }}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="pt-4">
            <Card className="p-4">
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium">Autor</h4>
                  <p className="text-sm text-muted-foreground">
                    {post.user?.name || post.user?.username || "Usuário"}
                  </p>
                </div>
                
                {post.category && (
                  <div>
                    <h4 className="text-sm font-medium">Categoria</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {post.category}
                    </p>
                  </div>
                )}
                
                {post.postFormat && (
                  <div>
                    <h4 className="text-sm font-medium">Formato</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {post.postFormat}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium">Publicado em</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="w-full"
                    disabled={isSharing}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {isSharing ? 'Compartilhando...' : 'Compartilhar'}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle>
            {postLoading ? "Carregando..." : post?.title || "Post da Comunidade"}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        {renderPostContent()}
      </DialogContent>
    </Dialog>
  );
}

export default PostViewDialog;