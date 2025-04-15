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
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        size="sm"
        className="mb-6 text-blue-600"
        onClick={handleBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a galeria
      </Button>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Art Image */}
          <div className="relative bg-neutral-50 flex items-center justify-center p-4 md:p-8 border-r border-gray-100">
            <div className="w-full h-full relative">
              <img 
                src={art.imageUrl} 
                alt={art.title} 
                className="w-full h-full object-contain max-h-[70vh]"
              />
              
              {/* Premium Badge */}
              {art.isPremium && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full font-medium shadow-md">
                    Premium
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Art Details */}
          <div className="p-6 md:p-8 flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              {art.title}
            </h1>
            
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
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
            
            <p className="text-neutral-600 mb-6">
              {art.description || 'Sem descrição disponível para esta arte.'}
            </p>
            
            {/* Benefits Section */}
            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Arquivo em formato {art.fileType?.name || 'editável'}</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Para qualquer competência e profissional</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Facilmente personalizável</span>
              </div>
              
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 bg-blue-100 text-blue-700 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span>Qualidade de imagem verificada</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mb-8 space-y-3">
              <Button 
                onClick={handleOpenEdit} 
                size="lg"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-6"
              >
                <ExternalLink className="h-5 w-5" />
                Editar no {art.fileType?.name || 'Editor'}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1 flex items-center justify-center gap-2 border-blue-200 text-blue-600"
                  onClick={handleLike}
                >
                  <Heart className={`h-5 w-5 ${liked ? 'fill-blue-600' : ''}`} />
                  {liked ? 'Favoritado' : 'Favoritar'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1 flex items-center justify-center gap-2 border-blue-200 text-blue-600"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                  Compartilhar
                </Button>
              </div>
            </div>
            
            {/* Additional Info Box */}
            {art.isPremium && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="text-amber-800 font-semibold flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                  Acesso Premium
                </h3>
                <p className="text-sm text-amber-700">
                  Este produto está disponível exclusivamente para os membros premium. 
                  Faça upgrade para uma conta Premium para ter acesso a todo o conteúdo premium.
                </p>
              </div>
            )}
            
            {/* Metadata */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden mt-auto">
              <div className="grid grid-cols-2 divide-x divide-neutral-200">
                <div className="p-3">
                  <p className="text-xs text-neutral-500 mb-1">Formato</p>
                  <p className="font-medium">{art.format?.name || 'Não especificado'}</p>
                </div>
                
                <div className="p-3">
                  <p className="text-xs text-neutral-500 mb-1">Tipo de Arquivo</p>
                  <p className="font-medium">{art.fileType?.name || 'Não especificado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-neutral-200 border-t border-neutral-200">
                <div className="p-3">
                  <p className="text-xs text-neutral-500 mb-1">Visualizações</p>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="font-medium">{art.viewCount || 0}</p>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="text-xs text-neutral-500 mb-1">Downloads</p>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="font-medium">{art.downloadCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Arts Section */}
      <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Conheça nossas artes similares
        </h2>
        <RelatedArts artId={Number(id)} />
      </div>
    </div>
  );
}