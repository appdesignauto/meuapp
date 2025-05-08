import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ThumbsUp, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import VerifiedUsername from '@/components/users/VerifiedUsername';
import { getInitials } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';

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
}

export const CommentItem = ({
  comment,
  user,
  likesCount,
  repliesCount: initialRepliesCount,
  userHasLiked,
  onRefresh,
  isReply = false
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

  // Referência para armazenar os valores originais para uso na reversão
  const originalValues = useRef({ isLiked, likes });
  
  useEffect(() => {
    // Atualizar os valores originais quando as props mudam
    originalValues.current = { isLiked, likes };
  }, [isLiked, likes]);
  
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
      // Guardar os valores originais antes da atualização
      const previousIsLiked = isLiked;
      const previousLikes = likes;
      
      // Atualizar UI imediatamente para feedback instantâneo
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes - 1 : likes + 1);

      // Obter o token de autenticação do localStorage
      const authToken = localStorage.getItem('authToken');
      
      // Vamos usar fetch diretamente para evitar problemas com o apiRequest
      const response = await fetch(`/api/community/comments/${comment.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Incluir o token de autenticação no cabeçalho se disponível
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        credentials: 'include' // Manter credentials para cookies como fallback
      });
      
      console.log("Resposta recebida, status:", response.status);
      
      if (!response.ok) {
        // Se o erro for 401 (não autenticado), podemos tentar atualizar o token
        if (response.status === 401) {
          console.log("Tentando novamente com refresh de autenticação...");
          
          // Aqui poderíamos adicionar lógica para atualizar o token se necessário
          
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
        
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Dados da resposta:", data);
      
      // Atualizar com os valores do servidor
      setIsLiked(data.liked);
      setLikes(data.likesCount);
      
      // Atualizar também os valores originais
      originalValues.current = { isLiked: data.liked, likes: data.likesCount };
      
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
      
      // Atualizar dados do post se necessário
      if (onRefresh) onRefresh();
      
    } catch (error: any) {
      console.error("Erro na requisição de curtir:", error);
      
      // Reverter mudanças em caso de erro usando os valores guardados na ref
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
      
      toast({
        title: "Erro ao curtir comentário",
        description: `Ocorreu um erro ao curtir este comentário: ${error.message}`,
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
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};