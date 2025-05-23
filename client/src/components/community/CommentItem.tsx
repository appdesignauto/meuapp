import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ThumbsUp, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import VerifiedUsername from '@/components/users/VerifiedUsername';
import { getInitials } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface User {
  id: number;
  username: string;
  name: string;
  profileimageurl: string | null;
  nivelacesso: string;
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CommentItemProps {
  comment: Comment;
  user: User;
  likesCount: number;
  repliesCount: number;
  userHasLiked: boolean;
  onRefresh?: () => void;
  isReply?: boolean;
  onDelete?: (commentId: number) => Promise<void> | void;
}

export const CommentItem = ({
  comment,
  user,
  likesCount,
  repliesCount: initialRepliesCount,
  userHasLiked,
  onRefresh,
  isReply = false,
  onDelete
}: CommentItemProps) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(userHasLiked);
  const [likes, setLikes] = useState(likesCount);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  // Estado local para controlar contagem de respostas
  const [repliesCountState, setRepliesCount] = useState(initialRepliesCount);

  const handleLikeComment = async () => {
    console.log("Função handleLikeComment chamada para o comentário:", comment.id);
    if (!currentUser) {
      toast({
        title: "Ação não permitida",
        description: "Você precisa estar logado para curtir comentários.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Enviando requisição para curtir comentário:", comment.id);
      const response = await apiRequest('POST', `/api/community/comments/${comment.id}/like`);
      const data = await response.json();
      console.log("Resposta recebida:", data);
      
      setIsLiked(data.liked);
      setLikes(data.likesCount);
      
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
        description: "Ocorreu um erro ao curtir este comentário.",
        variant: "destructive"
      });
    }
  };

  const loadReplies = async () => {
    if (repliesCountState === 0) return;
    
    setLoadingReplies(true);
    try {
      const response = await apiRequest('GET', `/api/community/comments/${comment.id}/replies`);
      const data = await response.json();
      setReplies(data);
      setShowReplies(true);
    } catch (error) {
      toast({
        title: "Erro ao carregar respostas",
        description: "Ocorreu um erro ao carregar as respostas deste comentário.",
        variant: "destructive"
      });
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleToggleReplies = () => {
    if (showReplies) {
      setShowReplies(false);
    } else {
      loadReplies();
    }
  };

  const handleSubmitReply = async () => {
    if (!currentUser) {
      toast({
        title: "Ação não permitida",
        description: "Você precisa estar logado para responder comentários.",
        variant: "destructive"
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Digite um comentário antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await apiRequest('POST', `/api/community/posts/${comment.postId}/comments`, {
        content: replyContent,
        parentId: comment.id
      });
      
      const data = await response.json();
      
      // Adicionar resposta à lista e limpar formulário
      setReplies([
        {
          comment: data.comment,
          user: data.user,
          likesCount: 0,
          userHasLiked: false
        },
        ...replies
      ]);
      setReplyContent('');
      setShowReplyForm(false);
      setRepliesCount((prev: number) => prev + 1);
      
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi adicionada com sucesso."
      });
      
      // Garantir que as respostas estejam visíveis
      setShowReplies(true);
      
      // Atualizar dados caso necessário
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "Erro ao enviar resposta",
        description: "Ocorreu um erro ao responder este comentário.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  // Função aprimorada para excluir um comentário
  const handleDeleteComment = async () => {
    console.log("Excluindo comentário:", comment.id);
    
    if (!currentUser) {
      toast({
        title: "Ação não permitida",
        description: "Você precisa estar logado para excluir comentários.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o usuário pode excluir este comentário
    const isAdmin = currentUser.nivelacesso === 'admin' || currentUser.nivelacesso === 'administrador' || currentUser.nivelacesso === 'designer_adm';
    if (currentUser.id !== comment.userId && !isAdmin) {
      toast({
        title: "Ação não permitida",
        description: "Você só pode excluir seus próprios comentários.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Primeiro tentamos usar o handler passado pela prop
      if (onDelete) {
        console.log("Usando função onDelete passada por props para comentário:", comment.id);
        await onDelete(comment.id);
        return;
      }
      
      console.log("Excluindo comentário com ID:", comment.id);
      console.log("Usuário atual:", currentUser.id, "Autor comentário:", comment.userId);
      
      // Escolher a rota adequada com base nos privilégios do usuário
      let deleteUrl = `/api/community/comments/${comment.id}`;
      // Admins podem usar a rota específica de admin se necessário
      if (isAdmin && currentUser.id !== comment.userId) {
        deleteUrl = `/api/community/admin/comments/${comment.id}`;
      }
      
      console.log("Usando URL para exclusão:", deleteUrl);
      
      // Executar a requisição com mais detalhes de log
      try {
        const response = await apiRequest('DELETE', deleteUrl);
        
        if (!response.ok) {
          // Se a resposta não for bem-sucedida, tentar extrair detalhes do erro
          const errorData = await response.json();
          throw new Error(errorData.message || `Erro ${response.status} ao excluir comentário`);
        }
        
        const data = await response.json();
        console.log("Resposta de exclusão:", data);
        
        toast({
          title: "Comentário excluído",
          description: "Seu comentário foi excluído com sucesso."
        });
        
        // Atualizar dados caso necessário
        if (onRefresh) {
          console.log("Chamando função onRefresh após exclusão");
          onRefresh();
        }
        
        // Se for uma resposta, atualizar a lista de respostas do comentário pai
        if (isReply && comment.parentId) {
          console.log("Invalidando queries para atualizar comentários pai");
          // Isso irá atualizar o post inteiro, incluindo todos os comentários
          queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${comment.postId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/community/comments/${comment.parentId}/replies`] });
        } else {
          // Para comentários principais, atualizar toda a lista de comentários do post
          console.log("Invalidando queries para atualizar lista de comentários do post");
          queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${comment.postId}/comments`] });
          queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${comment.postId}`] });
        }
      } catch (fetchError) {
        console.error("Erro na requisição de exclusão:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
      toast({
        title: "Erro ao excluir comentário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir este comentário.",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return 'há algum tempo';
    }
  };

  return (
    <div className={`flex gap-2 ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.profileimageurl || undefined} alt={user.name} />
        <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
          <div className="flex justify-between">
            <div>
              <VerifiedUsername user={user} />
            </div>
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Verificar se este usuário pode excluir o comentário */}
                  {(currentUser.id === comment.userId || 
                    currentUser.nivelacesso === 'admin' ||
                    currentUser.nivelacesso === 'administrador' || 
                    currentUser.nivelacesso === 'designer_adm') && (
                    <DropdownMenuItem 
                      onClick={async (e) => {
                        e.preventDefault();
                        console.log("Botão excluir clicado para comentário:", comment.id);
                        try {
                          if (onDelete) {
                            console.log("Usando função onDelete passada via props");
                            await onDelete(comment.id);
                          } else {
                            console.log("Usando função handleDeleteComment local");
                            await handleDeleteComment();
                          }
                        } catch (error) {
                          console.error("Erro ao processar exclusão:", error);
                          toast({
                            title: "Erro ao excluir comentário",
                            description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir este comentário.",
                            variant: "destructive"
                          });
                        }
                      }} 
                      className="text-red-500 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 ml-2">
          <Button 
            type="button"
            variant="ghost" 
            size="sm"
            onClick={handleLikeComment}
            className={`flex items-center gap-1 p-0 h-auto hover:text-primary transition-colors ${isLiked ? 'text-primary font-medium' : ''}`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {likes > 0 && <span>{likes === 1 ? '1 curtida' : `${likes} curtidas`}</span>}
            {likes === 0 && <span>{isLiked ? 'Curtido' : 'Curtir'}</span>}
          </Button>
          
          {!isReply && (
            <Button 
              type="button"
              variant="ghost" 
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 p-0 h-auto hover:text-primary transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Responder</span>
            </Button>
          )}
          
          <span>{formatTimeAgo(comment.createdAt)}</span>
        </div>
        
        {repliesCountState > 0 && !isReply && (
          <Button 
            type="button"
            variant="link" 
            size="sm"
            onClick={handleToggleReplies}
            className="text-xs text-primary font-medium ml-2 h-auto p-0"
            disabled={loadingReplies}
          >
            {loadingReplies ? (
              <span className="flex items-center">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                Carregando...
              </span>
            ) : (
              <>
                {showReplies ? 'Ocultar respostas' : `Ver ${repliesCountState} ${repliesCountState === 1 ? 'resposta' : 'respostas'}`}
              </>
            )}
          </Button>
        )}
        
        {showReplyForm && !isReply && (
          <div className="mt-2 ml-2">
            <Textarea
              placeholder="Escreva uma resposta..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowReplyForm(false)}
                disabled={submittingReply}
              >
                Cancelar
              </Button>
              <Button 
                size="sm"
                onClick={handleSubmitReply}
                disabled={submittingReply || !replyContent.trim()}
              >
                {submittingReply ? (
                  <span className="flex items-center">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enviando...
                  </span>
                ) : (
                  'Responder'
                )}
              </Button>
            </div>
          </div>
        )}
        
        {showReplies && replies.length > 0 && (
          <div className="mt-2">
            {replies.map((reply) => (
              <CommentItem
                key={reply.comment.id}
                comment={reply.comment}
                user={reply.user}
                likesCount={reply.likesCount}
                repliesCount={0} // Não permitimos respostas aninhadas além do segundo nível
                userHasLiked={reply.userHasLiked}
                isReply={true}
                onRefresh={onRefresh}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};