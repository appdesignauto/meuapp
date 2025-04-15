import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft, Download, Lock, Edit, Eye, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import RelatedArts from '@/components/art/RelatedArts';

// SEO metadata para melhorar o ranking do Google
const ArtMetadata = ({ art }: { art: any }) => {
  if (!art) return null;
  
  return (
    <>
      <title>{art.title} | DesignAuto - Arte para Concessionárias</title>
      <meta name="description" content={`${art.title} - Arte de alta qualidade para concessionárias e empresas automotivas. ${art.isPremium ? 'Conteúdo Premium.' : 'Disponível para download gratuito.'}`} />
      <meta property="og:title" content={`${art.title} | DesignAuto`} />
      <meta property="og:description" content="Arte para divulgação do seu negócio automotivo" />
      <meta property="og:image" content={art.imageUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${art.title} | DesignAuto`} />
      <meta name="twitter:description" content="Arte para divulgação do seu negócio automotivo" />
      <meta name="twitter:image" content={art.imageUrl} />
      <meta name="keywords" content={`arte automotiva, designauto, marketing automotivo, concessionária, ${art.title}, propaganda automotiva`} />
    </>
  );
};

export default function ArtDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Query para buscar dados da arte
  const { data: art, isLoading, error } = useQuery({
    queryKey: ['/api/arts', id],
    queryFn: async () => {
      const res = await fetch(`/api/arts/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao carregar arte');
      }
      return res.json();
    },
    retry: 1,
  });
  
  // Registrar visualização quando a arte for carregada
  useEffect(() => {
    if (art && user) {
      // Registrar visualização em segundo plano sem afetar UX
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artId: parseInt(id), userId: user.id }),
      }).catch(err => console.error('Erro ao registrar visualização:', err));
    }
  }, [art, id, user]);
  
  // Função para baixar arte
  const handleDownload = async () => {
    if (!art) return;
    
    // Se o conteúdo é premium e o usuário não é premium, mostrar toast
    if (art.isPremium && (!user || user.role !== 'premium')) {
      toast({
        title: "Conteúdo Premium",
        description: "Para baixar esse conteúdo, você precisa ter uma conta premium.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Registrar o download no backend se o usuário estiver logado
      if (user) {
        await fetch('/api/downloads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artId: parseInt(id), userId: user.id }),
        });
      }
      
      // Redirecionar para edição
      window.open(art.editUrl, '_blank');
      
      toast({
        title: "Arte disponível para edição",
        description: "Você foi redirecionado para a plataforma de edição.",
      });
    } catch (error) {
      console.error('Erro ao processar download:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar seu download. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-28 mr-4" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Skeleton className="w-full aspect-square rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-8" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !art) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Erro ao carregar arte</h1>
        <p className="mb-6">{error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}</p>
        <Button onClick={() => setLocation('/')}>Voltar para a galeria</Button>
      </div>
    );
  }
  
  // Para conteúdo premium, verificar se o usuário tem permissão
  if (art.isPremium && (!user || user.role !== 'premium')) {
    return (
      <div className="container mx-auto py-8 px-4">
        <ArtMetadata art={art} />
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost"
            className="gap-2"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft size={18} /> Voltar
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 relative">
            <div className="relative">
              <img
                src={art.imageUrl}
                alt={art.title}
                className="w-full rounded-lg object-cover aspect-square blur-sm"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
                <Lock size={64} className="text-primary mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Conteúdo Premium</h2>
                <p className="text-white/80 text-center mb-4 max-w-md">
                  Este conteúdo está disponível apenas para assinantes premium
                </p>
                <Button onClick={() => setLocation('/pricing')}>
                  Ver planos premium
                </Button>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">{art.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{art.format}</Badge>
              <Badge 
                variant={art.isPremium ? "default" : "secondary"}
              >
                {art.isPremium ? 'Premium' : 'Gratuito'}
              </Badge>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">Dimensões: {art.width} x {art.height} pixels</p>
              <p className="text-sm text-muted-foreground">Proporção: {art.aspectRatio}</p>
            </div>
            
            <div className="flex mb-6">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/pricing')}
              >
                Fazer upgrade para Premium
              </Button>
            </div>
            
            <Card className="p-4 mb-8">
              <h3 className="font-medium mb-2">Informações</h3>
              <p className="text-sm text-muted-foreground mb-2">
                As artes premium são de alta qualidade e otimizadas para postagens profissionais.
              </p>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Edit size={16} className="mr-2" /> Editável no {art.fileType}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Eye size={16} className="mr-2" /> Visualizações: <span className="loader">...</span>
              </div>
            </Card>
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Artes relacionadas</h2>
          <RelatedArts artId={parseInt(id)} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <ArtMetadata art={art} />
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost"
          className="gap-2"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft size={18} /> Voltar
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <img
            src={art.imageUrl}
            alt={art.title}
            className="w-full rounded-lg object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{art.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{art.format}</Badge>
            <Badge 
              variant={art.isPremium ? "default" : "secondary"}
            >
              {art.isPremium ? 'Premium' : 'Gratuito'}
            </Badge>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Dimensões: {art.width} x {art.height} pixels</p>
            <p className="text-sm text-muted-foreground">Proporção: {art.aspectRatio}</p>
          </div>
          
          <div className="flex mb-6">
            <Button 
              className="w-full gap-2"
              onClick={handleDownload}
            >
              <Download size={18} /> 
              {art.fileType === 'Canva' ? 'Editar no Canva' : 'Editar no Google'}
            </Button>
          </div>
          
          <Card className="p-4 mb-8">
            <h3 className="font-medium mb-2">Informações</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {art.isPremium 
                ? 'Esta arte premium está disponível para edição direta.'
                : 'Esta arte gratuita pode ser baixada e personalizada.'}
            </p>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Edit size={16} className="mr-2" /> Editável no {art.fileType}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Eye size={16} className="mr-2" /> Visualizações: <span className="loader">...</span>
            </div>
          </Card>
        </div>
      </div>
      
      <Separator className="my-12" />
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-6">Artes relacionadas</h2>
        <RelatedArts artId={parseInt(id)} />
      </div>
    </div>
  );
}