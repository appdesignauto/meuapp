import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Eye, 
  Download, 
  Share2, 
  Heart, 
  ExternalLink,
  Calendar, 
  Tag 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import RelatedArts from '@/components/art/RelatedArts';

export default function ArtDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  // Fetch art details
  const { data: art, isLoading, error } = useQuery({
    queryKey: ['/api/arts', id],
    queryFn: async () => {
      const res = await fetch(`/api/arts/${id}`);
      if (!res.ok) {
        throw new Error('Erro ao carregar detalhes da arte');
      }
      return res.json();
    },
    retry: 1,
  });

  const handleBack = () => {
    setLocation('/');
  };

  const handleOpenEdit = () => {
    // For premium content, check if user has access
    if (art.isPremium && (!user || user.role !== 'premium')) {
      toast({
        title: "Conteúdo Premium",
        description: "Assine o plano Premium para acessar este conteúdo",
        variant: "destructive",
      });
      return;
    }

    // If not authenticated, prompt to log in
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Faça login para acessar e editar esta arte",
        variant: "destructive",
      });
      return;
    }

    // Otherwise, open the edit URL in a new tab
    window.open(art.editUrl, '_blank');
  };

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Faça login para favoritar esta arte",
        variant: "destructive",
      });
      return;
    }
    
    setLiked(!liked);
    toast({
      title: liked ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: liked 
        ? "A arte foi removida da sua lista de favoritos" 
        : "A arte foi adicionada à sua lista de favoritos",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: art?.title || 'DesignAuto - Arte Automotiva',
        text: 'Confira esta arte incrível no DesignAuto!',
        url: window.location.href,
      })
      .catch((error) => {
        console.log('Erro ao compartilhar:', error);
      });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast({
            title: "Link copiado",
            description: "Link da arte copiado para a área de transferência",
          });
        })
        .catch(() => {
          toast({
            title: "Erro ao copiar",
            description: "Não foi possível copiar o link para a área de transferência",
            variant: "destructive",
          });
        });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          size="sm"
          className="mb-8 text-blue-600"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a galeria
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-xl overflow-hidden bg-neutral-100">
            <Skeleton className="w-full aspect-square" />
          </div>
          
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-5 w-2/3 mb-6" />
            
            <Skeleton className="h-32 w-full mb-6" />
            
            <div className="flex gap-3 mb-8">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-12" />
              <Skeleton className="h-12 w-12" />
            </div>
            
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
        
        <div className="mt-16">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !art) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erro ao carregar a arte
          </h1>
          <p className="text-gray-600 mb-8">
            Não foi possível carregar os detalhes desta arte. Por favor, tente novamente mais tarde.
          </p>
          <Button onClick={handleBack}>
            Voltar para a galeria
          </Button>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Button 
        variant="ghost" 
        size="sm"
        className="mb-8 text-blue-600"
        onClick={handleBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a galeria
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Art Image */}
        <div className="relative rounded-xl overflow-hidden bg-white shadow-md border border-neutral-200">
          <img 
            src={art.imageUrl} 
            alt={art.title} 
            className="w-full object-cover"
          />
          
          {/* Premium Badge */}
          {art.isPremium && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full font-medium shadow-md">
                Premium
              </Badge>
            </div>
          )}
        </div>
        
        {/* Art Details */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
            {art.title}
          </h1>
          
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(art.createdAt)}
            </div>
            <span>•</span>
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              {art.category?.name || 'Categoria não especificada'}
            </div>
          </div>
          
          <p className="text-neutral-600 mb-8">
            {art.description || 'Sem descrição disponível para esta arte.'}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button 
              onClick={handleOpenEdit} 
              size="lg"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="h-5 w-5" />
              Editar no {art.fileType?.name || 'Editor'}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 border-blue-200 text-blue-600"
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-blue-600' : ''}`} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 border-blue-200 text-blue-600"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Metadata */}
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-neutral-500">Formato</p>
                <p className="font-medium">{art.format?.name || 'Não especificado'}</p>
              </div>
              
              <div>
                <p className="text-xs text-neutral-500">Tipo de Arquivo</p>
                <p className="font-medium">{art.fileType?.name || 'Não especificado'}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-xs text-neutral-500">Visualizações</p>
              <div className="flex items-center">
                <Eye className="h-4 w-4 text-blue-600 mr-2" />
                <p className="font-medium">{art.viewCount || 0}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-xs text-neutral-500">Downloads</p>
              <div className="flex items-center">
                <Download className="h-4 w-4 text-blue-600 mr-2" />
                <p className="font-medium">{art.downloadCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Arts Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">
          Artes Relacionadas
        </h2>
        <RelatedArts artId={Number(id)} />
      </div>
    </div>
  );
}